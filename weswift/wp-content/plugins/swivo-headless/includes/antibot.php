<?php
/**
 * Anti-bot — protections appliquées sur les endpoints publics :
 *   - /swivo/v1/auth/register
 *   - /swivo/v1/auth/forgot
 *   - /swivo/v1/dossier
 *   - /swivo/v1/draft         (création anonyme)
 *   - /swivo/v1/chat/turn     (déjà rate-limité, on ajoute honeypot + minTime)
 *
 * Couches :
 *   1. Honeypot field — un champ `website` (caché côté SPA) qui doit rester vide.
 *   2. Min-time — un timestamp `formStartedAt` (client) doit être > 2.5 s avant submit.
 *   3. Cloudflare Turnstile (optionnel) — token serveur-vérifié si site key configurée.
 *   4. IP throttle agressif partagé.
 *
 * Le SPA inclut ces champs dans le payload (cf. src/lib/antibot.ts).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SWIVO_ANTIBOT_MIN_FORM_MS = 2500;

/** Routes (par méthode) sur lesquelles on applique l'anti-bot. */
function swivo_antibot_routes() {
	return apply_filters( 'swivo_antibot_routes', array(
		'POST /swivo/v1/auth/register',
		'POST /swivo/v1/auth/forgot',
		'POST /swivo/v1/dossier',
		'PUT  /swivo/v1/draft',
		'POST /swivo/v1/draft',
	) );
}

add_filter( 'rest_pre_dispatch', 'swivo_antibot_check', 5, 3 );

function swivo_antibot_check( $result, $server, $request ) {
	if ( $result !== null ) return $result;

	$method = $request->get_method();
	$route  = $request->get_route();
	$key    = $method . ' ' . $route;
	$key_alt = $method . '  ' . $route; // tolerate the double-space alias used above
	$routes = swivo_antibot_routes();
	$active = false;
	foreach ( $routes as $r ) {
		if ( preg_match( '/^' . preg_quote( $method, '/' ) . '\s+' . preg_quote( $route, '/' ) . '$/', $r ) ) {
			$active = true; break;
		}
	}
	if ( ! $active ) return $result;

	$body = $request->get_json_params();
	if ( ! is_array( $body ) ) $body = array();

	/* ---- 1. Honeypot ---- */
	$hp = (string) ( $body['website'] ?? $body['_hp'] ?? '' );
	if ( $hp !== '' ) {
		return swivo_antibot_block( 'honeypot' );
	}

	/* ---- 2. Min-time ---- */
	$started = isset( $body['formStartedAt'] ) ? (int) $body['formStartedAt'] : 0;
	if ( $started > 0 ) {
		$now_ms = (int) ( microtime( true ) * 1000 );
		$elapsed = $now_ms - $started;
		if ( $elapsed < SWIVO_ANTIBOT_MIN_FORM_MS ) {
			return swivo_antibot_block( 'too_fast', array( 'elapsed_ms' => $elapsed ) );
		}
	}

	/* ---- 3. IP throttle ---- */
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( $_SERVER['REMOTE_ADDR'] ) : 'unknown';
	$bkt = 'swivo_abot_' . md5( $ip . '|' . $route );
	$n = (int) get_transient( $bkt );
	$cap = (int) apply_filters( 'swivo_antibot_burst_cap', 8, $route );
	if ( $n > $cap ) {
		return swivo_antibot_block( 'throttled' );
	}
	set_transient( $bkt, $n + 1, 60 );

	/* ---- 4. Cloudflare Turnstile (optionnel) ---- */
	$ts_secret = trim( (string) get_option( 'swivo_turnstile_secret', '' ) );
	if ( $ts_secret ) {
		$token = (string) ( $body['turnstileToken'] ?? '' );
		if ( ! $token ) {
			return swivo_antibot_block( 'turnstile_missing' );
		}
		$verify = wp_remote_post( 'https://challenges.cloudflare.com/turnstile/v0/siteverify', array(
			'timeout' => 6,
			'body'    => array(
				'secret'   => $ts_secret,
				'response' => $token,
				'remoteip' => $ip,
			),
		) );
		if ( is_wp_error( $verify ) ) {
			return swivo_antibot_block( 'turnstile_upstream' );
		}
		$json = json_decode( wp_remote_retrieve_body( $verify ), true );
		if ( empty( $json['success'] ) ) {
			return swivo_antibot_block( 'turnstile_invalid' );
		}
	}

	return $result;
}

function swivo_antibot_block( $reason, $extra = array() ) {
	error_log( '[swivo-antibot] blocked: ' . $reason . ' ' . wp_json_encode( $extra ) );
	return new WP_Error(
		'swivo_antibot',
		'Requête refusée par le filtre anti-bot.',
		array_merge( array( 'status' => 429, 'reason' => $reason ), $extra )
	);
}

/** Expose la site key Turnstile au SPA (lecture publique). */
add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/security/turnstile', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			return array(
				'siteKey' => (string) get_option( 'swivo_turnstile_site', '' ),
			);
		},
	) );
} );
