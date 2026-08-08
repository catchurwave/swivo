<?php
/**
 * Transactional emails — fires on dossier lifecycle events. Uses wp_mail();
 * an SMTP plugin or external relay is recommended in production.
 *
 * Hooks consumed:
 *   - swivo_dossier_created
 *   - swivo_dossier_paid
 *   - swivo_dossier_status_changed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'wp_mail_content_type', function ( $type ) {
	return $type === 'text/plain' && did_action( 'swivo_sending_html' ) ? 'text/html' : $type;
} );

add_action( 'swivo_dossier_created', function ( $dossier_id ) {
	$email = (string) get_post_meta( $dossier_id, 'email', true );
	$forme = strtoupper( (string) get_post_meta( $dossier_id, 'forme', true ) );
	if ( ! $email ) return;

	$subject = '[Swivo] Votre dossier de création — bien reçu';
	$body = swivo_html_email(
		'Bonjour,',
		"<p>Nous avons bien reçu votre dossier de création <strong>{$forme}</strong>. Numéro : #{$dossier_id}.</p>"
		. '<p>Pour finaliser la transmission au Guichet unique, connectez-vous à votre espace et procédez au paiement.</p>'
		. '<p><a href="' . esc_url( swivo_spa_url( 'espace-createur' ) ) . '" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Accéder à mon espace</a></p>'
	);
	swivo_send_html( $email, $subject, $body );

	// Notify team.
	$admin = get_option( 'admin_email' );
	if ( $admin ) {
		wp_mail( $admin, '[Swivo] Nouveau dossier #' . $dossier_id . ' — ' . $forme, "Nouveau dossier déposé. ID : {$dossier_id}\nEmail client : {$email}\nForme : {$forme}\n\nLien admin : " . admin_url( 'post.php?post=' . $dossier_id . '&action=edit' ) );
	}
}, 20 );

add_action( 'swivo_dossier_paid', function ( $dossier_id ) {
	$email = (string) get_post_meta( $dossier_id, 'email', true );
	if ( ! $email ) return;
	$subject = '[Swivo] Paiement confirmé — dossier en cours de transmission';
	$body = swivo_html_email(
		'Merci pour votre confiance !',
		"<p>Votre paiement pour le dossier #{$dossier_id} a bien été reçu. Notre équipe contrôle votre dossier et le transmet au Guichet unique sous 24h ouvrées.</p>"
		. '<p>Suivi en temps réel : <a href="' . esc_url( swivo_spa_url( 'espace-createur' ) ) . '" style="color:#2563eb">votre espace créateur</a>.</p>'
	);
	swivo_send_html( $email, $subject, $body );
}, 20 );

add_action( 'swivo_dossier_status_changed', function ( $dossier_id, $status, $prev ) {
	unset( $prev );
	$email = (string) get_post_meta( $dossier_id, 'email', true );
	if ( ! $email ) return;

	$msgs = array(
		'deposited' => array( 'Dossier déposé au Guichet unique', '<p>Votre dossier a été transmis à l’INPI. L’immatriculation prend généralement 24h à 7 jours.</p>' ),
		'completed' => array( 'Félicitations — entreprise immatriculée !', '<p>Votre entreprise est officiellement immatriculée. Retrouvez vos documents légaux dans votre espace.</p>' ),
		'rejected'  => array( 'Action requise sur votre dossier', '<p>Le Guichet unique a signalé un point à corriger. Notre équipe vous contacte rapidement pour ajuster votre dossier sans frais supplémentaires.</p>' ),
	);
	if ( ! isset( $msgs[ $status ] ) ) return;
	$body = swivo_html_email( 'Mise à jour de votre dossier', $msgs[ $status ][1] );
	swivo_send_html( $email, '[Swivo] ' . $msgs[ $status ][0], $body );
}, 20, 3 );

function swivo_html_email( $heading, $html ) {
	$brand = '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">'
		. '<div style="padding:16px 0;border-bottom:1px solid #e2e8f0"><strong style="color:#1d4ed8">Swivo</strong></div>'
		. '<h1 style="font-size:20px;margin:24px 0 12px">' . esc_html( $heading ) . '</h1>'
		. '<div style="font-size:14px;line-height:1.6">' . $html . '</div>'
		. '<p style="margin-top:32px;font-size:12px;color:#475569">Swivo — service privé de création d’entreprise. Pas un service de l’État.</p>'
		. '</div>';
	return $brand;
}

function swivo_send_html( $to, $subject, $html ) {
	do_action( 'swivo_sending_html' );
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	wp_mail( $to, $subject, $html, $headers );
}
