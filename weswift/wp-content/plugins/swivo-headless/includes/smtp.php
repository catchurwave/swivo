<?php
/**
 * SMTP / transactional email config.
 *
 * If WP_MAIL_FROM / WP_MAIL_FROM_NAME constants are defined in wp-config.php,
 * apply them. If a Mailgun key is supplied via constants
 * (`SWIVO_MAILGUN_DOMAIN`, `SWIVO_MAILGUN_KEY`), route mail through their
 * HTTP API instead of `wp_mail`'s default sendmail/PHPMailer path.
 *
 * If neither is configured AND no popular SMTP plugin is active, show a
 * dismissible admin notice so the team doesn't ship with sendmail in prod.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'wp_mail_from', function ( $email ) {
	return defined( 'WP_MAIL_FROM' ) ? WP_MAIL_FROM : ( $email ?: 'contact@swivo.fr' );
} );

add_filter( 'wp_mail_from_name', function ( $name ) {
	return defined( 'WP_MAIL_FROM_NAME' ) ? WP_MAIL_FROM_NAME : ( $name ?: 'Swivo' );
} );

/**
 * Mailgun HTTP API short-circuit. Returns true on success so wp_mail()
 * considers the message sent and doesn't double-send via PHPMailer.
 */
add_filter( 'pre_wp_mail', function ( $short, $atts ) {
	if ( $short !== null ) return $short;
	if ( ! defined( 'SWIVO_MAILGUN_DOMAIN' ) || ! defined( 'SWIVO_MAILGUN_KEY' ) ) return null;

	$to      = is_array( $atts['to'] ) ? implode( ',', $atts['to'] ) : (string) $atts['to'];
	$headers = is_array( $atts['headers'] ) ? $atts['headers'] : array();
	$is_html = false;
	foreach ( $headers as $h ) {
		if ( stripos( $h, 'text/html' ) !== false ) { $is_html = true; break; }
	}

	$from_email = apply_filters( 'wp_mail_from', '' );
	$from_name  = apply_filters( 'wp_mail_from_name', '' );

	$body = array(
		'from'    => sprintf( '%s <%s>', $from_name, $from_email ),
		'to'      => $to,
		'subject' => (string) $atts['subject'],
		( $is_html ? 'html' : 'text' ) => (string) $atts['message'],
	);

	$response = wp_remote_post(
		'https://api.mailgun.net/v3/' . SWIVO_MAILGUN_DOMAIN . '/messages',
		array(
			'timeout' => 20,
			'headers' => array( 'Authorization' => 'Basic ' . base64_encode( 'api:' . SWIVO_MAILGUN_KEY ) ),
			'body'    => $body,
		)
	);
	if ( is_wp_error( $response ) ) {
		error_log( '[swivo-mailgun] ' . $response->get_error_message() );
		return false;
	}
	$code = wp_remote_retrieve_response_code( $response );
	return $code >= 200 && $code < 300;
}, 10, 2 );

/**
 * Admin notice when nothing is configured for production mail.
 */
add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) ) return;
	if ( defined( 'SWIVO_MAILGUN_DOMAIN' ) && defined( 'SWIVO_MAILGUN_KEY' ) ) return;

	$smtp_plugins = array( 'wp-mail-smtp/wp_mail_smtp.php', 'easy-wp-smtp/wp_easy_smtp.php', 'fluent-smtp/fluent-smtp.php', 'post-smtp/postman-smtp.php' );
	foreach ( $smtp_plugins as $p ) {
		if ( is_plugin_active( $p ) ) return;
	}

	echo '<div class="notice notice-warning is-dismissible"><p><strong>Swivo :</strong> aucun routage SMTP / API détecté. Pour la production, installez <a href="' . esc_url( admin_url( 'plugin-install.php?s=wp+mail+smtp&tab=search&type=term' ) ) . '">WP Mail SMTP</a> ou ajoutez <code>SWIVO_MAILGUN_DOMAIN</code> + <code>SWIVO_MAILGUN_KEY</code> dans <code>wp-config.php</code>.</p></div>';
} );

if ( ! function_exists( 'is_plugin_active' ) ) {
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
}
