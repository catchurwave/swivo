<?php
/**
 * Swivo > Clients — page admin pour superviser l'intégralité du contenu d'un user.
 *
 * - Vue liste : tous les utilisateurs WP avec compteurs (dossiers, factures, CA, gestion).
 * - Vue détail : un user → onglets Dossiers / Drafts / Factures / Devis / Clients fact /
 *   Catalogue / Encaissements / Dépenses / Documents / Profil fiscal / Émetteur.
 *
 * Accès : capability `manage_options` (admin uniquement).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', function () {
	add_menu_page(
		'Clients Swivo',
		'Swivo · Clients',
		'manage_options',
		'swivo-clients',
		'swivo_admin_clients_render',
		'dashicons-groups',
		25
	);
}, 9 );

function swivo_admin_clients_render() {
	if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Accès refusé' );
	$user_id = isset( $_GET['user'] ) ? (int) $_GET['user'] : 0;
	if ( $user_id ) {
		swivo_admin_client_detail( $user_id );
	} else {
		swivo_admin_clients_list();
	}
}

/* ============================================================ */
/* LISTE                                                         */
/* ============================================================ */

function swivo_admin_clients_list() {
	$users = get_users( array( 'number' => 200, 'orderby' => 'registered', 'order' => 'DESC' ) );
	$search = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
	if ( $search ) {
		$users = array_filter( $users, function ( $u ) use ( $search ) {
			return stripos( $u->user_email, $search ) !== false
				|| stripos( $u->display_name, $search ) !== false
				|| stripos( $u->user_login, $search ) !== false;
		} );
	}

	echo '<div class="wrap"><h1>Clients Swivo</h1>';
	echo '<form method="get" style="margin:10px 0"><input type="hidden" name="page" value="swivo-clients"/>';
	echo '<input type="search" name="s" value="' . esc_attr( $search ) . '" placeholder="Rechercher email / nom" />';
	echo ' <button class="button">Rechercher</button></form>';

	echo '<table class="wp-list-table widefat fixed striped">';
	echo '<thead><tr>'
		. '<th>Utilisateur</th>'
		. '<th>Email</th>'
		. '<th>Gestion</th>'
		. '<th>Dossiers</th>'
		. '<th>Brouillons</th>'
		. '<th>Factures</th>'
		. '<th>CA encaissé</th>'
		. '<th>Inscrit</th>'
		. '<th>Action</th>'
		. '</tr></thead><tbody>';

	foreach ( $users as $u ) {
		$counts = swivo_user_counts( $u->ID );
		$gestion = swivo_user_has_gestion( $u->ID ) ? '1' : '';
		printf(
			'<tr>'
			. '<td><strong>%s</strong></td>'
			. '<td>%s</td>'
			. '<td>%s</td>'
			. '<td>%d</td><td>%d</td><td>%d</td>'
			. '<td>%s</td>'
			. '<td>%s</td>'
			. '<td><a class="button button-primary" href="%s">Voir tout</a></td>'
			. '</tr>',
			esc_html( $u->display_name ?: $u->user_login ),
			esc_html( $u->user_email ),
			$gestion === '1' ? '<span style="color:#059669">✓ Actif</span>' : '<span style="color:#94a3b8">—</span>',
			$counts['dossiers'],
			$counts['drafts'],
			$counts['factures'],
			esc_html( number_format( $counts['ca_encaisse'], 2, ',', ' ' ) . ' €' ),
			esc_html( mysql2date( 'd/m/Y', $u->user_registered ) ),
			esc_url( admin_url( 'admin.php?page=swivo-clients&user=' . $u->ID ) )
		);
	}
	echo '</tbody></table></div>';
}

function swivo_user_counts( $uid ) {
	global $wpdb;
	$post_type = 'swivo_dossier';
	$dossiers = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key='user_id' AND pm.meta_value=%d AND p.post_type=%s AND p.post_status IN ('private','publish')", $uid, $post_type ) );
	$drafts = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->postmeta} pm2 ON pm2.post_id = pm.post_id AND pm2.meta_key='status' AND pm2.meta_value='draft' WHERE pm.meta_key='user_id' AND pm.meta_value=%d", $uid ) );
	$factures = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key='user_id' AND pm.meta_value=%d AND p.post_type='swivo_b_doc'", $uid ) );
	$ca_encaisse = (float) $wpdb->get_var( $wpdb->prepare( "SELECT SUM(pm.meta_value) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->postmeta} pm2 ON pm2.post_id = pm.post_id AND pm2.meta_key='user_id' AND pm2.meta_value=%d INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id AND p.post_type='swivo_encaissement' WHERE pm.meta_key='montant'", $uid ) );
	return compact( 'dossiers', 'drafts', 'factures', 'ca_encaisse' );
}

/* ============================================================ */
/* DÉTAIL                                                        */
/* ============================================================ */

function swivo_admin_client_detail( $uid ) {
	$u = get_user_by( 'id', $uid );
	if ( ! $u ) wp_die( 'Utilisateur introuvable' );

	$tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'overview';

	echo '<div class="wrap">';
	echo '<h1>' . esc_html( $u->display_name ?: $u->user_login ) . ' <a href="' . esc_url( admin_url( 'admin.php?page=swivo-clients' ) ) . '" class="page-title-action">← Tous les clients</a></h1>';
	echo '<p>' . esc_html( $u->user_email ) . ' · Inscrit ' . esc_html( mysql2date( 'd/m/Y', $u->user_registered ) ) . '</p>';

	$tabs = array(
		'overview'      => 'Vue d\'ensemble',
		'dossiers'      => 'Dossiers + Brouillons',
		'factures'      => 'Factures & devis',
		'clients_fact'  => 'Clients facturation',
		'catalogue'     => 'Catalogue',
		'encaissements' => 'Encaissements',
		'depenses'      => 'Dépenses',
		'documents'     => 'Documents',
		'profil'        => 'Profil & émetteur',
	);

	echo '<h2 class="nav-tab-wrapper">';
	foreach ( $tabs as $k => $lbl ) {
		$url = admin_url( 'admin.php?page=swivo-clients&user=' . $uid . '&tab=' . $k );
		printf( '<a href="%s" class="nav-tab %s">%s</a>', esc_url( $url ), $tab === $k ? 'nav-tab-active' : '', esc_html( $lbl ) );
	}
	echo '</h2>';

	switch ( $tab ) {
		case 'dossiers':      swivo_admin_tab_dossiers( $uid ); break;
		case 'factures':      swivo_admin_tab_cpt( $uid, 'swivo_b_doc', 'Factures & devis' ); break;
		case 'clients_fact':  swivo_admin_tab_cpt( $uid, 'swivo_b_client', 'Clients de facturation' ); break;
		case 'catalogue':     swivo_admin_tab_cpt( $uid, 'swivo_b_catalog', 'Catalogue de prestations' ); break;
		case 'encaissements': swivo_admin_tab_cpt( $uid, 'swivo_encaissement', 'Encaissements' ); break;
		case 'depenses':      swivo_admin_tab_cpt( $uid, 'swivo_depense', 'Dépenses' ); break;
		case 'documents':     swivo_admin_tab_documents( $uid ); break;
		case 'profil':        swivo_admin_tab_profil( $uid ); break;
		default:              swivo_admin_tab_overview( $uid ); break;
	}
	echo '</div>';
}

function swivo_admin_tab_overview( $uid ) {
	$c = swivo_user_counts( $uid );
	$gestion = swivo_user_has_gestion( $uid ) ? '1' : '';
	$emetteur = (array) get_user_meta( $uid, 'swivo_emetteur', true );
	$profil = (array) get_user_meta( $uid, 'swivo_profil_fiscal', true );

	echo '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:14px 0">';
	$cards = array(
		array( 'Dossiers',     $c['dossiers'],       '#1d4ed8' ),
		array( 'Brouillons',   $c['drafts'],         '#94a3b8' ),
		array( 'Factures',     $c['factures'],       '#7c3aed' ),
		array( 'CA encaissé',  number_format( $c['ca_encaisse'], 0, ',', ' ' ) . ' €', '#059669' ),
	);
	foreach ( $cards as $card ) {
		printf( '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px"><div style="font-size:11px;color:#64748b;text-transform:uppercase">%s</div><div style="font-size:24px;font-weight:700;color:%s;margin-top:4px">%s</div></div>',
			esc_html( $card[0] ), esc_attr( $card[2] ), esc_html( $card[1] ) );
	}
	echo '</div>';

	echo '<table class="widefat fixed striped"><tbody>';
	printf( '<tr><td><strong>Formule Gestion</strong></td><td>%s</td></tr>', $gestion === '1' ? '✓ Active' : '— Inactive' );
	if ( ! empty( $emetteur ) ) {
		printf( '<tr><td><strong>Émetteur</strong></td><td>%s — SIRET %s · %s</td></tr>',
			esc_html( $emetteur['nom'] ?? '—' ),
			esc_html( $emetteur['siret'] ?? '—' ),
			esc_html( ( $emetteur['codePostal'] ?? '' ) . ' ' . ( $emetteur['ville'] ?? '' ) )
		);
	}
	if ( ! empty( $profil ) ) {
		printf( '<tr><td><strong>Profil fiscal</strong></td><td>%s · Régime %s · ACRE jusqu\'au %s · VL: %s</td></tr>',
			esc_html( $profil['categorieDefaut'] ?? '—' ),
			esc_html( $profil['regimeDeclaration'] ?? '—' ),
			esc_html( $profil['acreJusquAu'] ?? '—' ),
			! empty( $profil['versementLiberatoire'] ) ? 'Oui' : 'Non'
		);
	}
	echo '</tbody></table>';
}

function swivo_admin_tab_dossiers( $uid ) {
	$posts = get_posts( array(
		'post_type' => 'swivo_dossier',
		'post_status' => array( 'private', 'publish' ),
		'posts_per_page' => 100,
		'meta_query' => array( array( 'key' => 'user_id', 'value' => $uid ) ),
		'orderby' => 'date', 'order' => 'DESC',
	) );
	if ( ! $posts ) { echo '<p>Aucun dossier.</p>'; return; }
	echo '<table class="widefat fixed striped"><thead><tr><th>Titre</th><th>Forme</th><th>Statut</th><th>Complétude</th><th>Date</th><th>Action</th></tr></thead><tbody>';
	foreach ( $posts as $p ) {
		$status = get_post_meta( $p->ID, 'status', true );
		$forme  = get_post_meta( $p->ID, 'forme', true );
		$score  = (int) get_post_meta( $p->ID, 'score_completude', true );
		printf( '<tr><td><strong>%s</strong></td><td>%s</td><td>%s</td><td>%d %%</td><td>%s</td><td><a class="button" href="%s">Éditer</a></td></tr>',
			esc_html( $p->post_title ),
			esc_html( strtoupper( (string) $forme ) ?: '—' ),
			esc_html( (string) $status ?: 'pending' ),
			$score,
			esc_html( mysql2date( 'd/m/Y H:i', $p->post_date ) ),
			esc_url( get_edit_post_link( $p->ID ) )
		);
	}
	echo '</tbody></table>';
}

function swivo_admin_tab_cpt( $uid, $post_type, $titre ) {
	$posts = get_posts( array(
		'post_type' => $post_type,
		'post_status' => 'private',
		'posts_per_page' => 200,
		'meta_query' => array( array( 'key' => 'user_id', 'value' => $uid ) ),
		'orderby' => 'date', 'order' => 'DESC',
	) );
	if ( ! $posts ) { echo '<p>Aucun ' . esc_html( strtolower( $titre ) ) . '.</p>'; return; }
	echo '<table class="widefat fixed striped"><thead><tr><th>Titre</th><th>Données clés</th><th>Date</th><th>Action</th></tr></thead><tbody>';
	foreach ( $posts as $p ) {
		$data = get_post_meta( $p->ID, 'data', true );
		$summary = swivo_admin_summarize( $post_type, is_array( $data ) ? $data : array() );
		printf( '<tr><td><strong>%s</strong></td><td>%s</td><td>%s</td><td><a class="button" href="%s">Voir</a></td></tr>',
			esc_html( $p->post_title ),
			$summary,
			esc_html( mysql2date( 'd/m/Y H:i', $p->post_date ) ),
			esc_url( get_edit_post_link( $p->ID ) )
		);
	}
	echo '</tbody></table>';
}

function swivo_admin_summarize( $post_type, $data ) {
	switch ( $post_type ) {
		case 'swivo_b_doc':
			$status = esc_html( $data['status'] ?? '—' );
			$ttc = number_format( (float) ( $data['totalTTC'] ?? 0 ), 2, ',', ' ' );
			return "{$data['type']} · {$data['numero']} · " . esc_html( $data['clientSnapshot']['nom'] ?? '' ) . " · {$ttc} € · {$status}";
		case 'swivo_b_client':
			return esc_html( ( $data['email'] ?? '' ) . ' · ' . ( $data['ville'] ?? '' ) . ' · SIREN ' . ( $data['siren'] ?? '—' ) );
		case 'swivo_b_catalog':
			return esc_html( ( $data['unite'] ?? '' ) . ' · ' . number_format( (float) ( $data['prixHT'] ?? 0 ), 2, ',', ' ' ) . ' € HT · ' . ( $data['categorie'] ?? '' ) );
		case 'swivo_encaissement':
			return esc_html( ( $data['libelle'] ?? '' ) . ' · ' . number_format( (float) ( $data['montant'] ?? 0 ), 2, ',', ' ' ) . ' € · ' . ( $data['categorie'] ?? '' ) . ' · ' . ( $data['date'] ?? '' ) );
		case 'swivo_depense':
			return esc_html( ( $data['libelle'] ?? '' ) . ' · - ' . number_format( (float) ( $data['montant'] ?? 0 ), 2, ',', ' ' ) . ' € · ' . ( $data['type'] ?? '' ) . ' · ' . ( $data['date'] ?? '' ) );
	}
	return '—';
}

function swivo_admin_tab_documents( $uid ) {
	$posts = get_posts( array(
		'post_type' => 'swivo_document',
		'post_status' => 'private',
		'posts_per_page' => 200,
		'meta_query' => array( array( 'key' => 'user_id', 'value' => $uid ) ),
		'orderby' => 'date', 'order' => 'DESC',
	) );
	if ( ! $posts ) { echo '<p>Aucun document.</p>'; return; }
	echo '<table class="widefat fixed striped"><thead><tr><th>Nom</th><th>Slot</th><th>Statut</th><th>Date</th><th>Action</th></tr></thead><tbody>';
	foreach ( $posts as $p ) {
		$attachment_id = (int) get_post_meta( $p->ID, 'attachment_id', true );
		$url = $attachment_id ? wp_get_attachment_url( $attachment_id ) : '';
		$slot = (string) get_post_meta( $p->ID, 'slot', true );
		$status = (string) get_post_meta( $p->ID, 'status', true );
		printf( '<tr><td><strong>%s</strong></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
			esc_html( $p->post_title ),
			esc_html( $slot ),
			esc_html( $status ),
			esc_html( mysql2date( 'd/m/Y H:i', $p->post_date ) ),
			$url ? '<a class="button" href="' . esc_url( $url ) . '" target="_blank">Télécharger</a>' : '—'
		);
	}
	echo '</tbody></table>';
}

function swivo_admin_tab_profil( $uid ) {
	$emetteur = (array) get_user_meta( $uid, 'swivo_emetteur', true );
	$profil   = (array) get_user_meta( $uid, 'swivo_profil_fiscal', true );

	echo '<h3>Émetteur</h3>';
	echo '<pre style="background:#f8fafc;padding:14px;border-radius:8px;overflow:auto">' . esc_html( wp_json_encode( $emetteur, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) ) . '</pre>';

	echo '<h3>Profil fiscal</h3>';
	echo '<pre style="background:#f8fafc;padding:14px;border-radius:8px;overflow:auto">' . esc_html( wp_json_encode( $profil, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) ) . '</pre>';

	$oauth_g = (array) get_user_meta( $uid, 'swivo_oauth_google', true );
	$oauth_fc = (array) get_user_meta( $uid, 'swivo_oauth_france_connect', true );
	if ( $oauth_g || $oauth_fc ) {
		echo '<h3>Connexions tierces</h3>';
		if ( $oauth_g )  echo '<p><strong>Google</strong> : ' . esc_html( $oauth_g['email'] ?? '' ) . '</p>';
		if ( $oauth_fc ) echo '<p><strong>FranceConnect</strong> : ' . esc_html( $oauth_fc['given_name'] ?? '' ) . ' ' . esc_html( $oauth_fc['family_name'] ?? '' ) . '</p>';
	}
}
