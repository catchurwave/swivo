/*
  Flow adaptatif — graphe de questions ciblées.
  Chaque step pose une question, mute le dossier, calcule le next step.
  Couvre : profilage initial → recommandation → identité → siège → activités
  → associés → capital → options fiscales/sociales → bénéficiaires effectifs
  → annonce légale → dépôt capital → mandat → récap.
*/
import type { Dossier, FormeCode, CategorieActivite, Associe, Dirigeant } from './types';
import { EMPTY_DOSSIER } from './types';
import { FORMES } from './formes';
import { searchActivites, detectReglementation } from './activites';
import { meilleureForme, recommander, profilDepuisDossier, type Profil } from './recommend';
import { documentsRequis } from './documents';
import { validate, Check } from './validate';
import { buildMandat, accepterMandat } from './mandat';
import { nirToPersonne } from '../nir';

export type ChoiceOption = {
  value: string;
  label: string;
  hint?: string;
  icon?: string;          // emoji or icon name from Icon set
  image?: string;         // image url for image-rich choices
  iconOnly?: boolean;     // render large icon, no label below
};

export type Field =
  | { kind: 'choice'; options: ChoiceOption[]; columns?: 1 | 2 | 3 | 4; visual?: 'compact' | 'tiles' | 'image' }
  | { kind: 'multichoice'; options: ChoiceOption[]; min?: number }
  | { kind: 'nir' }
  | { kind: 'id-scan' }
  | { kind: 'documents-upload' }
  | { kind: 'text'; placeholder?: string; multiline?: boolean }
  | { kind: 'number'; min?: number; max?: number; suffix?: string }
  | { kind: 'date' }
  | { kind: 'email' }
  | { kind: 'tel' }
  | { kind: 'address' }
  | { kind: 'activity-search' }
  | { kind: 'persons'; subject: 'associes' | 'dirigeants' | 'beneficiaires' }
  | { kind: 'capital-table' }
  | { kind: 'documents-checklist' }
  | { kind: 'mandat-accept' }
  | { kind: 'recap' };

export type Question = {
  id: string;
  category: 'profil' | 'identite' | 'societe' | 'activite' | 'siege' | 'capital' | 'gouvernance' | 'fiscal' | 'rbe' | 'mandat' | 'recap';
  title: string;
  help?: string;
  field: Field;
  applicable: (d: Dossier, profil: Profil) => boolean;
  apply: (value: any, d: Dossier) => Dossier;
  /** Returns array of error messages; empty/undefined = valid. Called BEFORE apply. */
  validateStep?: (value: any, d: Dossier) => string[];
  next?: (value: any, d: Dossier) => string | null;
};

export const QUESTIONS: Question[] = [
  /* ===== INTRO MICRO ===== */
  {
    id: 'micro_intro',
    category: 'profil',
    title: 'Votre micro-entreprise — démarrage en 5 minutes',
    help: 'Quelques questions ciblées, puis nous transmettons votre déclaration au Guichet unique INPI sous 24 h.',
    field: { kind: 'recap' },
    applicable: () => true,
    apply: (_, d) => ({ ...d, forme: 'micro', associes: d.associes?.length ? d.associes : [emptyAssocie()] }),
  },
  {
    id: 'id_scan',
    category: 'identite',
    title: 'Scannez votre pièce d\'identité (recto + verso) pour pré-remplir',
    help: 'Téléversez le recto ET le verso de votre CNI (ou la page principale du passeport). Nous lisons la MRZ (verso) + les libellés (recto) pour pré-remplir civilité, prénoms, nom, date et lieu de naissance, nationalité, et n° de pièce. Vos données restent sur votre appareil.',
    field: { kind: 'id-scan' },
    applicable: (d) => !d.dirigeants?.[0]?.personne?.prenom || !d.dirigeants?.[0]?.personne?.dateNaissance,
    apply: (v: any, d) => {
      if (!v) return d;
      const dir = d.dirigeants?.[0] ?? { type: 'personne_physique' as const, fonction: 'gerant' as const, personne: {} };
      const p = { ...(dir.personne ?? {}) };
      if (v.civilite && !p.civilite)            p.civilite = v.civilite;
      if (v.prenom && !p.prenom)                p.prenom = v.prenom;
      if (v.nom && !p.nom)                      p.nom = v.nom;
      if (v.nomUsage && !p.nomUsage)            p.nomUsage = v.nomUsage;
      if (v.dateNaissance && !p.dateNaissance)  p.dateNaissance = v.dateNaissance;
      if (v.lieuNaissance && !p.lieuNaissance)  p.lieuNaissance = v.lieuNaissance;
      if (v.nationalite && !p.nationalite)      p.nationalite = v.nationalite;
      if (v.nationalite === 'FRA' && !p.paysNaissance) p.paysNaissance = 'FRA';
      const options = { ...((d.options as any) ?? {}) };
      if (v.numeroDocument && !options.numeroPieceIdentite) options.numeroPieceIdentite = v.numeroDocument;
      if (Array.isArray(v.prenomsTous) && v.prenomsTous.length > 1 && !options.prenomsTous) options.prenomsTous = v.prenomsTous;
      if (v.dateExpiration && !options.pieceIdentiteExpiration) options.pieceIdentiteExpiration = v.dateExpiration;
      return {
        ...d,
        options,
        dirigeants: [{ ...dir, personne: p }, ...(d.dirigeants ?? []).slice(1)],
      };
    },
  },
  {
    id: 'nir_input',
    category: 'identite',
    title: 'Votre numéro de sécurité sociale (optionnel)',
    help: 'Permet de pré-remplir civilité, date et département de naissance. Stocké chiffré côté serveur.',
    field: { kind: 'nir' },
    applicable: (d) => !(d.options as any)?.nir && !d.dirigeants?.[0]?.personne?.dateNaissance,
    apply: (v: string, d) => {
      if (!v) return d;
      const parsed = nirToPersonne(v);
      if (!parsed) return d;
      const dir = d.dirigeants?.[0] ?? { type: 'personne_physique' as const, fonction: 'gerant' as const, personne: {} };
      const p = { ...(dir.personne ?? {}) };
      if (parsed.civilite && !p.civilite)             p.civilite = parsed.civilite;
      if (parsed.dateNaissance && !p.dateNaissance)   p.dateNaissance = parsed.dateNaissance;
      if (parsed.paysNaissance && !p.paysNaissance)   p.paysNaissance = parsed.paysNaissance;
      return {
        ...d,
        options: { ...(d.options ?? {}), nir: v } as any,
        dirigeants: [{ ...dir, personne: p }, ...(d.dirigeants ?? []).slice(1)],
      };
    },
  },
  /* ===== DOMICILE PERSONNEL DU DIRIGEANT (obligatoire micro) =====
     Le Guichet unique exige l'adresse personnelle même si elle est identique
     au siège — c'est une donnée d'état civil distincte. */
  {
    id: 'dirigeant_domicile',
    category: 'identite',
    title: 'Adresse de votre domicile personnel',
    help: 'Obligatoire — adresse de résidence du déclarant. Distincte du siège, même si elles sont identiques.',
    field: { kind: 'address' },
    applicable: () => true,
    validateStep: (v) => {
      const a = v ?? {};
      const errs: string[] = [];
      if (!a.voie || a.voie.trim().length < 4) errs.push('Voie requise (n° + rue).');
      if (!Check.codePostal(a.codePostal)) errs.push('Code postal invalide (5 chiffres).');
      if (!a.commune || a.commune.trim().length < 2) errs.push('Commune requise.');
      return errs;
    },
    apply: (v, d) => {
      const dir = d.dirigeants?.[0] ?? { type: 'personne_physique' as const, fonction: 'gerant' as const, personne: {} };
      const personne = { ...(dir.personne ?? {}), domicile: v };
      // Si le siège n'est pas encore défini ET le mode est "chez_dirigeant",
      // on pré-remplit le siège avec l'adresse personnelle.
      const ep = d.etablissementPrincipal;
      const next: Dossier = {
        ...d,
        dirigeants: [{ ...dir, personne }, ...(d.dirigeants ?? []).slice(1)],
      };
      if (!ep || ep.domiciliation === 'chez_dirigeant') {
        next.etablissementPrincipal = {
          ...(ep ?? { domiciliation: 'chez_dirigeant' as const }),
          adresse: { ...v },
        };
      }
      return next;
    },
  },
  /* Désactivé après pivot micro-only — toujours 1 entrepreneur. */
  {
    id: 'p_associes',
    category: 'profil',
    title: 'Vous lancez-vous seul·e ou à plusieurs ?',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: '1', label: 'Seul·e',     icon: '🧑‍💼', iconOnly: true },
      { value: '2', label: 'À deux',     icon: '👥',   iconOnly: true },
      { value: '3', label: 'À 3 ou plus', icon: '👨‍👩‍👧', iconOnly: true },
    ]},
    applicable: () => false,
    apply: (v, d) => ({ ...d, associes: Array.from({ length: Math.max(1, parseInt(v, 10)) }, () => emptyAssocie()) }),
  },
  {
    id: 'p_activite_categorie',
    category: 'profil',
    title: 'Type d’activité principale ?',
    help: 'Détermine la catégorie INPI (commerce, artisanat, libéral, agricole).',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'commerciale',              label: 'Commerciale',              hint: 'Achat-revente, e-commerce, restauration', icon: '🏪' },
      { value: 'artisanale',               label: 'Artisanale',               hint: 'Métiers manuels < 10 salariés',           icon: '🔨' },
      { value: 'liberale_non_reglementee', label: 'Libérale non réglementée', hint: 'Consulting, dev, design…',                icon: '💼' },
      { value: 'liberale_reglementee',     label: 'Libérale réglementée',     hint: 'Avocat, médecin, expert-comptable…',      icon: '⚖️' },
    ]},
    applicable: () => true,
    apply: (v, d) => upsertActivite(d, { categorie: v as CategorieActivite }),
  },
  {
    id: 'p_levee',
    category: 'profil',
    title: 'Envisagez-vous des investisseurs / une levée de fonds ?',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'non',      label: 'Non, jamais',          icon: '🚫' },
      { value: 'peutetre', label: 'Peut-être plus tard',  icon: '🤔' },
      { value: 'oui',      label: 'Oui, à court terme',   icon: '🚀' },
    ]},
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _levee: v } as any }),
  },
  {
    id: 'p_ca',
    category: 'profil',
    title: 'CA prévisionnel année 1 ?',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: '15000',  label: '< 30 000 €',           icon: '🌱' },
      { value: '60000',  label: '30 000 – 80 000 €',    icon: '📈' },
      { value: '150000', label: '80 000 – 250 000 €',   icon: '💰' },
      { value: '500000', label: '> 250 000 €',          icon: '🏆' },
    ]},
    applicable: () => true,
    apply: (v, d) => ({ ...d, options: { ...d.options, _caEstime: parseInt(v, 10) } as any }),
  },
  {
    id: 'p_patrimoine',
    category: 'profil',
    title: 'Protection du patrimoine personnel ?',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'protege', label: 'Important — protéger au max', icon: '🛡️' },
      { value: 'indiff',  label: 'Pas critique',                icon: '🤷' },
    ]},
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _patrimoine: v } as any }),
  },
  {
    id: 'p_social',
    category: 'profil',
    title: 'Protection sociale souhaitée ?',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'salarie_complete', label: 'Régime général (assimilé salarié)', hint: 'Couverture maladie complète, retraite cadre', icon: '🩺' },
      { value: 'tns_economique',   label: 'Cotisations réduites (TNS)',         hint: 'URSSAF allégée, retraite à compléter',       icon: '💸' },
      { value: 'indiff',           label: 'Peu importe',                        icon: '🤷' },
    ]},
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _social: v } as any }),
  },
  {
    id: 'p_fiscal',
    category: 'profil',
    title: 'Préférence fiscale ?',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'ir_passthrough', label: 'IR — transparence',     hint: 'Revenus = impôt perso',          icon: '👤' },
      { value: 'is_dividendes',  label: 'IS — dividendes',       hint: 'Société paie IS, dividendes',    icon: '🏢' },
      { value: 'indiff',         label: 'Conseillez-moi',        icon: '💡' },
    ]},
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _fiscal: v } as any }),
  },

  /* ===== RECOMMANDATION FORME ===== */
  {
    id: 'recommend',
    category: 'profil',
    title: 'Forme juridique recommandée',
    field: { kind: 'recap' },
    applicable: () => false,
    apply: (value, d) => {
      // value can be: true (accept reco) | FormeCode (pick alternative directly)
      if (typeof value === 'string' && value in FORMES) {
        return { ...d, forme: value as FormeCode, options: { ...d.options, _formeChosen: true } as any };
      }
      const p = computeProfil(d);
      const forme = meilleureForme(p);
      return { ...d, forme };
    },
  },
  {
    id: 'forme_override',
    category: 'profil',
    title: 'Souhaitez-vous changer la forme proposée ?',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'keep',  label: 'Garder la recommandation', icon: '✅' },
      { value: 'micro', label: 'Micro-entreprise',         icon: '🌱' },
      { value: 'ei',    label: 'EI',                       icon: '🧑' },
      { value: 'eurl',  label: 'EURL',                     icon: '🧑‍💼' },
      { value: 'sasu',  label: 'SASU',                     icon: '🚀' },
      { value: 'sas',   label: 'SAS',                      icon: '🏢' },
      { value: 'sarl',  label: 'SARL',                     icon: '🤝' },
      { value: 'sa',    label: 'SA',                       icon: '🏛️' },
      { value: 'sci',   label: 'SCI',                      icon: '🏠' },
    ]},
    // Désactivé après pivot micro-only.
    applicable: () => false,
    apply: (v, d) => v === 'keep' ? d : ({ ...d, forme: v as FormeCode }),
  },

  /* ===== ACTIVITÉS (description précise + APE) ===== */
  {
    id: 'act_description',
    category: 'activite',
    title: 'Décrivez précisément votre activité principale',
    help: 'L’INPI exige une description claire. Mentionnez les produits/services concrets (≥ 20 caractères).',
    field: { kind: 'text', placeholder: 'Conseil en transformation digitale pour PME du secteur retail', multiline: true },
    applicable: () => true,
    validateStep: (v) => {
      const s = String(v ?? '').trim();
      const errs: string[] = [];
      if (s.length < 20) errs.push('Description trop courte : minimum 20 caractères (l’INPI rejette les libellés vagues).');
      if (s.length > 500) errs.push('Description trop longue : maximum 500 caractères.');
      if (/^[A-ZÉÈ ]+$/.test(s)) errs.push('Évitez le texte tout en majuscules.');
      return errs;
    },
    apply: (v, d) => {
      const activite = (d.activites[0] ?? { categorie: 'liberale_non_reglementee' as const, description: '' });
      const reglementee = detectReglementation(v);
      const suggestions = searchActivites(v);
      const ape = suggestions[0]?.ape;
      return upsertActivite(d, { description: v, reglementee: reglementee ? { type: reglementee.type, piece: reglementee.piecesRequises.join(' · ') } : activite.reglementee, ape });
    },
  },
  {
    id: 'act_reglementation',
    category: 'activite',
    title: 'Cette activité est réglementée — disposez-vous des qualifications ?',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'diplome',     label: 'Oui, diplôme requis',      icon: '🎓' },
      { value: 'experience',  label: 'Oui, 3+ ans d’expérience', icon: '🛠️' },
      { value: 'inscription', label: 'Inscrit à l’Ordre',         icon: '📜' },
      { value: 'non',         label: 'Non, pas encore',           icon: '⚠️' },
    ]},
    applicable: (d) => !!d.activites?.[0]?.reglementee,
    apply: (v, d) => {
      const a = d.activites[0]!;
      const q = v === 'diplome' ? { diplome: 'À préciser' } : v === 'experience' ? { experienceAnnees: 3 } : v === 'inscription' ? { diplome: 'Inscription ordre' } : undefined;
      d.activites[0] = { ...a, qualificationProfessionnelle: q };
      return { ...d };
    },
  },
  {
    id: 'act_ape_confirm',
    category: 'activite',
    title: 'Code APE/NAF proposé',
    help: 'L’INSEE attribue le code définitif après immatriculation — celui-ci est indicatif.',
    field: { kind: 'recap' },
    applicable: (d) => !!d.activites?.[0]?.ape,
    apply: (_, d) => d,
  },

  /* ===== SOCIÉTÉ — dénomination, objet ===== */
  {
    id: 'soc_denomination',
    category: 'societe',
    title: 'Dénomination sociale',
    help: 'Nom officiel de la société. Vérifiez la disponibilité (INPI marques + societe.com).',
    field: { kind: 'text', placeholder: 'Ex : Atelier Numérique du Nord' },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      const s = String(v ?? '').trim();
      const errs: string[] = [];
      if (s.length < 2) errs.push('Dénomination requise (≥ 2 caractères).');
      if (s.length > 120) errs.push('Dénomination trop longue (max 120 caractères).');
      if (/^(la |le |les |sas |sasu |sarl )/i.test(s)) errs.push('Évitez de commencer par "La/Le/SAS/SARL" — la forme sera ajoutée automatiquement.');
      return errs;
    },
    apply: (v, d) => ({ ...d, denomination: String(v).trim() }),
  },
  {
    id: 'soc_sigle',
    category: 'societe',
    title: 'Sigle (facultatif)',
    field: { kind: 'text', placeholder: 'Ex : ANN' },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    apply: (v, d) => ({ ...d, sigle: v || undefined }),
  },
  {
    id: 'soc_objet',
    category: 'societe',
    title: 'Objet social complet',
    help: 'Décrivez activités présentes ET futures envisageables, pour éviter une modification statutaire ultérieure.',
    field: { kind: 'text', multiline: true, placeholder: 'Le conseil en stratégie digitale, l’édition de logiciels, la formation professionnelle ; et plus généralement toutes opérations…' },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      const s = String(v ?? '').trim();
      const errs: string[] = [];
      if (s.length < 20) errs.push('Objet social trop court (≥ 20 caractères). Décrivez activités présentes et futures.');
      if (s.length > 1500) errs.push('Objet social trop long (max 1500 caractères).');
      return errs;
    },
    apply: (v, d) => ({ ...d, objetSocial: String(v).trim() }),
  },
  {
    id: 'soc_duree',
    category: 'societe',
    title: 'Durée de la société',
    field: { kind: 'number', min: 1, max: 99, suffix: 'années' },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      const n = parseInt(String(v), 10);
      if (Number.isNaN(n) || n < 1 || n > 99) return ['Durée entre 1 et 99 ans (par défaut : 99).'];
      return [];
    },
    apply: (v, d) => ({ ...d, duree: parseInt(String(v), 10) || 99 }),
  },
  {
    id: 'soc_cloture',
    category: 'societe',
    title: 'Date de clôture du 1er exercice',
    help: 'Souvent le 31/12 (année civile) ou 31/03/30/06/30/09. Le 1er exercice peut durer jusqu’à 24 mois.',
    field: { kind: 'date' },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      if (!v || !Check.dateISO(String(v))) return ['Date invalide.'];
      const d = new Date(String(v));
      const now = new Date();
      const max = new Date(); max.setMonth(max.getMonth() + 24);
      if (d <= now) return ['La clôture doit être future.'];
      if (d > max) return ['Le 1er exercice ne peut excéder 24 mois.'];
      return [];
    },
    apply: (v, d) => ({ ...d, dateClotureExercice: v }),
  },

  /* ===== SIÈGE ===== */
  {
    id: 'siege_mode',
    category: 'siege',
    title: 'Où sera domicilié le siège social ?',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'chez_dirigeant',       label: 'Domicile dirigeant', hint: 'Vérifier bail / copro',     icon: '🏠' },
      { value: 'locataire_bail',       label: 'Local en location',  hint: 'Bail commercial / pro',     icon: '🏬' },
      { value: 'proprietaire',         label: 'Local en propriété', hint: 'Acte ou taxe foncière',     icon: '🔑' },
      { value: 'societe_domiciliation',label: 'Société domiciliation', hint: 'Agrément préfecture',    icon: '📬' },
      { value: 'pepiniere',            label: 'Pépinière / coworking', hint: 'Convention hébergement', icon: '🌐' },
    ]},
    applicable: () => true,
    apply: (v, d) => ({ ...d, etablissementPrincipal: { ...(d.etablissementPrincipal ?? { adresse: {}, domiciliation: 'chez_dirigeant' as const }), domiciliation: v as any } }),
  },
  {
    id: 'siege_adresse',
    category: 'siege',
    title: 'Adresse complète du siège',
    field: { kind: 'address' },
    applicable: () => true,
    validateStep: (v) => {
      const a = v ?? {};
      const errs: string[] = [];
      if (!a.voie || a.voie.trim().length < 4) errs.push('Voie requise (n° + rue).');
      if (!Check.codePostal(a.codePostal)) errs.push('Code postal invalide (5 chiffres).');
      if (!a.commune || a.commune.trim().length < 2) errs.push('Commune requise.');
      return errs;
    },
    apply: (v, d) => ({ ...d, etablissementPrincipal: { ...(d.etablissementPrincipal ?? { domiciliation: 'chez_dirigeant' as const, adresse: {} }), adresse: v } }),
  },
  {
    id: 'siege_dom_societe',
    category: 'siege',
    title: 'Société de domiciliation',
    help: 'Dénomination, SIREN, n° d’agrément préfectoral (obligatoire).',
    field: { kind: 'text', placeholder: 'Ex : Domiciliation Paris Opera — 480123456 — agrément 75-2021-0042' },
    applicable: (d) => d.etablissementPrincipal?.domiciliation === 'societe_domiciliation',
    validateStep: (v) => {
      const parts = String(v ?? '').split('—').map((s) => s.trim());
      const errs: string[] = [];
      if (parts.length < 3) errs.push('Format attendu : "Dénomination — SIREN (9 chiffres) — agrément préfectoral".');
      if (parts[1] && !Check.siren(parts[1])) errs.push('SIREN invalide (9 chiffres + clé Luhn).');
      if (!parts[2]) errs.push('Numéro d’agrément préfectoral requis.');
      return errs;
    },
    apply: (v, d) => {
      const [denom, siren, agr] = v.split('—').map((s: string) => s.trim());
      return { ...d, etablissementPrincipal: { ...d.etablissementPrincipal!, societeDomiciliation: { denomination: denom, siren, agrementPrefecture: agr } } };
    },
  },
  {
    id: 'siege_date_debut',
    category: 'siege',
    title: 'Date prévue de début d’activité',
    field: { kind: 'date' },
    applicable: () => true,
    validateStep: (v) => {
      if (!v || !Check.dateISO(String(v))) return ['Date invalide.'];
      const d = new Date(String(v));
      const min = new Date(); min.setDate(min.getDate() - 30);
      const max = new Date(); max.setFullYear(max.getFullYear() + 1);
      if (d < min) return ['Date trop ancienne (max 30 jours dans le passé).'];
      if (d > max) return ['Date trop lointaine (max +12 mois).'];
      return [];
    },
    apply: (v, d) => ({ ...d, etablissementPrincipal: { ...d.etablissementPrincipal!, dateDebutActivite: v } }),
  },

  /* ===== CAPITAL ===== */
  {
    id: 'cap_montant',
    category: 'capital',
    title: 'Capital social total (€)',
    help: 'Min légal : 1 € (SARL/SAS/EURL/SASU), 37 000 € (SA).',
    field: { kind: 'number', min: 1, suffix: '€' },
    applicable: (d) => !!d.forme && FORMES[d.forme].capital.requis,
    validateStep: (v, d) => {
      const n = Number(v);
      const rule = d.forme ? FORMES[d.forme] : null;
      const errs: string[] = [];
      if (!Number.isFinite(n) || n <= 0) errs.push('Montant invalide.');
      if (rule && n < rule.capital.montantMin) errs.push(`Capital minimum ${rule.capital.montantMin} € pour ${rule.shortLabel}.`);
      if (n > 1_000_000_000) errs.push('Montant déraisonnable.');
      return errs;
    },
    apply: (v, d) => ({ ...d, capital: { ...(d.capital ?? {}), montantTotal: Number(v) } }),
  },
  {
    id: 'cap_type',
    category: 'capital',
    title: 'Type de capital',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'fixe',     label: 'Fixe',     hint: 'Modification = AGE',            icon: '🔒' },
      { value: 'variable', label: 'Variable', hint: 'Plancher / plafond statutaires', icon: '🔄' },
    ]},
    applicable: (d) => !!d.forme && !!FORMES[d.forme].capital.permetVariable,
    apply: (v, d) => ({ ...d, capital: { ...(d.capital ?? {}), type: v as any } }),
  },
  {
    id: 'cap_apports',
    category: 'capital',
    title: 'Répartition des apports par associé',
    help: 'Numéraire (versé) + nature (biens) + industrie (compétences, ne compte pas dans le capital).',
    field: { kind: 'capital-table' },
    applicable: (d) => !!d.forme && FORMES[d.forme].capital.requis,
    validateStep: (v, d) => {
      const associes = v as Associe[];
      const errs: string[] = [];
      if (!associes?.length) errs.push('Au moins un associé requis.');
      const total = associes.reduce((s, a) => s + (a.apport.numeraire ?? 0) + (a.apport.nature ?? []).reduce((x, n) => x + n.valeur, 0), 0);
      if (total <= 0) errs.push('Apport total doit être > 0.');
      const declared = d.capital?.montantTotal;
      if (declared && Math.abs(total - declared) > 0.01) errs.push(`Somme des apports (${total} €) ≠ capital déclaré (${declared} €).`);
      const rule = d.forme ? FORMES[d.forme] : null;
      if (rule?.capital.libereMinPctApports) {
        const num = associes.reduce((s, a) => s + (a.apport.numeraire ?? 0), 0);
        const lib = associes.reduce((s, a) => s + (a.apport.numeraireLibere ?? 0), 0);
        if (num > 0 && (lib / num) * 100 < rule.capital.libereMinPctApports) {
          errs.push(`Libération min ${rule.capital.libereMinPctApports}% du numéraire requise à la constitution.`);
        }
      }
      return errs;
    },
    apply: (v, d) => ({ ...d, associes: v as Associe[] }),
  },
  {
    id: 'cap_depot',
    category: 'capital',
    title: 'Lieu de dépôt du capital',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'banque',         label: 'Banque',           hint: 'Compte société en formation', icon: '🏦' },
      { value: 'notaire',        label: 'Notaire',          hint: 'Compte séquestre',            icon: '⚖️' },
      { value: 'caisse_depots',  label: 'Caisse des dépôts', hint: 'CDC',                        icon: '🏛️' },
    ]},
    applicable: (d) => !!d.forme && FORMES[d.forme].depotCapitalObligatoire,
    apply: (v, d) => ({ ...d, depotCapital: { ...(d.depotCapital ?? {}), etablissement: v as any } }),
  },
  {
    id: 'cap_iban',
    category: 'capital',
    title: 'IBAN du compte de dépôt',
    field: { kind: 'text', placeholder: 'FR76 1234 5678 9012 3456 7890 123' },
    applicable: (d) => !!d.forme && FORMES[d.forme].depotCapitalObligatoire,
    validateStep: (v) => {
      const iban = String(v ?? '').replace(/\s/g, '').toUpperCase();
      if (!iban) return ['IBAN requis.'];
      if (!Check.iban(iban)) return ['IBAN invalide (format FR + 25 caractères + clé mod 97).'];
      return [];
    },
    apply: (v, d) => ({ ...d, depotCapital: { ...(d.depotCapital ?? {}), iban: v.replace(/\s/g, '').toUpperCase() } }),
  },

  /* ===== GOUVERNANCE ===== */
  {
    id: 'gov_dirigeants',
    category: 'gouvernance',
    title: 'Dirigeants — fonction et identité',
    field: { kind: 'persons', subject: 'dirigeants' },
    applicable: () => true,
    validateStep: (v, d) => {
      const arr = v as Dirigeant[];
      const errs: string[] = [];
      const rule = d.forme ? FORMES[d.forme] : null;
      if (!arr?.length) errs.push('Au moins un dirigeant requis.');
      if (rule && arr.length < rule.dirigeants.min) errs.push(`${rule.dirigeants.min} dirigeant(s) minimum pour ${rule.shortLabel}.`);
      arr?.forEach((dr, i) => validatePersonneErrors(dr.personne, `Dirigeant #${i + 1}`).forEach((e) => errs.push(e)));
      arr?.forEach((dr, i) => { if (!dr.fonction) errs.push(`Dirigeant #${i + 1} : fonction requise.`); });
      return errs;
    },
    apply: (v, d) => ({ ...d, dirigeants: v as Dirigeant[] }),
  },
  {
    id: 'gov_associes_identite',
    category: 'gouvernance',
    title: 'Identité complète des associés',
    field: { kind: 'persons', subject: 'associes' },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v, d) => {
      const arr = v as Associe[];
      const errs: string[] = [];
      const rule = d.forme ? FORMES[d.forme] : null;
      if (rule && arr.length < rule.associes.min) errs.push(`${rule.associes.min} associé(s) minimum pour ${rule.shortLabel}.`);
      if (rule?.associes.max && arr.length > rule.associes.max) errs.push(`Max ${rule.associes.max} associés pour ${rule.shortLabel}.`);
      arr?.forEach((a, i) => {
        if (a.type === 'personne_physique') validatePersonneErrors(a.personne, `Associé #${i + 1}`).forEach((e) => errs.push(e));
        else if (!a.morale?.siren || !Check.siren(a.morale.siren)) errs.push(`Associé PM #${i + 1} : SIREN invalide.`);
      });
      return errs;
    },
    apply: (v, d) => ({ ...d, associes: v as Associe[] }),
  },

  /* ===== FISCAL / SOCIAL ===== */
  {
    id: 'fiscal_regime',
    category: 'fiscal',
    title: 'Régime fiscal',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'is', label: 'IS — Impôt sur les sociétés', icon: '🏢' },
      { value: 'ir', label: 'IR — Impôt sur le revenu',    icon: '👤' },
    ]},
    applicable: () => false,
    apply: (v, d) => ({ ...d, regimeFiscal: v as any }),
  },
  {
    id: 'fiscal_tva',
    category: 'fiscal',
    title: 'Régime TVA',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'franchise',      label: 'Franchise en base', hint: 'Sous seuils, pas de TVA', icon: '🆓' },
      { value: 'reel_simplifie', label: 'Réel simplifié',    hint: 'Déclaration annuelle',     icon: '📋' },
      { value: 'reel_normal',    label: 'Réel normal',       hint: 'Mensuelle',                icon: '📑' },
      { value: 'mini_reel',      label: 'Mini-réel',         hint: 'TVA mensuelle, IS simpl.', icon: '📊' },
    ]},
    applicable: () => true,
    apply: (v, d) => ({ ...d, regimeTva: v as any }),
  },
  {
    id: 'fiscal_acre',
    category: 'fiscal',
    title: 'Demande d’ACRE (exonération début d’activité) ?',
    help: 'Exonération partielle de charges sociales la 1re année, sous conditions (chômeur indemnisé, < 26 ans, RSA…).',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'oui', label: 'Oui — éligible', icon: '🎯' },
      { value: 'non', label: 'Non',            icon: '➖' },
    ]},
    applicable: () => true,
    apply: (v, d) => ({ ...d, options: { ...d.options, acre: v === 'oui' } }),
  },
  {
    id: 'fiscal_versement_liberatoire',
    category: 'fiscal',
    title: 'Versement libératoire de l’impôt sur le revenu ?',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'oui', label: 'Oui', hint: 'IR + URSSAF ensemble',           icon: '💳' },
      { value: 'non', label: 'Non', hint: 'Déclaration annuelle classique', icon: '➖' },
    ]},
    applicable: (d) => d.forme === 'micro',
    apply: (v, d) => ({ ...d, options: { ...d.options, versementLiberatoireIR: v === 'oui' } }),
  },
  {
    id: 'fiscal_conjoint',
    category: 'fiscal',
    title: 'Conjoint participant à l’activité ?',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'collaborateur', label: 'Collaborateur', hint: 'Statut TNS rattaché', icon: '🤝' },
      { value: 'salarie',       label: 'Salarié',       hint: 'Contrat de travail',  icon: '💼' },
      { value: 'associe',       label: 'Associé',       hint: 'Parts au capital',    icon: '📊' },
      { value: 'aucun',         label: 'Aucun',         icon: '➖' },
    ]},
    applicable: (d) => d.forme === 'micro' || d.forme === 'ei' || d.forme === 'eurl' || d.forme === 'sarl',
    apply: (v, d) => ({ ...d, conjoint: { ...(d.conjoint ?? {}), statut: v as any } }),
  },

  /* ===== EI / MICRO ===== */
  {
    id: 'ei_insaisissabilite',
    category: 'fiscal',
    title: 'Insaisissabilité — biens fonciers',
    help: 'Résidence principale insaisissable de droit (loi Macron). Vous pouvez étendre l\'insaisissabilité à d\'autres biens fonciers (déclaration notariée), OU renoncer à l\'insaisissabilité automatique (déconseillé).',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'auto',     label: 'RP automatique', hint: 'Par défaut (recommandé)',     icon: '🏡' },
      { value: 'etendre',  label: 'Étendre',        hint: 'Déclaration notariée',         icon: '🏘️' },
      { value: 'renoncer', label: 'Renoncer',       hint: 'Risque patrimonial',           icon: '⚠️' },
    ]},
    applicable: (d) => d.forme === 'micro' || d.forme === 'ei',
    apply: (v, d) => ({
      ...d,
      options: {
        ...(d.options ?? {}),
        insaisissabiliteResidencePrincipale: v === 'renoncer' ? 'declaration_renoncee' : 'auto',
      } as any,
      ei: { ...(d.ei ?? {}), insaisissabiliteResidencePrincipale: v !== 'renoncer', declarationInsaisissabiliteAutre: v === 'etendre' ? 'À préciser' : undefined },
    }),
  },
  {
    id: 'micro_nature_activite',
    category: 'activite',
    title: 'Nature juridique de l\'activité',
    help: 'Détermine la caisse sociale et le régime BIC/BNC. Une activité commerciale + une activité artisanale = activité mixte, déclarez l\'activité principale.',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'commerciale', label: 'Commerciale', hint: 'Achat/revente, services aux entreprises (BIC)', icon: '🛍️' },
      { value: 'artisanale',  label: 'Artisanale',  hint: 'Production / fabrication / coiffure / BTP (BIC)', icon: '🔨' },
      { value: 'liberale',    label: 'Libérale',    hint: 'Prestations intellectuelles, conseil (BNC)',      icon: '💼' },
      { value: 'agricole',    label: 'Agricole',    hint: 'MSA — rare en micro',                              icon: '🌾' },
    ]},
    applicable: (d) => d.forme === 'micro' || d.forme === 'ei',
    apply: (v, d) => ({ ...d, natureActivite: v as any }),
  },
  {
    id: 'micro_artisan_qualification',
    category: 'activite',
    title: 'Qualification professionnelle (activité artisanale)',
    help: 'Pour les artisans : diplôme, CAP/BEP, expérience ≥ 3 ans. Obligatoire pour BTP, coiffure, esthétique, mécanique, alimentaire.',
    field: { kind: 'choice', columns: 3, visual: 'tiles', options: [
      { value: 'diplome',    label: 'Diplôme/CAP', icon: '🎓' },
      { value: 'experience', label: 'Expérience ≥ 3 ans', icon: '⏳' },
      { value: 'non_requis', label: 'Non requis',  icon: '➖' },
    ]},
    applicable: (d) => (d.forme === 'micro' || d.forme === 'ei') && (d.natureActivite as any) === 'artisanale',
    apply: (v, d) => ({ ...d, options: { ...(d.options ?? {}), qualificationArtisan: v } as any }),
  },
  {
    id: 'micro_lieu_exercice',
    category: 'siege',
    title: 'Lieu principal d\'exercice',
    help: 'Où réalisez-vous l\'activité ? Distinct du siège si vous travaillez chez vos clients.',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'siege',         label: 'Au siège',           icon: '🏠' },
      { value: 'chez_clients',  label: 'Chez les clients',   icon: '🚗' },
      { value: 'ambulant',      label: 'Ambulant / marchés', icon: '🚐' },
      { value: 'mixte',         label: 'Mixte',              icon: '🔀' },
    ]},
    applicable: (d) => d.forme === 'micro' || d.forme === 'ei',
    apply: (v, d) => ({ ...d, options: { ...(d.options ?? {}), lieuExercice: v, ambulant: v === 'ambulant' } as any }),
  },
  {
    id: 'micro_email',
    category: 'identite',
    title: 'Email pour les correspondances officielles',
    help: 'INPI, URSSAF, Impôts — utilisé pour transmettre votre SIRET, attestations, échéances.',
    field: { kind: 'email' },
    applicable: () => true,
    validateStep: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '')) ? [] : ['Email valide requis.'],
    apply: (v, d) => {
      const dir = d.dirigeants?.[0] ?? { type: 'personne_physique' as const, fonction: 'gerant' as const, personne: {} };
      const personne = { ...(dir.personne ?? {}), email: v };
      return { ...d, dirigeants: [{ ...dir, personne }, ...(d.dirigeants ?? []).slice(1)] };
    },
  },
  {
    id: 'micro_telephone',
    category: 'identite',
    title: 'Téléphone',
    help: 'Joignable par l\'INPI ou la SSI le cas échéant.',
    field: { kind: 'tel' },
    applicable: () => true,
    validateStep: (v) => String(v ?? '').replace(/\D/g, '').length >= 9 ? [] : ['Téléphone à 10 chiffres requis.'],
    apply: (v, d) => {
      const dir = d.dirigeants?.[0] ?? { type: 'personne_physique' as const, fonction: 'gerant' as const, personne: {} };
      const personne = { ...(dir.personne ?? {}), telephone: v };
      return { ...d, dirigeants: [{ ...dir, personne }, ...(d.dirigeants ?? []).slice(1)] };
    },
  },
  {
    id: 'micro_conjoint_identite',
    category: 'gouvernance',
    title: 'Identité du conjoint collaborateur',
    help: 'Obligatoire si vous avez déclaré un conjoint collaborateur — sera affilié à la SSI/CIPAV.',
    field: { kind: 'persons', subject: 'dirigeants' as any },
    applicable: (d) => (d.conjoint as any)?.statut === 'collaborateur',
    apply: (v, d) => ({ ...d, conjoint: { ...(d.conjoint ?? {}), personne: v?.[0]?.personne } as any }),
  },

  /* ===== BÉNÉFICIAIRES EFFECTIFS ===== */
  {
    id: 'rbe_declaration',
    category: 'rbe',
    title: 'Déclaration des bénéficiaires effectifs',
    help: 'Toute personne physique détenant > 25 % du capital ou droits de vote, OU exerçant un contrôle. À défaut, le représentant légal.',
    field: { kind: 'persons', subject: 'beneficiaires' },
    applicable: (d) => !!d.forme && FORMES[d.forme].rbeObligatoire,
    validateStep: (v) => {
      const arr = v as Array<{ personne?: any; pctCapital?: number; qualite?: string }>;
      const errs: string[] = [];
      if (!arr?.length) errs.push('Au moins un bénéficiaire effectif requis (à défaut : représentant légal).');
      const totalPct = arr?.reduce((s, b) => s + (Number(b.pctCapital) || 0), 0) ?? 0;
      if (totalPct > 100.01) errs.push(`Somme % capital = ${totalPct}% (max 100%).`);
      arr?.forEach((b, i) => { if (!b.qualite) errs.push(`Bénéficiaire #${i + 1} : qualité de contrôle requise.`); });
      arr?.forEach((b, i) => validatePersonneErrors(b.personne, `Bénéficiaire #${i + 1}`).forEach((e) => errs.push(e)));
      return errs;
    },
    apply: (v, d) => ({ ...d, beneficiairesEffectifs: v as any }),
  },

  /* ===== ANNONCE LÉGALE ===== */
  {
    id: 'jal_choix',
    category: 'societe',
    title: 'Journal d’Annonces Légales',
    help: 'Choix d’un journal habilité du département du siège. Nous nous chargeons de la publication.',
    field: { kind: 'choice', columns: 2, visual: 'tiles', options: [
      { value: 'swivo_choisit', label: 'Sélection auto', hint: 'Le moins cher du département', icon: '🤖' },
      { value: 'specifier',     label: 'Je précise',     hint: 'Journal de mon choix',         icon: '📰' },
    ]},
    applicable: (d) => !!d.forme && FORMES[d.forme].annonceLegaleObligatoire,
    apply: (v, d) => ({ ...d, annonceLegale: { ...(d.annonceLegale ?? {}), journal: v === 'swivo_choisit' ? 'auto' : 'à préciser' } }),
  },

  /* ===== PIÈCES JUSTIFICATIVES (upload réel) ===== */
  {
    id: 'docs_upload',
    category: 'mandat',
    title: 'Téléversez vos pièces justificatives',
    help: 'Vous pouvez aussi le faire plus tard depuis votre espace. Les obligatoires sont nécessaires pour la transmission INPI.',
    field: { kind: 'documents-upload' },
    applicable: () => true,
    apply: (_, d) => d,
  },

  /* ===== MANDAT ===== */
  {
    id: 'mandat_accept',
    category: 'mandat',
    title: 'Mandat de dépôt INPI',
    help: 'Indispensable : nous transmettons votre dossier en votre nom au Guichet unique.',
    field: { kind: 'mandat-accept' },
    applicable: () => true,
    validateStep: (v) => v ? [] : ['Vous devez accepter le mandat pour la transmission au Guichet unique.'],
    apply: (v, d) => v ? accepterMandat(d) : ({ ...d, mandat: buildMandat() }),
  },

  /* ===== RÉCAP FINAL ===== */
  {
    id: 'final_recap',
    category: 'recap',
    title: 'Récapitulatif & score de conformité',
    field: { kind: 'recap' },
    applicable: () => true,
    apply: (_, d) => d,
  },
];

/* ====== ORDONNANCEMENT DYNAMIQUE ====== */
export function nextQuestion(d: Dossier, currentId?: string): Question | null {
  const p = computeProfil(d);
  const idx = currentId ? QUESTIONS.findIndex((q) => q.id === currentId) : -1;
  for (let i = idx + 1; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i]!;
    if (q.applicable(d, p)) return q;
  }
  return null;
}

export function previousQuestion(d: Dossier, currentId: string): Question | null {
  const p = computeProfil(d);
  const idx = QUESTIONS.findIndex((q) => q.id === currentId);
  for (let i = idx - 1; i >= 0; i--) {
    const q = QUESTIONS[i]!;
    if (q.applicable(d, p)) return q;
  }
  return null;
}

export function totalQuestions(d: Dossier): number {
  const p = computeProfil(d);
  return QUESTIONS.filter((q) => q.applicable(d, p)).length;
}

export function questionIndex(d: Dossier, currentId: string): number {
  const p = computeProfil(d);
  const visibles = QUESTIONS.filter((q) => q.applicable(d, p));
  return visibles.findIndex((q) => q.id === currentId);
}

/**
 * Returns the value already stored in the dossier for a given question id.
 * Used to prefill form inputs when resuming a draft.
 */
export function currentValue(d: Dossier, qid: string): any {
  const o: any = d.options ?? {};
  switch (qid) {
    case 'p_associes':                 return d.associes?.length ? String(Math.min(3, d.associes.length)) : undefined;
    case 'p_activite_categorie':       return d.activites?.[0]?.categorie;
    case 'p_levee':                    return o._levee;
    case 'p_ca':                       return o._caEstime != null ? String(o._caEstime) : undefined;
    case 'p_patrimoine':               return o._patrimoine;
    case 'p_social':                   return o._social;
    case 'p_fiscal':                   return o._fiscal;
    case 'forme_override':             return o._formeChosen ? 'keep' : undefined;
    case 'act_description':            return d.activites?.[0]?.description;
    case 'act_reglementation':         return d.activites?.[0]?.qualificationProfessionnelle?.diplome ? 'diplome' : d.activites?.[0]?.qualificationProfessionnelle?.experienceAnnees ? 'experience' : undefined;
    case 'soc_denomination':           return d.denomination;
    case 'soc_sigle':                  return d.sigle;
    case 'soc_objet':                  return d.objetSocial;
    case 'soc_duree':                  return d.duree;
    case 'soc_cloture':                return d.dateClotureExercice;
    case 'siege_mode':                 return d.etablissementPrincipal?.domiciliation;
    case 'siege_adresse':              return d.etablissementPrincipal?.adresse;
    case 'siege_dom_societe': {
      const s = d.etablissementPrincipal?.societeDomiciliation;
      return s ? `${s.denomination ?? ''} — ${s.siren ?? ''} — ${s.agrementPrefecture ?? ''}` : undefined;
    }
    case 'siege_date_debut':           return d.etablissementPrincipal?.dateDebutActivite;
    case 'cap_montant':                return d.capital?.montantTotal;
    case 'cap_type':                   return d.capital?.type;
    case 'cap_apports':                return d.associes;
    case 'cap_depot':                  return d.depotCapital?.etablissement;
    case 'cap_iban':                   return d.depotCapital?.iban;
    case 'gov_dirigeants':             return d.dirigeants;
    case 'gov_associes_identite':      return d.associes;
    case 'fiscal_regime':              return d.regimeFiscal;
    case 'fiscal_tva':                 return d.regimeTva;
    case 'fiscal_acre':                return d.options?.acre === undefined ? undefined : (d.options.acre ? 'oui' : 'non');
    case 'fiscal_versement_liberatoire': return d.options?.versementLiberatoireIR === undefined ? undefined : (d.options.versementLiberatoireIR ? 'oui' : 'non');
    case 'fiscal_conjoint':            return d.conjoint?.statut;
    case 'ei_insaisissabilite':       return d.ei?.declarationInsaisissabiliteAutre ? 'etendre' : (d.ei?.insaisissabiliteResidencePrincipale ? 'rp_seule' : undefined);
    case 'rbe_declaration':            return d.beneficiairesEffectifs;
    case 'jal_choix':                  return d.annonceLegale?.journal === 'auto' ? 'swivo_choisit' : (d.annonceLegale?.journal ? 'specifier' : undefined);
    case 'mandat_accept':              return !!d.mandat?.accepte;
    default:                           return undefined;
  }
}

/** Save the currently active step id into the dossier for later resume. */
export function withLastStep(d: Dossier, stepId: string): Dossier {
  return { ...d, options: { ...(d.options ?? {}), _lastStepId: stepId } as any };
}

export function lastStepId(d: Dossier): string | undefined {
  return (d.options as any)?._lastStepId;
}

/* ====== HELPERS ====== */
export function newDossier(): Dossier {
  return {
    ...EMPTY_DOSSIER,
    forme: 'micro',
    activites: [],
    associes: [emptyAssocie()],
    dirigeants: [],
    beneficiairesEffectifs: [],
    options: {},
  };
}

export function computeProfil(d: Dossier): Profil {
  const base = profilDepuisDossier(d);
  const o: any = d.options ?? {};
  return {
    ...base,
    leveeFonds: o._levee,
    caPrevisionnel: o._caEstime,
    patrimoinePerso: o._patrimoine,
    protectionSociale: o._social,
    fiscalite: o._fiscal,
    conjointParticipe: d.conjoint?.statut && d.conjoint.statut !== 'aucun',
  };
}

export function rapportFinal(d: Dossier) {
  const docs = documentsRequis(d);
  const report = validate(d);
  const top = recommander(computeProfil(d));
  return { documents: docs, validation: report, alternativesForme: top };
}

function emptyAssocie(): Associe {
  return { type: 'personne_physique', apport: { numeraire: 0 } };
}

function validatePersonneErrors(p: any, label: string): string[] {
  const errs: string[] = [];
  if (!p) { errs.push(`${label} : informations manquantes.`); return errs; }
  if (!p.prenom || p.prenom.trim().length < 2) errs.push(`${label} : prénom requis.`);
  if (!p.nom || p.nom.trim().length < 2) errs.push(`${label} : nom requis.`);
  if (!p.dateNaissance) errs.push(`${label} : date de naissance requise.`);
  else if (!Check.majeur(p.dateNaissance)) errs.push(`${label} : doit être majeur.`);
  if (!p.lieuNaissance) errs.push(`${label} : lieu de naissance requis.`);
  if (!p.nationalite || p.nationalite.length !== 3) errs.push(`${label} : nationalité ISO-3 requise (ex : FRA).`);
  if (p.email && !Check.email(p.email)) errs.push(`${label} : email invalide.`);
  return errs;
}

function upsertActivite(d: Dossier, patch: Partial<Dossier['activites'][number]>): Dossier {
  const arr = [...(d.activites ?? [])];
  const cur = arr[0] ?? { categorie: 'liberale_non_reglementee' as const, description: '' };
  arr[0] = { ...cur, ...patch };
  return { ...d, activites: arr };
}
