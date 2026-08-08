/*
  Mini-formations & guides pour micro-entrepreneurs.
  Format texte avec étapes / checklists. Vidéos ajoutées plus tard.
*/

export type FormationLevel = 'debutant' | 'intermediaire' | 'avance';
export type FormationCategory = 'demarrage' | 'commercial' | 'fiscalite' | 'gestion' | 'croissance';

export type FormationStep = {
  title: string;
  body: string;
  duration?: string;
};

export type ExplainerSlide = {
  emoji: string;
  title: string;
  narration: string;        // texte lu par TTS (~10-15s par slide)
  bullets?: string[];       // points clés affichés
  accent?: 'primary' | 'secondary' | 'accent';
};

export type ExplainerScript = {
  totalDuration: string;    // "1 min 30"
  voice?: 'fr-FR';
  rate?: number;            // vitesse TTS (1 = normal)
  slides: ExplainerSlide[];
};

export type Formation = {
  slug: string;
  title: string;
  excerpt: string;
  category: FormationCategory;
  level: FormationLevel;
  duration: string;
  icon: string;
  premium?: boolean;
  /** URL d'une vidéo MP4 (Synthesia/HeyGen/D-ID/auto-hébergée). Prioritaire si défini. */
  videoUrl?: string;
  /** Poster image pour <video>. */
  videoPoster?: string;
  /** Fallback explainer animé + narration TTS si pas de videoUrl. */
  explainer?: ExplainerScript;
  steps: FormationStep[];
};

export const CATEGORY_LABEL: Record<FormationCategory, string> = {
  demarrage: '🚀 Démarrage',
  commercial: '🤝 Commercial',
  fiscalite: '🧾 Fiscalité',
  gestion: '📊 Gestion',
  croissance: '📈 Croissance',
};

export const LEVEL_LABEL: Record<FormationLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

export const FORMATIONS: Formation[] = [
  {
    slug: 'premiers-clients',
    title: 'Trouver ses premiers clients en 30 jours',
    excerpt: 'Méthode complète pour décrocher vos 3 premiers clients sans budget pub.',
    category: 'commercial',
    level: 'debutant',
    duration: '15 min',
    icon: '🎯',
    explainer: {
      totalDuration: '1 min 20',
      voice: 'fr-FR',
      rate: 1.05,
      slides: [
        {
          emoji: '👋',
          title: 'Salut !',
          narration: 'Salut ! En 1 minute 20, tu vas savoir comment décrocher tes 3 premiers clients en 30 jours.',
          accent: 'primary',
        },
        {
          emoji: '🎯',
          title: 'Une cible ultra précise',
          narration: 'Un client idéal précis, c\'est 5 fois plus de réponses. Secteur, taille, décideur, problème résolu.',
          bullets: ['Secteur', 'Taille', 'Décideur', 'Problème'],
          accent: 'primary',
        },
        {
          emoji: '📋',
          title: '50 prospects qualifiés',
          narration: 'Liste 50 prospects sur LinkedIn ou societe.com. Note un signal récent pour chacun.',
          bullets: ['LinkedIn', 'societe.com', 'Signal récent'],
          accent: 'secondary',
        },
        {
          emoji: '✉️',
          title: 'Email court qui convertit',
          narration: 'Objet personnalisé, accroche sur un signal, une seule question simple. 8 à 15 % de réponse.',
          bullets: ['Objet perso', 'Accroche signal', 'Question simple'],
          accent: 'secondary',
        },
        {
          emoji: '🤝',
          title: 'Le call qui ferme',
          narration: '80 % d\'écoute, devis sous 24 heures via Swivo, acompte 30 %. Et c\'est dans la poche.',
          bullets: ['80 % écoute', 'Devis < 24 h', 'Acompte 30 %'],
          accent: 'accent',
        },
        {
          emoji: '🚀',
          title: 'À toi de jouer',
          narration: 'La méthode complète est juste en dessous. Bonne prospection !',
          accent: 'primary',
        },
      ],
    },
    steps: [
      { title: 'Définir son ICP (Ideal Customer Profile)', duration: '3 min',
        body: 'Avant de prospecter, sachez à qui vous parlez. Un ICP précis = 5× plus de réponses.\n\n→ Notez : secteur, taille entreprise, fonction décideur, problème que vous résolvez, budget moyen.\n→ Exemple : "Agences web de 5-15 personnes à Lyon, qui galèrent à recruter des devs React seniors."\n\nChecklist : ✅ secteur précis · ✅ persona décideur · ✅ douleur identifiée · ✅ canal préféré (LinkedIn, email, événement)' },
      { title: 'Lister 50 prospects qualifiés', duration: '2 min',
        body: 'Sources gratuites : LinkedIn Sales Navigator (essai gratuit), societe.com, annuaires sectoriels, événements meetup.\n\nPour chaque prospect notez : nom décideur, email, page LinkedIn, signal récent (levée, recrutement, post sur le sujet que vous traitez).' },
      { title: 'Rédiger un cold email qui convertit', duration: '4 min',
        body: 'Structure éprouvée :\n1. Ligne d\'objet : courte, personnalisée, sans hype (ex : "Question rapide sur votre roadmap recrutement").\n2. Hook : reférence à un signal récent (1 phrase).\n3. Insight : un constat ou chiffre intéressant lié à leur business (1 phrase).\n4. Proposition : une question simple, pas un pitch (ex : "10 minutes la semaine prochaine pour échanger là-dessus ?").\n5. Signature courte.\n\nTaux de réponse moyen attendu : 8-15 % si personnalisation soignée.' },
      { title: 'Mettre en place le suivi', duration: '3 min',
        body: 'Outil minimal : Notion / Airtable / spreadsheet avec colonnes Statut (envoyé / ouvert / répondu / appel / closed).\n\nRègle d\'or : relance à J+3 puis J+7 puis stop. 3 messages max.' },
      { title: 'Convertir en mission', duration: '3 min',
        body: 'Lors du 1er call : 80 % du temps à écouter, 20 % à proposer.\n→ Comprenez le problème, l\'urgence, le budget.\n→ Envoyez un devis simple sous 24h (utilisez le module Facturation de Swivo).\n→ Demandez un signed devis + acompte 30 % avant démarrage.' },
    ],
  },

  {
    slug: 'fixer-ses-prix',
    title: 'Fixer ses prix sans se sous-estimer',
    excerpt: 'Méthode TJM, forfaits, valeur perçue : pricing qui paie réellement votre temps.',
    category: 'commercial',
    level: 'debutant',
    duration: '12 min',
    icon: '💰',
    steps: [
      { title: 'Calculer son TJM minimum vital',
        body: 'Formule : (revenu net souhaité + URSSAF + impôt + dépenses pro) / nombre de jours facturables.\n\nExemple service BNC :\n- Net souhaité : 2 500 €/mois → 30 000 €/an\n- URSSAF 21,1 % du CA brut\n- Impôt ~10 %\n- Dépenses pro : 200 €/mois\n- Jours facturables réalistes : 12/mois × 11 mois = 132 jours\n\n→ CA brut nécessaire ≈ 50 000 € → TJM minimum ≈ 380 €.\nUtilisez le simulateur Swivo /outils/calculateurs pour ajuster.' },
      { title: 'Benchmarker votre marché',
        body: 'Sources : Malt (filtrer par expérience/lieu), LinkedIn (offres freelance), forums spécialisés, témoignages confrères.\n\nFourchettes 2026 (indicatives) :\n- Dev React junior : 300-450 €/j\n- Dev React senior : 500-750 €/j\n- Designer UX senior : 450-650 €/j\n- Consultant stratégie : 700-1 200 €/j\n- Coach pro : 80-200 €/heure' },
      { title: 'Choisir entre TJM, forfait, abonnement',
        body: 'TJM : simple, indexé au temps. Risque : plafond du temps.\nForfait : fixe par livrable. Risque : sous-estimation, mais marge si efficace.\nAbonnement (retainer) : revenu récurrent. Idéal pour fidéliser et lisser CA.\n\nRègle : commencer en TJM, basculer en forfait dès que vous maîtrisez vos timings.' },
      { title: 'Justifier le prix par la valeur',
        body: 'Le client n\'achète pas votre temps, il achète un résultat. Reformulez votre proposition :\n❌ "Je facture 500€ la journée"\n✅ "Pour 5 000€, je vous livre un site qui convertit 2× mieux que l\'actuel, avec un ROI estimé à 6 mois."\n\nDans vos devis, mentionnez systématiquement : objectif business, livrables, métriques de succès.' },
      { title: 'Ne jamais discounter à l\'aveugle',
        body: 'Si on vous demande -20 %, jamais sans contrepartie :\n- Délai allongé\n- Scope réduit\n- Engagement long (3 mois min)\n- Acompte plus élevé\n- Témoignage public\n\nSinon vous formez votre client à négocier à chaque mission.' },
    ],
  },

  {
    slug: 'optimiser-ca',
    title: 'Optimiser son CA jusqu\'au plafond micro',
    excerpt: 'Stratégies pour atteindre 77 700 € (service) ou 188 700 € (vente) en restant micro.',
    category: 'croissance',
    level: 'intermediaire',
    duration: '18 min',
    icon: '📈',
    steps: [
      { title: 'Comprendre les seuils 2026',
        body: 'Plafonds CA :\n- Vente marchandises : 188 700 €\n- Services BIC/BNC : 77 700 €\n\nSeuils TVA (franchise) :\n- Vente : 85 000 € (tolérance 93 500 €)\n- Services : 37 500 € (tolérance 41 250 €)\n\nDépassement TVA = TVA à facturer dès le mois suivant, comptabilité plus lourde. Anticipez 2 mois à l\'avance via le cockpit Swivo /pilotage.' },
      { title: 'Augmenter votre TJM de 30 %',
        body: 'Le levier le plus rapide. Pour passer de 400 € à 520 €/jour :\n1. Recadrez vos missions sur la valeur (cf. formation "Fixer ses prix").\n2. Spécialisez-vous sur un segment (ex : SaaS B2B vs e-commerce vs santé).\n3. Annoncez votre nouveau prix uniquement aux nouveaux clients pendant 3 mois.\n4. Migrez les existants à la prochaine mission.' },
      { title: 'Vendre du retainer',
        body: 'Un retainer = forfait mensuel pour heures/livrables pré-définis. Avantages :\n- Revenu récurrent prévisible\n- Moins de prospection\n- Marge supérieure (engagement)\n\nProposez à vos 3 meilleurs clients :\n- Forfait 8h/mois @ TJM × 0,8 = - 20 % vs ponctuel\n- Engagement 3 mois minimum, renouvelable\n- Reporting mensuel inclus' },
      { title: 'Diversifier ses sources',
        body: 'Risque de la micro : 80 % du CA chez 1-2 clients. Si l\'un part, tunnel garanti.\n\nObjectif : aucun client > 30 % du CA.\nLeviers : présence LinkedIn régulière, blog/podcast/newsletter, side-projects (formations, templates, SaaS micro), affiliation.' },
      { title: 'Anticiper la sortie du régime',
        body: 'Si vous prévoyez > 77 700 € de service, le passage en EI (sans régime micro) ou SASU devient nécessaire l\'année N+1.\n\nPlanifiez à l\'avance :\n- Stocker des bénéfices pour préfinancer la transition\n- Choisir entre EI au réel simplifié ou SASU\n- Préparer comptable / expert pour la bascule' },
    ],
  },

  {
    slug: 'comptabilite-micro',
    title: 'Comptabilité micro : 1h par mois suffit',
    excerpt: 'Livre des recettes, registre des achats, déclarations. Tout l\'essentiel en 1h/mois.',
    category: 'gestion',
    level: 'debutant',
    duration: '10 min',
    icon: '📊',
    steps: [
      { title: 'Vos seules obligations comptables',
        body: 'La micro est ultra-simplifiée :\n1. Livre des recettes (chronologique, par jour ou semaine)\n2. Registre des achats (uniquement si activité achat-revente)\n3. Conservation des factures clients ET fournisseurs pendant 10 ans\n\nPas de bilan, pas de compte de résultat, pas d\'expert-comptable obligatoire.' },
      { title: 'Compte bancaire dédié (obligatoire si CA > 10 000 €/an pendant 2 ans)',
        body: 'Conseil : ouvrez-le dès le début, même si CA faible. Banques recommandées 2026 :\n- Néobanque pro : Shine, Qonto, BlankBank (15-30 €/mois)\n- Banque traditionnelle : compte basique perso suffisant (≠ pro)\n\nAvantages : traçabilité claire, réception virements pro, exports relevés pour la compta.' },
      { title: 'Le rituel mensuel de 1h',
        body: 'Calendrier suggéré (1er du mois) :\n1. Saisir encaissements du mois précédent dans Swivo /pilotage (5 min)\n2. Marquer factures payées (depuis Facturation) — encaissements créés auto (2 min)\n3. Vérifier alertes seuils (TVA, plafonds) (3 min)\n4. Pré-déclarer URSSAF (5 min)\n5. Sauvegarder factures du mois (PDF) dans cloud (10 min)\n6. Relancer impayés (15 min)\n7. Mettre à jour son TJM/objectifs (10 min)\n\nTotal : ~50 min. Plus jamais de stress fin de trimestre.' },
      { title: 'Déclarer son CA URSSAF',
        body: 'Calendrier :\n- Mensuel : avant le dernier jour du mois M+1\n- Trimestriel : 30 avril / 31 juillet / 31 octobre / 31 janvier\n\nÀ déclarer :\n- CA réellement ENCAISSÉ sur la période (pas le facturé)\n- Par catégorie (vente / service BIC / service BNC)\n- 0 € possible (déclaration obligatoire même si pas d\'activité)\n\nOubli = 56,80 € de pénalité par déclaration manquée.' },
      { title: 'Déclarer aux impôts (mai N+1)',
        body: 'Formulaire 2042-C-PRO, case "Régime micro-entrepreneur".\n\nDeux options :\n1. Versement libératoire (si activé) : impôt déjà payé via URSSAF, juste reporter le CA.\n2. Régime classique : abattement forfaitaire automatique appliqué par le fisc (71 % vente, 50 % service BIC, 34 % BNC). Le reste s\'ajoute à vos autres revenus.' },
    ],
  },

  {
    slug: 'urssaf-comprendre',
    title: 'Comprendre l\'URSSAF en 10 minutes',
    excerpt: 'Calcul des cotisations, ACRE, déclarations : maîtrisez votre URSSAF pour de bon.',
    category: 'fiscalite',
    level: 'debutant',
    duration: '10 min',
    icon: '🧾',
    steps: [
      { title: 'Combien je paie ?',
        body: 'Taux 2026 :\n- Vente marchandises : 12,3 %\n- Service BIC (artisan, prestation commerciale) : 21,2 %\n- Service BNC (libéral non réglementé) : 21,1 %\n- Libéral réglementé CIPAV : 23,2 %\n\n+ CFP (formation pro) : 0,1 à 0,3 % selon catégorie\n+ Taxe pour frais de chambre (artisans CMA, commerçants CCI) : 0,15-0,44 %\n\nExemple : CA service BNC de 5 000 € → URSSAF = 5 000 × 21,3 % = 1 065 €. Net restant : 3 935 €.\n\nUtilisez /outils/calculateurs ou /urssaf pour simuler.' },
      { title: 'Ce que couvrent les cotisations',
        body: '- Assurance maladie-maternité\n- Allocations familiales\n- Retraite de base + complémentaire\n- Invalidité-décès\n- CSG-CRDS\n\nNon couvert : chômage, mutuelle complémentaire, prévoyance lourde, retraite chapeau. À souscrire à part si besoin.' },
      { title: 'L\'ACRE — économisez 50 % la 1ère année',
        body: 'Exonération de 50 % des cotisations URSSAF pendant la 1ère année.\n\nÉligibilité :\n- Demandeur d\'emploi indemnisé ou inscrit Pôle Emploi\n- Bénéficiaire RSA / ASS / ATA\n- Moins de 26 ans (ou 30 si reconnu handicapé)\n- Repreneur d\'entreprise en difficulté\n- Personne créant en ZUS / quartier prioritaire\n\nDemande : formulaire ACRE à transmettre URSSAF dans les 45 jours suivant immatriculation. Économie moyenne : 1 000-2 500 € la 1ère année.' },
      { title: 'Le versement libératoire de l\'impôt',
        body: 'Option : payer l\'IR au fil de l\'eau en même temps que les cotisations URSSAF.\nTaux supplémentaires :\n- Vente : 1 %\n- Service BIC : 1,7 %\n- BNC : 2,2 %\n\nÉligibilité : Revenu fiscal de référence N-2 < 27 478 € par part (chiffre 2026).\n\nAvantage : pas de bonne surprise en mai. Inconvénient : si vous êtes peu imposé, vous payez plus.\nÀ choisir lors de l\'immatriculation OU avant le 30 septembre pour l\'année N+1.' },
      { title: 'Que faire si je ne peux pas payer',
        body: 'Premier réflexe : ne JAMAIS ignorer un appel URSSAF.\n\nDémarches :\n1. Appeler le 3957 (numéro URSSAF) — proposition de délai possible\n2. Demande de remise gracieuse de majorations\n3. Modulation du calendrier (étalement sur 12 mois max)\n4. Aide CAF / Caisse complémentaire si situation difficile\n\nDernier recours : commission de recours amiable de votre URSSAF régionale.' },
    ],
  },

  {
    slug: 'passer-en-societe',
    title: 'Quand et comment passer en société (EURL, SASU)',
    excerpt: 'Signaux pour quitter la micro, choix de structure, démarches concrètes.',
    category: 'croissance',
    level: 'avance',
    duration: '20 min',
    icon: '🏢',
    premium: true,
    steps: [
      { title: '5 signaux qu\'il faut passer en société',
        body: '1. Vous approchez 80 % du plafond CA (~62 000 € service ou 150 000 € vente).\n2. Vous embauchez (la micro permet 1 salarié, mais c\'est très contraint).\n3. Vous avez besoin de protection patrimoniale renforcée (clients gros risque).\n4. Vous voulez optimiser fiscalement (charges déductibles, IS à 15 %).\n5. Vous cherchez des investisseurs ou un associé.' },
      { title: 'EURL vs SASU : la vraie comparaison',
        body: 'EURL :\n+ Cotisations TNS ~45 % rémunération nette\n+ IS optionnel\n+ Charges déductibles\n- Couverture sociale TNS (santé OK, retraite faible)\n\nSASU :\n+ Couverture régime général (assimilé salarié)\n+ Pas de cotisations si pas de rémunération (dividendes uniquement)\n+ Image plus "société"\n- Cotisations ~80 % sur la rémunération brute\n- Plus complexe (statuts, AG, dépôt comptes)\n\nRègle empirique : revenus < 30 k€ → EURL ; > 50 k€ → SASU (avec rémunération basse + dividendes).' },
      { title: 'Préparer la transition',
        body: '1. Pendant les 6 derniers mois en micro : capitaliser un bénéfice (sera votre apport en capital de la nouvelle société).\n2. Choisir un expert-comptable (200-400 €/mois pour SASU).\n3. Préparer les statuts (Swivo ne fait pas SASU pour l\'instant — utilisez Captain Contrat, Legalstart, ou avocat).\n4. Provisionner les frais : annonce légale ~150 €, dépôt capital, INPI ~37 €.\n5. Anticiper le changement de RIB pour clients et URSSAF.' },
      { title: 'Le cap fiscal',
        body: 'Quand vous quittez la micro :\n- Cessation de l\'activité micro = déclaration au Guichet unique INPI\n- Dernière déclaration URSSAF du CA encaissé jusqu\'au jour de cessation\n- Si versement libératoire : passage automatique au réel\n\nCréation de la société peut être faite la veille (continuité d\'activité).\nAttention : les clients en cours doivent être facturés sur la nouvelle entité dès J+1 (nouveau SIRET).' },
      { title: 'Le piège à éviter',
        body: 'Erreur courante : créer la société trop tôt par enthousiasme.\nCoûts SASU = ~3 000 € minimum la 1ère année (compta + URSSAF même sans rémunération + obligations).\n\nLe break-even est à ~35-45 k€ de CA. En dessous, la micro reste imbattable.\n\nUtilisez le simulateur Shine ou Indy "micro vs SASU" pour valider avant de basculer.' },
    ],
  },

  {
    slug: 'checklist-mensuelle',
    title: 'La checklist mensuelle du micro-entrepreneur',
    excerpt: '10 actions répétées chaque mois = jamais d\'oubli, jamais de pénalité.',
    category: 'gestion',
    level: 'debutant',
    duration: '5 min',
    icon: '✅',
    steps: [
      { title: 'Semaine 1 du mois (5-10 du mois)',
        body: '☐ Saisir tous les encaissements du mois précédent\n☐ Réconcilier avec le relevé bancaire pro\n☐ Marquer les factures payées dans Swivo\n☐ Préparer la déclaration URSSAF (mensuel) ou vérifier l\'échéance trimestrielle' },
      { title: 'Semaine 2',
        body: '☐ Émettre les factures du mois précédent qui n\'ont pas encore été facturées\n☐ Envoyer les devis en attente\n☐ Relancer les clients en retard de paiement (J+7 après échéance)' },
      { title: 'Semaine 3',
        body: '☐ Mettre à jour son CRM / pipeline commercial\n☐ Publier au moins 1 contenu (LinkedIn, newsletter, blog)\n☐ Faire 1 démarche de prospection neuve (5-10 prospects)' },
      { title: 'Semaine 4',
        body: '☐ Sauvegarder factures + relevés du mois (dossier cloud + USB)\n☐ Mettre à jour tableau de bord financier (/pilotage)\n☐ Vérifier alertes seuils (TVA, plafond CA)\n☐ Faire un point sur le mois : ce qui a marché / pas marché' },
      { title: 'Bonus trimestriel',
        body: '☐ Renouveler / actualiser ses CGV et mentions légales si changement\n☐ Vérifier que les versements URSSAF prélevés correspondent aux déclarations\n☐ Faire le point sur sa TMI fiscale et optimiser (ACRE échue ? versement libératoire toujours pertinent ?)\n☐ Provisionner l\'impôt sur le revenu (10-20 % du CA selon TMI)' },
    ],
  },
];

export const CATEGORIES: FormationCategory[] = ['demarrage', 'commercial', 'fiscalite', 'gestion', 'croissance'];
