/*
  Comprehensive INPI / Guichet unique dossier shape.
  Mirrors fields from "Dictionnaire_de_donnees_INPI" + "Dictionnaire_de_donnees_mandataire".
  Designed to cover 99% of company-creation cases: micro, EI, EURL, SARL, SASU, SAS, SA,
  SCI, SNC, SCS, SCA, SELARL, SELAS, SCM, GIE, association loi 1901 (entreprise économique).
*/

export type FormeCode = 'micro';

export type CategorieActivite =
  | 'commerciale'
  | 'artisanale'
  | 'liberale_reglementee'
  | 'liberale_non_reglementee'
  | 'agricole'
  | 'mixte';

export type RegimeFiscal = 'ir' | 'is' | 'micro_bic' | 'micro_bnc' | 'micro_ba';
export type RegimeTva = 'franchise' | 'reel_simplifie' | 'reel_normal' | 'mini_reel';
export type RegimeSocialDirigeant = 'tns' | 'assimile_salarie' | 'salarie' | 'non_concerne';

export type Civilite = 'M' | 'Mme';
export type SituationMatrimoniale =
  | 'celibataire'
  | 'marie_communaute'
  | 'marie_separation'
  | 'marie_participation'
  | 'pacs'
  | 'divorce'
  | 'veuf';

export type Adresse = {
  voie?: string;            // "12 rue de la République"
  complement?: string;      // bâtiment, étage
  codePostal?: string;      // 5 chiffres
  commune?: string;
  pays?: string;            // ISO-3 default "FRA"
};

export type Personne = {
  civilite?: Civilite;
  prenom?: string;
  nom?: string;
  nomUsage?: string;
  dateNaissance?: string;   // ISO YYYY-MM-DD
  lieuNaissance?: string;
  paysNaissance?: string;
  nationalite?: string;     // ISO-3
  domicile?: Adresse;
  email?: string;
  telephone?: string;
  situationMatrimoniale?: SituationMatrimoniale;
  conjointCollaborateur?: boolean;
  pacs?: { dateConclusion?: string; lieu?: string };
};

export type Associe = {
  type: 'personne_physique' | 'personne_morale';
  personne?: Personne;
  morale?: {
    denomination?: string;
    formeJuridique?: string;
    siren?: string;
    siege?: Adresse;
    representant?: Personne;
  };
  apport: {
    numeraire?: number;       // € libéré + non libéré
    numeraireLibere?: number; // immédiatement libéré
    nature?: { description: string; valeur: number }[];
    industrie?: { description: string }[];
  };
  partsSociales?: number;
  partsBeneficeVote?: { benefice?: number; vote?: number }; // % si différents
};

export type Beneficiaire = {
  // Bénéficiaire effectif au sens R561-1 CMF
  personne: Personne;
  qualite: 'detention_capital' | 'detention_droits_vote' | 'controle_autre' | 'dirigeant_defaut';
  pctCapital?: number;
  pctVote?: number;
  modeControle?: string;
};

export type Dirigeant = {
  type: 'personne_physique' | 'personne_morale';
  fonction:
    | 'president'
    | 'directeur_general'
    | 'directeur_general_delegue'
    | 'gerant'
    | 'gerant_majoritaire'
    | 'gerant_minoritaire'
    | 'cogerant'
    | 'membre_directoire'
    | 'membre_conseil_surveillance'
    | 'commissaire_aux_comptes'
    | 'autre';
  personne?: Personne;
  morale?: {
    denomination?: string;
    siren?: string;
    representant?: Personne;
  };
  dateNomination?: string;
  dureeMandat?: 'duree_societe' | 'duree_determinee' | 'duree_indeterminee';
  pouvoirsLimites?: string;
};

export type EtablissementPrincipal = {
  adresse: Adresse;
  domiciliation:
    | 'proprietaire'
    | 'locataire_bail'
    | 'bail_commercial'
    | 'societe_domiciliation'
    | 'pepiniere'
    | 'chez_dirigeant'
    | 'sous_location';
  societeDomiciliation?: { denomination: string; siren: string; agrementPrefecture?: string };
  nomCommercial?: string;
  enseigne?: string;
  origineFonds?: 'creation' | 'achat' | 'apport' | 'location_gerance' | 'reprise';
  dateDebutActivite?: string;
  activitePermanenteSaisonniere?: 'permanente' | 'saisonniere';
  effectifSalarie?: number;
  ape?: string;       // code NAF 4 chiffres + 1 lettre
  activiteDescriptionRNE?: string; // libellé long
};

export type Etablissement = EtablissementPrincipal & { secondaire?: boolean };

export type Activite = {
  description: string;
  categorie: CategorieActivite;
  reglementee?: { type: string; piece: string };
  ape?: string;
  qualificationProfessionnelle?: { diplome?: string; experienceAnnees?: number };
  artisanat?: { stagePrealable?: 'fait' | 'dispense' | 'a_faire'; chefAtelier?: boolean };
};

export type Capital = {
  montantTotal?: number;
  montantLibere?: number;
  type?: 'fixe' | 'variable';
  variable?: { plancher: number; plafond: number };
  partsValeur?: number; // valeur nominale par part
  nombreParts?: number;
};

export type Options = {
  optionIs?: boolean;
  optionTvaReel?: RegimeTva;
  versementLiberatoireIR?: boolean;       // micro
  acre?: boolean;                          // exonération début d'activité
  insaisissabiliteResidencePrincipale?: 'auto' | 'declaration_renoncee';
  ej_clause_inalienabilite?: boolean;     // SAS clauses spécifiques
  ej_clause_agrement?: boolean;
  ej_clause_preemption?: boolean;
};

export type SignatureElectronique = {
  type: 'simple' | 'avancee' | 'qualifiee';
  fournisseur?: 'docusign' | 'yousign' | 'universign' | 'autre';
  dateSignature?: string;
};

export type MandatSignature = {
  accepte: boolean;
  dateAcceptation?: string;
  ip?: string;
  versionTexte: string;        // versionning du contrat de mandat
  prestataire: string;         // "Swivo SAS"
  scope: string[];             // ["depot_dossier_inpi","signature_actes","transmission_journal"]
};

export type Dossier = {
  // Identifiant interne
  id?: string;
  version: number;

  // Choix forme + activité
  forme?: FormeCode;
  denomination?: string;
  sigle?: string;
  objetSocial?: string;
  duree?: number;              // années, max 99
  dateDebutExercice?: string;  // jour-mois fixe
  dateClotureExercice?: string;
  premierExerciceClotureLe?: string;

  capital?: Capital;
  activites: Activite[];
  etablissementPrincipal?: EtablissementPrincipal;
  etablissementsSecondaires?: Etablissement[];

  associes: Associe[];
  dirigeants: Dirigeant[];
  beneficiairesEffectifs: Beneficiaire[];

  // Options fiscales/sociales
  regimeFiscal?: RegimeFiscal;
  regimeTva?: RegimeTva;
  regimeSocialDirigeantPrincipal?: RegimeSocialDirigeant;
  options: Options;

  // Nature juridique de l'activité (micro/EI)
  natureActivite?: 'commerciale' | 'artisanale' | 'liberale' | 'agricole';

  // Pour micro + EI
  ei?: {
    insaisissabiliteResidencePrincipale?: boolean;
    declarationInsaisissabiliteAutre?: string;
    eirl_anterieure?: boolean; // historique
  };

  // Conjoint collaborateur (TNS uniquement)
  conjoint?: {
    statut?: 'collaborateur' | 'salarie' | 'associe' | 'aucun';
    personne?: Personne;
  };

  // Capital — dépôt bancaire
  depotCapital?: {
    etablissement?: 'banque' | 'notaire' | 'caisse_depots';
    nom?: string;
    iban?: string;
    bic?: string;
    montantDepose?: number;
    dateDepot?: string;
    attestationFournie?: boolean;
  };

  // Annonce légale
  annonceLegale?: {
    journal?: string;
    departement?: string;
    datePublication?: string;
    refAttestation?: string;
  };

  // Mandat + signature
  mandat?: MandatSignature;
  signature?: SignatureElectronique;

  // Suivi
  statut: 'brouillon' | 'pret_a_signer' | 'signe' | 'transmis_inpi' | 'immatricule' | 'rejete';
  motifsRejetINPI?: string[];
  scoreCompletude: number; // 0..100
};

export const EMPTY_DOSSIER: Dossier = {
  version: 1,
  activites: [],
  associes: [],
  dirigeants: [],
  beneficiairesEffectifs: [],
  options: {},
  statut: 'brouillon',
  scoreCompletude: 0,
};
