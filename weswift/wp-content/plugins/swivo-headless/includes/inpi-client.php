<?php
/**
 * Guichet unique INPI — HTTP client (stub).
 *
 * The public Guichet unique API needs credentials (mandataire access) we don't
 * have yet; this module implements the wire format so we can swap in real
 * credentials without restructuring.
 *
 * Endpoints used (cf. doc PDF "API formalités v4.0") :
 *   POST {base}/formalites      → submit a new formality, returns formality id
 *   GET  {base}/formalites/{id} → poll status
 *
 * Activation flow :
 *   - admin clicks "Déposer au Guichet unique" on a dossier
 *   - if `swivo_inpi_token` is set and the mandataire base URL is reachable,
 *     payload from inpi.php is POSTed; response stored as meta
 *   - otherwise the function returns a WP_Error explaining the env is in
 *     "manual mode" — the team still uses Export INPI JSON for now.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_post_swivo_deposit_inpi', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Refusé.' );
	}
	check_admin_referer( 'swivo_deposit_inpi' );

	$id = isset( $_GET['dossier'] ) ? (int) $_GET['dossier'] : 0;
	if ( ! $id ) {
		wp_die( 'Dossier manquant.' );
	}

	$result = swivo_inpi_deposit( $id );
	$redirect = admin_url( 'post.php?post=' . $id . '&action=edit' );
	if ( is_wp_error( $result ) ) {
		set_transient( 'swivo_inpi_notice_' . get_current_user_id(), array( 'error' => $result->get_error_message() ), 30 );
	} else {
		set_transient( 'swivo_inpi_notice_' . get_current_user_id(), array( 'ok' => 'Dossier transmis. ID INPI : ' . ( $result['id'] ?? 'n/c' ) ), 30 );
	}
	wp_safe_redirect( $redirect );
	exit;
} );

function swivo_inpi_deposit( $dossier_id ) {
	$base  = trim( (string) get_option( 'swivo_inpi_base_url', '' ) );
	$token = trim( (string) get_option( 'swivo_inpi_token', '' ) );

	if ( ! $base || ! $token ) {
		return new WP_Error( 'swivo_inpi_manual', 'Mode manuel — accès mandataire non configuré. Utilisez Export INPI JSON et déposez via guichet-formalites.inpi.fr.' );
	}

	$payload = get_post_meta( $dossier_id, 'payload', true );
	if ( ! is_array( $payload ) ) {
		$payload = array();
	}
	$body = swivo_map_to_inpi( $payload );

	$response = wp_remote_post( rtrim( $base, '/' ) . '/formalites', array(
		'timeout' => 30,
		'headers' => array(
			'Authorization' => 'Bearer ' . $token,
			'Content-Type'  => 'application/json',
			'Accept'        => 'application/json',
		),
		'body' => wp_json_encode( $body ),
	) );

	if ( is_wp_error( $response ) ) {
		return $response;
	}
	$code = wp_remote_retrieve_response_code( $response );
	$raw  = wp_remote_retrieve_body( $response );
	$json = json_decode( $raw, true );

	if ( $code < 200 || $code >= 300 ) {
		return new WP_Error( 'swivo_inpi_upstream', 'INPI ' . $code . ' — ' . substr( (string) $raw, 0, 200 ) );
	}

	$inpi_id = $json['id'] ?? ( $json['formaliteId'] ?? '' );
	update_post_meta( $dossier_id, 'inpi_id', sanitize_text_field( (string) $inpi_id ) );
	update_post_meta( $dossier_id, 'inpi_deposited_at', current_time( 'mysql' ) );
	update_post_meta( $dossier_id, 'status', 'deposited' );
	do_action( 'swivo_dossier_status_changed', $dossier_id, 'deposited', 'paid' );

	return array( 'id' => $inpi_id );
}

/**
 * Poll status (admin button). Updates dossier status based on INPI response.
 */
add_action( 'admin_post_swivo_poll_inpi', function () {
	if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Refusé.' );
	check_admin_referer( 'swivo_poll_inpi' );
	$id = isset( $_GET['dossier'] ) ? (int) $_GET['dossier'] : 0;
	if ( ! $id ) wp_die( 'Dossier manquant.' );

	$status = swivo_inpi_poll( $id );
	set_transient( 'swivo_inpi_notice_' . get_current_user_id(),
		is_wp_error( $status )
			? array( 'error' => $status->get_error_message() )
			: array( 'ok' => 'Statut INPI : ' . $status ),
		30
	);
	wp_safe_redirect( admin_url( 'post.php?post=' . $id . '&action=edit' ) );
	exit;
} );

function swivo_inpi_poll( $dossier_id ) {
	$base    = trim( (string) get_option( 'swivo_inpi_base_url', '' ) );
	$token   = trim( (string) get_option( 'swivo_inpi_token', '' ) );
	$inpi_id = (string) get_post_meta( $dossier_id, 'inpi_id', true );

	if ( ! $base || ! $token ) {
		return new WP_Error( 'swivo_inpi_manual', 'Mode manuel — pas de polling.' );
	}
	if ( ! $inpi_id ) {
		return new WP_Error( 'swivo_no_inpi_id', 'Pas d’ID INPI sur ce dossier.' );
	}

	$response = wp_remote_get( rtrim( $base, '/' ) . '/formalites/' . rawurlencode( $inpi_id ), array(
		'timeout' => 20,
		'headers' => array( 'Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json' ),
	) );

	if ( is_wp_error( $response ) ) return $response;
	$json = json_decode( wp_remote_retrieve_body( $response ), true );
	$inpi_status = strtolower( (string) ( $json['statut'] ?? $json['status'] ?? '' ) );

	$map = array(
		'enregistree' => 'completed',
		'enregistree_avec_observations' => 'completed',
		'a_completer' => 'rejected',
		'rejetee'     => 'rejected',
		'recue'       => 'deposited',
		'en_cours'    => 'deposited',
	);
	if ( isset( $map[ $inpi_status ] ) ) {
		$prev = (string) get_post_meta( $dossier_id, 'status', true );
		update_post_meta( $dossier_id, 'status', $map[ $inpi_status ] );
		if ( $prev !== $map[ $inpi_status ] ) {
			do_action( 'swivo_dossier_status_changed', $dossier_id, $map[ $inpi_status ], $prev );
		}
	}
	return $inpi_status ?: 'inconnu';
}

/**
 * Admin notice for the INPI buttons.
 */
add_action( 'admin_notices', function () {
	$key = 'swivo_inpi_notice_' . get_current_user_id();
	$msg = get_transient( $key );
	if ( ! $msg ) return;
	delete_transient( $key );
	if ( ! empty( $msg['ok'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( $msg['ok'] ) . '</p></div>';
	}
	if ( ! empty( $msg['error'] ) ) {
		echo '<div class="notice notice-error is-dismissible"><p>' . esc_html( $msg['error'] ) . '</p></div>';
	}
} );

/**
 * Add the two buttons to the dossier meta box.
 */
add_filter( 'swivo_dossier_meta_box_extra', function ( $html, $post_id ) {
	$deposit = wp_nonce_url( admin_url( 'admin-post.php?action=swivo_deposit_inpi&dossier=' . $post_id ), 'swivo_deposit_inpi' );
	$poll    = wp_nonce_url( admin_url( 'admin-post.php?action=swivo_poll_inpi&dossier=' . $post_id ),    'swivo_poll_inpi' );
	$html .= '<p><a href="' . esc_url( $deposit ) . '" class="button">Déposer au Guichet unique</a> ';
	$html .= '<a href="' . esc_url( $poll ) . '" class="button">Rafraîchir statut INPI</a></p>';
	return $html;
}, 10, 2 );
