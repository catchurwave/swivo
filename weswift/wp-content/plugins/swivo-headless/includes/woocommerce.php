<?php
/**
 * WooCommerce bridge — routes Swivo checkout through WC orders instead of
 * direct Stripe API. WC Stripe Gateway handles the actual payment + webhooks;
 * we just listen for order/subscription state changes and sync our
 * `swivo_dossier` CPT and `swivo_gestion_*` user meta accordingly.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_wc_active() {
	return class_exists( 'WooCommerce' );
}

/**
 * Create a WooCommerce order containing the "creation" product, link it to a
 * Swivo dossier, and return the pay URL the SPA should redirect to.
 */
function swivo_wc_create_creation_order( $dossier_id, $user_id, $email ) {
	if ( ! swivo_wc_active() ) {
		return new WP_Error( 'swivo_no_wc', 'WooCommerce non actif.', array( 'status' => 503 ) );
	}
	$product_id = (int) get_option( 'swivo_wc_creation_product_id', 0 );
	if ( ! $product_id || ! wc_get_product( $product_id ) ) {
		return new WP_Error( 'swivo_no_product', 'Produit Création non configuré.', array( 'status' => 503 ) );
	}

	$order = wc_create_order( array(
		'customer_id' => $user_id,
		'status'      => 'pending',
	) );
	if ( is_wp_error( $order ) ) {
		return $order;
	}

	$order->add_product( wc_get_product( $product_id ), 1 );
	$order->set_billing_email( $email );
	$order->update_meta_data( 'swivo_dossier_id', $dossier_id );
	$order->update_meta_data( 'swivo_plan', 'creation' );
	$order->calculate_totals();
	$order->save();

	update_post_meta( $dossier_id, 'wc_order_id', $order->get_id() );
	update_post_meta( $dossier_id, 'status', 'awaiting_payment' );

	return $order->get_checkout_payment_url();
}

/**
 * Create a WooCommerce order for the gestion subscription product. The
 * subscription lifecycle is then managed by WC Subscriptions (or the Stripe
 * gateway's built-in recurring support); we listen to the resulting hooks.
 */
function swivo_wc_create_gestion_order( $user_id, $email ) {
	if ( ! swivo_wc_active() ) {
		return new WP_Error( 'swivo_no_wc', 'WooCommerce non actif.', array( 'status' => 503 ) );
	}
	$product_id = (int) get_option( 'swivo_wc_gestion_product_id', 0 );
	if ( ! $product_id || ! wc_get_product( $product_id ) ) {
		return new WP_Error( 'swivo_no_product', 'Produit Gestion non configuré.', array( 'status' => 503 ) );
	}

	$order = wc_create_order( array(
		'customer_id' => $user_id,
		'status'      => 'pending',
	) );
	if ( is_wp_error( $order ) ) {
		return $order;
	}
	$order->add_product( wc_get_product( $product_id ), 1 );
	$order->set_billing_email( $email );
	$order->update_meta_data( 'swivo_plan', 'gestion' );
	$order->calculate_totals();
	$order->save();

	return $order->get_checkout_payment_url();
}

/**
 * Sync dossier and user state when WC marks an order paid/complete.
 */
add_action( 'woocommerce_payment_complete', 'swivo_wc_on_payment_complete', 10, 1 );
add_action( 'woocommerce_order_status_completed', 'swivo_wc_on_payment_complete', 10, 1 );

function swivo_wc_on_payment_complete( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( ! $order ) return;

	$plan       = (string) $order->get_meta( 'swivo_plan' );
	$dossier_id = (int)    $order->get_meta( 'swivo_dossier_id' );
	$user_id    = (int)    $order->get_user_id();

	if ( 'creation' === $plan && $dossier_id ) {
		update_post_meta( $dossier_id, 'status', 'paid' );
		update_post_meta( $dossier_id, 'paid_at', current_time( 'mysql' ) );
		update_post_meta( $dossier_id, 'wc_order_id', $order_id );
		do_action( 'swivo_dossier_paid', $dossier_id );
	}

	if ( 'gestion' === $plan && $user_id ) {
		update_user_meta( $user_id, 'swivo_gestion_active', 1 );
		update_user_meta( $user_id, 'swivo_gestion_until', strtotime( '+1 month' ) );
		do_action( 'swivo_gestion_started', $user_id );
	}
}

/**
 * WC Subscriptions hooks (no-op if the extension isn't installed).
 */
add_action( 'woocommerce_subscription_status_active',    'swivo_wc_sub_active' );
add_action( 'woocommerce_subscription_status_cancelled', 'swivo_wc_sub_inactive' );
add_action( 'woocommerce_subscription_status_expired',   'swivo_wc_sub_inactive' );
add_action( 'woocommerce_subscription_renewal_payment_complete', function ( $subscription, $last_order ) {
	unset( $last_order );
	if ( method_exists( $subscription, 'get_user_id' ) ) {
		update_user_meta( $subscription->get_user_id(), 'swivo_gestion_until', strtotime( '+1 month' ) );
	}
}, 10, 2 );

function swivo_wc_sub_active( $subscription ) {
	if ( ! method_exists( $subscription, 'get_user_id' ) ) return;
	$uid = (int) $subscription->get_user_id();
	if ( ! $uid ) return;
	update_user_meta( $uid, 'swivo_gestion_active', 1 );
	update_user_meta( $uid, 'swivo_gestion_until', strtotime( '+1 month' ) );
}

function swivo_wc_sub_inactive( $subscription ) {
	if ( ! method_exists( $subscription, 'get_user_id' ) ) return;
	$uid = (int) $subscription->get_user_id();
	if ( ! $uid ) return;
	update_user_meta( $uid, 'swivo_gestion_active', 0 );
	do_action( 'swivo_gestion_cancelled', $uid );
}

/**
 * Pre-fill checkout fields from the linked dossier so customers don't retype
 * data they already gave to the chat assistant.
 */
add_filter( 'woocommerce_checkout_get_value', function ( $value, $field ) {
	if ( $value ) return $value;
	$dossier_id = isset( $_GET['swivo_dossier'] ) ? (int) $_GET['swivo_dossier'] : 0;
	if ( ! $dossier_id ) return $value;
	$payload = get_post_meta( $dossier_id, 'payload', true );
	if ( ! is_array( $payload ) ) return $value;

	$map = array(
		'billing_email'     => $payload['identite']['email']   ?? '',
		'billing_first_name'=> $payload['identite']['prenom']  ?? '',
		'billing_last_name' => $payload['identite']['nom']     ?? '',
		'billing_address_1' => $payload['siege']['adresse']    ?? '',
	);
	return $map[ $field ] ?? $value;
}, 10, 2 );
