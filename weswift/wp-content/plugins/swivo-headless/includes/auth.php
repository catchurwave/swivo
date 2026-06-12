<?php
/**
 * Auth — register / login / logout / me.
 *
 * Strategy: WordPress core cookies (wp_set_auth_cookie) + a `swivo_nonce`
 * action exposed to the SPA so POST/PUT/DELETE requests can pass WP's nonce
 * check. The SPA must:
 *   1. Hit /auth/me on boot to read the current user (cookies sent via
 *      `credentials: 'include'`).
 *   2. Read the `nonce` value from /auth/me and send it as `X-WP-Nonce`
 *      on write requests.
 *
 * This avoids shipping JWT yet keeps the SPA fully cookie-authenticated.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Headless cookies — emit auth/logged_in cookies with SameSite=None; Secure
 * so browsers send them on cross-origin XHR from the SPA.
 *
 * WordPress' set_logged_in_cookie / set_auth_cookie actions fire BEFORE the
 * default `setcookie()` calls, so re-emitting at action time gets overwritten
 * by WP's defaults. Instead: short-circuit `send_auth_cookies` to suppress
 * WP's defaults and send everything ourselves, with our own attributes.
 *
 * Requires HTTPS (SameSite=None requires Secure). Fine on honeylemon.fr.
 */
add_filter( 'send_auth_cookies', '__return_false' );

add_action( 'set_auth_cookie',      'swivo_emit_auth_cookie',      10, 6 );
add_action( 'set_logged_in_cookie', 'swivo_emit_logged_in_cookie', 10, 6 );
add_action( 'clear_auth_cookie',    'swivo_clear_auth_cookies' );

function swivo_emit_auth_cookie( $cookie, $expire, $expiration, $user_id, $scheme, $token ) {
	unset( $expiration, $user_id, $token );
	$secure = ( 'secure_auth' === $scheme );
	$name   = $secure ? SECURE_AUTH_COOKIE : AUTH_COOKIE;
	swivo_setcookie( $name, $cookie, $expire, PLUGINS_COOKIE_PATH, $secure );
	swivo_setcookie( $name, $cookie, $expire, ADMIN_COOKIE_PATH,   $secure );
}

function swivo_emit_logged_in_cookie( $cookie, $expire, $expiration, $user_id, $scheme, $token ) {
	unset( $expiration, $scheme, $token );
	$secure_logged_in = (bool) apply_filters( 'secure_logged_in_cookie', is_ssl(), $user_id, is_ssl() );

	// Force path=/ so the cookie is sent on ANY URL on this host, including
	// the SPA's /wp-json/... requests, which sit outside COOKIEPATH when
	// WordPress lives in a subdirectory (e.g. /swivo/).
	swivo_setcookie( LOGGED_IN_COOKIE, $cookie, $expire, '/', $secure_logged_in );

	// Keep the legacy paths too so wp-admin sessions still work for editors
	// hitting the WP backend directly.
	if ( COOKIEPATH && '/' !== COOKIEPATH ) {
		swivo_setcookie( LOGGED_IN_COOKIE, $cookie, $expire, COOKIEPATH, $secure_logged_in );
	}
	if ( SITECOOKIEPATH && SITECOOKIEPATH !== COOKIEPATH && '/' !== SITECOOKIEPATH ) {
		swivo_setcookie( LOGGED_IN_COOKIE, $cookie, $expire, SITECOOKIEPATH, $secure_logged_in );
	}
}

function swivo_clear_auth_cookies() {
	$expire = time() - YEAR_IN_SECONDS;
	$paths = array(
		AUTH_COOKIE        => array( PLUGINS_COOKIE_PATH, ADMIN_COOKIE_PATH ),
		SECURE_AUTH_COOKIE => array( PLUGINS_COOKIE_PATH, ADMIN_COOKIE_PATH ),
		LOGGED_IN_COOKIE   => array_unique( array_filter( array( '/', COOKIEPATH, SITECOOKIEPATH ) ) ),
	);
	foreach ( $paths as $name => $list ) {
		foreach ( $list as $path ) {
			$secure = ( SECURE_AUTH_COOKIE === $name ) || ( LOGGED_IN_COOKIE === $name && is_ssl() );
			swivo_setcookie( $name, ' ', $expire, $path, $secure );
		}
	}
}

function swivo_setcookie( $name, $value, $expire, $path, $secure ) {
	// Chrome 80+ rejects SameSite=None without Secure. In dev (http://localhost)
	// fall back to Lax so the cookie persists for same-origin requests; in prod
	// (HTTPS) use None so the SPA on a different origin can send credentials.
	$samesite = ( $secure || is_ssl() ) ? 'None' : 'Lax';
	setcookie( $name, $value, array(
		'expires'  => $expire,
		'path'     => $path,
		'domain'   => COOKIE_DOMAIN,
		'secure'   => (bool) $secure,
		'httponly' => true,
		'samesite' => $samesite,
	) );
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/auth/register', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_auth_register',
	) );

	register_rest_route( 'swivo/v1', '/auth/login', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_auth_login',
	) );

	register_rest_route( 'swivo/v1', '/auth/logout', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_auth_logout',
	) );

	register_rest_route( 'swivo/v1', '/auth/me', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_auth_me',
	) );

	register_rest_route( 'swivo/v1', '/auth/forgot', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_auth_forgot',
	) );

	register_rest_route( 'swivo/v1', '/auth/reset', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_auth_reset',
	) );
} );

/**
 * Réinitialisation effective du mot de passe.
 * Body : { "login" : "...", "key" : "...", "password" : "nouveauMotDePasse" }
 */
function swivo_auth_reset( WP_REST_Request $req ) {
	$body  = $req->get_json_params();
	$login = isset( $body['login'] ) ? sanitize_user( (string) $body['login'] ) : '';
	$key   = isset( $body['key'] ) ? (string) $body['key'] : '';
	$pass  = isset( $body['password'] ) ? (string) $body['password'] : '';
	if ( ! $login || ! $key || strlen( $pass ) < 8 ) {
		return new WP_Error( 'bad_request', 'Champs requis : login, key, password (≥ 8 caractères).', array( 'status' => 400 ) );
	}
	$user = check_password_reset_key( $key, $login );
	if ( is_wp_error( $user ) ) {
		return new WP_Error( 'invalid_key', 'Lien invalide ou expiré. Refaites une demande.', array( 'status' => 400 ) );
	}
	reset_password( $user, $pass );
	return rest_ensure_response( array( 'ok' => true ) );
}

/**
 * Demande de réinitialisation de mot de passe.
 * Body : { "email" : "..." }
 * Toujours retourne 200 (anti-énumération). Email envoyé via wp_mail si user existe.
 */
function swivo_auth_forgot( WP_REST_Request $req ) {
	$body  = $req->get_json_params();
	$email = isset( $body['email'] ) ? sanitize_email( $body['email'] ) : '';
	if ( ! $email ) return rest_ensure_response( array( 'ok' => true ) );

	$user = get_user_by( 'email', $email );
	if ( $user ) {
		$key = get_password_reset_key( $user );
		if ( ! is_wp_error( $key ) ) {
			$reset_url = home_url( '/connexion?reset=' . rawurlencode( $key ) . '&login=' . rawurlencode( $user->user_login ) );
			$subject = 'Réinitialisation de votre mot de passe Swivo';
			$message = "Bonjour,\n\nPour réinitialiser votre mot de passe, cliquez ici : $reset_url\n\nLien valable 24 h. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n— L'équipe Swivo";
			wp_mail( $email, $subject, $message );
		}
	}
	return rest_ensure_response( array( 'ok' => true ) );
}

function swivo_auth_register( WP_REST_Request $req ) {
	$body = $req->get_json_params();
	$email = isset( $body['email'] ) ? sanitize_email( $body['email'] ) : '';
	$pass  = isset( $body['password'] ) ? (string) $body['password'] : '';
	$name  = isset( $body['name'] ) ? sanitize_text_field( $body['name'] ) : '';

	if ( ! is_email( $email ) || strlen( $pass ) < 8 ) {
		return new WP_Error( 'swivo_invalid', 'Email invalide ou mot de passe trop court (8+).', array( 'status' => 400 ) );
	}
	if ( email_exists( $email ) ) {
		return new WP_Error( 'swivo_exists', 'Compte déjà existant.', array( 'status' => 409 ) );
	}

	// Suppress any wp_mail() triggered by user_register hooks (WC customer_new_account,
	// PMP welcome, core admin notify). PHP mail() with no SMTP transport blocks on
	// sendmail timeout → register request hangs 30-60s. Our own welcome email is
	// scheduled async below via wp_schedule_single_event.
	$mail_short_circuit = function () { return true; };
	add_filter( 'pre_wp_mail', $mail_short_circuit, 999 );
	remove_action( 'register_new_user',           'wp_send_new_user_notifications' );
	remove_action( 'edit_user_created_user',      'wp_send_new_user_notifications', 10 );

	$user_id = wp_insert_user( array(
		'user_login'   => $email,
		'user_email'   => $email,
		'user_pass'    => $pass,
		'display_name' => $name ?: $email,
		'role'         => 'subscriber',
	) );

	remove_filter( 'pre_wp_mail', $mail_short_circuit, 999 );

	if ( is_wp_error( $user_id ) ) {
		return new WP_Error( 'swivo_failed', $user_id->get_error_message(), array( 'status' => 500 ) );
	}

	wp_set_current_user( $user_id );
	wp_set_auth_cookie( $user_id, true );

	// Async welcome email — fires on next WP cron tick, doesn't block response.
	wp_schedule_single_event( time() + 5, 'swivo_send_welcome_email', array( $user_id ) );

	return rest_ensure_response( swivo_user_payload( get_user_by( 'id', $user_id ) ) );
}

add_action( 'swivo_send_welcome_email', function ( $user_id ) {
	$user = get_user_by( 'id', (int) $user_id );
	if ( ! $user instanceof WP_User ) return;
	$first = strtok( (string) $user->display_name, ' ' ) ?: '';
	$subject = 'Bienvenue sur Swivo';
	$body = "Bonjour $first,\n\nVotre compte Swivo est créé. Accédez à votre espace : " . home_url( '/espace-createur' ) . "\n\n— L'équipe Swivo";
	wp_mail( $user->user_email, $subject, $body );
} );

function swivo_auth_login( WP_REST_Request $req ) {
	$body  = $req->get_json_params();
	$email = isset( $body['email'] ) ? sanitize_email( $body['email'] ) : '';
	$pass  = isset( $body['password'] ) ? (string) $body['password'] : '';

	if ( ! $email || ! $pass ) {
		return new WP_Error( 'swivo_invalid', 'Email et mot de passe requis.', array( 'status' => 400 ) );
	}

	$user = wp_signon( array(
		'user_login'    => $email,
		'user_password' => $pass,
		'remember'      => true,
	), is_ssl() );

	if ( is_wp_error( $user ) ) {
		return new WP_Error( 'swivo_bad_credentials', 'Identifiants invalides.', array( 'status' => 401 ) );
	}

	wp_set_current_user( $user->ID );
	wp_set_auth_cookie( $user->ID, true );

	return rest_ensure_response( swivo_user_payload( $user ) );
}

function swivo_auth_logout() {
	wp_logout();
	return rest_ensure_response( array( 'ok' => true ) );
}

function swivo_auth_me() {
	$user = swivo_resolve_current_user();
	if ( ! $user ) {
		return rest_ensure_response( array( 'user' => null, 'nonce' => null ) );
	}
	wp_set_current_user( $user->ID );
	return rest_ensure_response( array_merge(
		array( 'user' => swivo_user_payload_array( $user ) ),
		array( 'nonce' => wp_create_nonce( 'wp_rest' ) )
	) );
}

/**
 * Resolve the current user from the logged-in cookie directly.
 *
 * WP REST's default auth flow rejects cookie auth without a valid X-WP-Nonce
 * (rest_cookie_check_errors). The SPA can't send a nonce on its very first
 * call (it doesn't have one yet — /auth/me is how it fetches the nonce). So
 * for this specific route we trust the cookie via wp_validate_auth_cookie.
 */
function swivo_resolve_current_user() {
	if ( empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		return null;
	}
	$cookie  = wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] );
	$user_id = wp_validate_auth_cookie( $cookie, 'logged_in' );
	if ( ! $user_id ) {
		return null;
	}
	$user = get_user_by( 'id', $user_id );
	return ( $user instanceof WP_User && $user->exists() ) ? $user : null;
}

/**
 * Same issue applies to every other authenticated route — without a nonce
 * the cookie alone leaves current_user empty. Hook the REST stack so cookie
 * presence is enough to establish the session for our endpoints.
 *
 * We DO NOT bypass nonce for write requests on core WP endpoints; we just
 * give REST a logged-in user when there's a valid cookie, leaving CSRF
 * guarantees to:
 *   - SameSite=None requires explicit credentials:'include' (CORS already
 *     restricts which origins can call us)
 *   - The X-WP-Nonce header continues to be sent by the SPA on POST routes
 *     that genuinely need it (our SPA reads nonce from /auth/me and sends
 *     it back, so this is opt-in safety).
 */
add_filter( 'determine_current_user', function ( $user_id ) {
	if ( $user_id ) {
		return $user_id;
	}
	if ( empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		return $user_id;
	}
	$validated = wp_validate_auth_cookie( wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ), 'logged_in' );
	return $validated ? $validated : $user_id;
}, 30 );

/**
 * Tell WP REST that the cookie auth is OK so rest_cookie_check_errors() does
 * not raise rest_cookie_invalid_nonce on our routes.
 */
add_filter( 'rest_authentication_errors', function ( $result ) {
	if ( ! empty( $result ) ) {
		return $result;
	}
	global $wp_rest_auth_cookie;
	if ( true !== $wp_rest_auth_cookie && ! empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
		$user_id = wp_validate_auth_cookie( wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ), 'logged_in' );
		if ( $user_id ) {
			$wp_rest_auth_cookie = true;
		}
	}
	return $result;
}, 50 );

function swivo_user_payload( WP_User $u ) {
	return swivo_user_payload_array( $u );
}

function swivo_user_payload_array( WP_User $u ) {
	$active = swivo_user_has_gestion( $u->ID );
	$until  = swivo_user_gestion_until( $u->ID );
	return array(
		'id'    => $u->ID,
		'email' => $u->user_email,
		'name'  => $u->display_name,
		'roles' => array_values( $u->roles ),
		'gestion' => array(
			'active' => (bool) $active,
			'until'  => $until ? date( 'c', $until ) : null,
		),
	);
}
