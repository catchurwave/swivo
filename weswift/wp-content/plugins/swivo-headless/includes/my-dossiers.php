<?php
/**
 * GET /swivo/v1/my-dossiers
 *
 * Lists dossiers owned by the current logged-in user. We attach the user_id
 * meta on creation when the user is authenticated; older anonymous dossiers
 * are claimed retroactively if their `email` matches the current account.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/my-dossiers', array(
		'methods'             => 'GET',
		'permission_callback' => function () { return is_user_logged_in(); },
		'callback'            => 'swivo_my_dossiers',
	) );
} );

/**
 * Attach user_id when an authenticated SPA posts a dossier; if anonymous,
 * remember the email so we can claim it on next login.
 */
add_action( 'swivo_dossier_created', function ( $post_id ) {
	$uid = get_current_user_id();
	if ( $uid ) {
		update_post_meta( $post_id, 'user_id', $uid );
	}
}, 10, 1 );

/**
 * Auto-claim by email REMOVED. Email match is not proof of ownership — any
 * anonymous submitter who knew the victim's email could plant a dossier that
 * would attach to the victim on login. Claims must go through /drafts/claim
 * which verifies a per-draft anon_token via hash_equals().
 */

function swivo_my_dossiers() {
	$uid = get_current_user_id();
	$dossiers = get_posts( array(
		'post_type'      => 'swivo_dossier',
		'post_status'    => array( 'private', 'publish' ),
		'meta_query'     => array(
			'relation' => 'AND',
			array( 'key' => 'user_id', 'value' => $uid ),
			array(
				'relation' => 'OR',
				array( 'key' => 'status', 'value' => 'draft', 'compare' => '!=' ),
				array( 'key' => 'status', 'compare' => 'NOT EXISTS' ),
			),
		),
		'orderby'        => 'date',
		'order'          => 'DESC',
		'posts_per_page' => 50,
	) );

	$status_labels = array(
		'pending'          => 'À traiter',
		'awaiting_payment' => 'Paiement en attente',
		'paid'             => 'Payé — à déposer',
		'deposited'        => 'Déposé Guichet unique',
		'completed'        => 'Immatriculée',
		'rejected'         => 'Rejeté',
	);

	$out = array();
	foreach ( $dossiers as $d ) {
		$status = (string) get_post_meta( $d->ID, 'status', true ) ?: 'pending';
		$forme  = (string) get_post_meta( $d->ID, 'forme', true );
		$out[] = array(
			'id'         => $d->ID,
			'reference'  => 'WS-' . date( 'Y', strtotime( $d->post_date ) ) . '-' . str_pad( $d->ID, 4, '0', STR_PAD_LEFT ),
			'title'      => $d->post_title ?: ( strtoupper( $forme ) . ' — sans titre' ),
			'forme'      => $forme,
			'status'     => $status,
			'statusLabel'=> $status_labels[ $status ] ?? $status,
			'progress'   => swivo_status_progress( $status ),
			'createdAt'  => mysql2date( 'c', $d->post_date ),
		);
	}
	return rest_ensure_response( $out );
}

function swivo_status_progress( $status ) {
	return array(
		'pending'          => 25,
		'awaiting_payment' => 45,
		'paid'             => 65,
		'deposited'        => 85,
		'completed'        => 100,
		'rejected'         => 0,
	)[ $status ] ?? 10;
}
