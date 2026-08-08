<?php
/**
 * INPI / Guichet unique mapping.
 *
 * Maps Swivo's internal dossier shape onto the public Guichet unique
 * "formalités" JSON schema (cf. `Documentation guichet unique/Dictionnaire
 * de données INPI 2026_04_29.xlsx`).
 *
 * Output is a *skeleton* — fields the user has provided are filled; everything
 * else is left empty or omitted. The team uses this JSON as a starting point
 * to copy/paste into the Guichet unique portal until the mandataire API is
 * granted. When mandataire access lands, this is the function to evolve.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_post_swivo_export_inpi', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Refusé.' );
	}
	check_admin_referer( 'swivo_export_inpi' );
	$id = isset( $_GET['dossier'] ) ? (int) $_GET['dossier'] : 0;
	if ( ! $id ) {
		wp_die( 'Dossier manquant.' );
	}
	$dossier_meta = get_post_meta( $id, 'payload', true );
	if ( ! is_array( $dossier_meta ) ) {
		$dossier_meta = array();
	}
	$payload = swivo_map_to_inpi( $dossier_meta );

	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="dossier-' . $id . '-inpi.json"' );
	echo wp_json_encode( $payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	exit;
} );

function swivo_map_to_inpi( array $d ) {
	$forme_code = swivo_inpi_forme_code( $d['forme'] ?? '' );

	$personne_physique = array(
		'nom_naissance'  => $d['identite']['nom']    ?? '',
		'prenoms'        => array_filter( array( $d['identite']['prenom'] ?? '' ) ),
		'nationalite'    => 'FR',
		'lieu_naissance' => null,
		'date_naissance' => null,
		'email'          => $d['identite']['email']  ?? '',
	);

	$siege = array(
		'adresse_complete' => $d['siege']['adresse'] ?? '',
		'pays'             => 'FR',
	);

	return array(
		'formality'    => 'creation',
		'nature'       => 'PRINCIPALE',
		'company' => array(
			'forme_juridique_code' => $forme_code,
			'forme_juridique_lib'  => strtoupper( $d['forme'] ?? '' ),
			'denomination'         => '',
			'siege'                => $siege,
			'activites' => array(
				array(
					'principale' => true,
					'libelle'    => $d['activite'] ?? '',
				),
			),
			'capital' => array(
				'montant_eur'        => isset( $d['capital'] ) ? (float) $d['capital'] : null,
				'devise'             => 'EUR',
				'apport_numeraire'   => null,
				'apport_nature'      => null,
			),
		),
		'dirigeants' => array(
			array(
				'role'              => swivo_inpi_role_for( $d['forme'] ?? '' ),
				'personne_physique' => $personne_physique,
			),
		),
		'associes'   => array(),
		'meta'       => array(
			'source'       => 'swivo',
			'capital_levee' => $d['capitalLevee'] ?? null,
			'ca_previsionnel' => $d['ca'] ?? null,
			'projet'       => $d['projet'] ?? null,
		),
	);
}

/**
 * Forme juridique codes — INPI table extract (cf. xlsx "Liste des formes
 * juridiques code et valideurs particuliers"). Keep this small + targeted to
 * the forms we sell; expand as needed.
 */
function swivo_inpi_forme_code( $slug ) {
	return array(
		'micro' => '1000', // Entrepreneur individuel (régime micro)
		'ei'    => '1000',
		'eurl'  => '5498',
		'sarl'  => '5499',
		'sasu'  => '5720',
		'sas'   => '5710',
		'sa'    => '5599',
		'sci'   => '6540',
	)[ $slug ] ?? '';
}

function swivo_inpi_role_for( $slug ) {
	return in_array( $slug, array( 'sas', 'sasu' ), true ) ? 'PRESIDENT'
		: ( in_array( $slug, array( 'sarl', 'eurl' ), true ) ? 'GERANT'
			: 'DIRIGEANT' );
}
