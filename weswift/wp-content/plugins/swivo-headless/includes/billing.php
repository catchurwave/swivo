<?php
/**
 * Subscription self-service — Stripe Billing Portal.
 *
 * POST /swivo/v1/billing-portal  → { url }
 *
 * The Stripe-hosted portal handles cancel, pause, resume, update card,
 * view invoices. We just look up the customer's Stripe customer ID from
 * either WC Stripe Gateway's `_stripe_customer_id` user meta or our own
 * `swivo_stripe_customer` meta saved by the legacy webhook flow.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/billing-portal', array(
		'methods'             => 'POST',
		'permission_callback' => function () { return is_user_logged_in(); },
		'callback'            => 'swivo_billing_portal',
	) );
} );

function swivo_billing_portal() {
	$uid = get_current_user_id();
	if ( ! $uid ) {
		return new WP_Error( 'swivo_unauth', 'Connexion requise.', array( 'status' => 401 ) );
	}

	$secret = swivo_resolve_stripe_secret();
	if ( ! $secret ) {
		return new WP_Error( 'swivo_no_stripe', 'Stripe non configuré.', array( 'status' => 503 ) );
	}

	$customer = swivo_resolve_stripe_customer( $uid );
	if ( ! $customer ) {
		return new WP_Error( 'swivo_no_customer', 'Aucun abonnement Stripe trouvé pour ce compte.', array( 'status' => 404 ) );
	}

	$response = wp_remote_post( 'https://api.stripe.com/v1/billing_portal/sessions', array(
		'timeout' => 20,
		'headers' => array(
			'Authorization' => 'Bearer ' . $secret,
			'Content-Type'  => 'application/x-www-form-urlencoded',
		),
		'body' => http_build_query( array(
			'customer'   => $customer,
			'return_url' => swivo_spa_url( 'espace-createur?billing=back' ),
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

	return rest_ensure_response( array( 'url' => $json['url'] ) );
}

/**
 * Resolve the Stripe secret key, falling back to whatever WC Stripe Gateway
 * has stored. Lets the Billing Portal work without re-saving the key in our
 * own settings page.
 */
function swivo_resolve_stripe_secret() {
	$ours = trim( (string) get_option( 'swivo_stripe_secret', '' ) );
	if ( $ours ) return $ours;

	$wc = get_option( 'woocommerce_stripe_settings' );
	if ( is_array( $wc ) ) {
		$mode = isset( $wc['testmode'] ) && 'yes' === $wc['testmode'] ? 'test' : 'live';
		$key  = $mode === 'test'
			? ( $wc['test_secret_key'] ?? '' )
			: ( $wc['secret_key']      ?? '' );
		if ( $key ) return trim( (string) $key );
	}

	// Official Stripe plugin (developer) — different option name.
	$alt = get_option( 'stripe_secret_key' );
	if ( $alt ) return trim( (string) $alt );

	return '';
}

/**
 * Resolve a Stripe customer ID for a WP user, checking:
 *   1. WC Stripe Gateway's official key `_stripe_customer_id`.
 *   2. Our legacy meta `swivo_stripe_customer`.
 *   3. The customer attached to the latest WC subscription/order for that
 *      user, if WC is active.
 */
function swivo_resolve_stripe_customer( $user_id ) {
	$id = (string) get_user_meta( $user_id, '_stripe_customer_id', true );
	if ( $id ) return $id;

	$id = (string) get_user_meta( $user_id, 'swivo_stripe_customer', true );
	if ( $id ) return $id;

	if ( function_exists( 'wc_get_orders' ) ) {
		$orders = wc_get_orders( array(
			'customer_id' => $user_id,
			'limit'       => 1,
			'orderby'     => 'date',
			'order'       => 'DESC',
			'status'      => array( 'completed', 'processing', 'active' ),
		) );
		foreach ( $orders as $o ) {
			$cust = (string) $o->get_meta( '_stripe_customer_id' );
			if ( $cust ) return $cust;
		}
	}
	return '';
}
