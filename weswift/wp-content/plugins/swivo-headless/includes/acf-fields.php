<?php
/**
 * Advanced Custom Fields PRO field registration.
 *
 * Registers structured fields for the `swivo_dossier` CPT so editors see
 * named inputs (Forme, Identité, Siège, Activité…) instead of opaque post
 * meta. Also adds an options page that mirrors the most-used Swivo settings
 * for editors who don't have the `manage_options` capability.
 *
 * Local-only registration (no JSON sync) so the schema lives in code and
 * travels with the plugin.
 *
 * The dossier `payload` meta remains the canonical store (written by the
 * SPA wizard). These ACF fields are mirrors populated by acf_to_payload
 * sync below — editing in WP admin keeps the payload in sync.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'acf/init', 'swivo_acf_register_field_groups' );

function swivo_acf_register_field_groups() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) return;

	acf_add_local_field_group( array(
		'key'    => 'group_swivo_dossier',
		'title'  => 'Dossier Swivo',
		'fields' => array(
			array(
				'key'           => 'field_swivo_status',
				'label'         => 'Statut',
				'name'          => 'swivo_status',
				'type'          => 'select',
				'choices'       => array(
					'draft'             => 'Brouillon',
					'awaiting_payment'  => 'En attente paiement',
					'paid'              => 'Payé',
					'submitted'         => 'Transmis INPI',
					'completed'         => 'Terminé',
					'cancelled'         => 'Annulé',
				),
				'default_value' => 'draft',
				'ui'            => 1,
			),
			array(
				'key'   => 'field_swivo_forme',
				'label' => 'Forme juridique',
				'name'  => 'swivo_forme',
				'type'  => 'select',
				'choices' => array(
					'micro' => 'Micro-entreprise',
					'ei'    => 'Entreprise Individuelle',
					'eurl'  => 'EURL',
					'sarl'  => 'SARL',
					'sasu'  => 'SASU',
					'sas'   => 'SAS',
					'sa'    => 'SA',
					'sci'   => 'SCI',
				),
				'allow_null' => 1,
				'ui'         => 1,
			),
			array(
				'key'   => 'field_swivo_identite',
				'label' => 'Identité du dirigeant',
				'name'  => 'swivo_identite',
				'type'  => 'group',
				'sub_fields' => array(
					array( 'key' => 'f_id_civ',    'label' => 'Civilité',       'name' => 'civilite',      'type' => 'select', 'choices' => array( 'M' => 'M.', 'Mme' => 'Mme' ), 'allow_null' => 1 ),
					array( 'key' => 'f_id_pre',    'label' => 'Prénom',         'name' => 'prenom',        'type' => 'text' ),
					array( 'key' => 'f_id_nom',    'label' => 'Nom',            'name' => 'nom',           'type' => 'text' ),
					array( 'key' => 'f_id_email',  'label' => 'Email',          'name' => 'email',         'type' => 'email' ),
					array( 'key' => 'f_id_nir',    'label' => 'NIR',            'name' => 'nir',           'type' => 'text', 'maxlength' => 15 ),
					array( 'key' => 'f_id_dob',    'label' => 'Date naissance', 'name' => 'date_naissance','type' => 'date_picker', 'display_format' => 'd/m/Y', 'return_format' => 'Y-m-d' ),
				),
			),
			array(
				'key'   => 'field_swivo_siege',
				'label' => 'Siège social',
				'name'  => 'swivo_siege',
				'type'  => 'group',
				'sub_fields' => array(
					array( 'key' => 'f_s_adr',  'label' => 'Adresse',     'name' => 'adresse',     'type' => 'text' ),
					array( 'key' => 'f_s_comp', 'label' => 'Complément',  'name' => 'complement',  'type' => 'text' ),
					array( 'key' => 'f_s_cp',   'label' => 'Code postal', 'name' => 'code_postal', 'type' => 'text', 'maxlength' => 5 ),
					array( 'key' => 'f_s_vil',  'label' => 'Ville',       'name' => 'ville',       'type' => 'text' ),
				),
			),
			array( 'key' => 'field_swivo_activite', 'label' => 'Activité',         'name' => 'swivo_activite', 'type' => 'textarea', 'rows' => 3 ),
			array( 'key' => 'field_swivo_capital',  'label' => 'Capital (€)',      'name' => 'swivo_capital',  'type' => 'number',   'min' => 0 ),
			array( 'key' => 'field_swivo_acre',     'label' => 'ACRE éligible',    'name' => 'swivo_acre',     'type' => 'true_false', 'ui' => 1 ),
			array( 'key' => 'field_swivo_notes',    'label' => 'Notes internes',   'name' => 'swivo_notes',    'type' => 'textarea', 'rows' => 4 ),
		),
		'location' => array(
			array(
				array(
					'param'    => 'post_type',
					'operator' => '==',
					'value'    => 'swivo_dossier',
				),
			),
		),
		'menu_order'    => 5,
		'position'      => 'normal',
		'style'         => 'default',
		'label_placement' => 'top',
	) );
}

/**
 * Options page: lets editors edit pricing and AI provider selection without
 * needing manage_options. Falls through gracefully when ACF Pro is absent.
 */
add_action( 'acf/init', function () {
	if ( ! function_exists( 'acf_add_options_sub_page' ) ) return;
	acf_add_options_sub_page( array(
		'page_title'  => 'Swivo — Réglages éditoriaux',
		'menu_title'  => 'Réglages éditoriaux',
		'parent_slug' => 'swivo-headless',
		'capability'  => 'edit_others_posts',
	) );
} );

add_action( 'acf/init', function () {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) return;
	acf_add_local_field_group( array(
		'key'    => 'group_swivo_options',
		'title'  => 'Swivo — Tarifs & IA',
		'fields' => array(
			array( 'key' => 'opt_swivo_creation_price', 'label' => 'Tarif création',            'name' => 'swivo_creation_price', 'type' => 'text', 'default_value' => '29,90 €' ),
			array( 'key' => 'opt_swivo_gestion_price',  'label' => 'Tarif gestion (mensuel)',   'name' => 'swivo_gestion_price',  'type' => 'text', 'default_value' => '9,90 €' ),
			array( 'key' => 'opt_swivo_ai_provider',    'label' => 'Provider IA',               'name' => 'swivo_ai_provider',    'type' => 'select', 'choices' => array( 'anthropic' => 'Anthropic (Claude)', 'google' => 'Google (Gemini)' ), 'default_value' => 'anthropic' ),
		),
		'location' => array(
			array(
				array(
					'param'    => 'options_page',
					'operator' => '==',
					'value'    => 'acf-options-swivo-reglages-editoriaux',
				),
			),
		),
	) );
} );

/**
 * Sync ACF fields ↔ canonical `payload` meta. The SPA writes `payload` as a
 * flat array; admins edit ACF fields. After save, fold the ACF fields back
 * into payload so /my-dossiers and the wizard resume see consistent data.
 */
add_action( 'acf/save_post', 'swivo_acf_sync_to_payload', 20 );

function swivo_acf_sync_to_payload( $post_id ) {
	if ( ! is_numeric( $post_id ) ) return;
	if ( get_post_type( $post_id ) !== 'swivo_dossier' ) return;

	$payload = get_post_meta( $post_id, 'payload', true );
	if ( ! is_array( $payload ) ) $payload = array();

	$forme    = (string) get_field( 'swivo_forme', $post_id );
	$identite = (array)  get_field( 'swivo_identite', $post_id );
	$siege    = (array)  get_field( 'swivo_siege', $post_id );
	$activite = (string) get_field( 'swivo_activite', $post_id );
	$capital  = (string) get_field( 'swivo_capital', $post_id );

	if ( $forme )    $payload['forme']    = $forme;
	if ( $activite ) $payload['activite'] = $activite;
	if ( $capital !== '' ) $payload['capital'] = $capital;
	if ( $identite ) $payload['identite'] = array_filter( $identite );
	if ( $siege )    $payload['siege']    = array_filter( $siege );

	update_post_meta( $post_id, 'payload', $payload );

	// Mirror status field onto the legacy meta key the REST APIs read.
	$status = get_field( 'swivo_status', $post_id );
	if ( $status ) update_post_meta( $post_id, 'status', sanitize_text_field( $status ) );
}
