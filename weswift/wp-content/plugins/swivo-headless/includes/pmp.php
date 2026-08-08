<?php
/**
 * Paid Memberships Pro integration — single source of truth for the
 * "Gestion" subscription (9,90 €/month).
 *
 * Why PMP and not custom Stripe?
 *  - Customer-facing checkout, billing portal, cancellation, invoice history
 *    are all built-in and configured in WP admin.
 *  - Stripe webhook signature verification, dunning, proration are handled
 *    by PMP — we no longer maintain that in includes/stripe.php.
 *
 * Creation (29,90 € one-time) stays on WooCommerce because PMP is geared
 * toward recurring access; treating creation as a "level" would conflate
 * a one-time deliverable with subscription access control.
 *
 * Config:
 *   - swivo_pmp_gestion_level_id : ID of the PMP level mapped to Gestion.
 *
 * Side-effect: this file mirrors PMP membership state into the legacy
 * `swivo_gestion_active` / `swivo_gestion_until` user meta so existing
 * admin views and the SPA `/auth/me` payload keep working unchanged.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_pmp_active() {
	return defined( 'PMPRO_VERSION' ) || function_exists( 'pmpro_hasMembershipLevel' );
}

function swivo_pmp_gestion_level_id() {
	return (int) get_option( 'swivo_pmp_gestion_level_id', 0 );
}

/**
 * Single source of truth for "does this user have access to the Gestion
 * features?". Checks PMP first, then falls back to legacy meta so WC-only
 * historical subscribers still keep access until they renew via PMP.
 */
function swivo_user_has_gestion( $user_id ) {
	$user_id = (int) $user_id;
	if ( ! $user_id ) return false;

	if ( swivo_pmp_active() ) {
		$level_id = swivo_pmp_gestion_level_id();
		if ( $level_id && pmpro_hasMembershipLevel( $level_id, $user_id ) ) {
			return true;
		}
	}
	// Legacy fallback — keeps WC-Stripe subscribers covered during migration.
	$until  = (int) get_user_meta( $user_id, 'swivo_gestion_until', true );
	$active = (int) get_user_meta( $user_id, 'swivo_gestion_active', true );
	return $active && ( ! $until || $until > time() );
}

/**
 * Resolve the timestamp until which the user's Gestion access is valid.
 * Returns 0 when unknown or already expired.
 */
function swivo_user_gestion_until( $user_id ) {
	$user_id = (int) $user_id;
	if ( ! $user_id ) return 0;

	if ( swivo_pmp_active() && function_exists( 'pmpro_getMembershipLevelForUser' ) ) {
		$lvl = pmpro_getMembershipLevelForUser( $user_id );
		if ( $lvl && (int) $lvl->id === swivo_pmp_gestion_level_id() ) {
			$end = isset( $lvl->enddate ) ? (int) $lvl->enddate : 0;
			if ( $end ) return $end;
			// Recurring level with no fixed enddate: assume rolling +1 month.
			return strtotime( '+1 month' );
		}
	}
	return (int) get_user_meta( $user_id, 'swivo_gestion_until', true );
}

/**
 * Sync legacy meta whenever PMP changes a user's level so the rest of the
 * codebase (admin-clients view, /auth/me) can keep reading the old meta.
 */
add_action( 'pmpro_after_change_membership_level', 'swivo_pmp_sync_legacy_meta', 10, 3 );

function swivo_pmp_sync_legacy_meta( $level_id, $user_id, $cancel_level = null ) {
	unset( $cancel_level );
	$level_id = (int) $level_id;
	$user_id  = (int) $user_id;
	if ( ! $user_id ) return;

	if ( $level_id === swivo_pmp_gestion_level_id() ) {
		update_user_meta( $user_id, 'swivo_gestion_active', 1 );
		update_user_meta( $user_id, 'swivo_gestion_until', swivo_user_gestion_until( $user_id ) ?: strtotime( '+1 month' ) );
		do_action( 'swivo_gestion_started', $user_id );
	} else {
		update_user_meta( $user_id, 'swivo_gestion_active', 0 );
		do_action( 'swivo_gestion_cancelled', $user_id );
	}
}

/**
 * REST: redirect SPA's "Souscrire à la gestion" button to the PMP checkout
 * page when PMP is active. Falls through to the existing WC/Stripe path
 * otherwise so /subscribe stays functional during migration.
 */
add_filter( 'rest_pre_dispatch', 'swivo_pmp_intercept_subscribe', 10, 3 );

function swivo_pmp_intercept_subscribe( $result, $server, $request ) {
	if ( $result !== null ) return $result;
	if ( $request->get_route() !== '/swivo/v1/subscribe' ) return $result;
	if ( ! swivo_pmp_active() ) return $result;

	$level_id = swivo_pmp_gestion_level_id();
	if ( ! $level_id ) return $result; // Not configured — fall through.

	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'swivo_unauth', 'Connexion requise.', array( 'status' => 401 ) );
	}

	$url = function_exists( 'pmpro_url' )
		? pmpro_url( 'checkout', '?level=' . $level_id )
		: site_url( '/membership-checkout/?level=' . $level_id );

	return rest_ensure_response( array( 'url' => $url ) );
}

/**
 * REST: prefer the PMP account page over the Stripe billing portal when PMP
 * is the source of truth. Stripe portal still works (PMP can be configured
 * to delegate), but the account page covers cancel/update/invoices natively.
 */
add_filter( 'rest_pre_dispatch', 'swivo_pmp_intercept_billing_portal', 10, 3 );

function swivo_pmp_intercept_billing_portal( $result, $server, $request ) {
	if ( $result !== null ) return $result;
	if ( $request->get_route() !== '/swivo/v1/billing-portal' ) return $result;
	if ( ! swivo_pmp_active() ) return $result;
	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'swivo_unauth', 'Connexion requise.', array( 'status' => 401 ) );
	}

	$url = function_exists( 'pmpro_url' )
		? pmpro_url( 'account' )
		: site_url( '/membership-account/' );

	return rest_ensure_response( array( 'url' => $url ) );
}

/**
 * Settings — PMP level mapping. Rendered under the existing Swivo settings
 * page via the swivo_settings_extra_fields action.
 */
add_action( 'admin_init', function () {
	register_setting( 'swivo_settings', 'swivo_pmp_gestion_level_id', array( 'sanitize_callback' => 'absint' ) );
	register_setting( 'swivo_settings', 'swivo_ai_provider',          array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_google_key',           array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_anthropic_model',      array( 'sanitize_callback' => 'sanitize_text_field' ) );
} );
