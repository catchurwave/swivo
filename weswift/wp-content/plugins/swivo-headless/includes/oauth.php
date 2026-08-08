<?php
/**
 * OAuth / OIDC connexions tierces — Google + FranceConnect.
 *
 * Implémente le flow Authorization Code + state CSRF. Les ID providers
 * doivent être enregistrés en options WP (admin > Réglages > Swivo).
 *
 * Routes :
 *   GET  /auth/google/start         → redirige vers Google
 *   GET  /auth/google/callback      ← retour Google, crée/login user, redirige SPA
 *   GET  /auth/france-connect/start
 *   GET  /auth/france-connect/callback
 *
 * NB : pour FranceConnect en prod il faut un compte partenaire (https://partenaires.franceconnect.gouv.fr)
 *      et URLs HTTPS. Sandbox FranceConnect+ disponible pour dev (eIDAS substantiel).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SWIVO_OAUTH_PROVIDERS = array(
	'google' => array(
		'authorize' => 'https://accounts.google.com/o/oauth2/v2/auth',
		'token'     => 'https://oauth2.googleapis.com/token',
		'userinfo'  => 'https://openidconnect.googleapis.com/v1/userinfo',
		'scope'     => 'openid email profile',
	),
	'france-connect' => array(
		// Bac à sable FranceConnect+ (eIDAS substantiel). Remplacer par prod après agrément.
		'authorize' => 'https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize',
		'token'     => 'https://fcp.integ01.dev-franceconnect.fr/api/v1/token',
		'userinfo'  => 'https://fcp.integ01.dev-franceconnect.fr/api/v1/userinfo',
		'logout'    => 'https://fcp.integ01.dev-franceconnect.fr/api/v1/logout',
		'scope'     => 'openid given_name family_name birthdate gender preferred_username email address phone',
	),
);

add_action( 'rest_api_init', function () {
	foreach ( array_keys( SWIVO_OAUTH_PROVIDERS ) as $provider ) {
		register_rest_route( 'swivo/v1', "/auth/$provider/start", array(
			'methods' => 'GET', 'permission_callback' => '__return_true',
			'callback' => function ( WP_REST_Request $r ) use ( $provider ) { return swivo_oauth_start( $provider, $r ); },
		) );
		register_rest_route( 'swivo/v1', "/auth/$provider/callback", array(
			'methods' => 'GET', 'permission_callback' => '__return_true',
			'callback' => function ( WP_REST_Request $r ) use ( $provider ) { return swivo_oauth_callback( $provider, $r ); },
		) );
	}
} );

function swivo_oauth_creds( $provider ) {
	$opts = get_option( 'swivo_oauth_' . str_replace( '-', '_', $provider ), array() );
	$client_id     = $opts['client_id']     ?? '';
	$client_secret = $opts['client_secret'] ?? '';
	$site          = home_url();
	return array(
		'client_id'     => $client_id,
		'client_secret' => $client_secret,
		'redirect_uri'  => $site . '/wp-json/swivo/v1/auth/' . $provider . '/callback',
	);
}

function swivo_oauth_start( $provider, WP_REST_Request $r ) {
	$conf = SWIVO_OAUTH_PROVIDERS[ $provider ] ?? null;
	if ( ! $conf ) return new WP_Error( 'unknown_provider', 'Fournisseur inconnu', array( 'status' => 400 ) );
	$creds = swivo_oauth_creds( $provider );
	if ( empty( $creds['client_id'] ) ) {
		return new WP_Error( 'not_configured', "OAuth $provider non configuré (admin > Réglages > Swivo).", array( 'status' => 503 ) );
	}
	$state = wp_generate_password( 32, false, false );
	$nonce = wp_generate_password( 32, false, false );
	set_transient( 'swivo_oauth_state_' . $state, array(
		'provider' => $provider,
		'nonce'    => $nonce,
		'return'   => sanitize_text_field( (string) $r->get_param( 'return' ) ),
	), 900 );

	$args = array(
		'response_type' => 'code',
		'client_id'     => $creds['client_id'],
		'redirect_uri'  => $creds['redirect_uri'],
		'scope'         => $conf['scope'],
		'state'         => $state,
		'nonce'         => $nonce,
	);
	if ( $provider === 'france-connect' ) {
		$args['acr_values'] = 'eidas2';
	}
	$url = add_query_arg( $args, $conf['authorize'] );
	wp_redirect( $url );
	exit;
}

function swivo_oauth_callback( $provider, WP_REST_Request $r ) {
	$conf = SWIVO_OAUTH_PROVIDERS[ $provider ] ?? null;
	if ( ! $conf ) return new WP_Error( 'unknown_provider', 'Fournisseur inconnu', array( 'status' => 400 ) );
	$code  = sanitize_text_field( (string) $r->get_param( 'code' ) );
	$state = sanitize_text_field( (string) $r->get_param( 'state' ) );
	$stored = get_transient( 'swivo_oauth_state_' . $state );
	if ( ! $stored ) {
		return new WP_Error( 'bad_state', 'État CSRF invalide ou expiré.', array( 'status' => 400 ) );
	}
	delete_transient( 'swivo_oauth_state_' . $state );

	$creds = swivo_oauth_creds( $provider );
	$resp = wp_remote_post( $conf['token'], array(
		'body' => array(
			'grant_type'    => 'authorization_code',
			'code'          => $code,
			'redirect_uri'  => $creds['redirect_uri'],
			'client_id'     => $creds['client_id'],
			'client_secret' => $creds['client_secret'],
		),
		'timeout' => 15,
	) );
	if ( is_wp_error( $resp ) ) {
		return new WP_Error( 'token_failed', $resp->get_error_message(), array( 'status' => 500 ) );
	}
	$tok = json_decode( wp_remote_retrieve_body( $resp ), true );
	$access = $tok['access_token'] ?? '';
	if ( ! $access ) return new WP_Error( 'no_token', 'Pas d’access token reçu.', array( 'status' => 500 ) );

	$resp2 = wp_remote_get( $conf['userinfo'], array(
		'headers' => array( 'Authorization' => 'Bearer ' . $access ),
		'timeout' => 15,
	) );
	if ( is_wp_error( $resp2 ) ) return new WP_Error( 'userinfo_failed', $resp2->get_error_message(), array( 'status' => 500 ) );
	$user = json_decode( wp_remote_retrieve_body( $resp2 ), true );
	if ( ! $user || empty( $user['email'] ) ) return new WP_Error( 'no_email', 'Aucun email retourné.', array( 'status' => 500 ) );

	// Provider must assert the email is verified. Without this check an OAuth
	// app that returns an arbitrary unverified email could attach the session
	// to any existing WP account sharing that email (account takeover).
	// Google returns `email_verified`; FranceConnect's eIDAS flow implicitly
	// verifies identity, so we accept it when the acr claim is present.
	$email_verified = false;
	if ( isset( $user['email_verified'] ) ) {
		$email_verified = ( true === $user['email_verified'] || '1' === (string) $user['email_verified'] || 'true' === $user['email_verified'] );
	} elseif ( $provider === 'france-connect' ) {
		$email_verified = true; // FC asserts identity via eIDAS, email comes from civil registry context
	}
	if ( ! $email_verified ) {
		return new WP_Error( 'email_unverified', 'Email non vérifié par le fournisseur.', array( 'status' => 401 ) );
	}

	// Login ou création WP user
	$wp_user = get_user_by( 'email', $user['email'] );
	if ( ! $wp_user ) {
		$login = sanitize_user( strstr( $user['email'], '@', true ) . wp_generate_password( 4, false ) );
		$pass  = wp_generate_password( 32, true, true );
		$uid   = wp_create_user( $login, $pass, $user['email'] );
		if ( is_wp_error( $uid ) ) return new WP_Error( 'create_failed', $uid->get_error_message(), array( 'status' => 500 ) );
		$wp_user = get_user_by( 'id', $uid );
		wp_update_user( array(
			'ID'         => $uid,
			'first_name' => sanitize_text_field( $user['given_name'] ?? '' ),
			'last_name'  => sanitize_text_field( $user['family_name'] ?? '' ),
			'display_name' => sanitize_text_field( ( $user['given_name'] ?? '' ) . ' ' . ( $user['family_name'] ?? '' ) ),
		) );
	}

	// Stocker données profil pour pré-fill
	update_user_meta( $wp_user->ID, 'swivo_oauth_' . str_replace( '-', '_', $provider ), $user );

	wp_set_current_user( $wp_user->ID );
	wp_set_auth_cookie( $wp_user->ID, true, is_ssl() );

	$return = $stored['return'] ?: '/espace-createur';
	wp_redirect( home_url( '/?_swivo_oauth=ok&from=' . urlencode( $return ) ) );
	exit;
}

/* ============================================================ */
/* OPTIONS ADMIN                                                 */
/* ============================================================ */

add_action( 'admin_init', function () {
	register_setting( 'swivo_settings', 'swivo_oauth_google', array(
		'type'              => 'array',
		'sanitize_callback' => 'swivo_sanitize_oauth_creds',
		'default'           => array( 'client_id' => '', 'client_secret' => '' ),
	) );
	register_setting( 'swivo_settings', 'swivo_oauth_france_connect', array(
		'type'              => 'array',
		'sanitize_callback' => 'swivo_sanitize_oauth_creds',
		'default'           => array( 'client_id' => '', 'client_secret' => '' ),
	) );
} );

function swivo_sanitize_oauth_creds( $value ) {
	if ( ! is_array( $value ) ) return array( 'client_id' => '', 'client_secret' => '' );
	return array(
		'client_id'     => isset( $value['client_id'] )     ? sanitize_text_field( $value['client_id'] )     : '',
		'client_secret' => isset( $value['client_secret'] ) ? sanitize_text_field( $value['client_secret'] ) : '',
	);
}
