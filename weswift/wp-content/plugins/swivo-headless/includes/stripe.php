<?php
/**
 * Checkout entry points + Stripe webhook fallback.
 *
 * Default path: WooCommerce orders (swivo_wc_create_*_order) so WC Stripe
 * Gateway handles payments uniformly. The direct Stripe Checkout fallback
 * is kept for environments without WC, but WC is the recommended setup.
 *
 * POST /swivo/v1/checkout   { dossierId }  → { url }
 * POST /swivo/v1/subscribe                 → { url }
 * POST /swivo/v1/stripe/webhook            → optional, legacy only
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/checkout', array(
		'methods'             => 'POST',
		'permission_callback' => function () { return is_user_logged_in(); },
		'callback'            => 'swivo_rest_checkout',
	) );

	register_rest_route( 'swivo/v1', '/subscribe', array(
		'methods'             => 'POST',
		'permission_callback' => function () { return is_user_logged_in(); },
		'callback'            => 'swivo_rest_subscribe',
	) );

	register_rest_route( 'swivo/v1', '/stripe/webhook', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_stripe_webhook',
	) );
} );

function swivo_rest_checkout( WP_REST_Request $req ) {
	$body      = $req->get_json_params();
	$dossierId = isset( $body['dossierId'] ) ? (int) $body['dossierId'] : 0;
	$dossier   = $dossierId ? get_post( $dossierId ) : null;
	if ( ! $dossier || 'swivo_dossier' !== $dossier->post_type ) {
		return new WP_Error( 'swivo_invalid', 'Dossier introuvable.', array( 'status' => 404 ) );
	}
	$owner = (int) get_post_meta( $dossier->ID, 'user_id', true );
	if ( $owner && $owner !== get_current_user_id() && ! current_user_can( 'manage_options' ) ) {
		return new WP_Error( 'swivo_forbidden', 'Accès refusé.', array( 'status' => 403 ) );
	}

	$user  = wp_get_current_user();
	$email = (string) get_post_meta( $dossier->ID, 'email', true ) ?: $user->user_email;

	if ( function_exists( 'swivo_wc_active' ) && swivo_wc_active() ) {
		$url = swivo_wc_create_creation_order( $dossier->ID, $user->ID, $email );
		if ( is_wp_error( $url ) ) return $url;
		return rest_ensure_response( array( 'url' => $url ) );
	}

	return swivo_direct_stripe_checkout( $dossier, $email );
}

function swivo_rest_subscribe() {
	$user = wp_get_current_user();
	if ( function_exists( 'swivo_wc_active' ) && swivo_wc_active() ) {
		$url = swivo_wc_create_gestion_order( $user->ID, $user->user_email );
		if ( is_wp_error( $url ) ) return $url;
		return rest_ensure_response( array( 'url' => $url ) );
	}
	return swivo_direct_stripe_subscribe( $user );
}

/* ───────────────────────────────────────────────────────────────────────
   Direct Stripe Checkout fallback (no WooCommerce). Same behaviour as the
   pre-WC plugin: creates a Stripe Checkout Session via the REST API.
   ─────────────────────────────────────────────────────────────────────── */

function swivo_stripe_keys() {
	return array(
		'secret'             => trim( (string) get_option( 'swivo_stripe_secret', '' ) ),
		'webhook_secret'     => trim( (string) get_option( 'swivo_stripe_webhook_secret', '' ) ),
		'creation_price'     => (int) get_option( 'swivo_stripe_creation_amount_cents', 2990 ),
		'gestion_price_id'   => trim( (string) get_option( 'swivo_stripe_gestion_price_id', '' ) ),
		'gestion_amount'     => (int) get_option( 'swivo_stripe_gestion_amount_cents', 990 ),
	);
}

function swivo_direct_stripe_checkout( $dossier, $email ) {
	$cfg = swivo_stripe_keys();
	if ( ! $cfg['secret'] ) {
		return new WP_Error( 'swivo_no_stripe', 'Stripe non configuré et WooCommerce inactif.', array( 'status' => 503 ) );
	}
	$response = wp_remote_post( 'https://api.stripe.com/v1/checkout/sessions', array(
		'timeout' => 30,
		'headers' => array(
			'Authorization' => 'Bearer ' . $cfg['secret'],
			'Content-Type'  => 'application/x-www-form-urlencoded',
		),
		'body' => http_build_query( array(
			'mode'                      => 'payment',
			'payment_method_types[]'    => 'card',
			'customer_email'            => $email,
			'success_url'               => swivo_spa_url( 'espace-createur?paid=1&dossier=' . $dossier->ID ),
			'cancel_url'                => swivo_spa_url( 'creer-mon-entreprise?cancelled=1' ),
			'metadata[dossier_id]'      => $dossier->ID,
			'line_items[0][quantity]'   => 1,
			'line_items[0][price_data][currency]'              => 'eur',
			'line_items[0][price_data][unit_amount]'           => $cfg['creation_price'],
			'line_items[0][price_data][product_data][name]'    => 'Création d’entreprise — Swivo',
			'line_items[0][price_data][product_data][description]' => 'Préparation et transmission du dossier au Guichet unique INPI',
		) ),
	) );
	if ( is_wp_error( $response ) ) {
		return new WP_Error( 'swivo_stripe_upstream', $response->get_error_message(), array( 'status' => 502 ) );
	}
	$code = wp_remote_retrieve_response_code( $response );
	$json = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( $code < 200 || $code >= 300 || empty( $json['url'] ) ) {
		return new WP_Error( 'swivo_stripe_upstream', 'Stripe ' . $code, array( 'status' => 502 ) );
	}
	update_post_meta( $dossier->ID, 'stripe_session_id', sanitize_text_field( $json['id'] ?? '' ) );
	update_post_meta( $dossier->ID, 'status', 'awaiting_payment' );
	return rest_ensure_response( array( 'url' => $json['url'] ) );
}

function swivo_direct_stripe_subscribe( $user ) {
	$cfg = swivo_stripe_keys();
	if ( ! $cfg['secret'] ) {
		return new WP_Error( 'swivo_no_stripe', 'Stripe non configuré et WooCommerce inactif.', array( 'status' => 503 ) );
	}
	$args = array(
		'mode'                   => 'subscription',
		'payment_method_types[]' => 'card',
		'customer_email'         => $user->user_email,
		'success_url'            => swivo_spa_url( 'espace-createur?subscribed=1' ),
		'cancel_url'             => swivo_spa_url( 'tarifs?cancelled=1' ),
		'metadata[user_id]'      => $user->ID,
		'metadata[plan]'         => 'gestion',
		'line_items[0][quantity]'=> 1,
	);
	if ( $cfg['gestion_price_id'] ) {
		$args['line_items[0][price]'] = $cfg['gestion_price_id'];
	} else {
		$args['line_items[0][price_data][currency]']            = 'eur';
		$args['line_items[0][price_data][unit_amount]']         = $cfg['gestion_amount'];
		$args['line_items[0][price_data][recurring][interval]'] = 'month';
		$args['line_items[0][price_data][product_data][name]']  = 'Gestion d’entreprise — Swivo';
	}
	$response = wp_remote_post( 'https://api.stripe.com/v1/checkout/sessions', array(
		'timeout' => 30,
		'headers' => array(
			'Authorization' => 'Bearer ' . $cfg['secret'],
			'Content-Type'  => 'application/x-www-form-urlencoded',
		),
		'body' => http_build_query( $args ),
	) );
	if ( is_wp_error( $response ) ) {
		return new WP_Error( 'swivo_stripe_upstream', $response->get_error_message(), array( 'status' => 502 ) );
	}
	$code = wp_remote_retrieve_response_code( $response );
	$json = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( $code < 200 || $code >= 300 || empty( $json['url'] ) ) {
		return new WP_Error( 'swivo_stripe_upstream', 'Stripe ' . $code, array( 'status' => 502 ) );
	}
	return rest_ensure_response( array( 'url' => $json['url'] ) );
}

/* ───────────────────────────────────────────────────────────────────────
   Legacy custom webhook — only used when running without WooCommerce.
   With WC active, WC Stripe Gateway handles the webhook and our hooks in
   includes/woocommerce.php sync state via `woocommerce_payment_complete`.
   ─────────────────────────────────────────────────────────────────────── */

function swivo_stripe_webhook( WP_REST_Request $req ) {
	$cfg = swivo_stripe_keys();
	if ( ! $cfg['webhook_secret'] ) {
		return new WP_Error( 'swivo_no_stripe', 'Webhook non configuré.', array( 'status' => 503 ) );
	}

	$payload   = $req->get_body();
	$signature = $req->get_header( 'stripe_signature' );
	if ( ! swivo_stripe_verify_signature( $payload, $signature, $cfg['webhook_secret'] ) ) {
		return new WP_Error( 'swivo_bad_sig', 'Signature invalide.', array( 'status' => 400 ) );
	}

	$event = json_decode( $payload, true );
	if ( empty( $event['type'] ) ) {
		return new WP_Error( 'swivo_invalid', 'Event invalide.', array( 'status' => 400 ) );
	}

	switch ( $event['type'] ) {
		case 'checkout.session.completed':
			$session    = $event['data']['object'] ?? array();
			$dossier_id = (int) ( $session['metadata']['dossier_id'] ?? 0 );
			$user_id    = (int) ( $session['metadata']['user_id'] ?? 0 );
			$plan       = (string) ( $session['metadata']['plan'] ?? '' );

			if ( 'gestion' === $plan && $user_id ) {
				update_user_meta( $user_id, 'swivo_gestion_active', 1 );
				update_user_meta( $user_id, 'swivo_gestion_until', strtotime( '+1 month' ) );
				update_user_meta( $user_id, 'swivo_stripe_customer', sanitize_text_field( $session['customer'] ?? '' ) );
				update_user_meta( $user_id, 'swivo_stripe_subscription', sanitize_text_field( $session['subscription'] ?? '' ) );
				do_action( 'swivo_gestion_started', $user_id );
			} elseif ( $dossier_id ) {
				update_post_meta( $dossier_id, 'status', 'paid' );
				update_post_meta( $dossier_id, 'stripe_payment_intent', sanitize_text_field( $session['payment_intent'] ?? '' ) );
				update_post_meta( $dossier_id, 'paid_at', current_time( 'mysql' ) );
				do_action( 'swivo_dossier_paid', $dossier_id );
			}
			break;

		case 'invoice.paid':
			$invoice = $event['data']['object'] ?? array();
			$sub_id  = (string) ( $invoice['subscription'] ?? '' );
			if ( $sub_id ) {
				$users = get_users( array( 'meta_key' => 'swivo_stripe_subscription', 'meta_value' => $sub_id, 'number' => 1 ) );
				if ( $users ) {
					$period_end = (int) ( $invoice['lines']['data'][0]['period']['end'] ?? 0 );
					update_user_meta( $users[0]->ID, 'swivo_gestion_until', $period_end ?: strtotime( '+1 month' ) );
				}
			}
			break;

		case 'customer.subscription.deleted':
		case 'customer.subscription.updated':
			$sub    = $event['data']['object'] ?? array();
			$status = (string) ( $sub['status'] ?? '' );
			$sub_id = (string) ( $sub['id'] ?? '' );
			$users  = get_users( array( 'meta_key' => 'swivo_stripe_subscription', 'meta_value' => $sub_id, 'number' => 1 ) );
			if ( $users ) {
				$uid = $users[0]->ID;
				if ( in_array( $status, array( 'canceled', 'unpaid', 'incomplete_expired' ), true ) ) {
					update_user_meta( $uid, 'swivo_gestion_active', 0 );
					do_action( 'swivo_gestion_cancelled', $uid );
				} elseif ( 'active' === $status ) {
					update_user_meta( $uid, 'swivo_gestion_active', 1 );
				}
			}
			break;
	}

	return rest_ensure_response( array( 'ok' => true ) );
}

function swivo_stripe_verify_signature( $payload, $header, $secret ) {
	if ( ! $header || ! $secret ) return false;
	$parts = array();
	foreach ( explode( ',', $header ) as $part ) {
		list( $k, $v ) = array_pad( explode( '=', trim( $part ), 2 ), 2, '' );
		$parts[ $k ][] = $v;
	}
	if ( empty( $parts['t'][0] ) || empty( $parts['v1'] ) ) return false;
	$timestamp = $parts['t'][0];
	if ( abs( time() - (int) $timestamp ) > 300 ) return false;
	$expected = hash_hmac( 'sha256', $timestamp . '.' . $payload, $secret );
	foreach ( $parts['v1'] as $sig ) {
		if ( hash_equals( $expected, $sig ) ) return true;
	}
	return false;
}
