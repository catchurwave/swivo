<?php
/**
 * Seed default content (formes juridiques, FAQ) on activation, so the SPA has
 * something to display the first time it talks to the API. Re-running is safe:
 * we only insert items whose slug doesn't already exist.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_seed_default_content() {
	swivo_seed_formes();
	swivo_seed_faq();
}

function swivo_seed_formes() {
	$formes = array(
		array(
			'slug'  => 'micro',
			'title' => 'Micro-entreprise',
			'meta'  => array(
				'short_label'    => 'Micro',
				'tagline'        => 'Simple, rapide, fiscalité ultra-allégée jusqu’aux plafonds.',
				'associes_min'   => 1,
				'associes_max'   => 1,
				'regime_fiscal'  => 'Micro-fiscal (versement libératoire possible)',
				'regime_social'  => 'TNS',
				'responsabilite' => 'Illimitée sur le patrimoine pro (insaisissabilité RP)',
				'bon_pour'       => array( 'Activité solo', 'Lancement rapide', 'Faible CA' ),
			),
		),
		array(
			'slug'  => 'ei',
			'title' => 'Entreprise individuelle',
			'meta'  => array(
				'short_label'    => 'EI',
				'tagline'        => 'Souplesse maximale, séparation patrimoine pro/perso depuis 2022.',
				'associes_min'   => 1,
				'associes_max'   => 1,
				'regime_fiscal'  => 'IR (option IS possible)',
				'regime_social'  => 'TNS',
				'responsabilite' => 'Limitée au patrimoine pro',
				'bon_pour'       => array( 'Artisan / commerçant', 'Projet seul' ),
			),
		),
		array(
			'slug'  => 'eurl',
			'title' => 'EURL',
			'meta'  => array(
				'short_label'    => 'EURL',
				'tagline'        => 'SARL à associé unique — protection patrimoniale + cadre clair.',
				'capital_min'    => '1 €',
				'associes_min'   => 1,
				'associes_max'   => 1,
				'regime_fiscal'  => 'IR par défaut, option IS',
				'regime_social'  => 'TNS',
				'responsabilite' => 'Limitée aux apports',
				'bon_pour'       => array( 'Activité seul·e', 'Sécuriser son patrimoine' ),
			),
		),
		array(
			'slug'  => 'sarl',
			'title' => 'SARL',
			'meta'  => array(
				'short_label'    => 'SARL',
				'tagline'        => 'Cadre stable pour société à plusieurs associés.',
				'capital_min'    => '1 €',
				'associes_min'   => 2,
				'associes_max'   => 100,
				'regime_fiscal'  => 'IS par défaut',
				'regime_social'  => 'TNS gérant majo / Assimilé salarié sinon',
				'responsabilite' => 'Limitée aux apports',
				'bon_pour'       => array( 'Projet à plusieurs', 'Activité familiale' ),
			),
		),
		array(
			'slug'  => 'sasu',
			'title' => 'SASU',
			'meta'  => array(
				'short_label'    => 'SASU',
				'tagline'        => 'SAS à associé unique — flexible, protection sociale salariée.',
				'capital_min'    => '1 €',
				'associes_min'   => 1,
				'associes_max'   => 1,
				'regime_fiscal'  => 'IS (option IR sous conditions)',
				'regime_social'  => 'Assimilé salarié',
				'responsabilite' => 'Limitée aux apports',
				'bon_pour'       => array( 'Freelance tech', 'Levée future', 'Optimisation rémunération' ),
			),
		),
		array(
			'slug'  => 'sas',
			'title' => 'SAS',
			'meta'  => array(
				'short_label'    => 'SAS',
				'tagline'        => 'Statuts sur-mesure pour startups et associés multiples.',
				'capital_min'    => '1 €',
				'associes_min'   => 2,
				'regime_fiscal'  => 'IS (option IR 5 ans)',
				'regime_social'  => 'Assimilé salarié (président)',
				'responsabilite' => 'Limitée aux apports',
				'bon_pour'       => array( 'Startup', 'Investisseurs', 'Statuts flexibles' ),
			),
		),
		array(
			'slug'  => 'sa',
			'title' => 'SA',
			'meta'  => array(
				'short_label'    => 'SA',
				'tagline'        => 'Société anonyme — projets d’envergure / cotation.',
				'capital_min'    => '37 000 €',
				'associes_min'   => 2,
				'regime_fiscal'  => 'IS',
				'regime_social'  => 'Assimilé salarié',
				'responsabilite' => 'Limitée aux apports',
				'bon_pour'       => array( 'Grande structure', 'Bourse' ),
			),
		),
		array(
			'slug'  => 'sci',
			'title' => 'SCI',
			'meta'  => array(
				'short_label'    => 'SCI',
				'tagline'        => 'Gérer / transmettre un patrimoine immobilier.',
				'capital_min'    => '1 €',
				'associes_min'   => 2,
				'regime_fiscal'  => 'IR par défaut, option IS',
				'regime_social'  => 'TNS / NC',
				'responsabilite' => 'Indéfinie, non solidaire',
				'bon_pour'       => array( 'Investissement locatif', 'Transmission' ),
			),
		),
	);

	foreach ( $formes as $i => $f ) {
		$existing = get_page_by_path( $f['slug'], OBJECT, 'swivo_forme' );
		if ( $existing ) {
			continue;
		}
		$post_id = wp_insert_post( array(
			'post_type'   => 'swivo_forme',
			'post_status' => 'publish',
			'post_title'  => $f['title'],
			'post_name'   => $f['slug'],
			'menu_order'  => $i,
		) );
		if ( $post_id && ! is_wp_error( $post_id ) ) {
			foreach ( $f['meta'] as $k => $v ) {
				update_post_meta( $post_id, $k, $v );
			}
		}
	}
}

function swivo_seed_faq() {
	$faqs = array(
		array( 'cat' => 'creation', 'q' => 'Quelle forme juridique choisir ?',         'a' => 'Notre assistant adapte ses questions et recommande la forme la plus pertinente : micro, EI, EURL, SASU, SARL, SAS, SA ou SCI.' ),
		array( 'cat' => 'creation', 'q' => 'Combien de temps prend la création ?',      'a' => 'Dossier constitué en 5-10 minutes. Transmission au Guichet unique INPI sous 24h ouvrées. Immatriculation officielle : 24h à 7 jours.' ),
		array( 'cat' => 'creation', 'q' => 'Quels documents préparer ?',                'a' => 'Pièce d’identité, justificatif de domicile (-3 mois), et selon la forme : projet de statuts, attestation de dépôt de capital.' ),
		array( 'cat' => 'tarifs',   'q' => 'Pourquoi 29,90 € pour la création ?',       'a' => 'Prix tout compris pour la préparation et la transmission. Frais légaux INPI affichés avant paiement.' ),
		array( 'cat' => 'tarifs',   'q' => 'Que comprend la formule gestion 9,90 €/mois ?', 'a' => 'Tableau de bord, calculateurs, facturation/devis, modèles juridiques, mise en pause/fermeture, support prioritaire.' ),
		array( 'cat' => 'gestion',  'q' => 'Puis-je mettre mon entreprise en pause ?',  'a' => 'Oui : mise en sommeil (sociétés) ou cessation temporaire (micro-entreprise) depuis votre espace.' ),
		array( 'cat' => 'legal',    'q' => 'Swivo est-il un service public ?',        'a' => 'Non. Swivo est un service privé indépendant qui transmet vos formalités au Guichet unique INPI, service officiel.' ),
		array( 'cat' => 'legal',    'q' => 'Mes données sont-elles protégées ?',        'a' => 'Données hébergées en France, conformité RGPD, chiffrement TLS. Accès, rectification, suppression possibles à tout moment.' ),
	);

	foreach ( $faqs as $i => $f ) {
		$slug = sanitize_title( $f['q'] );
		$existing = get_page_by_path( $slug, OBJECT, 'swivo_faq' );
		if ( $existing ) {
			continue;
		}
		$post_id = wp_insert_post( array(
			'post_type'    => 'swivo_faq',
			'post_status'  => 'publish',
			'post_title'   => $f['q'],
			'post_name'    => $slug,
			'post_content' => $f['a'],
			'menu_order'   => $i,
		) );
		if ( $post_id && ! is_wp_error( $post_id ) ) {
			update_post_meta( $post_id, 'category', $f['cat'] );
		}
	}
}
