/*
  Catégorisation des activités selon INPI (avril 2025) + table NAF/APE INSEE.
  Filtres : commerciale / artisanale / libérale réglementée / libérale non réglementée / agricole.
  Liste des activités réglementées extraite du référentiel APCMA + INPI.
*/
import type { CategorieActivite } from './types';

export type ActiviteReglementee = {
  motsCles: string[];
  type:
    | 'artisanat_qualification'
    | 'sante'
    | 'juridique'
    | 'comptable_finance'
    | 'immobilier_carte'
    | 'transport_capacite'
    | 'securite_privee'
    | 'restauration_debit'
    | 'enseignement'
    | 'social_petite_enfance'
    | 'esthetique_qualification'
    | 'batiment_qualification'
    | 'autre';
  piecesRequises: string[];
  autorite: string;
};

export const REGLEMENTEES: ActiviteReglementee[] = [
  // ARTISANAT (qualification professionnelle obligatoire — décret 98-246 et loi PACTE)
  {
    motsCles: ['coiffure', 'coiffeur', 'coiffeuse', 'barbier'],
    type: 'artisanat_qualification',
    piecesRequises: ['CAP/BP coiffure OU 3 ans expérience attestés', 'Attestation qualification CMA'],
    autorite: 'Chambre de Métiers et de l’Artisanat',
  },
  {
    motsCles: ['esthétique', 'esthéticien', 'esthéticienne', 'soins du visage', 'épilation'],
    type: 'esthetique_qualification',
    piecesRequises: ['CAP esthétique-cosmétique-parfumerie OU 3 ans expérience'],
    autorite: 'CMA',
  },
  {
    motsCles: ['boulangerie', 'boulanger', 'pâtisserie', 'pâtissier', 'boucher', 'boucherie', 'charcutier', 'poissonnier', 'fromager'],
    type: 'artisanat_qualification',
    piecesRequises: ['CAP/BEP métier OU 3 ans expérience attestés'],
    autorite: 'CMA',
  },
  {
    motsCles: ['plombier', 'électricien', 'chauffagiste', 'maçon', 'couvreur', 'menuisier', 'charpentier', 'carreleur', 'peintre en bâtiment', 'plâtrier'],
    type: 'batiment_qualification',
    piecesRequises: ['CAP/BEP du métier OU 3 ans expérience', 'Attestation qualification CMA'],
    autorite: 'CMA',
  },
  {
    motsCles: ['mécanicien automobile', 'garage', 'carrossier', 'réparation automobile', 'moto', 'cycle'],
    type: 'artisanat_qualification',
    piecesRequises: ['CAP/BEP mécanique OU 3 ans expérience', 'Assurance RC garagiste'],
    autorite: 'CMA',
  },
  {
    motsCles: ['taxi', 'vtc', 'voiture de tourisme avec chauffeur'],
    type: 'transport_capacite',
    piecesRequises: ['Carte professionnelle VTC/taxi (préfecture)', 'Permis B > 3 ans', 'Casier judiciaire vierge B2', 'Visite médicale apte'],
    autorite: 'Préfecture',
  },
  {
    motsCles: ['transport de marchandises', 'transporteur', 'déménagement', 'commissionnaire de transport'],
    type: 'transport_capacite',
    piecesRequises: ['Attestation de capacité professionnelle transport', 'Inscription registre transporteurs DREAL', 'Capacité financière'],
    autorite: 'DREAL',
  },

  // SANTÉ / RÉGLEMENTÉ
  {
    motsCles: ['médecin', 'dentiste', 'sage-femme', 'infirmier', 'infirmière', 'kinésithérapeute', 'orthophoniste', 'pharmacien', 'psychologue'],
    type: 'sante',
    piecesRequises: ['Diplôme d’État', 'Inscription Ordre professionnel (RPPS)', 'Numéro ADELI le cas échéant'],
    autorite: 'ARS + Ordre',
  },
  {
    motsCles: ['ostéopathe', 'chiropracteur', 'naturopathe', 'sophrologue'],
    type: 'sante',
    piecesRequises: ['Diplôme reconnu par le Ministère de la Santé', 'Numéro ADELI (ostéo/chiro)'],
    autorite: 'ARS',
  },

  // JURIDIQUE
  {
    motsCles: ['avocat', 'notaire', 'huissier', 'commissaire de justice', 'mandataire judiciaire'],
    type: 'juridique',
    piecesRequises: ['CAPA/diplôme officiel', 'Prestation de serment', 'Inscription à l’Ordre ou Chambre'],
    autorite: 'Ordre des avocats / CSN / CNCJ',
  },

  // COMPTABILITÉ / FINANCE
  {
    motsCles: ['expert-comptable', 'expert comptable', 'commissaire aux comptes'],
    type: 'comptable_finance',
    piecesRequises: ['DEC', 'Inscription Ordre des experts-comptables / CNCC'],
    autorite: 'OEC / CNCC',
  },
  {
    motsCles: ['conseiller en investissement', 'intermédiaire en assurance', 'iobsp', 'cif'],
    type: 'comptable_finance',
    piecesRequises: ['Immatriculation ORIAS', 'Justificatifs compétence professionnelle', 'RC pro adaptée'],
    autorite: 'ORIAS / ACPR',
  },

  // IMMOBILIER
  {
    motsCles: ['agent immobilier', 'agence immobilière', 'syndic', 'gestion locative', 'transactionnaire'],
    type: 'immobilier_carte',
    piecesRequises: ['Carte professionnelle T/G/S (CCI)', 'Garantie financière', 'RC pro', 'Aptitude professionnelle'],
    autorite: 'CCI',
  },

  // SÉCURITÉ
  {
    motsCles: ['sécurité privée', 'gardiennage', 'agent de sécurité', 'vidéosurveillance', 'protection physique des personnes'],
    type: 'securite_privee',
    piecesRequises: ['Autorisation CNAPS dirigeant', 'Autorisation d’exercer CNAPS', 'Carte professionnelle agents'],
    autorite: 'CNAPS',
  },

  // RESTAURATION / DÉBIT
  {
    motsCles: ['débit de boissons', 'bar', 'pub', 'restaurant licence iv', 'restauration alcool', 'discothèque'],
    type: 'restauration_debit',
    piecesRequises: ['Permis d’exploitation (formation hygiène alcool 20h)', 'Licence III/IV (mairie)', 'Formation HACCP si restauration commerciale'],
    autorite: 'Préfecture / mairie',
  },
  {
    motsCles: ['restaurant', 'restauration', 'food truck', 'traiteur', 'cantine'],
    type: 'restauration_debit',
    piecesRequises: ['Formation HACCP (minimum 1 personne)', 'Déclaration DDPP', 'Numéro agrément sanitaire si prod. animale'],
    autorite: 'DDPP',
  },

  // ENSEIGNEMENT
  {
    motsCles: ['école', 'enseignement', 'formation', 'auto-école', 'soutien scolaire'],
    type: 'enseignement',
    piecesRequises: ['Déclaration préfecture (école)', 'BEPECASER (auto-école)', 'Déclaration NDA si formation continue'],
    autorite: 'Rectorat / Préfecture',
  },

  // PETITE ENFANCE / SOCIAL
  {
    motsCles: ['crèche', 'micro-crèche', 'assistante maternelle', 'garde enfants à domicile'],
    type: 'social_petite_enfance',
    piecesRequises: ['Agrément PMI (Conseil départemental)', 'Casier B2 vierge', 'Formation petite enfance'],
    autorite: 'PMI',
  },
];

export type ActiviteSuggestion = {
  ape: string;            // code NAF/APE
  libelle: string;
  categorie: CategorieActivite;
  motsClesMatch: string[];
};

const APE_INDEX: ActiviteSuggestion[] = [
  // Services aux entreprises
  { ape: '70.22Z', libelle: 'Conseil pour les affaires et autres conseils de gestion', categorie: 'liberale_non_reglementee', motsClesMatch: ['conseil', 'consulting', 'consultant', 'stratégie', 'management'] },
  { ape: '62.01Z', libelle: 'Programmation informatique', categorie: 'liberale_non_reglementee', motsClesMatch: ['développeur', 'développement', 'dev web', 'programmation', 'logiciel', 'saas'] },
  { ape: '62.02A', libelle: 'Conseil en systèmes et logiciels informatiques', categorie: 'liberale_non_reglementee', motsClesMatch: ['conseil informatique', 'devops', 'cloud', 'architecte si'] },
  { ape: '63.12Z', libelle: 'Portails internet', categorie: 'commerciale', motsClesMatch: ['portail', 'marketplace', 'plateforme'] },
  { ape: '73.11Z', libelle: 'Activités des agences de publicité', categorie: 'commerciale', motsClesMatch: ['publicité', 'agence pub', 'marketing', 'communication'] },
  { ape: '74.10Z', libelle: 'Activités spécialisées de design', categorie: 'liberale_non_reglementee', motsClesMatch: ['design', 'graphisme', 'ux', 'ui'] },
  { ape: '74.20Z', libelle: 'Activités photographiques', categorie: 'liberale_non_reglementee', motsClesMatch: ['photographe', 'photo'] },
  { ape: '74.30Z', libelle: 'Traduction et interprétation', categorie: 'liberale_non_reglementee', motsClesMatch: ['traduction', 'traducteur', 'interprète'] },

  // Commerce
  { ape: '47.91A', libelle: 'Vente à distance sur catalogue général', categorie: 'commerciale', motsClesMatch: ['e-commerce', 'boutique en ligne', 'vente en ligne'] },
  { ape: '47.19B', libelle: 'Autres commerces de détail en magasin non spécialisé', categorie: 'commerciale', motsClesMatch: ['boutique', 'magasin', 'commerce détail'] },
  { ape: '47.71Z', libelle: 'Commerce de détail d’habillement', categorie: 'commerciale', motsClesMatch: ['vêtements', 'prêt-à-porter', 'mode'] },
  { ape: '46.49Z', libelle: 'Commerce de gros d’autres biens', categorie: 'commerciale', motsClesMatch: ['grossiste', 'gros'] },

  // Restauration
  { ape: '56.10A', libelle: 'Restauration traditionnelle', categorie: 'commerciale', motsClesMatch: ['restaurant', 'bistrot', 'brasserie'] },
  { ape: '56.10C', libelle: 'Restauration de type rapide', categorie: 'commerciale', motsClesMatch: ['fast food', 'snack', 'food truck'] },
  { ape: '56.21Z', libelle: 'Services des traiteurs', categorie: 'commerciale', motsClesMatch: ['traiteur', 'événementiel'] },
  { ape: '56.30Z', libelle: 'Débits de boissons', categorie: 'commerciale', motsClesMatch: ['bar', 'café', 'pub'] },

  // Bâtiment / artisanat
  { ape: '43.22A', libelle: 'Travaux d’installation d’eau et de gaz en tous locaux', categorie: 'artisanale', motsClesMatch: ['plombier', 'plomberie'] },
  { ape: '43.21A', libelle: 'Travaux d’installation électrique dans tous locaux', categorie: 'artisanale', motsClesMatch: ['électricien', 'électricité'] },
  { ape: '43.34Z', libelle: 'Travaux de peinture et vitrerie', categorie: 'artisanale', motsClesMatch: ['peintre', 'peinture'] },
  { ape: '41.20A', libelle: 'Construction de maisons individuelles', categorie: 'artisanale', motsClesMatch: ['constructeur', 'maçonnerie', 'maçon'] },
  { ape: '96.02A', libelle: 'Coiffure', categorie: 'artisanale', motsClesMatch: ['coiffeur', 'coiffure', 'barbier'] },
  { ape: '96.02B', libelle: 'Soins de beauté', categorie: 'artisanale', motsClesMatch: ['esthétique', 'esthéticienne', 'institut beauté'] },
  { ape: '10.71C', libelle: 'Boulangerie-pâtisserie', categorie: 'artisanale', motsClesMatch: ['boulanger', 'boulangerie', 'pâtissier'] },

  // Santé / libéral réglementé
  { ape: '86.21Z', libelle: 'Activités des médecins généralistes', categorie: 'liberale_reglementee', motsClesMatch: ['médecin généraliste'] },
  { ape: '86.22A', libelle: 'Activités de radiodiagnostic et de radiothérapie', categorie: 'liberale_reglementee', motsClesMatch: ['radiologue'] },
  { ape: '86.23Z', libelle: 'Pratique dentaire', categorie: 'liberale_reglementee', motsClesMatch: ['dentiste'] },
  { ape: '86.90A', libelle: 'Ambulances', categorie: 'liberale_reglementee', motsClesMatch: ['ambulance'] },
  { ape: '86.90D', libelle: 'Activités des infirmiers et des sages-femmes', categorie: 'liberale_reglementee', motsClesMatch: ['infirmier', 'infirmière', 'sage-femme'] },
  { ape: '86.90E', libelle: 'Activités des professionnels de la rééducation', categorie: 'liberale_reglementee', motsClesMatch: ['kinésithérapeute', 'orthophoniste'] },

  // Juridique / comptable
  { ape: '69.10Z', libelle: 'Activités juridiques', categorie: 'liberale_reglementee', motsClesMatch: ['avocat', 'notaire', 'huissier'] },
  { ape: '69.20Z', libelle: 'Activités comptables', categorie: 'liberale_reglementee', motsClesMatch: ['expert-comptable', 'comptable'] },

  // Immobilier
  { ape: '68.10Z', libelle: 'Activités des marchands de biens immobiliers', categorie: 'commerciale', motsClesMatch: ['marchand de biens'] },
  { ape: '68.20A', libelle: 'Location de logements', categorie: 'commerciale', motsClesMatch: ['location nue', 'location appartement'] },
  { ape: '68.20B', libelle: 'Location de terrains et d’autres biens immobiliers', categorie: 'commerciale', motsClesMatch: ['location terrain'] },
  { ape: '68.31Z', libelle: 'Agences immobilières', categorie: 'commerciale', motsClesMatch: ['agent immobilier', 'agence immobilière'] },

  // Transport
  { ape: '49.32Z', libelle: 'Transports de voyageurs par taxis', categorie: 'commerciale', motsClesMatch: ['taxi', 'vtc'] },
  { ape: '49.41A', libelle: 'Transports routiers de fret interurbains', categorie: 'commerciale', motsClesMatch: ['transport marchandises', 'fret'] },
  { ape: '53.20Z', libelle: 'Autres activités de poste et de courrier', categorie: 'commerciale', motsClesMatch: ['coursier', 'livraison', 'livreur'] },

  // Enseignement / sport / culture
  { ape: '85.59A', libelle: 'Formation continue d’adultes', categorie: 'liberale_non_reglementee', motsClesMatch: ['formation', 'formateur'] },
  { ape: '85.32Z', libelle: 'Enseignement secondaire technique ou professionnel', categorie: 'liberale_reglementee', motsClesMatch: ['école technique'] },
  { ape: '85.51Z', libelle: 'Enseignement de disciplines sportives', categorie: 'commerciale', motsClesMatch: ['coach sportif', 'coach', 'fitness'] },
  { ape: '85.52Z', libelle: 'Enseignement culturel', categorie: 'liberale_non_reglementee', motsClesMatch: ['professeur musique', 'cours danse'] },

  // Agricole
  { ape: '01.13Z', libelle: 'Culture de légumes, melons, racines et tubercules', categorie: 'agricole', motsClesMatch: ['maraîchage', 'maraîcher'] },
  { ape: '01.25Z', libelle: 'Culture d’autres fruits d’arbres et arbustes', categorie: 'agricole', motsClesMatch: ['arboriculture'] },
  { ape: '01.45Z', libelle: 'Élevage d’ovins et de caprins', categorie: 'agricole', motsClesMatch: ['élevage', 'éleveur'] },

  // Bien-être / fitness
  { ape: '93.13Z', libelle: 'Activités des centres de culture physique', categorie: 'commerciale', motsClesMatch: ['salle de sport', 'gym', 'fitness'] },
];

export function searchActivites(query: string, limit = 6): ActiviteSuggestion[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored = APE_INDEX.map((row) => {
    let score = 0;
    for (const kw of row.motsClesMatch) {
      const k = normalize(kw);
      if (q.includes(k)) score += k.length;
      else if (k.includes(q)) score += q.length;
    }
    if (normalize(row.libelle).includes(q)) score += 5;
    return { row, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.row);
}

export function detectReglementation(description: string): ActiviteReglementee | null {
  const desc = normalize(description);
  for (const r of REGLEMENTEES) {
    if (r.motsCles.some((mc) => desc.includes(normalize(mc)))) return r;
  }
  return null;
}

export function categoriserDepuisAPE(ape: string): CategorieActivite | null {
  const match = APE_INDEX.find((r) => r.ape === ape);
  return match?.categorie ?? null;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Activités INTERDITES en micro-entreprise (article L613-7 CSS + L526-22 Ccom) */
export const ACTIVITES_INTERDITES_MICRO = [
  'Avocats, notaires, huissiers, magistrats et professions juridiques réglementées',
  'Officiers ministériels et publics (commissaires-priseurs…)',
  'Activités relevant de la MSA (salariés agricoles)',
  'Activités relevant de la TVA immobilière (marchands de biens, lotisseurs)',
  'Activités artistiques rémunérées en droits d’auteur (AGESSA / Maison des Artistes)',
  'Activités relevant de la CIPAV avec revenus > plafond LMNP',
  'Production littéraire, scientifique ou artistique (régime BNC déclaration contrôlée)',
];

/* Activités INTERDITES en SCI (objet civil strict) */
export const ACTIVITES_INTERDITES_SCI = [
  'Location meublée à titre habituel (qualifiée commerciale)',
  'Achat-revente immobilière (marchand de biens)',
  'Promotion immobilière',
  'Activités commerciales annexes (location courte durée type Airbnb avec services)',
];
