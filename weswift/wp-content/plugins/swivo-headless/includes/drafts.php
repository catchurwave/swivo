<?php
/**
 * Brouillons de dossiers (auto-save) — endpoints REST.
 *
 *   PUT  /swivo/v1/draft           — create OR update a draft (auth required)
 *   GET  /swivo/v1/draft/<id>      — fetch full payload to resume
 *   GET  /swivo/v1/drafts          — list current user's drafts + in-progress
 *   POST /swivo/v1/draft/<id>/finalize — promote draft → submitted dossier
 *   DELETE /swivo/v1/draft/<id>    — abandon
 *
 * Drafts share the `swivo_dossier` CPT but carry meta `status = draft` so they
 * surface in WP admin with the rest of the dossiers. Anonymous drafts are
 * accepted (no user_id) but require an `anon_token` for retrieval/update.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/draft', array(
		'methods'             => 'PUT, POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_draft_upsert',
	) );

	register_rest_route( 'swivo/v1', '/draft/(?P<id>\d+)', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_draft_fetch',
	) );

	register_rest_route( 'swivo/v1', '/draft/(?P<id>\d+)', array(
		'methods'             => 'DELETE',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_draft_delete',
	) );

	register_rest_route( 'swivo/v1', '/draft/(?P<id>\d+)/finalize', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_draft_finalize',
	) );

	register_rest_route( 'swivo/v1', '/drafts', array(
		'methods'             => 'GET',
		'permission_callback' => function () { return is_user_logged_in(); },
		'callback'            => 'swivo_drafts_list',
	) );

	register_rest_route( 'swivo/v1', '/draft/claim', array(
		'methods'             => 'POST',
		'permission_callback' => function () { return is_user_logged_in(); },
		'callback'            => 'swivo_drafts_claim',
	) );
} );

/**
 * Migrate anonymous drafts to the logged-in user.
 * Body: { drafts: [{ id, token }] }
 * Each draft is bound to current user_id only if its anon_token matches.
 */
function swivo_drafts_claim( WP_REST_Request $req ) {
	$body  = $req->get_json_params();
	$items = isset( $body['drafts'] ) && is_array( $body['drafts'] ) ? $body['drafts'] : array();
	$uid   = get_current_user_id();
	$user  = wp_get_current_user();
	$claimed = array();
	$skipped = array();

	foreach ( $items as $it ) {
		$id    = isset( $it['id'] ) ? (int) $it['id'] : 0;
		$token = isset( $it['token'] ) ? (string) $it['token'] : '';
		if ( ! $id ) { $skipped[] = array( 'id' => $id, 'reason' => 'no_id' ); continue; }
		$post = get_post( $id );
		if ( ! $post || 'swivo_dossier' !== $post->post_type ) { $skipped[] = array( 'id' => $id, 'reason' => 'not_found' ); continue; }
		$existing_owner = (int) get_post_meta( $id, 'user_id', true );
		if ( $existing_owner && $existing_owner !== $uid ) { $skipped[] = array( 'id' => $id, 'reason' => 'owned_by_other' ); continue; }
		$expected = (string) get_post_meta( $id, 'anon_token', true );
		if ( ! $expected || ! hash_equals( $expected, $token ) ) { $skipped[] = array( 'id' => $id, 'reason' => 'bad_token' ); continue; }

		update_post_meta( $id, 'user_id', $uid );
		delete_post_meta( $id, 'anon_token' );
		if ( $user instanceof WP_User && $user->user_email && ! get_post_meta( $id, 'email', true ) ) {
			update_post_meta( $id, 'email', $user->user_email );
		}
		$claimed[] = $id;
	}

	return rest_ensure_response( array(
		'claimed'  => $claimed,
		'skipped'  => $skipped,
		'userId'   => $uid,
	) );
}

/**
 * Generate / verify anonymous tokens so unauthenticated drafts remain accessible
 * only to the originating browser. Token stored in post_meta `anon_token`.
 */
function swivo_make_anon_token() {
	return bin2hex( random_bytes( 16 ) );
}

function swivo_check_draft_access( $post_id, $req ) {
	$uid = get_current_user_id();
	$owner = (int) get_post_meta( $post_id, 'user_id', true );
	if ( $uid && $owner === $uid ) {
		return true;
	}
	$token = $req->get_header( 'x-swivo-token' );
	if ( ! $token ) {
		$token = (string) $req->get_param( 'token' );
	}
	$expected = (string) get_post_meta( $post_id, 'anon_token', true );
	if ( $expected && hash_equals( $expected, (string) $token ) ) {
		return true;
	}
	return false;
}

function swivo_draft_upsert( WP_REST_Request $req ) {
	$body = $req->get_json_params();
	if ( ! is_array( $body ) ) {
		return new WP_Error( 'invalid', 'Payload invalide', array( 'status' => 400 ) );
	}
	$payload  = isset( $body['payload'] ) && is_array( $body['payload'] ) ? $body['payload'] : $body;
	$existing = isset( $body['id'] ) ? (int) $body['id'] : 0;
	$token    = isset( $body['token'] ) ? sanitize_text_field( $body['token'] ) : '';

	$forme  = isset( $payload['forme'] ) ? sanitize_text_field( $payload['forme'] ) : 'inconnu';
	$denom  = isset( $payload['denomination'] ) ? sanitize_text_field( $payload['denomination'] ) : '';
	$dirig  = $payload['dirigeants'][0]['personne'] ?? array();
	$prenom = isset( $dirig['prenom'] ) ? sanitize_text_field( $dirig['prenom'] ) : '';
	$nom    = isset( $dirig['nom'] ) ? sanitize_text_field( $dirig['nom'] ) : '';
	$email  = isset( $dirig['email'] ) ? sanitize_email( $dirig['email'] ) : '';
	$score  = isset( $payload['scoreCompletude'] ) ? (int) $payload['scoreCompletude'] : 0;

	$title  = sprintf( '[Brouillon] %s — %s', strtoupper( $forme ), $denom ?: trim( "$prenom $nom" ) ?: 'Sans titre' );

	if ( $existing > 0 ) {
		if ( ! swivo_check_draft_access( $existing, $req ) ) {
			return new WP_Error( 'forbidden', 'Accès refusé', array( 'status' => 403 ) );
		}
		wp_update_post( array(
			'ID'           => $existing,
			'post_title'   => $title,
			'post_content' => wp_json_encode( $payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ),
		) );
		$post_id = $existing;
	} else {
		$post_id = wp_insert_post( array(
			'post_type'    => 'swivo_dossier',
			'post_title'   => $title,
			'post_status'  => 'private',
			'post_content' => wp_json_encode( $payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ),
		), true );
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'save_failed', 'Création brouillon échouée', array( 'status' => 500 ) );
		}
		update_post_meta( $post_id, 'status', 'draft' );
		if ( ! get_current_user_id() ) {
			$token = swivo_make_anon_token();
			update_post_meta( $post_id, 'anon_token', $token );
		}
	}

	update_post_meta( $post_id, 'forme', $forme );
	update_post_meta( $post_id, 'denomination', $denom );
	update_post_meta( $post_id, 'prenom', $prenom );
	update_post_meta( $post_id, 'nom', $nom );
	update_post_meta( $post_id, 'email', $email );
	update_post_meta( $post_id, 'score_completude', $score );
	update_post_meta( $post_id, 'payload', $payload );
	update_post_meta( $post_id, 'last_saved_at', current_time( 'mysql' ) );

	if ( ( $uid = get_current_user_id() ) ) {
		update_post_meta( $post_id, 'user_id', $uid );
	}

	return rest_ensure_response( array(
		'id'      => $post_id,
		'status'  => (string) get_post_meta( $post_id, 'status', true ),
		'token'   => $token ?: null,
		'savedAt' => (string) get_post_meta( $post_id, 'last_saved_at', true ),
		'score'   => $score,
	) );
}

function swivo_draft_fetch( WP_REST_Request $req ) {
	$id = (int) $req->get_param( 'id' );
	$post = get_post( $id );
	if ( ! $post || 'swivo_dossier' !== $post->post_type ) {
		return new WP_Error( 'not_found', 'Brouillon introuvable', array( 'status' => 404 ) );
	}
	if ( ! swivo_check_draft_access( $id, $req ) ) {
		return new WP_Error( 'forbidden', 'Accès refusé', array( 'status' => 403 ) );
	}
	$payload = get_post_meta( $id, 'payload', true );
	if ( ! is_array( $payload ) ) {
		$decoded = json_decode( (string) $post->post_content, true );
		$payload = is_array( $decoded ) ? $decoded : array();
	}
	return rest_ensure_response( array(
		'id'      => $id,
		'status'  => (string) get_post_meta( $id, 'status', true ),
		'savedAt' => (string) get_post_meta( $id, 'last_saved_at', true ),
		'payload' => $payload,
	) );
}

function swivo_draft_delete( WP_REST_Request $req ) {
	$id = (int) $req->get_param( 'id' );
	if ( ! swivo_check_draft_access( $id, $req ) ) {
		return new WP_Error( 'forbidden', 'Accès refusé', array( 'status' => 403 ) );
	}
	wp_trash_post( $id );
	return rest_ensure_response( array( 'ok' => true ) );
}

function swivo_draft_finalize( WP_REST_Request $req ) {
	$id = (int) $req->get_param( 'id' );
	if ( ! swivo_check_draft_access( $id, $req ) ) {
		return new WP_Error( 'forbidden', 'Accès refusé', array( 'status' => 403 ) );
	}
	$payload = get_post_meta( $id, 'payload', true );
	if ( ! is_array( $payload ) ) {
		return new WP_Error( 'empty', 'Dossier vide', array( 'status' => 400 ) );
	}

	// Auto-account : si non connecté ET email présent dans le dossier, on crée
	// un compte WP « subscriber » et on connecte la session. Évite à l'utilisateur
	// de tout ressaisir + permet le suivi/paiement.
	$account_created = false;
	if ( ! get_current_user_id() ) {
		$email = swivo_extract_email_from_payload( $payload );
		if ( $email ) {
			$account_created = swivo_autocreate_account_for_dossier( $id, $email, $payload );
		}
	}

	$post = get_post( $id );
	if ( $post && stripos( $post->post_title, '[Brouillon]' ) === 0 ) {
		wp_update_post( array(
			'ID'         => $id,
			'post_title' => trim( str_replace( '[Brouillon]', '', $post->post_title ) ),
		) );
	}
	update_post_meta( $id, 'status', 'pending' );
	update_post_meta( $id, 'finalized_at', current_time( 'mysql' ) );
	if ( $email = swivo_extract_email_from_payload( $payload ) ) {
		update_post_meta( $id, 'email', $email );
	}
	do_action( 'swivo_dossier_created', $id, $payload );
	return rest_ensure_response( array(
		'id'              => $id,
		'status'          => 'pending',
		'account_created' => $account_created,
	) );
}

function swivo_extract_email_from_payload( $payload ) {
	if ( ! is_array( $payload ) ) return '';
	$candidates = array(
		$payload['identite']['email']                ?? '',
		$payload['dirigeants'][0]['personne']['email'] ?? '',
		$payload['email']                            ?? '',
	);
	foreach ( $candidates as $e ) {
		$e = sanitize_email( (string) $e );
		if ( is_email( $e ) ) return $e;
	}
	return '';
}

function swivo_autocreate_account_for_dossier( $dossier_id, $email, $payload ) {
	$existing = get_user_by( 'email', $email );
	if ( $existing instanceof WP_User ) {
		// Compte déjà présent — on n'écrase rien ni ne logue (sécurité).
		update_post_meta( $dossier_id, 'user_id', (int) $existing->ID );
		return false;
	}

	$identite = $payload['identite'] ?? array();
	$dir0     = $payload['dirigeants'][0]['personne'] ?? array();
	$prenom   = sanitize_text_field( (string) ( $identite['prenom'] ?? $dir0['prenom'] ?? '' ) );
	$nom      = sanitize_text_field( (string) ( $identite['nom']    ?? $dir0['nom']    ?? '' ) );
	$display  = trim( "$prenom $nom" ) ?: strtok( $email, '@' );
	$pass     = wp_generate_password( 24, true, true );

	// Suppress wp_mail() from user_register hooks (WC welcome, PMP, etc.).
	$shut = function () { return true; };
	add_filter( 'pre_wp_mail', $shut, 999 );

	$uid = wp_insert_user( array(
		'user_login'   => $email,
		'user_email'   => $email,
		'user_pass'    => $pass,
		'display_name' => $display,
		'first_name'   => $prenom,
		'last_name'    => $nom,
		'role'         => 'subscriber',
	) );

	remove_filter( 'pre_wp_mail', $shut, 999 );

	if ( is_wp_error( $uid ) ) return false;
	update_post_meta( $dossier_id, 'user_id', (int) $uid );
	delete_post_meta( $dossier_id, 'anon_token' );

	wp_set_current_user( $uid );
	wp_set_auth_cookie( $uid, true );

	// Envoi d'un mail de bienvenue avec lien magique de définition de mot de passe.
	wp_schedule_single_event( time() + 5, 'swivo_send_dossier_welcome', array( $uid, $dossier_id ) );
	return true;
}

add_action( 'swivo_send_dossier_welcome', function ( $user_id, $dossier_id ) {
	$user = get_user_by( 'id', (int) $user_id );
	if ( ! $user instanceof WP_User ) return;
	$key  = get_password_reset_key( $user );
	$url  = is_wp_error( $key )
		? home_url( '/connexion' )
		: home_url( '/connexion?reset=' . rawurlencode( $key ) . '&login=' . rawurlencode( $user->user_login ) );
	$first = strtok( (string) $user->display_name, ' ' ) ?: '';
	$subject = '[Swivo] Votre compte + suivi de dossier';
	$body = "Bonjour $first,\n\n"
		. "Votre dossier #{$dossier_id} est enregistré. Pour suivre son avancement et procéder au paiement, "
		. "définissez votre mot de passe via ce lien (24 h) : $url\n\n"
		. "Ensuite, connectez-vous sur " . home_url( '/espace-createur' ) . "\n\n"
		. "— L'équipe Swivo";
	wp_mail( $user->user_email, $subject, $body );
}, 10, 2 );

function swivo_drafts_list() {
	$uid = get_current_user_id();
	$posts = get_posts( array(
		'post_type'      => 'swivo_dossier',
		'post_status'    => array( 'private', 'publish' ),
		'meta_query'     => array(
			'relation' => 'AND',
			array( 'key' => 'user_id', 'value' => $uid ),
			array( 'key' => 'status', 'value' => 'draft' ),
		),
		'orderby'        => 'modified',
		'order'          => 'DESC',
		'posts_per_page' => 50,
	) );
	$out = array();
	foreach ( $posts as $p ) {
		$out[] = array(
			'id'        => $p->ID,
			'title'     => $p->post_title,
			'forme'     => (string) get_post_meta( $p->ID, 'forme', true ),
			'score'     => (int) get_post_meta( $p->ID, 'score_completude', true ),
			'savedAt'   => (string) get_post_meta( $p->ID, 'last_saved_at', true ) ?: mysql2date( 'c', $p->post_modified ),
			'updatedAt' => mysql2date( 'c', $p->post_modified ),
		);
	}
	return rest_ensure_response( $out );
}
