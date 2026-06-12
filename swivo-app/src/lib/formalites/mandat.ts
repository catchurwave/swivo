/*
  Mandat de dépôt / signature électronique des formalités.
  Référence : art. R123-30 Ccom + Contrat d'interface INPI juin 2025.
  Le mandat est OBLIGATOIRE pour qu'un tiers (Swivo) puisse déposer au nom du déclarant.
*/
import type { Dossier, MandatSignature } from './types';

export const MANDAT_VERSION = '2026-05-A';
export const MANDAT_PRESTATAIRE = 'Swivo SAS';

export const MANDAT_SCOPE_DEFAUT = [
  'depot_dossier_inpi',
  'signature_formulaire_m0_p0',
  'declaration_beneficiaires_effectifs',
  'transmission_journal_annonces_legales',
  'reception_correspondance_inpi',
  'rectification_mineure_demande_inpi',
  'recuperation_kbis',
];

export const MANDAT_TEXTE = `MANDAT DE DÉPÔT — FORMALITÉS GUICHET UNIQUE INPI
Version ${MANDAT_VERSION}

Entre :
- Le déclarant (futur dirigeant ou représentant légal de la société en formation), désigné ci-après "le Mandant",
- ${MANDAT_PRESTATAIRE}, immatriculée au RCS de Paris, désignée ci-après "le Mandataire".

Article 1 — Objet
Le Mandant donne mandat au Mandataire à l’effet de :
  1. Compléter et signer en son nom et pour son compte tout formulaire ou téléprocédure du Guichet unique de l’INPI (procedure-tiers-declarant.fr), notamment la formalité de création d’entreprise ;
  2. Déposer le dossier complet et toutes pièces justificatives ;
  3. Procéder à la déclaration des bénéficiaires effectifs (RBE) lorsqu’elle est requise (art. L561-46 CMF) ;
  4. Transmettre l’annonce légale au journal habilité du département du siège ;
  5. Recevoir la correspondance INPI (accusés, demandes complémentaires) et y répondre dans le périmètre du dossier ;
  6. Récupérer l’extrait Kbis / avis SIREN après immatriculation et le transmettre au Mandant.

Article 2 — Périmètre exclu
Le présent mandat ne comprend pas :
  - La signature des statuts sociaux (réservée aux associés) ;
  - La gestion fiscale et sociale post-immatriculation ;
  - Toute représentation juridique en cas de litige.

Article 3 — Données personnelles & RGPD
Le Mandataire collecte les données strictement nécessaires à la formalité (Règlement (UE) 2016/679). Données hébergées en France, durée de conservation : 10 ans (obligation comptable + preuve dépôt). Le Mandant dispose d’un droit d’accès, rectification, effacement, opposition (dpo@swivo.fr).

Article 4 — Durée
Le mandat prend effet à la signature électronique et expire à l’immatriculation effective au RNE ou en cas de rejet définitif du dossier par l’INPI.

Article 5 — Honoraires
Les honoraires de service sont ceux figurant sur la facture Swivo (29,90 € TTC à la création). Les frais légaux (INPI, greffe, JAL, dépôt capital) sont refacturés à l’euro près.

Article 6 — Responsabilité
Le Mandataire s’engage à une obligation de moyens renforcée. La responsabilité du Mandataire est limitée à la diligence des contrôles effectués sur les pièces transmises par le Mandant. Le Mandant garantit la véracité des informations fournies.

Article 7 — Révocation
Le mandat peut être révoqué à tout moment par lettre recommandée ou email à hello@swivo.fr avant transmission. Après transmission, la révocation n’est effective que dans la mesure où l’INPI accepte le retrait.

Article 8 — Loi applicable
Le présent mandat est régi par le droit français. Tribunaux de Paris compétents.

Signé électroniquement par le Mandant le [DATE_ACCEPTATION]
Adresse IP : [IP] — Empreinte : [EMPREINTE]`;

export function buildMandat(opts?: { scope?: string[]; ip?: string }): MandatSignature {
  return {
    accepte: false,
    versionTexte: MANDAT_VERSION,
    prestataire: MANDAT_PRESTATAIRE,
    scope: opts?.scope ?? MANDAT_SCOPE_DEFAUT,
    ip: opts?.ip,
  };
}

export function accepterMandat(d: Dossier, opts?: { ip?: string }): Dossier {
  const mandat: MandatSignature = {
    accepte: true,
    dateAcceptation: new Date().toISOString(),
    versionTexte: MANDAT_VERSION,
    prestataire: MANDAT_PRESTATAIRE,
    scope: d.mandat?.scope ?? MANDAT_SCOPE_DEFAUT,
    ip: opts?.ip ?? d.mandat?.ip,
  };
  return { ...d, mandat };
}

export function mandatTexteRendu(d: Dossier): string {
  const date = d.mandat?.dateAcceptation ?? '[À SIGNER]';
  return MANDAT_TEXTE
    .replace('[DATE_ACCEPTATION]', date)
    .replace('[IP]', d.mandat?.ip ?? '—')
    .replace('[EMPREINTE]', d.mandat ? hash(JSON.stringify(d.mandat)) : '—');
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}
