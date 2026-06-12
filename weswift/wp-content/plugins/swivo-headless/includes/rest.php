<?php
/**
 * REST API for Swivo — namespace `swivo/v1`.
 *
 * Public read routes for SPA hydration:
 *   GET /formes           — list of formes juridiques
 *   GET /faq              — FAQ items
 *   GET /pricing          — current pricing (29.90 / 9.90) — sourced from options
 *
 * Write route (rate-limited, public for v1; switch to authenticated when account
 * flow lands):
 *   POST /dossier         — submit a dossier from the chat flow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_register_rest_routes() {
	register_rest_route( 'swivo/v1', '/formes', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_rest_formes',
	) );

	register_rest_route( 'swivo/v1', '/faq', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_rest_faq',
	) );

	register_rest_route( 'swivo/v1', '/pricing', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'swivo_rest_pricing',
	) );

	register_rest_route( 'swivo/v1', '/dossier', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true', // public for now; throttled below
		'callback'            => 'swivo_rest_create_dossier',
	) );
}

function swivo_rest_formes() {
	$posts = get_posts( array(
		'post_type'      => 'swivo_forme',
		'posts_per_page' => -1,
		'orderby'        => 'menu_order title',
		'order'          => 'ASC',
	) );

	$out = array();
	foreach ( $posts as $p ) {
		$out[] = array(
			'slug'           => $p->post_name,
			'label'          => $p->post_title,
			'shortLabel'     => (string) get_post_meta( $p->ID, 'short_label', true ),
			'tagline'        => (string) get_post_meta( $p->ID, 'tagline', true ),
			'capitalMin'     => (string) get_post_meta( $p->ID, 'capital_min', true ) ?: null,
			'associesMin'    => (int) ( get_post_meta( $p->ID, 'associes_min', true ) ?: 1 ),
			'associesMax'    => (int) ( get_post_meta( $p->ID, 'associes_max', true ) ?: 0 ) ?: null,
			'regimeFiscal'   => (string) get_post_meta( $p->ID, 'regime_fiscal', true ),
			'regimeSocial'   => (string) get_post_meta( $p->ID, 'regime_social', true ),
			'responsabilite' => (string) get_post_meta( $p->ID, 'responsabilite', true ),
			'bonPour'        => (array)  get_post_meta( $p->ID, 'bon_pour', true ) ?: array(),
		);
	}
	return rest_ensure_response( $out );
}

function swivo_rest_faq() {
	$posts = get_posts( array(
		'post_type'      => 'swivo_faq',
		'posts_per_page' => -1,
		'orderby'        => 'menu_order date',
		'order'          => 'ASC',
	) );

	$out = array();
	foreach ( $posts as $p ) {
		$out[] = array(
			'q'   => $p->post_title,
			'a'   => wp_strip_all_tags( $p->post_content ),
			'cat' => (string) get_post_meta( $p->ID, 'category', true ) ?: 'creation',
		);
	}
	return rest_ensure_response( $out );
}

function swivo_rest_pricing() {
	$default = array(
		'creation' => array(
			'price'    => get_option( 'swivo_creation_price', '29,90 €' ),
			'suffix'   => ' tout compris',
			'features' => array(
				'Chat IA adaptatif (5 min)',
				'Dossier conforme garanti',
				'Transmission Guichet unique sous 24h',
				'Statuts pré-rédigés (sociétés)',
				'Suivi temps réel + alertes email',
				'Support juridique humain',
			),
			'note'     => 'Frais légaux INPI / annonce légale en sus.',
		),
		'gestion' => array(
			'price'    => get_option( 'swivo_gestion_price', '9,90 €' ),
			'suffix'   => ' / mois',
			'features' => array(
				'Tableau de bord temps réel',
				'Calculateurs URSSAF / TVA / IS',
				'Facturation & devis illimités',
				'Modèles juridiques',
				'Mise en pause / fermeture assistée',
				'Support prioritaire',
			),
			'note'     => 'Sans engagement, résiliable en 1 clic.',
		),
		'inpiFees' => array(
			array( 'k' => 'Micro-entreprise',          'v' => '0 €' ),
			array( 'k' => 'SAS / SASU',                'v' => '~ 37 €' ),
			array( 'k' => 'SARL / EURL',               'v' => '~ 37 €' ),
			array( 'k' => 'Annonce légale (sociétés)', 'v' => '~ 150 €' ),
			array( 'k' => 'Dépôt de capital banque',   'v' => '0 — 80 €' ),
		),
	);
	return rest_ensure_response( $default );
}

/**
 * Persist an incoming dossier from the SPA chat. Lightweight throttle: 1 dossier
 * per IP every 30 seconds; bigger rate-limiting belongs to a security plugin.
 */
function swivo_rest_create_dossier( WP_REST_Request $req ) {
	$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( $_SERVER['REMOTE_ADDR'] ) : 'unknown';
	$cap_key  = 'swivo_dossier_cap_' . md5( $ip );
	if ( get_transient( $cap_key ) ) {
		return new WP_Error( 'swivo_throttled', 'Trop de requêtes — réessayez dans 30 s.', array( 'status' => 429 ) );
	}
	set_transient( $cap_key, 1, 30 );

	$body = $req->get_json_params();
	if ( ! is_array( $body ) || empty( $body ) ) {
		return new WP_Error( 'swivo_invalid', 'Payload invalide.', array( 'status' => 400 ) );
	}

	$forme  = isset( $body['forme'] ) ? sanitize_text_field( $body['forme'] ) : 'inconnu';
	$email  = isset( $body['identite']['email'] ) ? sanitize_email( $body['identite']['email'] ) : '';
	$prenom = isset( $body['identite']['prenom'] ) ? sanitize_text_field( $body['identite']['prenom'] ) : '';
	$nom    = isset( $body['identite']['nom'] ) ? sanitize_text_field( $body['identite']['nom'] ) : '';

	$title = sprintf( '%s — %s %s', strtoupper( $forme ), $prenom, $nom );
	$post_id = wp_insert_post( array(
		'post_type'    => 'swivo_dossier',
		'post_title'   => trim( $title, ' —' ),
		'post_status'  => 'private',
		'post_content' => wp_json_encode( $body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ),
	), true );

	if ( is_wp_error( $post_id ) ) {
		return new WP_Error( 'swivo_save_failed', 'Impossible de créer le dossier.', array( 'status' => 500 ) );
	}

	update_post_meta( $post_id, 'forme', $forme );
	update_post_meta( $post_id, 'email', $email );
	update_post_meta( $post_id, 'prenom', $prenom );
	update_post_meta( $post_id, 'nom', $nom );
	update_post_meta( $post_id, 'payload', $body );
	update_post_meta( $post_id, 'ip', $ip );
	update_post_meta( $post_id, 'status', 'pending' );

	/**
	 * Allow other plugins (Stripe, email, etc.) to react.
	 */
	do_action( 'swivo_dossier_created', $post_id, $body );

	return rest_ensure_response( array(
		'id'     => $post_id,
		'status' => 'pending',
	) );
}
