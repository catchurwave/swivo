<?php
/**
 * Gestion endpoints — pause / fermeture / divers actes pilotés depuis l'espace
 * client. Crée un nouveau dossier `swivo_dossier` typé pour l'équipe.
 *
 * Routes :
 *   POST /swivo/v1/dossier/pause
 *   POST /swivo/v1/dossier/fermeture
 *   POST /swivo/v1/dossier/acte    { type: 'pv'|'dividendes'|'transfert', payload }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	$permission = function () { return is_user_logged_in(); };
	register_rest_route( 'swivo/v1', '/dossier/pause',     array( 'methods' => 'POST', 'permission_callback' => $permission, 'callback' => 'swivo_dossier_pause' ) );
	register_rest_route( 'swivo/v1', '/dossier/fermeture', array( 'methods' => 'POST', 'permission_callback' => $permission, 'callback' => 'swivo_dossier_fermeture' ) );
	register_rest_route( 'swivo/v1', '/dossier/acte',      array( 'methods' => 'POST', 'permission_callback' => $permission, 'callback' => 'swivo_dossier_acte' ) );
} );

function swivo_dossier_pause( WP_REST_Request $req ) {
	return swivo_create_gestion_dossier( $req, 'pause', 'Mise en pause' );
}

function swivo_dossier_fermeture( WP_REST_Request $req ) {
	return swivo_create_gestion_dossier( $req, 'fermeture', 'Fermeture / radiation' );
}

function swivo_dossier_acte( WP_REST_Request $req ) {
	$body = $req->get_json_params();
	$type = isset( $body['type'] ) ? sanitize_key( $body['type'] ) : 'acte';
	return swivo_create_gestion_dossier( $req, 'acte:' . $type, 'Acte juridique — ' . $type );
}

function swivo_create_gestion_dossier( WP_REST_Request $req, $kind, $label ) {
	$user = wp_get_current_user();
	$body = $req->get_json_params();
	if ( ! is_array( $body ) ) {
		$body = array();
	}

	$siret = isset( $body['siret'] ) ? sanitize_text_field( $body['siret'] ) : '';
	$denom = isset( $body['denomination'] ) ? sanitize_text_field( $body['denomination'] ) : '';

	$post_id = wp_insert_post( array(
		'post_type'    => 'swivo_dossier',
		'post_status'  => 'private',
		'post_title'   => sprintf( '%s — %s', $label, $denom ?: $user->user_email ),
		'post_content' => wp_json_encode( $body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ),
	), true );

	if ( is_wp_error( $post_id ) ) {
		return new WP_Error( 'swivo_save_failed', 'Création échouée.', array( 'status' => 500 ) );
	}

	update_post_meta( $post_id, 'kind', $kind );
	update_post_meta( $post_id, 'siret', $siret );
	update_post_meta( $post_id, 'denomination', $denom );
	update_post_meta( $post_id, 'email', $user->user_email );
	update_post_meta( $post_id, 'user_id', $user->ID );
	update_post_meta( $post_id, 'status', 'pending' );
	update_post_meta( $post_id, 'payload', $body );

	do_action( 'swivo_dossier_created', $post_id, $body );
	do_action( 'swivo_gestion_dossier_created', $post_id, $kind );

	return rest_ensure_response( array( 'id' => $post_id, 'status' => 'pending', 'kind' => $kind ) );
}
