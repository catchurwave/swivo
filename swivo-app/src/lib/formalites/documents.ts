/*
  Résolveur de pièces justificatives — INPI Guichet unique.
  Sources : Contrat d'interface juin 2025, Dictionnaire INPI, fiches CFE-CCI/CMA.
  Retourne la liste exhaustive des documents à fournir selon le dossier.
*/
import type { Dossier } from './types';
import { FORMES } from './formes';

export type DocumentRequis = {
  code: string;
  titre: string;
  description: string;
  format: 'pdf' | 'image' | 'pdf_signe' | 'attestation_inpi' | 'cerfa';
  obligatoire: boolean;
  cible:
    | 'societe'
    | 'dirigeant'
    | 'associe'
    | 'beneficiaire_effectif'
    | 'conjoint'
    | 'siege'
    | 'activite'
    | 'mandat';
  contexte: string[]; // explications conditionnelles
  modele?: string;    // url interne modèle PDF
};

function base(c: Omit<DocumentRequis, 'contexte'> & { contexte?: string[] }): DocumentRequis {
  return { contexte: [], ...c } as DocumentRequis;
}

export function documentsRequis(d: Dossier): DocumentRequis[] {
  const docs: DocumentRequis[] = [];
  const rule = d.forme ? FORMES[d.forme] : null;
  if (!rule) return docs;

  /* ====== SOCLE COMMUN ====== */
  // Mandat Swivo
  docs.push(base({
    code: 'mandat_swivo',
    titre: 'Mandat de dépôt INPI (Swivo)',
    description: 'Mandat signé électroniquement nous autorisant à déposer le dossier en votre nom auprès du Guichet unique INPI.',
    format: 'pdf_signe', obligatoire: true, cible: 'mandat',
    contexte: ['Obligatoire pour toute formalité de tiers déclarant', 'Conforme art. R123-30 Ccom'],
  }));

  // Justificatif siège
  const dom = d.etablissementPrincipal?.domiciliation;
  if (dom === 'proprietaire') {
    docs.push(base({
      code: 'siege_proprietaire',
      titre: 'Justificatif de propriété du local du siège',
      description: 'Acte de propriété OU dernière taxe foncière (-12 mois).',
      format: 'pdf', obligatoire: true, cible: 'siege',
    }));
  } else if (dom === 'locataire_bail' || dom === 'bail_commercial') {
    docs.push(base({
      code: 'siege_bail',
      titre: 'Bail commercial / professionnel / habitation autorisant l’activité',
      description: 'Bail comportant explicitement l’autorisation d’exercer l’activité au siège.',
      format: 'pdf', obligatoire: true, cible: 'siege',
    }));
  } else if (dom === 'societe_domiciliation') {
    docs.push(base({
      code: 'siege_domiciliation',
      titre: 'Contrat de domiciliation',
      description: 'Contrat avec une société de domiciliation agréée préfecture (numéro à mentionner).',
      format: 'pdf', obligatoire: true, cible: 'siege',
      contexte: ['Société doit posséder agrément préfectoral en cours de validité'],
    }));
  } else if (dom === 'chez_dirigeant') {
    docs.push(base({
      code: 'siege_attestation_dirigeant',
      titre: 'Attestation de domiciliation chez le dirigeant',
      description: 'Lettre attestant la domiciliation au domicile personnel du représentant légal + justificatif de domicile -3 mois (facture EDF/GDF/internet/quittance).',
      format: 'pdf', obligatoire: true, cible: 'siege',
      contexte: ['Vérifier l’absence de clause d’interdiction du bail / règlement copro', 'Durée limitée si interdiction (5 ans max art. L123-11-1 Ccom)'],
    }));
  } else if (dom === 'sous_location') {
    docs.push(base({
      code: 'siege_sous_location',
      titre: 'Autorisation de sous-location + bail principal',
      description: 'Bail principal + autorisation écrite du propriétaire + sous-bail signé.',
      format: 'pdf', obligatoire: true, cible: 'siege',
    }));
  } else if (dom === 'pepiniere') {
    docs.push(base({
      code: 'siege_pepiniere',
      titre: 'Contrat de pépinière / coworking',
      description: 'Convention d’hébergement signée par l’organisme.',
      format: 'pdf', obligatoire: true, cible: 'siege',
    }));
  }

  /* ====== DIRIGEANTS / ASSOCIÉS PERS. PHYS. ====== */
  const persPhysIds = new Set<string>();
  (d.dirigeants ?? []).forEach((dr, i) => {
    if (dr.type === 'personne_physique') {
      persPhysIds.add(`dir_${i}`);
      docs.push(base({
        code: `id_dirigeant_${i}`,
        titre: `Pièce d’identité dirigeant — ${dr.personne?.prenom ?? ''} ${dr.personne?.nom ?? ''}`.trim(),
        description: 'Recto/verso CNI en cours de validité OU passeport OU titre de séjour. Lisible, en couleur.',
        format: 'image', obligatoire: true, cible: 'dirigeant',
      }));
      docs.push(base({
        code: `nonconv_${i}`,
        titre: `Déclaration de non-condamnation et de filiation — ${dr.personne?.prenom ?? ''} ${dr.personne?.nom ?? ''}`.trim(),
        description: 'Déclaration sur l’honneur (modèle Swivo), datée < 3 mois, mentionnant : non-condamnation, filiation (parents).',
        format: 'pdf_signe', obligatoire: true, cible: 'dirigeant',
        modele: '/modeles/non-condamnation.pdf',
      }));
    }
  });

  (d.associes ?? []).forEach((a, i) => {
    if (a.type === 'personne_physique' && !persPhysIds.has(`dir_${i}`)) {
      docs.push(base({
        code: `id_associe_${i}`,
        titre: `Pièce d’identité associé #${i + 1}`,
        description: 'Recto/verso CNI / passeport / titre de séjour.',
        format: 'image', obligatoire: true, cible: 'associe',
      }));
    }
    if (a.type === 'personne_morale') {
      docs.push(base({
        code: `kbis_associe_pm_${i}`,
        titre: `Extrait Kbis associé personne morale #${i + 1}`,
        description: 'Kbis < 3 mois de l’associé personne morale.',
        format: 'pdf', obligatoire: true, cible: 'associe',
      }));
      docs.push(base({
        code: `delib_associe_pm_${i}`,
        titre: `Délibération autorisant l’apport — associé #${i + 1}`,
        description: 'PV d’assemblée autorisant la prise de participation (si statuts l’imposent).',
        format: 'pdf', obligatoire: false, cible: 'associe',
      }));
    }
  });

  /* ====== STATUTS / CAPITAL ====== */
  if (rule.statutsObligatoires) {
    docs.push(base({
      code: 'statuts',
      titre: 'Statuts signés',
      description: `Statuts datés et signés par tous les associés (paraphes sur chaque page + signature finale précédée de "Lu et approuvé").`,
      format: 'pdf_signe', obligatoire: true, cible: 'societe',
      contexte: ['Mention obligatoire : forme, dénomination, siège, objet, durée, capital, apports, exercice social'],
    }));
  }

  if (rule.depotCapitalObligatoire) {
    docs.push(base({
      code: 'attestation_depot_capital',
      titre: 'Attestation de dépôt de capital',
      description: 'Délivrée par la banque (ou notaire / Caisse des dépôts) à réception des fonds. Mentionne montant, IBAN du compte "compte société en formation".',
      format: 'pdf', obligatoire: true, cible: 'societe',
      contexte: ['Compte bloqué jusqu’à immatriculation', 'Min. 20% libéré (SARL/EURL) ou 50% (SAS/SASU) à la constitution'],
    }));
  }

  // Apports en nature : rapport commissaire si seuils
  const apportsNature = (d.associes ?? []).flatMap((a) => a.apport.nature ?? []);
  if (apportsNature.length) {
    const maxApportNat = Math.max(...apportsNature.map((n) => n.valeur));
    const totalNat = apportsNature.reduce((s, n) => s + n.valeur, 0);
    const totalCap = d.capital?.montantTotal ?? totalNat;
    const seuils = rule.capital.apportNatureCommissaire;
    const needCAC = !!seuils && (maxApportNat > seuils.seuilParApport || (totalCap > 0 && (totalNat / totalCap) * 100 > seuils.totalGtCapitalPct));
    if (needCAC) {
      docs.push(base({
        code: 'rapport_cac_apports',
        titre: 'Rapport du commissaire aux apports',
        description: 'Évaluation des apports en nature par un CAC inscrit (sauf renonciation unanime SAS/SASU sous seuils).',
        format: 'pdf_signe', obligatoire: true, cible: 'societe',
      }));
    }
  }

  /* ====== ANNONCE LÉGALE ====== */
  if (rule.annonceLegaleObligatoire) {
    docs.push(base({
      code: 'jal',
      titre: 'Attestation de parution au Journal d’Annonces Légales',
      description: 'Attestation délivrée par le JAL après publication (mentionnant forme, dénomination, siège, capital, objet, durée, dirigeants).',
      format: 'pdf', obligatoire: true, cible: 'societe',
    }));
  }

  /* ====== BÉNÉFICIAIRES EFFECTIFS ====== */
  if (rule.rbeObligatoire) {
    docs.push(base({
      code: 'rbe',
      titre: 'Déclaration des bénéficiaires effectifs',
      description: 'Formulaire RBE (intégré INPI). Toute personne physique détenant > 25% capital/droits de vote OU exerçant un contrôle. À défaut : représentant légal.',
      format: 'attestation_inpi', obligatoire: true, cible: 'beneficiaire_effectif',
      contexte: ['Sanction défaut RBE : 6 mois prison + 7 500 € amende (L561-49 CMF)'],
    }));
  }

  /* ====== ACTIVITÉS RÉGLEMENTÉES ====== */
  (d.activites ?? []).forEach((act, i) => {
    if (act.reglementee) {
      act.reglementee.piece || act.reglementee;
      docs.push(base({
        code: `reglementation_${i}`,
        titre: `Justificatif d’activité réglementée — ${act.reglementee.type}`,
        description: act.reglementee.piece || 'Diplôme / autorisation / inscription à l’ordre, selon la profession.',
        format: 'pdf', obligatoire: true, cible: 'activite',
      }));
    }
    if (act.categorie === 'artisanale') {
      if (act.artisanat?.stagePrealable === 'a_faire' || act.artisanat?.stagePrealable === undefined) {
        docs.push(base({
          code: `spi_${i}`,
          titre: 'Stage de Préparation à l’Installation (SPI) — facultatif depuis Loi PACTE',
          description: 'Recommandé mais non obligatoire depuis 22/05/2019.',
          format: 'pdf', obligatoire: false, cible: 'activite',
        }));
      }
      if (act.qualificationProfessionnelle?.diplome) {
        docs.push(base({
          code: `qualif_artisan_${i}`,
          titre: 'Diplôme / CAP / BEP du métier (artisanat qualifié)',
          description: 'Décret 98-246 : qualification professionnelle exigée pour certains métiers.',
          format: 'pdf', obligatoire: true, cible: 'activite',
        }));
      }
    }
  });

  /* ====== CONJOINT COLLABORATEUR ====== */
  if (d.conjoint?.statut === 'collaborateur' && d.conjoint?.personne) {
    docs.push(base({
      code: 'conjoint_collab',
      titre: 'Déclaration du conjoint collaborateur',
      description: 'Mentions identité conjoint, choix du statut (collaborateur). Obligatoire pour TNS si conjoint participe régulièrement.',
      format: 'attestation_inpi', obligatoire: true, cible: 'conjoint',
    }));
    docs.push(base({
      code: 'conjoint_id',
      titre: 'Pièce d’identité du conjoint',
      description: 'CNI / passeport en cours.',
      format: 'image', obligatoire: true, cible: 'conjoint',
    }));
  }

  /* ====== MICRO — Spécifique ====== */
  if (d.ei?.declarationInsaisissabiliteAutre) {
    docs.push(base({
      code: 'insaisissabilite',
      titre: 'Déclaration d’insaisissabilité notariée',
      description: 'Acte notarié rendant insaisissables d’autres biens fonciers que la RP.',
      format: 'pdf', obligatoire: false, cible: 'societe',
    }));
  }

  /* ====== ÉTABLISSEMENTS SECONDAIRES ====== */
  (d.etablissementsSecondaires ?? []).forEach((_es, i) => {
    docs.push(base({
      code: `etab_sec_${i}`,
      titre: `Justificatif de jouissance — établissement secondaire #${i + 1}`,
      description: 'Bail / contrat de domiciliation / titre de propriété du second établissement.',
      format: 'pdf', obligatoire: true, cible: 'siege',
    }));
  });

  return docs;
}

export function manquants(d: Dossier): DocumentRequis[] {
  return documentsRequis(d).filter((doc) => doc.obligatoire);
}
