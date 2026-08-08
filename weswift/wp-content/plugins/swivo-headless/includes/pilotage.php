<?php
/**
 * Pilotage micro-entrepreneur — backend REST.
 *
 * CPTs : swivo_encaissement, swivo_depense, swivo_b_client, swivo_b_catalog,
 *        swivo_b_doc.
 * Profil fiscal + émetteur stockés en user_meta.
 *
 * Toutes les routes sont authentifiées (is_user_logged_in) et isolent strictement
 * par user_id. Lecture/écriture du seul utilisateur courant.
 *
 * Routes (namespace swivo/v1) :
 *   GET  /me/profil               — profil fiscal + émetteur
 *   PUT  /me/profil               — patch profil/émetteur
 *
 *   GET  /me/encaissements        — liste
 *   POST /me/encaissements        — créer
 *   DEL  /me/encaissements/{id}
 *
 *   GET  /me/depenses             — liste
 *   POST /me/depenses
 *   DEL  /me/depenses/{id}
 *
 *   GET  /me/billing/clients
 *   POST /me/billing/clients      — upsert (id optionnel)
 *   DEL  /me/billing/clients/{id}
 *
 *   GET  /me/billing/catalog
 *   POST /me/billing/catalog      — upsert
 *   DEL  /me/billing/catalog/{id}
 *
 *   GET  /me/billing/docs
 *   POST /me/billing/docs         — upsert
 *   DEL  /me/billing/docs/{id}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SWIVO_CPT_ENCAISSEMENT = 'swivo_encaissement';
const SWIVO_CPT_DEPENSE      = 'swivo_depense';
const SWIVO_CPT_B_CLIENT     = 'swivo_b_client';
const SWIVO_CPT_B_CATALOG    = 'swivo_b_catalog';
const SWIVO_CPT_B_DOC        = 'swivo_b_doc';

add_action( 'init', function () {
	$shared = array(
		'public'              => false,
		'show_ui'             => true,
		'show_in_rest'        => false,
		'supports'            => array( 'title', 'custom-fields' ),
		'capability_type'     => 'post',
		'map_meta_cap'        => true,
	);
	register_post_type( SWIVO_CPT_ENCAISSEMENT, array_merge( $shared, array(
		'labels' => array( 'name' => 'Encaissements', 'singular_name' => 'Encaissement', 'menu_name' => 'Encaissements' ),
		'menu_icon' => 'dashicons-money-alt',
		'menu_position' => 26,
	) ) );
	register_post_type( SWIVO_CPT_DEPENSE, array_merge( $shared, array(
		'labels' => array( 'name' => 'Dépenses', 'singular_name' => 'Dépense', 'menu_name' => 'Dépenses' ),
		'menu_icon' => 'dashicons-cart',
		'menu_position' => 27,
	) ) );
	register_post_type( SWIVO_CPT_B_CLIENT, array_merge( $shared, array(
		'labels' => array( 'name' => 'Clients facturation', 'singular_name' => 'Client', 'menu_name' => 'Clients' ),
		'menu_icon' => 'dashicons-businessperson',
		'menu_position' => 28,
	) ) );
	register_post_type( SWIVO_CPT_B_CATALOG, array_merge( $shared, array(
		'labels' => array( 'name' => 'Catalogue', 'singular_name' => 'Prestation', 'menu_name' => 'Catalogue' ),
		'menu_icon' => 'dashicons-tag',
		'menu_position' => 29,
	) ) );
	register_post_type( SWIVO_CPT_B_DOC, array_merge( $shared, array(
		'labels' => array( 'name' => 'Factures & devis', 'singular_name' => 'Document', 'menu_name' => 'Factures & devis' ),
		'menu_icon' => 'dashicons-media-document',
		'menu_position' => 30,
	) ) );
}, 11 );

/* ============================================================ */
/* REST ROUTES                                                   */
/* ============================================================ */

add_action( 'rest_api_init', function () {
	$auth = function () { return is_user_logged_in(); };

	register_rest_route( 'swivo/v1', '/me/profil', array(
		array( 'methods' => 'GET',  'permission_callback' => $auth, 'callback' => 'swivo_pilotage_get_profil' ),
		array( 'methods' => 'PUT',  'permission_callback' => $auth, 'callback' => 'swivo_pilotage_put_profil' ),
	) );

	register_rest_route( 'swivo/v1', '/me/sync-sirene', array(
		'methods' => 'POST', 'permission_callback' => $auth, 'callback' => 'swivo_pilotage_sync_sirene',
	) );

	register_rest_route( 'swivo/v1', '/me/sync-inpi', array(
		'methods' => 'POST', 'permission_callback' => $auth, 'callback' => 'swivo_pilotage_sync_inpi',
	) );

	$crud_list = function ( $base, $type ) use ( $auth ) {
		register_rest_route( 'swivo/v1', "/me/$base", array(
			array( 'methods' => 'GET',  'permission_callback' => $auth, 'callback' => function ( WP_REST_Request $r ) use ( $type ) { return swivo_pilotage_list( $type ); } ),
			array( 'methods' => 'POST', 'permission_callback' => $auth, 'callback' => function ( WP_REST_Request $r ) use ( $type ) { return swivo_pilotage_upsert( $type, $r ); } ),
		) );
		register_rest_route( 'swivo/v1', "/me/$base/(?P<id>[A-Za-z0-9_-]+)", array(
			array( 'methods' => 'DELETE', 'permission_callback' => $auth, 'callback' => function ( WP_REST_Request $r ) use ( $type ) { return swivo_pilotage_delete( $type, $r ); } ),
		) );
	};

	$crud_list( 'encaissements', SWIVO_CPT_ENCAISSEMENT );
	$crud_list( 'depenses', SWIVO_CPT_DEPENSE );
	$crud_list( 'billing/clients', SWIVO_CPT_B_CLIENT );
	$crud_list( 'billing/catalog', SWIVO_CPT_B_CATALOG );
	$crud_list( 'billing/docs', SWIVO_CPT_B_DOC );
} );

/* ============================================================ */
/* PROFIL FISCAL + ÉMETTEUR                                      */
/* ============================================================ */

function swivo_pilotage_get_profil() {
	$uid = get_current_user_id();
	$profil   = get_user_meta( $uid, 'swivo_profil_fiscal', true );
	$emetteur = get_user_meta( $uid, 'swivo_emetteur', true );
	return rest_ensure_response( array(
		'profil'   => is_array( $profil ) ? $profil : new stdClass(),
		'emetteur' => is_array( $emetteur ) ? $emetteur : new stdClass(),
	) );
}

function swivo_pilotage_put_profil( WP_REST_Request $req ) {
	$uid  = get_current_user_id();
	$body = $req->get_json_params();
	if ( ! is_array( $body ) ) {
		return new WP_Error( 'invalid', 'Body invalide', array( 'status' => 400 ) );
	}
	if ( isset( $body['profil'] ) && is_array( $body['profil'] ) ) {
		$current = (array) get_user_meta( $uid, 'swivo_profil_fiscal', true );
		update_user_meta( $uid, 'swivo_profil_fiscal', array_merge( $current, $body['profil'] ) );
	}
	if ( isset( $body['emetteur'] ) && is_array( $body['emetteur'] ) ) {
		$current = (array) get_user_meta( $uid, 'swivo_emetteur', true );
		update_user_meta( $uid, 'swivo_emetteur', array_merge( $current, $body['emetteur'] ) );
	}
	return swivo_pilotage_get_profil();
}

/* ============================================================ */
/* CRUD GÉNÉRIQUE                                                */
/* ============================================================ */

function swivo_pilotage_list( $post_type ) {
	$uid = get_current_user_id();
	$posts = get_posts( array(
		'post_type'      => $post_type,
		'post_status'    => 'private',
		'posts_per_page' => 500,
		'meta_query'     => array( array( 'key' => 'user_id', 'value' => $uid ) ),
		'orderby'        => 'date',
		'order'          => 'DESC',
	) );
	$out = array();
	foreach ( $posts as $p ) {
		$data = get_post_meta( $p->ID, 'data', true );
		if ( ! is_array( $data ) ) continue;
		$data['_pid'] = $p->ID;
		$out[] = $data;
	}
	return rest_ensure_response( $out );
}

function swivo_pilotage_upsert( $post_type, WP_REST_Request $req ) {
	$uid  = get_current_user_id();
	$body = $req->get_json_params();
	if ( ! is_array( $body ) || empty( $body['id'] ) ) {
		return new WP_Error( 'invalid', 'Identifiant manquant', array( 'status' => 400 ) );
	}
	$client_id = sanitize_text_field( (string) $body['id'] );

	// Cherche existant par meta 'client_id' + user_id
	$existing = get_posts( array(
		'post_type'      => $post_type,
		'post_status'    => 'private',
		'posts_per_page' => 1,
		'meta_query'     => array(
			'relation' => 'AND',
			array( 'key' => 'user_id', 'value' => $uid ),
			array( 'key' => 'client_id', 'value' => $client_id ),
		),
	) );

	$title = swivo_pilotage_make_title( $post_type, $body );

	if ( $existing ) {
		$post_id = $existing[0]->ID;
		wp_update_post( array( 'ID' => $post_id, 'post_title' => $title ) );
	} else {
		$post_id = wp_insert_post( array(
			'post_type'   => $post_type,
			'post_status' => 'private',
			'post_title'  => $title,
		), true );
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'save_failed', 'Création échouée', array( 'status' => 500 ) );
		}
		update_post_meta( $post_id, 'user_id', $uid );
		update_post_meta( $post_id, 'client_id', $client_id );
	}

	update_post_meta( $post_id, 'data', $body );

	// Index utiles pour requêtes/admin
	if ( isset( $body['date'] ) )      update_post_meta( $post_id, 'date', sanitize_text_field( $body['date'] ) );
	if ( isset( $body['montant'] ) )   update_post_meta( $post_id, 'montant', floatval( $body['montant'] ) );
	if ( isset( $body['totalTTC'] ) )  update_post_meta( $post_id, 'montant', floatval( $body['totalTTC'] ) );
	if ( isset( $body['categorie'] ) ) update_post_meta( $post_id, 'categorie', sanitize_text_field( $body['categorie'] ) );
	if ( isset( $body['type'] ) )      update_post_meta( $post_id, 'type', sanitize_text_field( $body['type'] ) );
	if ( isset( $body['status'] ) )    update_post_meta( $post_id, 'status', sanitize_text_field( $body['status'] ) );

	$body['_pid'] = $post_id;
	return rest_ensure_response( $body );
}

function swivo_pilotage_delete( $post_type, WP_REST_Request $req ) {
	$uid = get_current_user_id();
	$client_id = sanitize_text_field( (string) $req['id'] );
	$existing = get_posts( array(
		'post_type'      => $post_type,
		'post_status'    => 'private',
		'posts_per_page' => 1,
		'meta_query'     => array(
			'relation' => 'AND',
			array( 'key' => 'user_id', 'value' => $uid ),
			array( 'key' => 'client_id', 'value' => $client_id ),
		),
	) );
	if ( ! $existing ) return rest_ensure_response( array( 'ok' => true ) );
	wp_delete_post( $existing[0]->ID, true );
	return rest_ensure_response( array( 'ok' => true ) );
}

/**
 * Hydrate l'émetteur de l'utilisateur depuis l'API publique recherche-entreprises (SIRENE).
 * Body : { "siret" : "12345678900099" } ou { "query" : "Acme SAS" }
 */
function swivo_pilotage_sync_sirene( WP_REST_Request $req ) {
	$uid = get_current_user_id();
	$body = $req->get_json_params();
	$q = isset( $body['siret'] ) ? preg_replace( '/\s/', '', (string) $body['siret'] ) : (string) ( $body['query'] ?? '' );
	if ( ! $q ) return new WP_Error( 'no_query', 'siret ou query requis', array( 'status' => 400 ) );

	$resp = wp_remote_get( 'https://recherche-entreprises.api.gouv.fr/search?per_page=1&q=' . rawurlencode( $q ), array( 'timeout' => 8 ) );
	if ( is_wp_error( $resp ) ) return new WP_Error( 'sirene_failed', $resp->get_error_message(), array( 'status' => 502 ) );
	$data = json_decode( wp_remote_retrieve_body( $resp ), true );
	$r = $data['results'][0] ?? null;
	if ( ! $r ) return new WP_Error( 'not_found', 'Aucune entreprise trouvée', array( 'status' => 404 ) );
	$siege = $r['siege'] ?? array();
	$adresse = trim( ( $siege['numero_voie'] ?? '' ) . ' ' . ( $siege['type_voie'] ?? '' ) . ' ' . ( $siege['libelle_voie'] ?? '' ) );
	if ( ! $adresse ) $adresse = $siege['geo_adresse'] ?? '';

	$emetteur = (array) get_user_meta( $uid, 'swivo_emetteur', true );
	$emetteur = array_merge( $emetteur, array(
		'nom'        => $r['nom_raison_sociale'] ?? $r['nom_complet'] ?? '',
		'siret'      => $siege['siret'] ?? '',
		'adresse'    => $adresse,
		'codePostal' => $siege['code_postal'] ?? '',
		'ville'      => $siege['libelle_commune'] ?? '',
	) );
	update_user_meta( $uid, 'swivo_emetteur', $emetteur );

	return rest_ensure_response( array( 'ok' => true, 'emetteur' => $emetteur, 'source' => 'sirene' ) );
}

/**
 * Stub Guichet unique INPI — nécessite un token mandataire INPI (procédures-tiers-déclarant.fr).
 * Pour activer : déposer un dossier d'agrément, recevoir l'identifiant client OAuth2 INPI,
 * stocker en option `swivo_inpi_token`. Routes prod : api.inpi.fr/formalites/v3/* (mandataire).
 */
function swivo_pilotage_sync_inpi( WP_REST_Request $req ) {
	unset( $req );
	$token = get_option( 'swivo_inpi_token', '' );
	if ( ! $token ) {
		return rest_ensure_response( array(
			'ok'          => false,
			'configured'  => false,
			'message'     => "Pas d'agrément mandataire INPI configuré. Étapes : déposer un dossier sur procédures-tiers-déclarant.fr → recevoir client_id OAuth2 → enregistrer le token dans WP option `swivo_inpi_token`.",
		) );
	}
	// TODO : appeler https://api.inpi.fr/formalites/v3/me/formalites avec Bearer $token
	return rest_ensure_response( array( 'ok' => false, 'configured' => true, 'message' => 'À implémenter — endpoint INPI à brancher ici.' ) );
}

function swivo_pilotage_make_title( $post_type, $body ) {
	if ( $post_type === SWIVO_CPT_ENCAISSEMENT ) {
		return sprintf( '%s — %s €', $body['libelle'] ?? 'Encaissement', $body['montant'] ?? '?' );
	}
	if ( $post_type === SWIVO_CPT_DEPENSE ) {
		return sprintf( '%s — %s €', $body['libelle'] ?? 'Dépense', $body['montant'] ?? '?' );
	}
	if ( $post_type === SWIVO_CPT_B_CLIENT ) {
		return $body['nom'] ?? 'Client';
	}
	if ( $post_type === SWIVO_CPT_B_CATALOG ) {
		return $body['libelle'] ?? 'Prestation';
	}
	if ( $post_type === SWIVO_CPT_B_DOC ) {
		return sprintf( '[%s] %s — %s', strtoupper( $body['type'] ?? 'doc' ), $body['numero'] ?? '?', ($body['clientSnapshot']['nom'] ?? '') );
	}
	return 'Item';
}
