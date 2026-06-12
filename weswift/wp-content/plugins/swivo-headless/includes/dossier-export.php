<?php
/**
 * Export d'un dossier Swivo dans un format consommable par l'extension Chrome
 * « Swivo Autofill » (cf. /chrome-extension/swivo-autofill).
 *
 * Trois représentations dans le même JSON :
 *   - meta     : id Swivo, forme, statut, date export
 *   - inpi     : schéma INPI Guichet unique (cf. swivo_map_to_inpi())
 *   - autofill : map plate { keyCanonique : valeurString }, indépendante du DOM
 *
 * L'extension utilise `autofill.<clé>` + un dictionnaire de sélecteurs côté ext
 * (matchers `name`, `id`, `aria-label`, `placeholder`, texte de `<label>`) pour
 * remplir les champs sur procedure.inpi.fr / formalites.entreprises.gouv.fr.
 *
 * Endpoint admin (sécurisé, nonce + manage_options) :
 *   admin-post.php?action=swivo_export_dossier_json&dossier=<ID>
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_post_swivo_export_dossier_json', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Refusé.' );
	}
	check_admin_referer( 'swivo_export_dossier_json' );
	$id = isset( $_GET['dossier'] ) ? (int) $_GET['dossier'] : 0;
	if ( ! $id ) {
		wp_die( 'Dossier manquant.' );
	}
	$post = get_post( $id );
	if ( ! $post || 'swivo_dossier' !== $post->post_type ) {
		wp_die( 'Dossier introuvable.' );
	}

	$bundle = swivo_dossier_export_bundle( $id );
	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="swivo-dossier-' . $id . '.json"' );
	echo wp_json_encode( $bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	exit;
} );

/**
 * Construit le bundle export. Utilisé par l'endpoint admin et la copie clipboard.
 */
function swivo_dossier_export_bundle( $dossier_id ) {
	$dossier_id = (int) $dossier_id;
	$payload    = get_post_meta( $dossier_id, 'payload', true );
	if ( ! is_array( $payload ) ) $payload = array();

	return array(
		'meta' => array(
			'swivoId'   => $dossier_id,
			'exportedAt'=> current_time( 'c' ),
			'version'   => 1,
			'source'    => 'swivo',
			'forme'     => (string) get_post_meta( $dossier_id, 'forme', true ),
			'status'    => (string) get_post_meta( $dossier_id, 'status', true ),
			'email'     => (string) get_post_meta( $dossier_id, 'email', true ),
		),
		'inpi'     => function_exists( 'swivo_map_to_inpi' ) ? swivo_map_to_inpi( $payload ) : null,
		'autofill' => swivo_dossier_flat_autofill( $payload ),
		'raw'      => $payload,
	);
}

/**
 * Aplatit le dossier Swivo en map { clé : { value, variants } } couvrant TOUTES
 * les pages du parcours micro-entreprise du Guichet unique :
 *   1. Identité du déclarant
 *   2. Adresse personnelle + état civil
 *   3. Activité principale + nature
 *   4. Adresse d'exercice / établissement
 *   5. Régime fiscal (micro BIC / BNC, VL)
 *   6. Régime social TNS + ACRE
 *   7. Insaisissabilité résidence principale
 *   8. Conjoint collaborateur le cas échéant
 *   9. Contact (mail, tel)
 *
 * Pour chaque clé, on émet la valeur ET plusieurs variantes formatées
 * (date FR/ISO, codes/libellés, oui/non/true/1) pour que l'extension puisse
 * choisir celle qui satisfait le champ cible (`<input>` libre, `<select>`,
 * `<radio>`, combobox React).
 */
function swivo_dossier_flat_autofill( array $d ) {
	$identite = $d['identite'] ?? array();
	$siege    = $d['siege']    ?? array();
	$dir0     = $d['dirigeants'][0]['personne'] ?? array();
	$options  = $d['options']  ?? array();
	$out      = array();

	$add = function ( $k, $v, $variants = null ) use ( &$out ) {
		if ( $v === null ) return;
		if ( is_string( $v ) && trim( $v ) === '' ) return;
		if ( is_array( $v ) ) {
			$out[ $k ] = $v;
			return;
		}
		$value = is_string( $v ) ? trim( $v ) : $v;
		if ( $variants === null ) {
			$out[ $k ] = $value;
		} else {
			$out[ $k ] = array(
				'value'    => $value,
				'variants' => array_values( array_unique( array_filter( $variants, fn( $x ) => $x !== null && $x !== '' ) ) ),
			);
		}
	};

	/* ===== Helpers ===== */
	$boolStr = function ( $b ) {
		return $b ? 'oui' : 'non';
	};
	$dateVariants = function ( $iso ) {
		if ( ! $iso ) return array();
		$ts = strtotime( $iso );
		if ( ! $ts ) return array( $iso );
		return array(
			$iso,                            // YYYY-MM-DD
			date( 'd/m/Y', $ts ),            // DD/MM/YYYY
			date( 'd-m-Y', $ts ),            // DD-MM-YYYY
			date( 'd.m.Y', $ts ),            // DD.MM.YYYY
			date( 'Y-m-d', $ts ),
		);
	};
	$civiliteVariants = function ( $c ) {
		if ( ! $c ) return array();
		$c = strtolower( $c );
		if ( $c === 'm' || $c === 'mr' || $c === 'monsieur' ) {
			return array( 'M.', 'M', 'Mr', 'MONSIEUR', 'Monsieur', '1' );
		}
		return array( 'Mme', 'MME', 'Madame', 'MADAME', '2' );
	};
	$sexeVariants = function ( $s ) {
		if ( ! $s ) return array();
		$s = strtoupper( $s );
		return $s === 'M'
			? array( 'M', 'MASCULIN', 'Masculin', '1', 'male' )
			: array( 'F', 'FEMININ', 'Féminin', '2', 'female' );
	};
	$paysVariants = function ( $code ) {
		$map = array(
			'FRA' => array( 'FRA', 'FR', 'France', 'FRANCE', '99100', '250' ),
			'BEL' => array( 'BEL', 'BE', 'Belgique', '99131' ),
			'CHE' => array( 'CHE', 'CH', 'Suisse', '99140' ),
		);
		return $map[ strtoupper( (string) $code ) ] ?? array( $code );
	};
	$ouiNon = function ( $b ) {
		return array( $b ? 'oui' : 'non', $b ? 'OUI' : 'NON', $b ? 'true' : 'false', $b ? '1' : '0', $b ? 'O' : 'N' );
	};

	/* ============================================================ */
	/* META FORME                                                    */
	/* ============================================================ */
	$forme = strtolower( (string) ( $d['forme'] ?? 'micro' ) );
	$add( 'forme', $forme );
	$add( 'formeJuridiqueCode', '1000', array( '1000', 'EI', 'ME', 'MICRO' ) );
	$add( 'formeJuridiqueLib', 'Entrepreneur individuel', array( 'Entrepreneur individuel', 'Micro-entrepreneur', 'EI', 'Entrepreneur Individuel' ) );
	$add( 'typeFormalite', 'creation', array( 'creation', 'CREATION', 'Création', 'P0' ) );
	$add( 'natureFormalite', 'PRINCIPALE' );

	/* ============================================================ */
	/* ÉTAT CIVIL                                                    */
	/* ============================================================ */
	$civ = $identite['civilite'] ?? $dir0['civilite'] ?? null;
	$add( 'civilite', $civ, $civiliteVariants( $civ ) );

	$sex = $identite['sexe'] ?? $dir0['sexe'] ?? null;
	$add( 'sexe', $sex, $sexeVariants( $sex ) );

	$prenom = (string) ( $identite['prenom']    ?? $dir0['prenom']    ?? '' );
	$nom    = (string) ( $identite['nom']       ?? $dir0['nom']       ?? '' );
	$add( 'prenom', $prenom );
	$add( 'prenom1', $prenom );
	$prenomsTous = (array) ( $identite['prenomsTous'] ?? $dir0['prenomsTous'] ?? array() );
	$add( 'prenomsTous', implode( ' ', $prenomsTous ) );
	if ( isset( $prenomsTous[1] ) ) $add( 'prenom2', $prenomsTous[1] );
	if ( isset( $prenomsTous[2] ) ) $add( 'prenom3', $prenomsTous[2] );
	$add( 'nom', $nom );
	$add( 'nomNaissance', $nom );
	$add( 'nomUsage', (string) ( $identite['nomUsage'] ?? $dir0['nomUsage'] ?? '' ) );
	$add( 'pseudonyme', (string) ( $identite['pseudonyme'] ?? $dir0['pseudonyme'] ?? '' ) );

	$dateN = (string) ( $identite['dateNaissance'] ?? $dir0['dateNaissance'] ?? '' );
	if ( $dateN ) {
		$variants = $dateVariants( $dateN );
		$add( 'dateNaissance', $dateN, $variants );
		$ts = strtotime( $dateN );
		if ( $ts ) {
			$add( 'jourNaissance', date( 'd', $ts ) );
			$add( 'moisNaissance', date( 'm', $ts ) );
			$add( 'anneeNaissance', date( 'Y', $ts ) );
		}
	}

	$lieuN = (string) ( $identite['lieuNaissance'] ?? $dir0['lieuNaissance'] ?? '' );
	$add( 'lieuNaissance', $lieuN );
	$add( 'communeNaissance', $lieuN );
	$add( 'villeNaissance', $lieuN );
	$add( 'codeInseeNaissance', (string) ( $identite['codeInseeNaissance'] ?? $dir0['codeInseeNaissance'] ?? '' ) );
	$add( 'departementNaissance', (string) ( $identite['departementNaissance'] ?? $dir0['departementNaissance'] ?? '' ) );
	$paysN = (string) ( $identite['paysNaissance'] ?? $dir0['paysNaissance'] ?? 'FRA' );
	$add( 'paysNaissance', $paysN, $paysVariants( $paysN ) );

	$nat = (string) ( $identite['nationalite'] ?? $dir0['nationalite'] ?? 'FRA' );
	$add( 'nationalite', $nat, $paysVariants( $nat ) );

	/* ============================================================ */
	/* DOMICILE PERSONNEL                                            */
	/* ============================================================ */
	$dom = $identite['domicile'] ?? $dir0['domicile'] ?? array();
	$add( 'domicileNumeroVoie', (string) ( $dom['numeroVoie'] ?? '' ) );
	$add( 'domicileTypeVoie',   (string) ( $dom['typeVoie']   ?? '' ) );
	$add( 'domicileNomVoie',    (string) ( $dom['nomVoie']    ?? '' ) );
	// SPA stores "voie" = full "n° + rue" string (from BAN autocomplete).
	$domAdresse = (string) ( $dom['voie'] ?? $dom['ligne1'] ?? $dom['adresse'] ?? trim( ( $dom['numeroVoie'] ?? '' ) . ' ' . ( $dom['typeVoie'] ?? '' ) . ' ' . ( $dom['nomVoie'] ?? '' ) ) );
	$add( 'domicileAdresse',    $domAdresse );
	$add( 'domicileVoie',       $domAdresse ); // alias
	$add( 'domicileComplement', (string) ( $dom['complement'] ?? $dom['ligne2'] ?? '' ) );
	$add( 'domicileCodePostal', (string) ( $dom['codePostal'] ?? '' ) );
	$add( 'domicileCommune',    (string) ( $dom['commune']    ?? $dom['ville'] ?? '' ) );
	$add( 'domicileCodeInsee',  (string) ( $dom['codeInsee']  ?? '' ) );
	$domPays = (string) ( $dom['pays'] ?? 'FRA' );
	$add( 'domicilePays',       $domPays, $paysVariants( $domPays ) );

	/* ============================================================ */
	/* CONTACT                                                       */
	/* ============================================================ */
	$add( 'email',     (string) ( $identite['email']     ?? $dir0['email']     ?? '' ) );
	$add( 'emailPro',  (string) ( $identite['emailPro']  ?? $dir0['emailPro']  ?? $identite['email'] ?? '' ) );
	$add( 'telephone', (string) ( $identite['telephone'] ?? $dir0['telephone'] ?? '' ) );
	$add( 'mobile',    (string) ( $identite['mobile']    ?? $dir0['mobile']    ?? '' ) );

	/* ============================================================ */
	/* ACTIVITÉ                                                      */
	/* ============================================================ */
	$activite       = $d['activites'][0] ?? array();
	$libelleActivite = (string) ( $activite['libelle'] ?? $d['activite'] ?? '' );
	$add( 'activiteLibelle', $libelleActivite );
	$add( 'activite',        $libelleActivite );
	$add( 'descriptionActivite', $libelleActivite );
	$add( 'activitePrincipale',  'true', $ouiNon( true ) );

	$natureActivite = (string) ( $activite['nature'] ?? $d['natureActivite'] ?? '' );
	// service_bnc, service_bic, vente_bic, liberal_cipav, artisanale, commerciale
	$catMap = array(
		'service_bnc' => array( 'libérale', 'BNC', 'Libérale', 'liberale', 'PROFESSION_LIBERALE' ),
		'liberal_cipav' => array( 'libérale CIPAV', 'BNC', 'CIPAV' ),
		'service_bic' => array( 'prestation de services', 'BIC services', 'Service', 'PRESTATION_SERVICE' ),
		'vente_bic'   => array( 'vente de marchandises', 'BIC vente', 'Commerciale', 'COMMERCIALE', 'VENTE' ),
		'artisanale'  => array( 'artisanale', 'Artisanale', 'ARTISANALE' ),
	);
	if ( $natureActivite ) {
		$add( 'natureActivite', $natureActivite, $catMap[ $natureActivite ] ?? array( $natureActivite ) );
		$add( 'categorieActivite', $natureActivite, $catMap[ $natureActivite ] ?? array( $natureActivite ) );
	}
	$add( 'codeApe',   (string) ( $activite['codeApe']  ?? $d['codeApe']  ?? '' ) );
	$add( 'codeNaf',   (string) ( $activite['codeNaf']  ?? $d['codeNaf']  ?? '' ) );
	$add( 'qualiteArtisan', isset( $options['qualiteArtisan'] ) ? $boolStr( $options['qualiteArtisan'] ) : null, isset( $options['qualiteArtisan'] ) ? $ouiNon( (bool) $options['qualiteArtisan'] ) : null );
	$add( 'commercantSedentaire', (string) ( $options['commercantSedentaire'] ?? '' ) );
	$add( 'ambulant', isset( $options['ambulant'] ) ? $boolStr( $options['ambulant'] ) : null, isset( $options['ambulant'] ) ? $ouiNon( (bool) $options['ambulant'] ) : null );

	$dateDebut = (string) ( $d['dateDebutExercice'] ?? '' );
	if ( $dateDebut ) {
		$add( 'dateDebutActivite', $dateDebut, $dateVariants( $dateDebut ) );
		$add( 'dateCreation',      $dateDebut, $dateVariants( $dateDebut ) );
		$add( 'dateImmatriculation', $dateDebut, $dateVariants( $dateDebut ) );
	}

	/* ============================================================ */
	/* ÉTABLISSEMENT / SIÈGE                                         */
	/* ============================================================ */
	$add( 'denomination',       (string) ( $d['denomination'] ?? '' ) );
	$add( 'sigle',              (string) ( $d['sigle']        ?? '' ) );
	$add( 'enseigne',           (string) ( $d['enseigne']     ?? '' ) );
	$add( 'nomCommercial',      (string) ( $d['nomCommercial'] ?? $d['denomination'] ?? '' ) );
	$add( 'objetSocial',        (string) ( $d['objetSocial']  ?? '' ) );

	// Two payload shapes: legacy `siege` flat OR new `etablissementPrincipal.adresse`.
	$etabAdr = $d['etablissementPrincipal']['adresse'] ?? array();
	if ( ! $siege && $etabAdr ) $siege = $etabAdr;
	$add( 'siegeNumeroVoie',  (string) ( $siege['numeroVoie'] ?? '' ) );
	$add( 'siegeTypeVoie',    (string) ( $siege['typeVoie']   ?? '' ) );
	$add( 'siegeNomVoie',     (string) ( $siege['nomVoie']    ?? '' ) );
	$siegeAdr = (string) ( $siege['voie'] ?? $siege['ligne1'] ?? $siege['adresse'] ?? trim( ( $siege['numeroVoie'] ?? '' ) . ' ' . ( $siege['typeVoie'] ?? '' ) . ' ' . ( $siege['nomVoie'] ?? '' ) ) );
	$add( 'siegeAdresse',     $siegeAdr );
	$add( 'siegeVoie',        $siegeAdr );
	$add( 'siegeComplement',  (string) ( $siege['complement'] ?? $siege['ligne2']    ?? '' ) );
	$add( 'siegeCodePostal',  (string) ( $siege['codePostal'] ?? '' ) );
	$add( 'siegeCommune',     (string) ( $siege['commune']    ?? $siege['ville'] ?? '' ) );
	$add( 'siegeCodeInsee',   (string) ( $siege['codeInsee']  ?? '' ) );
	$siegePays = (string) ( $siege['pays'] ?? 'FRA' );
	$add( 'siegePays',        $siegePays, $paysVariants( $siegePays ) );

	$typeSiege = (string) ( $siege['type'] ?? '' );
	$add( 'siegeDomiciliation', $typeSiege, array_filter( array(
		$typeSiege,
		$typeSiege === 'domicile' ? 'Au domicile du déclarant' : null,
		$typeSiege === 'commercial' ? 'Local commercial' : null,
		$typeSiege === 'pepiniere' ? 'Pépinière d\'entreprises' : null,
		$typeSiege === 'coworking' ? 'Espace de coworking' : null,
		$typeSiege === 'domiciliation' ? 'Société de domiciliation' : null,
	) ) );
	$add( 'meneActiviteDomicile', $typeSiege === 'domicile' ? 'oui' : ( $typeSiege ? 'non' : null ), $ouiNon( $typeSiege === 'domicile' ) );
	$add( 'destinationCorrespondance', (string) ( $siege['destinationCorrespondance'] ?? '' ) );

	/* ============================================================ */
	/* RÉGIME FISCAL — micro                                         */
	/* ============================================================ */
	$add( 'regimeFiscal', 'micro', array( 'micro', 'MICRO', 'micro-entreprise', 'Micro-entreprise', 'BIC_MICRO', 'BNC_MICRO' ) );
	$add( 'regimeImposition', 'micro', array( 'micro-BIC', 'micro-BNC', 'Régime micro' ) );

	$vl = $options['versementLiberatoireIR'] ?? null;
	if ( $vl !== null ) {
		$add( 'versementLiberatoire', $boolStr( (bool) $vl ), $ouiNon( (bool) $vl ) );
		$add( 'optionVL', $boolStr( (bool) $vl ), $ouiNon( (bool) $vl ) );
		$add( 'versementLiberatoireIR', $boolStr( (bool) $vl ), $ouiNon( (bool) $vl ) );
	}

	$add( 'regimeTva', 'franchise_base', array( 'franchise', 'Franchise en base', 'FRANCHISE_BASE', 'TVA non applicable', '293B' ) );
	$add( 'optionTva', 'non', $ouiNon( false ) );

	/* ============================================================ */
	/* RÉGIME SOCIAL TNS                                             */
	/* ============================================================ */
	$regimeSocial = $natureActivite === 'liberal_cipav' ? 'cipav' : 'ssi';
	$add( 'regimeSocial', $regimeSocial, array(
		$regimeSocial,
		$regimeSocial === 'cipav' ? 'CIPAV' : 'SSI',
		$regimeSocial === 'cipav' ? 'Caisse interprofessionnelle' : 'Sécurité sociale des indépendants',
	) );
	$add( 'caisseRetraite', $regimeSocial === 'cipav' ? 'CIPAV' : 'SSI' );

	$acre = $options['acre'] ?? null;
	if ( $acre !== null ) {
		$add( 'acre', $boolStr( (bool) $acre ), $ouiNon( (bool) $acre ) );
		$add( 'exonerationDebutActivite', $boolStr( (bool) $acre ), $ouiNon( (bool) $acre ) );
	}

	/* ============================================================ */
	/* INSAISISSABILITÉ                                              */
	/* ============================================================ */
	$ins = (string) ( $options['insaisissabiliteResidencePrincipale'] ?? '' );
	$add( 'insaisissabilite', $ins, array(
		$ins,
		$ins === 'auto' ? 'Bénéficie automatiquement' : null,
		$ins === 'declaration_renoncee' ? 'Renonciation par déclaration' : null,
	) );
	$add( 'renonciationInsaisissabilite', $ins === 'declaration_renoncee' ? 'oui' : 'non', $ouiNon( $ins === 'declaration_renoncee' ) );

	/* ============================================================ */
	/* CONJOINT COLLABORATEUR                                        */
	/* ============================================================ */
	$conj = $identite['conjoint'] ?? $dir0['conjoint'] ?? array();
	$conjCollab = $identite['conjointCollaborateur'] ?? $dir0['conjointCollaborateur'] ?? null;
	if ( $conjCollab !== null ) {
		$add( 'conjointCollaborateur', $boolStr( (bool) $conjCollab ), $ouiNon( (bool) $conjCollab ) );
	}
	if ( $conj ) {
		$add( 'conjointCivilite',     (string) ( $conj['civilite']     ?? '' ), $civiliteVariants( $conj['civilite'] ?? '' ) );
		$add( 'conjointPrenom',       (string) ( $conj['prenom']       ?? '' ) );
		$add( 'conjointNom',          (string) ( $conj['nom']          ?? '' ) );
		$add( 'conjointDateNaissance',(string) ( $conj['dateNaissance']?? '' ), $dateVariants( $conj['dateNaissance'] ?? '' ) );
		$add( 'conjointLieuNaissance',(string) ( $conj['lieuNaissance']?? '' ) );
		$add( 'conjointNationalite',  (string) ( $conj['nationalite']  ?? '' ) );
	}

	/* ============================================================ */
	/* PIÈCE D'IDENTITÉ                                              */
	/* ============================================================ */
	$add( 'pieceIdentiteType',       (string) ( $options['pieceIdentiteType']    ?? 'CNI' ) );
	$add( 'pieceIdentiteNumero',     (string) ( $options['numeroPieceIdentite'] ?? '' ) );
	$dateExp = (string) ( $options['pieceIdentiteExpiration'] ?? '' );
	if ( $dateExp ) $add( 'pieceIdentiteExpiration', $dateExp, $dateVariants( $dateExp ) );
	$dateDel = (string) ( $options['pieceIdentiteDelivrance'] ?? '' );
	if ( $dateDel ) $add( 'pieceIdentiteDelivrance', $dateDel, $dateVariants( $dateDel ) );
	$add( 'pieceIdentiteAutorite',   (string) ( $options['pieceIdentiteAutorite'] ?? '' ) );

	$add( 'nir', (string) ( $options['nir'] ?? '' ) );

	/* ============================================================ */
	/* JANUS — déclaration sociale liée                              */
	/* ============================================================ */
	$add( 'situationMatrimoniale', (string) ( $identite['situationMatrimoniale'] ?? '' ) );

	/* ============================================================ */
	/* DIVERS                                                        */
	/* ============================================================ */
	$add( 'capitalMontant', '0', array( '0', '0,00', '0.00' ) ); // micro: pas de capital
	$add( 'capitalDevise',  'EUR' );

	// Allow user-supplied extra overrides stored as JSON in meta.
	$extra = get_post_meta( (int) ( $d['_pid'] ?? 0 ), 'swivo_autofill_extra', true );
	if ( is_array( $extra ) ) {
		foreach ( $extra as $k => $v ) {
			$out[ $k ] = $v;
		}
	}

	/**
	 * Permet d'étendre / surcharger l'autofill sans toucher le code.
	 * Ajoutez vos propres mappings via ce filtre (ex. plugin perso, mu-plugin).
	 */
	return apply_filters( 'swivo_dossier_autofill', $out, $d );
}

/**
 * Bouton supplémentaire dans la metabox dossier : "Copier JSON" + "Télécharger".
 */
add_filter( 'swivo_dossier_meta_box_extra', function ( $extra, $post_id ) {
	$download_url = wp_nonce_url(
		admin_url( 'admin-post.php?action=swivo_export_dossier_json&dossier=' . (int) $post_id ),
		'swivo_export_dossier_json'
	);
	$bundle = swivo_dossier_export_bundle( $post_id );
	// Encode pour embed dans <script type="application/json"> — il faut
	// neutraliser uniquement la séquence "</" qui terminerait prématurément
	// l'élément. Aucun autre escaping nécessaire (le navigateur lit .textContent
	// brut), ce qui évite les corruptions causées par esc_js() sur les
	// caractères Unicode et les guillemets.
	$json     = wp_json_encode( $bundle, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
	$json_safe = str_replace( '</', '<\/', $json );
	$btn_id   = 'swivo-copy-' . (int) $post_id;
	$json_id  = 'swivo-json-' . (int) $post_id;

	ob_start();
	?>
	<hr/>
	<p style="margin-top:8px"><strong>Export pour extension Chrome</strong></p>
	<p style="font-size:11px;color:#475569;margin:0 0 8px">Pour pré-remplir les formulaires du Guichet unique via l'extension <em>Swivo Autofill</em>.</p>
	<p>
		<a href="<?php echo esc_url( $download_url ); ?>" class="button">⬇ Télécharger JSON</a>
		<button type="button" class="button button-primary" id="<?php echo esc_attr( $btn_id ); ?>">📋 Copier dans le presse-papier</button>
	</p>
	<script type="application/json" id="<?php echo esc_attr( $json_id ); ?>"><?php echo $json_safe; ?></script>
	<script>
	(function(){
		var btn  = document.getElementById('<?php echo esc_js( $btn_id ); ?>');
		var node = document.getElementById('<?php echo esc_js( $json_id ); ?>');
		if (!btn || !node) return;
		// .textContent renvoie la chaîne JSON brute, sans ré-encodage HTML.
		var json = node.textContent;
		try {
			// Re-parse + re-stringify pour garantir un format valide
			// (cas où la sérialisation PHP aurait inséré des sauts indésirables).
			json = JSON.stringify(JSON.parse(json), null, 2);
		} catch (e) { /* on copie tel quel si le parse échoue */ }

		function done(msg) {
			var prev = btn.textContent; btn.textContent = msg;
			setTimeout(function(){ btn.textContent = prev; }, 1500);
		}
		btn.addEventListener('click', function(){
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(json).then(function(){ done('✅ Copié !'); })
					.catch(function(){ fallback(); });
			} else {
				fallback();
			}
		});
		function fallback() {
			var ta = document.createElement('textarea');
			ta.value = json;
			ta.style.position = 'fixed';
			ta.style.left = '-9999px';
			document.body.appendChild(ta); ta.select();
			try { document.execCommand('copy'); done('✅ Copié !'); }
			catch(e) { done('⚠ Erreur'); }
			document.body.removeChild(ta);
		}
	})();
	</script>
	<?php
	return $extra . ob_get_clean();
}, 10, 2 );
