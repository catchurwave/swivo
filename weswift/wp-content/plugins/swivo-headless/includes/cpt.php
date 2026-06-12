<?php
/**
 * Custom post types for Swivo Headless.
 *
 * - `swivo_forme`  : forme juridique (micro, sasu, sarl, etc.) — editable in WP admin
 *                       with custom meta exposed to REST.
 * - `swivo_faq`    : single FAQ item with `category` taxonomy via meta.
 * - `swivo_dossier`: dossier de création soumis depuis le SPA. Privé, géré par
 *                      l'équipe via le tableau de bord WP.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_register_cpts() {
	register_post_type( 'swivo_forme', array(
		'labels'              => array(
			'name'               => 'Formes juridiques',
			'singular_name'      => 'Forme juridique',
			'add_new_item'       => 'Ajouter une forme juridique',
			'edit_item'          => 'Modifier la forme juridique',
			'menu_name'          => 'Formes juridiques',
		),
		'public'              => true,
		'show_in_rest'        => true,
		'rest_base'           => 'swivo_forme',
		'supports'            => array( 'title', 'editor', 'custom-fields' ),
		'menu_icon'           => 'dashicons-portfolio',
		'has_archive'         => false,
		'rewrite'             => array( 'slug' => 'formes-juridiques' ),
	) );

	$forme_meta = array(
		'short_label'   => 'string',
		'tagline'       => 'string',
		'capital_min'   => 'string',
		'associes_min'  => 'integer',
		'associes_max'  => 'integer',
		'regime_fiscal' => 'string',
		'regime_social' => 'string',
		'responsabilite'=> 'string',
		'bon_pour'      => 'array',
	);
	foreach ( $forme_meta as $key => $type ) {
		register_post_meta( 'swivo_forme', $key, array(
			'type'         => $type === 'array' ? 'array' : $type,
			'single'       => true,
			'show_in_rest' => $type === 'array'
				? array(
					'schema' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				)
				: true,
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		) );
	}

	register_post_type( 'swivo_faq', array(
		'labels'              => array(
			'name'          => 'FAQ',
			'singular_name' => 'FAQ',
			'menu_name'     => 'FAQ',
		),
		'public'              => false,
		'show_ui'             => true,
		'show_in_rest'        => true,
		'rest_base'           => 'swivo_faq',
		'supports'            => array( 'title', 'editor', 'custom-fields' ),
		'menu_icon'           => 'dashicons-format-chat',
	) );

	register_post_meta( 'swivo_faq', 'category', array(
		'type'         => 'string',
		'single'       => true,
		'show_in_rest' => true,
		'auth_callback' => function () { return current_user_can( 'edit_posts' ); },
	) );

	register_post_type( 'swivo_dossier', array(
		'labels'              => array(
			'name'          => 'Dossiers',
			'singular_name' => 'Dossier',
			'menu_name'     => 'Dossiers',
		),
		'public'              => false,
		'show_ui'             => true,
		'show_in_rest'        => false, // accessed only via custom auth-protected route
		'supports'            => array( 'title', 'editor', 'custom-fields' ),
		'menu_icon'           => 'dashicons-clipboard',
		'capability_type'     => 'post',
		'map_meta_cap'        => true,
	) );
}
