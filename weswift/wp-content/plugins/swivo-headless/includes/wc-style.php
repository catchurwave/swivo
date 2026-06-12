<?php
/**
 * Swivo brand skin for WooCommerce front pages.
 *
 * - Enqueues `assets/wc-style.css` on cart / checkout / order-received /
 *   my-account so the WC pages match the SPA visually.
 * - Injects a small Swivo header (logo + "retour" link + trust line) above
 *   the WC content and a discreet footer below.
 * - Trims away noisy WC defaults (coupon toggle, login toggle, "(facultatif)"
 *   labels) so the tunnel feels like a single-purpose SaaS checkout.
 *
 * The CSS targets WooCommerce class names only — leaves the rest of WP/admin
 * untouched.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Quick check: does this request belong to one of the WC front pages we
 * want to skin? We can't rely on is_woocommerce() everywhere because the
 * order-received / my-account pages aren't shop pages.
 */
function swivo_is_wc_front_page() {
	if ( ! function_exists( 'is_cart' ) ) {
		return false;
	}
	return is_cart() || is_checkout() || is_account_page() || is_wc_endpoint_url( 'order-received' );
}

add_action( 'wp_enqueue_scripts', function () {
	if ( ! swivo_is_wc_front_page() ) {
		return;
	}
	$file = SWIVO_HEADLESS_DIR . 'assets/wc-style.css';
	if ( ! file_exists( $file ) ) {
		return;
	}
	wp_enqueue_style(
		'swivo-wc-style',
		SWIVO_HEADLESS_URL . 'assets/wc-style.css',
		array(),
		filemtime( $file )
	);
	wp_enqueue_style(
		'swivo-wc-font',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
		array(),
		null
	);
}, 100 );

/**
 * Inject a branded header right after <body> opens on WC pages. We use
 * `wp_body_open` so it appears even when the theme doesn't render its own
 * site header above the WC content.
 */
add_action( 'wp_body_open', function () {
	if ( ! swivo_is_wc_front_page() ) {
		return;
	}
	$spa = swivo_spa_url( '/' );
	?>
	<div class="swivo-wc-header">
		<a href="<?php echo esc_url( $spa ); ?>" class="swivo-back" aria-label="Retour au site">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
			Retour au site
		</a>
		<a href="<?php echo esc_url( $spa ); ?>" aria-label="Swivo" style="text-decoration:none">
			<svg viewBox="22 26 240 70" class="swivo-logo" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<rect x="28" y="36" width="38" height="16" rx="8" fill="#7c3aed"/>
				<circle cx="47" cy="62" r="4" fill="#ec4899"/>
				<rect x="35" y="76" width="38" height="16" rx="8" fill="#ec4899"/>
				<circle cx="71" cy="38" r="3" fill="#ec4899" opacity="0.7"/>
				<text x="84" y="80" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="500" fill="#ec4899" letter-spacing="-2">sw<tspan fill="#7c3aed">ivo</tspan></text>
			</svg>
		</a>
		<span class="swivo-wc-trust">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
			Paiement sécurisé Stripe
		</span>
	</div>
	<?php
}, 5 );

/**
 * Discreet footer band on WC pages (TLS notice + RGPD line).
 */
add_action( 'wp_footer', function () {
	if ( ! swivo_is_wc_front_page() ) {
		return;
	}
	?>
	<div class="swivo-wc-footer">
		<strong>Swivo</strong> — Création et gestion d’entreprise en France. Données hébergées en France · RGPD · TLS 1.3.
	</div>
	<?php
} );

/**
 * Trim WC checkout fields that hurt conversion / trust on a simple SaaS sale.
 * Country defaults to France; we hide most billing fields except what
 * Stripe + invoicing actually need.
 */
add_filter( 'woocommerce_checkout_fields', function ( $fields ) {
	$keep_billing = array(
		'billing_first_name', 'billing_last_name',
		'billing_email', 'billing_phone',
		'billing_country',
		'billing_address_1', 'billing_postcode', 'billing_city',
	);
	foreach ( $fields['billing'] as $key => $field ) {
		if ( ! in_array( $key, $keep_billing, true ) ) {
			unset( $fields['billing'][ $key ] );
		}
	}
	if ( isset( $fields['billing']['billing_country'] ) ) {
		$fields['billing']['billing_country']['default'] = 'FR';
	}
	unset( $fields['order']['order_comments'] );
	return $fields;
} );

/**
 * Hide WC's "you must be logged in" coupon notice — we don't sell coupons.
 */
add_filter( 'woocommerce_coupons_enabled', '__return_false' );

/**
 * "Place order" button label.
 */
add_filter( 'woocommerce_order_button_text', function () { return 'Payer & valider mon dossier'; } );
