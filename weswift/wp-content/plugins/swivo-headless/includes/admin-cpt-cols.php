<?php
/**
 * Améliore les listes admin des CPTs Swivo :
 * - Colonne "Utilisateur" (email + lien vers vue détail Swivo Clients)
 * - Filtre par utilisateur (dropdown)
 * - Colonne "Montant / Statut" selon contexte
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SWIVO_USER_CPTS = array(
	'swivo_dossier',
	'swivo_b_doc',
	'swivo_b_client',
	'swivo_b_catalog',
	'swivo_encaissement',
	'swivo_depense',
	'swivo_document',
);

/* ===== Colonne user + colonnes extra ===== */

foreach ( SWIVO_USER_CPTS as $ptype ) {
	add_filter( "manage_{$ptype}_posts_columns", 'swivo_add_user_column' );
	add_action( "manage_{$ptype}_posts_custom_column", 'swivo_render_user_column', 10, 2 );
}

function swivo_add_user_column( $cols ) {
	$new = array();
	foreach ( $cols as $k => $v ) {
		$new[ $k ] = $v;
		if ( $k === 'title' ) {
			$new['swivo_user']   = 'Utilisateur';
			$new['swivo_resume'] = 'Détails';
		}
	}
	return $new;
}

function swivo_render_user_column( $col, $post_id ) {
	if ( $col === 'swivo_user' ) {
		$uid = (int) get_post_meta( $post_id, 'user_id', true );
		if ( ! $uid ) { echo '—'; return; }
		$u = get_user_by( 'id', $uid );
		if ( ! $u ) { echo '—'; return; }
		printf(
			'<a href="%s">%s</a><br/><small>%s</small>',
			esc_url( admin_url( 'admin.php?page=swivo-clients&user=' . $uid ) ),
			esc_html( $u->display_name ?: $u->user_login ),
			esc_html( $u->user_email )
		);
	}
	if ( $col === 'swivo_resume' ) {
		$ptype = get_post_type( $post_id );
		$data = get_post_meta( $post_id, 'data', true );
		if ( ! is_array( $data ) ) $data = array();
		echo swivo_admin_summarize_safe( $ptype, $data, $post_id );
	}
}

function swivo_admin_summarize_safe( $ptype, $data, $post_id ) {
	if ( function_exists( 'swivo_admin_summarize' ) ) return swivo_admin_summarize( $ptype, $data );
	// Fallback simple
	return esc_html( substr( wp_json_encode( $data ), 0, 80 ) );
}

/* ===== Filtre dropdown user ===== */

add_action( 'restrict_manage_posts', function ( $post_type ) {
	if ( ! in_array( $post_type, SWIVO_USER_CPTS, true ) ) return;
	$selected = isset( $_GET['swivo_filter_user'] ) ? (int) $_GET['swivo_filter_user'] : 0;
	$users = get_users( array( 'number' => 200, 'orderby' => 'display_name' ) );
	echo '<select name="swivo_filter_user"><option value="">Tous les utilisateurs</option>';
	foreach ( $users as $u ) {
		printf( '<option value="%d"%s>%s</option>', $u->ID, selected( $selected, $u->ID, false ), esc_html( $u->display_name . ' · ' . $u->user_email ) );
	}
	echo '</select>';
} );

add_action( 'pre_get_posts', function ( $q ) {
	if ( ! is_admin() || ! $q->is_main_query() ) return;
	if ( ! in_array( $q->get( 'post_type' ), SWIVO_USER_CPTS, true ) ) return;
	if ( empty( $_GET['swivo_filter_user'] ) ) return;
	$existing = (array) $q->get( 'meta_query' );
	$existing[] = array( 'key' => 'user_id', 'value' => (int) $_GET['swivo_filter_user'] );
	$q->set( 'meta_query', $existing );
} );

/* ===== Sub-menus sous "Swivo · Clients" pour accès rapide ===== */

add_action( 'admin_menu', function () {
	$labels = array(
		'edit.php?post_type=swivo_dossier'      => 'Dossiers',
		'edit.php?post_type=swivo_b_doc'        => 'Factures & devis',
		'edit.php?post_type=swivo_b_client'     => 'Clients (fact.)',
		'edit.php?post_type=swivo_b_catalog'    => 'Catalogue',
		'edit.php?post_type=swivo_encaissement' => 'Encaissements',
		'edit.php?post_type=swivo_depense'      => 'Dépenses',
		'edit.php?post_type=swivo_document'     => 'Documents',
	);
	foreach ( $labels as $slug => $lbl ) {
		add_submenu_page( 'swivo-clients', $lbl, $lbl, 'manage_options', $slug );
	}
}, 30 );
