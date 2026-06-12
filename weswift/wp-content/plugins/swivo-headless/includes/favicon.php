<?php
/**
 * Force the Swivo favicon across WP admin, login screen and any non-SPA
 * front-end pages (PMP checkout, WooCommerce account, transactional emails
 * preview) so branding stays consistent everywhere.
 *
 * Source files live in the SPA's `public/` folder and are served from the SPA
 * host. We point WP to that public URL (filterable to swap to wp-content path
 * if you prefer self-hosting on the WP origin).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_favicon_base() {
	return apply_filters( 'swivo_favicon_base', home_url( '/' ) );
}

function swivo_favicon_print_tags() {
	$base = rtrim( swivo_favicon_base(), '/' );
	$theme = '#1d4ed8';
	?>
	<link rel="icon" type="image/svg+xml" href="<?php echo esc_url( $base . '/favicon.svg' ); ?>">
	<link rel="icon" type="image/png" sizes="32x32" href="<?php echo esc_url( $base . '/favicon-32.png' ); ?>">
	<link rel="icon" type="image/png" sizes="16x16" href="<?php echo esc_url( $base . '/favicon-16.png' ); ?>">
	<link rel="shortcut icon" href="<?php echo esc_url( $base . '/favicon.ico' ); ?>">
	<link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url( $base . '/apple-touch-icon.png' ); ?>">
	<link rel="apple-touch-icon-precomposed" href="<?php echo esc_url( $base . '/apple-touch-icon-precomposed.png' ); ?>">
	<link rel="mask-icon" href="<?php echo esc_url( $base . '/favicon.svg' ); ?>" color="#7c3aed">
	<meta name="apple-mobile-web-app-title" content="Swivo">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="theme-color" content="<?php echo esc_attr( $theme ); ?>">
	<meta name="msapplication-TileColor" content="<?php echo esc_attr( $theme ); ?>">
	<meta name="msapplication-TileImage" content="<?php echo esc_url( $base . '/favicon-192.png' ); ?>">
	<?php
}

add_action( 'wp_head',     'swivo_favicon_print_tags',  5 );
add_action( 'admin_head',  'swivo_favicon_print_tags',  5 );
add_action( 'login_head',  'swivo_favicon_print_tags',  5 );

/**
 * Make get_site_icon_url() return the Swivo PNG so REST API / WP admin bar /
 * Open Graph fallbacks all use the brand asset instead of the default WP mark.
 */
add_filter( 'get_site_icon_url', function ( $url, $size ) {
	$base = rtrim( swivo_favicon_base(), '/' );
	$buckets = array( 16, 32, 48, 96, 192, 512 );
	$pick = 192;
	foreach ( $buckets as $s ) {
		if ( $size <= $s ) { $pick = $s; break; }
	}
	return $base . '/favicon-' . $pick . '.png';
}, 10, 2 );
