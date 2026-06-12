/*
  Algo extra pour la création de micro-entreprise.
  Objectifs :
  - Score de complétude détaillé champ par champ
  - "Next best question" — suggère la prochaine question la plus utile
  - Eligibilité automatique : ACRE, versement libératoire, dispense SPI
  - Pré-fill multi-sources : NIR, OCR carte ID, Sirene (homonyme entreprise existante)
  - Détection conflits / erreurs en temps réel
*/
import type { Dossier, Personne } from './formalites/types';
import { nirToPersonne } from './nir';

/* ============================================================ */
/* SCORING COMPLÉTUDE DÉTAILLÉ                                  */
/* ============================================================ */

export type FieldStatus = { key: string; label: string; required: boolean; filled: boolean; value?: string };
export type CompletenessReport = {
  score: number;            // 0..100
  fieldsRequired: number;
  fieldsFilled: number;
  fields: FieldStatus[];
  missingCritical: string[]; // libellés des champs critiques manquants
};

const FIELDS_MICRO: Array<{ key: string; label: string; required: boolean; get: (d: Dossier) => any }> = [
  // Identité
  { key: 'civilite', label: 'Civilité', required: true, get: (d) => d.dirigeants[0]?.personne?.civilite },
  { key: 'prenom', label: 'Prénom', required: true, get: (d) => d.dirigeants[0]?.personne?.prenom },
  { key: 'nom', label: 'Nom', required: true, get: (d) => d.dirigeants[0]?.personne?.nom },
  { key: 'dateNaissance', label: 'Date de naissance', required: true, get: (d) => d.dirigeants[0]?.personne?.dateNaissance },
  { key: 'lieuNaissance', label: 'Lieu de naissance', required: true, get: (d) => d.dirigeants[0]?.personne?.lieuNaissance },
  { key: 'nationalite', label: 'Nationalité', required: true, get: (d) => d.dirigeants[0]?.personne?.nationalite },
  { key: 'email', label: 'Email', required: true, get: (d) => d.dirigeants[0]?.personne?.email },
  { key: 'telephone', label: 'Téléphone', required: false, get: (d) => d.dirigeants[0]?.personne?.telephone },
  { key: 'nir', label: 'Numéro de sécurité sociale', required: false, get: (d) => (d.options as any)?.nir },

  // Adresse perso
  { key: 'domicileVoie', label: 'Adresse personnelle', required: true, get: (d) => d.dirigeants[0]?.personne?.domicile?.voie },
  { key: 'domicileCp', label: 'Code postal', required: true, get: (d) => d.dirigeants[0]?.personne?.domicile?.codePostal },
  { key: 'domicileCommune', label: 'Commune', required: true, get: (d) => d.dirigeants[0]?.personne?.domicile?.commune },

  // Activité
  { key: 'activiteDescription', label: 'Description activité', required: true, get: (d) => d.activites[0]?.description },
  { key: 'activiteCategorie', label: 'Catégorie activité', required: true, get: (d) => d.activites[0]?.categorie },
  { key: 'activiteAPE', label: 'Code APE', required: true, get: (d) => d.activites[0]?.ape },

  // Siège
  { key: 'siegeMode', label: 'Mode domiciliation siège', required: true, get: (d) => d.etablissementPrincipal?.domiciliation },
  { key: 'siegeAdresse', label: 'Adresse siège', required: true, get: (d) => d.etablissementPrincipal?.adresse?.voie },
  { key: 'siegeCp', label: 'CP siège', required: true, get: (d) => d.etablissementPrincipal?.adresse?.codePostal },
  { key: 'siegeCommune', label: 'Commune siège', required: true, get: (d) => d.etablissementPrincipal?.adresse?.commune },
  { key: 'dateDebut', label: 'Date début activité', required: true, get: (d) => d.etablissementPrincipal?.dateDebutActivite },

  // Fiscal / social
  { key: 'tva', label: 'Régime TVA', required: true, get: (d) => d.regimeTva },
  { key: 'acre', label: 'ACRE demandée', required: false, get: (d) => d.options?.acre },
  { key: 'versementLib', label: 'Versement libératoire', required: false, get: (d) => d.options?.versementLiberatoireIR },

  // Mandat
  { key: 'mandat', label: 'Mandat signé', required: true, get: (d) => d.mandat?.accepte },
];

export function evaluerCompletude(d: Dossier): CompletenessReport {
  const fields: FieldStatus[] = FIELDS_MICRO.map((f) => {
    const v = f.get(d);
    const filled = v !== undefined && v !== null && v !== '' && v !== false;
    return { key: f.key, label: f.label, required: f.required, filled, value: filled ? String(v).slice(0, 60) : undefined };
  });
  const required = fields.filter((f) => f.required);
  const filledRequired = required.filter((f) => f.filled).length;
  const score = required.length ? Math.round((filledRequired / required.length) * 100) : 0;
  const missingCritical = required.filter((f) => !f.filled).map((f) => f.label);
  return {
    score,
    fieldsRequired: required.length,
    fieldsFilled: filledRequired,
    fields,
    missingCritical,
  };
}

/* ============================================================ */
/* NEXT BEST QUESTION                                            */
/* ============================================================ */

/**
 * Renvoie l'ID de la prochaine question la plus utile à poser, selon
 * l'ordre de criticité INPI + dépendances logiques.
 */
export function nextBestQuestionId(d: Dossier): string | null {
  if (!d.activites?.[0]?.categorie)    return 'p_activite_categorie';
  if (!(d.options as any)?._caEstime)   return 'p_ca';
  if (!d.activites?.[0]?.description)   return 'act_description';
  if (d.activites?.[0]?.reglementee && !d.activites?.[0]?.qualificationProfessionnelle) return 'act_reglementation';
  if (!d.etablissementPrincipal?.domiciliation) return 'siege_mode';
  if (!d.etablissementPrincipal?.adresse?.voie) return 'siege_adresse';
  if (!d.etablissementPrincipal?.dateDebutActivite) return 'siege_date_debut';
  if (!d.dirigeants?.[0]?.personne?.prenom) return 'gov_dirigeants';
  if (!d.regimeTva) return 'fiscal_tva';
  if (d.options?.acre === undefined) return 'fiscal_acre';
  if (d.options?.versementLiberatoireIR === undefined) return 'fiscal_versement_liberatoire';
  if (!d.conjoint?.statut) return 'fiscal_conjoint';
  if (!d.mandat?.accepte) return 'mandat_accept';
  return 'final_recap';
}

/* ============================================================ */
/* ELIGIBILITÉ AUTO                                              */
/* ============================================================ */

export type EligibilityHints = {
  acre: { eligible: boolean | 'unknown'; raisons: string[]; gainEstime?: number };
  versementLiberatoire: { eligible: boolean | 'unknown'; raisons: string[]; rfrPlafondRequis: number };
  franchiseTva: { applicable: boolean; raison: string };
  spi: { obligatoire: boolean; raison: string };
};

const PLAFOND_RFR_VL_2026 = 27478; // par part fiscale, base 2026

export function eligibilites(d: Dossier, extras?: { rfr?: number; pole_emploi?: boolean; rsa?: boolean; age?: number; quartierPrioritaire?: boolean }): EligibilityHints {
  const r: EligibilityHints = {
    acre: { eligible: 'unknown', raisons: [] },
    versementLiberatoire: { eligible: 'unknown', raisons: [], rfrPlafondRequis: PLAFOND_RFR_VL_2026 },
    franchiseTva: { applicable: true, raison: 'Sous les seuils TVA par défaut en micro-entreprise.' },
    spi: { obligatoire: false, raison: 'Stage SPI facultatif depuis la loi PACTE (mai 2019).' },
  };

  // ACRE
  if (extras) {
    const raisons: string[] = [];
    let elig = false;
    if (extras.pole_emploi) { elig = true; raisons.push('Demandeur d’emploi indemnisé / inscrit Pôle Emploi'); }
    if (extras.rsa)         { elig = true; raisons.push('Bénéficiaire RSA / ASS / ATA'); }
    if (extras.age && extras.age < 26) { elig = true; raisons.push('Moins de 26 ans'); }
    if (extras.quartierPrioritaire) { elig = true; raisons.push('Création en quartier prioritaire (QPV)'); }
    r.acre.eligible = elig;
    r.acre.raisons = raisons;
    // Estimation gain : 50 % cotisations sur CA prévisionnel année 1
    const caEstime = (d.options as any)?._caEstime ?? 30000;
    r.acre.gainEstime = Math.round(caEstime * 0.21 * 0.5); // ~50% URSSAF moyenne service
  }

  // Versement libératoire — RFR du foyer doit être < plafond
  if (extras?.rfr !== undefined) {
    r.versementLiberatoire.eligible = extras.rfr < PLAFOND_RFR_VL_2026;
    r.versementLiberatoire.raisons.push(
      r.versementLiberatoire.eligible
        ? `RFR ${extras.rfr} € < plafond ${PLAFOND_RFR_VL_2026} €`
        : `RFR ${extras.rfr} € ≥ plafond ${PLAFOND_RFR_VL_2026} €`,
    );
  }

  // Catégorie artisanale → SPI facultatif (loi PACTE)
  if (d.activites?.[0]?.categorie === 'artisanale') {
    r.spi = { obligatoire: false, raison: 'Artisan — stage SPI facultatif (loi PACTE 22/05/2019). Recommandé si pas d’expérience.' };
  }

  return r;
}

/* ============================================================ */
/* PRÉ-FILL ENGINE                                               */
/* ============================================================ */

export type PrefillSource = {
  source: 'nir' | 'ocr_id' | 'sirene' | 'france_connect' | 'google';
  data: any;
};

/** Fusionne les sources externes dans le dossier en n'écrasant que les champs vides. */
export function appliquerPrefill(d: Dossier, sources: PrefillSource[]): Dossier {
  let updated = { ...d };
  for (const s of sources) {
    if (s.source === 'nir' && typeof s.data === 'string') {
      const p = nirToPersonne(s.data);
      if (p) updated = mergePersonne(updated, p, { nir: s.data });
    }
    if (s.source === 'ocr_id' && typeof s.data === 'object' && s.data) {
      updated = mergePersonne(updated, {
        civilite: s.data.civilite,
        prenom: s.data.prenom,
        nom: s.data.nom,
        dateNaissance: s.data.dateNaissance,
        nationalite: s.data.nationalite,
        lieuNaissance: s.data.lieuNaissance,
      });
    }
    if ((s.source === 'france_connect' || s.source === 'google') && s.data) {
      updated = mergePersonne(updated, {
        prenom: s.data.given_name ?? s.data.prenom,
        nom: s.data.family_name ?? s.data.nom,
        email: s.data.email,
        dateNaissance: s.data.birthdate,
        civilite: s.data.gender === 'male' ? 'M' : s.data.gender === 'female' ? 'Mme' : undefined,
      });
    }
  }
  return updated;
}

function mergePersonne(d: Dossier, patch: Partial<Personne> & Record<string, any>, extras?: { nir?: string }): Dossier {
  const next = { ...d };
  if (!next.dirigeants?.length) next.dirigeants = [{ type: 'personne_physique', fonction: 'gerant', personne: {} } as any];
  const dir = { ...next.dirigeants[0]! };
  const p = { ...(dir.personne ?? {}) };
  // n'écrase pas
  for (const k of Object.keys(patch)) {
    if ((p as any)[k] === undefined && (patch as any)[k] !== undefined) (p as any)[k] = (patch as any)[k];
  }
  dir.personne = p;
  next.dirigeants = [dir, ...next.dirigeants.slice(1)];
  if (extras?.nir) next.options = { ...(next.options ?? {}), nir: extras.nir } as any;
  return next;
}

/* ============================================================ */
/* DOCUMENTS — liste auto pour micro                             */
/* ============================================================ */

export type DocumentSlot = {
  key: string;
  titre: string;
  description: string;
  obligatoire: boolean;
  formatAccepte: string;
  conditions?: (d: Dossier) => boolean;
};

export const DOCUMENTS_SLOTS_MICRO: DocumentSlot[] = [
  { key: 'cni_recto',          titre: 'Pièce d’identité (recto)',     description: 'CNI ou passeport en cours de validité, lisible couleur.', obligatoire: true,  formatAccepte: 'image/*,application/pdf' },
  { key: 'cni_verso',          titre: 'Pièce d’identité (verso)',     description: 'Verso CNI (avec MRZ) — optionnel si passeport.',        obligatoire: false, formatAccepte: 'image/*,application/pdf' },
  { key: 'justif_domicile',    titre: 'Justificatif de domicile',     description: 'Facture EDF/GDF/internet ou quittance de loyer < 3 mois.', obligatoire: true,  formatAccepte: 'application/pdf,image/*' },
  { key: 'non_condamnation',   titre: 'Déclaration de non-condamnation', description: 'Modèle disponible dans /outils/modeles. À dater et signer.', obligatoire: true,  formatAccepte: 'application/pdf' },
  { key: 'attestation_dom_dir',titre: 'Attestation domiciliation chez le dirigeant', description: 'Si siège chez vous. Modèle dans /outils/modeles.', obligatoire: false, formatAccepte: 'application/pdf', conditions: (d) => d.etablissementPrincipal?.domiciliation === 'chez_dirigeant' },
  { key: 'bail_local',         titre: 'Bail commercial / professionnel', description: 'Si local loué pour le siège.',                   obligatoire: false, formatAccepte: 'application/pdf', conditions: (d) => d.etablissementPrincipal?.domiciliation === 'locataire_bail' || d.etablissementPrincipal?.domiciliation === 'bail_commercial' },
  { key: 'contrat_dom',        titre: 'Contrat de domiciliation',     description: 'Avec société agréée préfecture.',                    obligatoire: false, formatAccepte: 'application/pdf', conditions: (d) => d.etablissementPrincipal?.domiciliation === 'societe_domiciliation' },
  { key: 'qualif_pro',         titre: 'Qualification professionnelle', description: 'Diplôme / CAP / BEP / attestation expérience pour activité réglementée ou artisanale qualifiée.', obligatoire: false, formatAccepte: 'application/pdf,image/*', conditions: (d) => !!d.activites?.[0]?.reglementee || d.activites?.[0]?.categorie === 'artisanale' },
  { key: 'rib_perso',          titre: 'RIB compte bancaire',          description: 'Pour les prélèvements URSSAF (compte dédié si CA > 10 000 €/an pendant 2 ans).', obligatoire: false, formatAccepte: 'application/pdf,image/*' },
  { key: 'acre',               titre: 'Formulaire ACRE',              description: 'Si demande ACRE. À transmettre URSSAF sous 45 jours.', obligatoire: false, formatAccepte: 'application/pdf', conditions: (d) => d.options?.acre === true },
];

export function documentsApplicables(d: Dossier): DocumentSlot[] {
  return DOCUMENTS_SLOTS_MICRO.filter((s) => !s.conditions || s.conditions(d));
}
