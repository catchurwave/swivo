<?php
/**
 * CORS for the headless SPA.
 *
 * Origins allowed by default: `http://localhost:5173`, `http://localhost:4173`
 * and whatever the editor adds in Settings → Swivo. Wildcards are not
 * permitted on purpose — credentials are sent with dossier requests.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_setup_cors() {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter( 'rest_pre_serve_request', 'swivo_send_cors_headers' );
}

function swivo_allowed_origins() {
	// Localhost origins only enabled in dev (WP_DEBUG or wp-env). In production
	// the SPA origin must be added explicitly via Settings → Swivo → Origines CORS.
	$defaults = ( defined( 'WP_DEBUG' ) && WP_DEBUG )
		? array( 'http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173' )
		: array();
	$extra_raw = (string) get_option( 'swivo_allowed_origins', '' );
	$extra     = array_filter( array_map( 'trim', explode( "\n", $extra_raw ) ) );
	return array_unique( array_merge( $defaults, $extra ) );
}

function swivo_send_cors_headers( $value ) {
	$origin = get_http_origin();
	if ( $origin && in_array( $origin, swivo_allowed_origins(), true ) ) {
		header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
		header( 'Vary: Origin' );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
		header( 'Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, Link' );
	}

	if ( 'OPTIONS' === ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
		status_header( 200 );
		exit;
	}

	return $value;
}
