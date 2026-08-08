import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { L as Link } from "./vendor-router-Izd1qo3Q.js";
import { S as Seo } from "../entry-server.js";
import { useParams, useNavigate } from "react-router";
import "react-dom";
import "@remix-run/router";
import "react-dom/server";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./wizard-CbzVLHaR.js";
import "./formalites-DR4taCu5.js";
const CATEGORY_LABEL = {
  demarrage: "🚀 Démarrage",
  commercial: "🤝 Commercial",
  fiscalite: "🧾 Fiscalité",
  gestion: "📊 Gestion",
  croissance: "📈 Croissance"
};
const LEVEL_LABEL = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé"
};
const FORMATIONS = [
  {
    slug: "premiers-clients",
    title: "Trouver ses premiers clients en 30 jours",
    excerpt: "Méthode complète pour décrocher vos 3 premiers clients sans budget pub.",
    category: "commercial",
    level: "debutant",
    duration: "15 min",
    icon: "🎯",
    explainer: {
      totalDuration: "1 min 20",
      voice: "fr-FR",
      rate: 1.05,
      slides: [
        {
          emoji: "👋",
          title: "Salut !",
          narration: "Salut ! En 1 minute 20, tu vas savoir comment décrocher tes 3 premiers clients en 30 jours.",
          accent: "primary"
        },
        {
          emoji: "🎯",
          title: "Une cible ultra précise",
          narration: "Un client idéal précis, c'est 5 fois plus de réponses. Secteur, taille, décideur, problème résolu.",
          bullets: ["Secteur", "Taille", "Décideur", "Problème"],
          accent: "primary"
        },
        {
          emoji: "📋",
          title: "50 prospects qualifiés",
          narration: "Liste 50 prospects sur LinkedIn ou societe.com. Note un signal récent pour chacun.",
          bullets: ["LinkedIn", "societe.com", "Signal récent"],
          accent: "secondary"
        },
        {
          emoji: "✉️",
          title: "Email court qui convertit",
          narration: "Objet personnalisé, accroche sur un signal, une seule question simple. 8 à 15 % de réponse.",
          bullets: ["Objet perso", "Accroche signal", "Question simple"],
          accent: "secondary"
        },
        {
          emoji: "🤝",
          title: "Le call qui ferme",
          narration: "80 % d'écoute, devis sous 24 heures via Swivo, acompte 30 %. Et c'est dans la poche.",
          bullets: ["80 % écoute", "Devis < 24 h", "Acompte 30 %"],
          accent: "accent"
        },
        {
          emoji: "🚀",
          title: "À toi de jouer",
          narration: "La méthode complète est juste en dessous. Bonne prospection !",
          accent: "primary"
        }
      ]
    },
    steps: [
      {
        title: "Définir son ICP (Ideal Customer Profile)",
        duration: "3 min",
        body: 'Avant de prospecter, sachez à qui vous parlez. Un ICP précis = 5× plus de réponses.\n\n→ Notez : secteur, taille entreprise, fonction décideur, problème que vous résolvez, budget moyen.\n→ Exemple : "Agences web de 5-15 personnes à Lyon, qui galèrent à recruter des devs React seniors."\n\nChecklist : ✅ secteur précis · ✅ persona décideur · ✅ douleur identifiée · ✅ canal préféré (LinkedIn, email, événement)'
      },
      {
        title: "Lister 50 prospects qualifiés",
        duration: "2 min",
        body: "Sources gratuites : LinkedIn Sales Navigator (essai gratuit), societe.com, annuaires sectoriels, événements meetup.\n\nPour chaque prospect notez : nom décideur, email, page LinkedIn, signal récent (levée, recrutement, post sur le sujet que vous traitez)."
      },
      {
        title: "Rédiger un cold email qui convertit",
        duration: "4 min",
        body: `Structure éprouvée :
1. Ligne d'objet : courte, personnalisée, sans hype (ex : "Question rapide sur votre roadmap recrutement").
2. Hook : reférence à un signal récent (1 phrase).
3. Insight : un constat ou chiffre intéressant lié à leur business (1 phrase).
4. Proposition : une question simple, pas un pitch (ex : "10 minutes la semaine prochaine pour échanger là-dessus ?").
5. Signature courte.

Taux de réponse moyen attendu : 8-15 % si personnalisation soignée.`
      },
      {
        title: "Mettre en place le suivi",
        duration: "3 min",
        body: "Outil minimal : Notion / Airtable / spreadsheet avec colonnes Statut (envoyé / ouvert / répondu / appel / closed).\n\nRègle d'or : relance à J+3 puis J+7 puis stop. 3 messages max."
      },
      {
        title: "Convertir en mission",
        duration: "3 min",
        body: "Lors du 1er call : 80 % du temps à écouter, 20 % à proposer.\n→ Comprenez le problème, l'urgence, le budget.\n→ Envoyez un devis simple sous 24h (utilisez le module Facturation de Swivo).\n→ Demandez un signed devis + acompte 30 % avant démarrage."
      }
    ]
  },
  {
    slug: "fixer-ses-prix",
    title: "Fixer ses prix sans se sous-estimer",
    excerpt: "Méthode TJM, forfaits, valeur perçue : pricing qui paie réellement votre temps.",
    category: "commercial",
    level: "debutant",
    duration: "12 min",
    icon: "💰",
    steps: [
      {
        title: "Calculer son TJM minimum vital",
        body: "Formule : (revenu net souhaité + URSSAF + impôt + dépenses pro) / nombre de jours facturables.\n\nExemple service BNC :\n- Net souhaité : 2 500 €/mois → 30 000 €/an\n- URSSAF 21,1 % du CA brut\n- Impôt ~10 %\n- Dépenses pro : 200 €/mois\n- Jours facturables réalistes : 12/mois × 11 mois = 132 jours\n\n→ CA brut nécessaire ≈ 50 000 € → TJM minimum ≈ 380 €.\nUtilisez le simulateur Swivo /outils/calculateurs pour ajuster."
      },
      {
        title: "Benchmarker votre marché",
        body: "Sources : Malt (filtrer par expérience/lieu), LinkedIn (offres freelance), forums spécialisés, témoignages confrères.\n\nFourchettes 2026 (indicatives) :\n- Dev React junior : 300-450 €/j\n- Dev React senior : 500-750 €/j\n- Designer UX senior : 450-650 €/j\n- Consultant stratégie : 700-1 200 €/j\n- Coach pro : 80-200 €/heure"
      },
      {
        title: "Choisir entre TJM, forfait, abonnement",
        body: "TJM : simple, indexé au temps. Risque : plafond du temps.\nForfait : fixe par livrable. Risque : sous-estimation, mais marge si efficace.\nAbonnement (retainer) : revenu récurrent. Idéal pour fidéliser et lisser CA.\n\nRègle : commencer en TJM, basculer en forfait dès que vous maîtrisez vos timings."
      },
      {
        title: "Justifier le prix par la valeur",
        body: `Le client n'achète pas votre temps, il achète un résultat. Reformulez votre proposition :
❌ "Je facture 500€ la journée"
✅ "Pour 5 000€, je vous livre un site qui convertit 2× mieux que l'actuel, avec un ROI estimé à 6 mois."

Dans vos devis, mentionnez systématiquement : objectif business, livrables, métriques de succès.`
      },
      {
        title: "Ne jamais discounter à l'aveugle",
        body: "Si on vous demande -20 %, jamais sans contrepartie :\n- Délai allongé\n- Scope réduit\n- Engagement long (3 mois min)\n- Acompte plus élevé\n- Témoignage public\n\nSinon vous formez votre client à négocier à chaque mission."
      }
    ]
  },
  {
    slug: "optimiser-ca",
    title: "Optimiser son CA jusqu'au plafond micro",
    excerpt: "Stratégies pour atteindre 77 700 € (service) ou 188 700 € (vente) en restant micro.",
    category: "croissance",
    level: "intermediaire",
    duration: "18 min",
    icon: "📈",
    steps: [
      {
        title: "Comprendre les seuils 2026",
        body: "Plafonds CA :\n- Vente marchandises : 188 700 €\n- Services BIC/BNC : 77 700 €\n\nSeuils TVA (franchise) :\n- Vente : 85 000 € (tolérance 93 500 €)\n- Services : 37 500 € (tolérance 41 250 €)\n\nDépassement TVA = TVA à facturer dès le mois suivant, comptabilité plus lourde. Anticipez 2 mois à l'avance via le cockpit Swivo /pilotage."
      },
      {
        title: "Augmenter votre TJM de 30 %",
        body: 'Le levier le plus rapide. Pour passer de 400 € à 520 €/jour :\n1. Recadrez vos missions sur la valeur (cf. formation "Fixer ses prix").\n2. Spécialisez-vous sur un segment (ex : SaaS B2B vs e-commerce vs santé).\n3. Annoncez votre nouveau prix uniquement aux nouveaux clients pendant 3 mois.\n4. Migrez les existants à la prochaine mission.'
      },
      {
        title: "Vendre du retainer",
        body: "Un retainer = forfait mensuel pour heures/livrables pré-définis. Avantages :\n- Revenu récurrent prévisible\n- Moins de prospection\n- Marge supérieure (engagement)\n\nProposez à vos 3 meilleurs clients :\n- Forfait 8h/mois @ TJM × 0,8 = - 20 % vs ponctuel\n- Engagement 3 mois minimum, renouvelable\n- Reporting mensuel inclus"
      },
      {
        title: "Diversifier ses sources",
        body: "Risque de la micro : 80 % du CA chez 1-2 clients. Si l'un part, tunnel garanti.\n\nObjectif : aucun client > 30 % du CA.\nLeviers : présence LinkedIn régulière, blog/podcast/newsletter, side-projects (formations, templates, SaaS micro), affiliation."
      },
      {
        title: "Anticiper la sortie du régime",
        body: "Si vous prévoyez > 77 700 € de service, le passage en EI (sans régime micro) ou SASU devient nécessaire l'année N+1.\n\nPlanifiez à l'avance :\n- Stocker des bénéfices pour préfinancer la transition\n- Choisir entre EI au réel simplifié ou SASU\n- Préparer comptable / expert pour la bascule"
      }
    ]
  },
  {
    slug: "comptabilite-micro",
    title: "Comptabilité micro : 1h par mois suffit",
    excerpt: "Livre des recettes, registre des achats, déclarations. Tout l'essentiel en 1h/mois.",
    category: "gestion",
    level: "debutant",
    duration: "10 min",
    icon: "📊",
    steps: [
      {
        title: "Vos seules obligations comptables",
        body: "La micro est ultra-simplifiée :\n1. Livre des recettes (chronologique, par jour ou semaine)\n2. Registre des achats (uniquement si activité achat-revente)\n3. Conservation des factures clients ET fournisseurs pendant 10 ans\n\nPas de bilan, pas de compte de résultat, pas d'expert-comptable obligatoire."
      },
      {
        title: "Compte bancaire dédié (obligatoire si CA > 10 000 €/an pendant 2 ans)",
        body: "Conseil : ouvrez-le dès le début, même si CA faible. Banques recommandées 2026 :\n- Néobanque pro : Shine, Qonto, BlankBank (15-30 €/mois)\n- Banque traditionnelle : compte basique perso suffisant (≠ pro)\n\nAvantages : traçabilité claire, réception virements pro, exports relevés pour la compta."
      },
      {
        title: "Le rituel mensuel de 1h",
        body: "Calendrier suggéré (1er du mois) :\n1. Saisir encaissements du mois précédent dans Swivo /pilotage (5 min)\n2. Marquer factures payées (depuis Facturation) — encaissements créés auto (2 min)\n3. Vérifier alertes seuils (TVA, plafonds) (3 min)\n4. Pré-déclarer URSSAF (5 min)\n5. Sauvegarder factures du mois (PDF) dans cloud (10 min)\n6. Relancer impayés (15 min)\n7. Mettre à jour son TJM/objectifs (10 min)\n\nTotal : ~50 min. Plus jamais de stress fin de trimestre."
      },
      {
        title: "Déclarer son CA URSSAF",
        body: "Calendrier :\n- Mensuel : avant le dernier jour du mois M+1\n- Trimestriel : 30 avril / 31 juillet / 31 octobre / 31 janvier\n\nÀ déclarer :\n- CA réellement ENCAISSÉ sur la période (pas le facturé)\n- Par catégorie (vente / service BIC / service BNC)\n- 0 € possible (déclaration obligatoire même si pas d'activité)\n\nOubli = 56,80 € de pénalité par déclaration manquée."
      },
      {
        title: "Déclarer aux impôts (mai N+1)",
        body: `Formulaire 2042-C-PRO, case "Régime micro-entrepreneur".

Deux options :
1. Versement libératoire (si activé) : impôt déjà payé via URSSAF, juste reporter le CA.
2. Régime classique : abattement forfaitaire automatique appliqué par le fisc (71 % vente, 50 % service BIC, 34 % BNC). Le reste s'ajoute à vos autres revenus.`
      }
    ]
  },
  {
    slug: "urssaf-comprendre",
    title: "Comprendre l'URSSAF en 10 minutes",
    excerpt: "Calcul des cotisations, ACRE, déclarations : maîtrisez votre URSSAF pour de bon.",
    category: "fiscalite",
    level: "debutant",
    duration: "10 min",
    icon: "🧾",
    steps: [
      {
        title: "Combien je paie ?",
        body: "Taux 2026 :\n- Vente marchandises : 12,3 %\n- Service BIC (artisan, prestation commerciale) : 21,2 %\n- Service BNC (libéral non réglementé) : 21,1 %\n- Libéral réglementé CIPAV : 23,2 %\n\n+ CFP (formation pro) : 0,1 à 0,3 % selon catégorie\n+ Taxe pour frais de chambre (artisans CMA, commerçants CCI) : 0,15-0,44 %\n\nExemple : CA service BNC de 5 000 € → URSSAF = 5 000 × 21,3 % = 1 065 €. Net restant : 3 935 €.\n\nUtilisez /outils/calculateurs ou /urssaf pour simuler."
      },
      {
        title: "Ce que couvrent les cotisations",
        body: "- Assurance maladie-maternité\n- Allocations familiales\n- Retraite de base + complémentaire\n- Invalidité-décès\n- CSG-CRDS\n\nNon couvert : chômage, mutuelle complémentaire, prévoyance lourde, retraite chapeau. À souscrire à part si besoin."
      },
      {
        title: "L'ACRE — économisez 50 % la 1ère année",
        body: "Exonération de 50 % des cotisations URSSAF pendant la 1ère année.\n\nÉligibilité :\n- Demandeur d'emploi indemnisé ou inscrit Pôle Emploi\n- Bénéficiaire RSA / ASS / ATA\n- Moins de 26 ans (ou 30 si reconnu handicapé)\n- Repreneur d'entreprise en difficulté\n- Personne créant en ZUS / quartier prioritaire\n\nDemande : formulaire ACRE à transmettre URSSAF dans les 45 jours suivant immatriculation. Économie moyenne : 1 000-2 500 € la 1ère année."
      },
      {
        title: "Le versement libératoire de l'impôt",
        body: "Option : payer l'IR au fil de l'eau en même temps que les cotisations URSSAF.\nTaux supplémentaires :\n- Vente : 1 %\n- Service BIC : 1,7 %\n- BNC : 2,2 %\n\nÉligibilité : Revenu fiscal de référence N-2 < 27 478 € par part (chiffre 2026).\n\nAvantage : pas de bonne surprise en mai. Inconvénient : si vous êtes peu imposé, vous payez plus.\nÀ choisir lors de l'immatriculation OU avant le 30 septembre pour l'année N+1."
      },
      {
        title: "Que faire si je ne peux pas payer",
        body: "Premier réflexe : ne JAMAIS ignorer un appel URSSAF.\n\nDémarches :\n1. Appeler le 3957 (numéro URSSAF) — proposition de délai possible\n2. Demande de remise gracieuse de majorations\n3. Modulation du calendrier (étalement sur 12 mois max)\n4. Aide CAF / Caisse complémentaire si situation difficile\n\nDernier recours : commission de recours amiable de votre URSSAF régionale."
      }
    ]
  },
  {
    slug: "passer-en-societe",
    title: "Quand et comment passer en société (EURL, SASU)",
    excerpt: "Signaux pour quitter la micro, choix de structure, démarches concrètes.",
    category: "croissance",
    level: "avance",
    duration: "20 min",
    icon: "🏢",
    premium: true,
    steps: [
      {
        title: "5 signaux qu'il faut passer en société",
        body: "1. Vous approchez 80 % du plafond CA (~62 000 € service ou 150 000 € vente).\n2. Vous embauchez (la micro permet 1 salarié, mais c'est très contraint).\n3. Vous avez besoin de protection patrimoniale renforcée (clients gros risque).\n4. Vous voulez optimiser fiscalement (charges déductibles, IS à 15 %).\n5. Vous cherchez des investisseurs ou un associé."
      },
      {
        title: "EURL vs SASU : la vraie comparaison",
        body: 'EURL :\n+ Cotisations TNS ~45 % rémunération nette\n+ IS optionnel\n+ Charges déductibles\n- Couverture sociale TNS (santé OK, retraite faible)\n\nSASU :\n+ Couverture régime général (assimilé salarié)\n+ Pas de cotisations si pas de rémunération (dividendes uniquement)\n+ Image plus "société"\n- Cotisations ~80 % sur la rémunération brute\n- Plus complexe (statuts, AG, dépôt comptes)\n\nRègle empirique : revenus < 30 k€ → EURL ; > 50 k€ → SASU (avec rémunération basse + dividendes).'
      },
      {
        title: "Préparer la transition",
        body: "1. Pendant les 6 derniers mois en micro : capitaliser un bénéfice (sera votre apport en capital de la nouvelle société).\n2. Choisir un expert-comptable (200-400 €/mois pour SASU).\n3. Préparer les statuts (Swivo ne fait pas SASU pour l'instant — utilisez Captain Contrat, Legalstart, ou avocat).\n4. Provisionner les frais : annonce légale ~150 €, dépôt capital, INPI ~37 €.\n5. Anticiper le changement de RIB pour clients et URSSAF."
      },
      {
        title: "Le cap fiscal",
        body: "Quand vous quittez la micro :\n- Cessation de l'activité micro = déclaration au Guichet unique INPI\n- Dernière déclaration URSSAF du CA encaissé jusqu'au jour de cessation\n- Si versement libératoire : passage automatique au réel\n\nCréation de la société peut être faite la veille (continuité d'activité).\nAttention : les clients en cours doivent être facturés sur la nouvelle entité dès J+1 (nouveau SIRET)."
      },
      {
        title: "Le piège à éviter",
        body: 'Erreur courante : créer la société trop tôt par enthousiasme.\nCoûts SASU = ~3 000 € minimum la 1ère année (compta + URSSAF même sans rémunération + obligations).\n\nLe break-even est à ~35-45 k€ de CA. En dessous, la micro reste imbattable.\n\nUtilisez le simulateur Shine ou Indy "micro vs SASU" pour valider avant de basculer.'
      }
    ]
  },
  {
    slug: "checklist-mensuelle",
    title: "La checklist mensuelle du micro-entrepreneur",
    excerpt: "10 actions répétées chaque mois = jamais d'oubli, jamais de pénalité.",
    category: "gestion",
    level: "debutant",
    duration: "5 min",
    icon: "✅",
    steps: [
      {
        title: "Semaine 1 du mois (5-10 du mois)",
        body: "☐ Saisir tous les encaissements du mois précédent\n☐ Réconcilier avec le relevé bancaire pro\n☐ Marquer les factures payées dans Swivo\n☐ Préparer la déclaration URSSAF (mensuel) ou vérifier l'échéance trimestrielle"
      },
      {
        title: "Semaine 2",
        body: "☐ Émettre les factures du mois précédent qui n'ont pas encore été facturées\n☐ Envoyer les devis en attente\n☐ Relancer les clients en retard de paiement (J+7 après échéance)"
      },
      {
        title: "Semaine 3",
        body: "☐ Mettre à jour son CRM / pipeline commercial\n☐ Publier au moins 1 contenu (LinkedIn, newsletter, blog)\n☐ Faire 1 démarche de prospection neuve (5-10 prospects)"
      },
      {
        title: "Semaine 4",
        body: "☐ Sauvegarder factures + relevés du mois (dossier cloud + USB)\n☐ Mettre à jour tableau de bord financier (/pilotage)\n☐ Vérifier alertes seuils (TVA, plafond CA)\n☐ Faire un point sur le mois : ce qui a marché / pas marché"
      },
      {
        title: "Bonus trimestriel",
        body: "☐ Renouveler / actualiser ses CGV et mentions légales si changement\n☐ Vérifier que les versements URSSAF prélevés correspondent aux déclarations\n☐ Faire le point sur sa TMI fiscale et optimiser (ACRE échue ? versement libératoire toujours pertinent ?)\n☐ Provisionner l'impôt sur le revenu (10-20 % du CA selon TMI)"
      }
    ]
  }
];
const CATEGORIES = ["demarrage", "commercial", "fiscalite", "gestion", "croissance"];
function FormationVideo({ videoUrl, poster, explainer }) {
  if (videoUrl) {
    return /* @__PURE__ */ jsx("div", { className: "relative overflow-hidden rounded-2xl border border-surface-border bg-black shadow-elevated", children: /* @__PURE__ */ jsxs("video", { controls: true, poster, className: "block aspect-video w-full", preload: "metadata", children: [
      /* @__PURE__ */ jsx("source", { src: videoUrl, type: "video/mp4" }),
      "Votre navigateur ne supporte pas la vidéo HTML5."
    ] }) });
  }
  if (explainer) return /* @__PURE__ */ jsx(ExplainerPlayer, { script: explainer });
  return /* @__PURE__ */ jsx("div", { className: "flex aspect-video items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-muted text-center text-sm text-ink-muted", children: "🎬 Vidéo bientôt disponible" });
}
function ExplainerPlayer({ script }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supportsTts, setSupportsTts] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const voicesRef = useRef([]);
  const timerRef = useRef(null);
  const bulletTimerRef = useRef(null);
  useEffect(() => {
    const supports = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupportsTts(supports);
    if (!supports) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      voicesRef.current = v;
      if (v.length > 0) setVoicesReady(true);
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      stopAll();
    };
  }, []);
  function stopAll() {
    var _a;
    try {
      (_a = window.speechSynthesis) == null ? void 0 : _a.cancel();
    } catch {
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (bulletTimerRef.current) clearInterval(bulletTimerRef.current);
    setPlaying(false);
  }
  function playSlide(i) {
    var _a;
    const slide2 = script.slides[i];
    if (!slide2) return;
    setRevealed(0);
    if ((_a = slide2.bullets) == null ? void 0 : _a.length) {
      let r = 0;
      bulletTimerRef.current = setInterval(() => {
        r++;
        setRevealed(Math.min(r, slide2.bullets.length));
        if (r >= slide2.bullets.length) {
          if (bulletTimerRef.current) clearInterval(bulletTimerRef.current);
        }
      }, 700);
    }
    if (supportsTts && !muted) {
      window.speechSynthesis.cancel();
      try {
        window.speechSynthesis.resume();
      } catch {
      }
      const u = new SpeechSynthesisUtterance(slide2.narration);
      u.lang = script.voice ?? "fr-FR";
      u.rate = (script.rate ?? 1) * 0.97;
      u.pitch = 0.92;
      u.volume = 1;
      const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
      const frVoices = voices.filter((v) => {
        var _a2;
        return (_a2 = v.lang) == null ? void 0 : _a2.toLowerCase().startsWith("fr");
      });
      const isMaleFR = (v) => /henri|thomas|paul|nicolas|s[ée]bastien|antoine|claude|jean|pierre|jacques|guillaume|alex(?!a)|jorge|male|homme/i.test(v.name);
      const isFemaleFR = (v) => /am[ée]lie|aur[ée]lie|julie|marie|audrey|marlene|virginie|c[ée]cile|c[ée]line|sophie|chantal|female|femme|elsa|alice|val[ée]rie/i.test(v.name);
      const pick = frVoices.find((v) => isMaleFR(v) && /natural|neural|online|premium/i.test(v.name)) ?? frVoices.find((v) => isMaleFR(v) && /google/i.test(v.name)) ?? frVoices.find((v) => isMaleFR(v)) ?? frVoices.find((v) => !isFemaleFR(v) && /natural|neural|online|premium/i.test(v.name)) ?? frVoices.find((v) => !isFemaleFR(v)) ?? frVoices[0];
      if (pick) u.voice = pick;
      u.onend = () => {
        if (i < script.slides.length - 1) {
          setIdx(i + 1);
          playSlide(i + 1);
        } else {
          setPlaying(false);
        }
      };
      u.onerror = () => {
      };
      window.speechSynthesis.speak(u);
      const keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAlive);
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 8e3);
    }
    const estimatedMs = Math.max(3500, slide2.narration.length * 50);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / estimatedMs);
      setProgress(p);
      if (p >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!supportsTts || muted) {
          if (i < script.slides.length - 1) {
            setIdx(i + 1);
            setProgress(0);
            setTimeout(() => playSlide(i + 1), 50);
          } else setPlaying(false);
        }
      }
    }, 100);
  }
  function play() {
    setPlaying(true);
    playSlide(idx);
  }
  function pause() {
    stopAll();
  }
  function restart() {
    stopAll();
    setIdx(0);
    setProgress(0);
    setTimeout(() => {
      setPlaying(true);
      playSlide(0);
    }, 50);
  }
  function goTo(i) {
    stopAll();
    setIdx(i);
    setProgress(0);
    if (playing) setTimeout(() => playSlide(i), 50);
  }
  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (next) {
        try {
          window.speechSynthesis.cancel();
        } catch {
        }
      }
      return next;
    });
  }
  const slide = script.slides[idx];
  const bg = slide.accent === "secondary" ? "from-secondary-50 via-surface to-primary-50" : slide.accent === "accent" ? "from-accent-300/20 via-surface to-primary-50" : "from-primary-50 via-surface to-secondary-50";
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-elevated", children: [
    /* @__PURE__ */ jsxs("div", { className: `relative aspect-video w-full bg-gradient-to-br ${bg}`, children: [
      /* @__PURE__ */ jsxs("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -right-12 h-72 w-72 rounded-full bg-primary-300/25 blur-3xl animate-float-lg" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-secondary-300/25 blur-3xl animate-float" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-dot-pattern opacity-25" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative grid h-full grid-cols-[auto_1fr] items-center gap-4 px-5 py-6 sm:gap-8 sm:px-10", children: [
        /* @__PURE__ */ jsx(Character, { speaking: playing, accent: slide.accent ?? "primary" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative inline-block max-w-full motion-safe:animate-tile-in", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl rounded-bl-sm bg-surface px-4 py-2 text-base font-display font-bold text-ink shadow-soft ring-1 ring-surface-border sm:text-2xl", children: [
              /* @__PURE__ */ jsx("span", { className: "mr-2 align-middle text-2xl sm:text-4xl", children: slide.emoji }),
              slide.title
            ] }),
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "absolute -left-1.5 bottom-0 h-4 w-4 -translate-y-1/2 -rotate-45 bg-surface" })
          ] }),
          slide.bullets && slide.bullets.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-4 flex flex-wrap gap-2", children: slide.bullets.map((b, i) => /* @__PURE__ */ jsxs(
            "li",
            {
              className: `rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-ink shadow-soft backdrop-blur transition-all duration-500 sm:text-sm ${i < revealed ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`,
              children: [
                "✓ ",
                b
              ]
            },
            b
          )) })
        ] })
      ] }, idx),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/55 px-2.5 py-1 text-[10px] font-semibold text-ink-inverse backdrop-blur", children: [
        "✨ Explainer IA · ",
        script.totalDuration
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-1 bg-ink/5 px-3 py-2", children: script.slides.map((_, i) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => goTo(i),
        className: "group h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border transition hover:bg-surface-border/70",
        "aria-label": `Aller à la scène ${i + 1}`,
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all",
            style: { width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }
          }
        )
      },
      i
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-surface-border bg-surface px-4 py-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        !playing ? /* @__PURE__ */ jsx("button", { onClick: play, className: "btn-primary text-sm", "aria-label": "Lecture", children: "▶ Lecture" }) : /* @__PURE__ */ jsx("button", { onClick: pause, className: "btn-outline text-sm", "aria-label": "Pause", children: "⏸ Pause" }),
        /* @__PURE__ */ jsx("button", { onClick: restart, className: "btn-ghost text-xs", "aria-label": "Recommencer", title: "Recommencer", children: "↺" }),
        /* @__PURE__ */ jsx("button", { onClick: toggleMute, className: "btn-ghost text-xs", "aria-label": muted ? "Activer son" : "Couper son", title: muted ? "Activer la voix" : "Couper la voix", children: muted ? "🔇" : "🔊" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-ink-muted", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => goTo(Math.max(0, idx - 1)), disabled: idx === 0, className: "btn-ghost text-xs disabled:opacity-40", "aria-label": "Précédent", children: "‹" }),
        /* @__PURE__ */ jsxs("span", { className: "px-1 tabular-nums", children: [
          idx + 1,
          " / ",
          script.slides.length
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => goTo(Math.min(script.slides.length - 1, idx + 1)), disabled: idx === script.slides.length - 1, className: "btn-ghost text-xs disabled:opacity-40", "aria-label": "Suivant", children: "›" })
      ] })
    ] }),
    !supportsTts && /* @__PURE__ */ jsx("div", { className: "border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800", children: "Voix non disponible sur ce navigateur — les scènes défilent automatiquement." }),
    supportsTts && voicesReady && !voicesRef.current.some((v) => {
      var _a;
      return (_a = v.lang) == null ? void 0 : _a.startsWith("fr");
    }) && /* @__PURE__ */ jsx("div", { className: "border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800", children: "Aucune voix française détectée sur votre système — l'anglais sera utilisé par défaut." })
  ] });
}
function Character({ speaking, accent }) {
  const skin = "#fde2c8";
  const hair = "#1f2937";
  const shirt = accent === "secondary" ? "#10b981" : accent === "accent" ? "#7c3aed" : "#2563eb";
  const shirtDark = accent === "secondary" ? "#047857" : accent === "accent" ? "#5b21b6" : "#1d4ed8";
  return /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
    /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-primary-200/40 to-secondary-200/40 blur-xl" }),
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 220 260", className: `relative h-28 w-auto sm:h-44 ${speaking ? "animate-bounce-soft" : ""}`, style: { filter: "drop-shadow(0 6px 16px rgba(15,23,42,0.15))" }, children: [
      /* @__PURE__ */ jsx("ellipse", { cx: "110", cy: "210", rx: "78", ry: "44", fill: shirtDark }),
      /* @__PURE__ */ jsx("path", { d: "M 32 200 Q 110 130 188 200 L 188 260 L 32 260 Z", fill: shirt }),
      /* @__PURE__ */ jsx("ellipse", { cx: "110", cy: "170", rx: "22", ry: "10", fill: skin }),
      /* @__PURE__ */ jsx("ellipse", { cx: "110", cy: "115", rx: "52", ry: "58", fill: skin }),
      /* @__PURE__ */ jsx("path", { d: "M 58 95 Q 60 50 110 48 Q 160 50 162 95 Q 158 80 130 78 Q 110 90 90 78 Q 62 80 58 95 Z", fill: hair }),
      /* @__PURE__ */ jsx("ellipse", { cx: "58", cy: "118", rx: "6", ry: "10", fill: skin }),
      /* @__PURE__ */ jsx("ellipse", { cx: "162", cy: "118", rx: "6", ry: "10", fill: skin }),
      /* @__PURE__ */ jsx("path", { d: "M 78 100 Q 88 95 96 100", stroke: hair, strokeWidth: "3", strokeLinecap: "round", fill: "none" }),
      /* @__PURE__ */ jsx("path", { d: "M 124 100 Q 132 95 142 100", stroke: hair, strokeWidth: "3", strokeLinecap: "round", fill: "none" }),
      /* @__PURE__ */ jsxs("g", { className: speaking ? "animate-blink" : "", children: [
        /* @__PURE__ */ jsx("ellipse", { cx: "88", cy: "115", rx: "4", ry: "5", fill: hair }),
        /* @__PURE__ */ jsx("ellipse", { cx: "132", cy: "115", rx: "4", ry: "5", fill: hair }),
        /* @__PURE__ */ jsx("circle", { cx: "89", cy: "113", r: "1.2", fill: "#ffffff" }),
        /* @__PURE__ */ jsx("circle", { cx: "133", cy: "113", r: "1.2", fill: "#ffffff" })
      ] }),
      /* @__PURE__ */ jsx("circle", { cx: "76", cy: "135", r: "6", fill: "#f9a8d4", opacity: "0.55" }),
      /* @__PURE__ */ jsx("circle", { cx: "144", cy: "135", r: "6", fill: "#f9a8d4", opacity: "0.55" }),
      /* @__PURE__ */ jsx("g", { transform: "translate(110 145)", children: speaking ? /* @__PURE__ */ jsxs("ellipse", { cx: "0", cy: "0", rx: "11", ry: "7", fill: "#7a2424", className: "animate-mouth", children: [
        /* @__PURE__ */ jsx("animate", { attributeName: "ry", values: "2;7;3;6;2", dur: "0.4s", repeatCount: "indefinite" }),
        /* @__PURE__ */ jsx("animate", { attributeName: "rx", values: "9;11;10;12;9", dur: "0.5s", repeatCount: "indefinite" })
      ] }) : /* @__PURE__ */ jsx("path", { d: "M -10 0 Q 0 6 10 0", stroke: "#7a2424", strokeWidth: "2.4", strokeLinecap: "round", fill: "none" }) })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%, 97%      { transform: scaleY(0.1); }
        }
        .animate-bounce-soft { animation: bounce-soft 2.4s ease-in-out infinite; }
        .animate-blink g    { transform-origin: center; }
        .animate-blink      { animation: blink 4s ease-in-out infinite; transform-box: fill-box; }
      ` })
  ] });
}
function FormationsPage() {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => filter === "all" ? FORMATIONS : FORMATIONS.filter((f) => f.category === filter), [filter]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Formations & guides micro-entreprise — Swivo", description: "Mini-formations pratiques pour trouver vos clients, fixer vos prix, comprendre l'URSSAF, optimiser votre CA.", path: "/formations" }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10 lg:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 max-w-2xl", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "🎓 Académie Swivo" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: "Formations & guides" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-ink-muted", children: "Méthodes éprouvées pour démarrer, vendre, déclarer, optimiser et grandir en micro-entreprise." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setFilter("all"), className: `badge ${filter === "all" ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: [
          "Toutes (",
          FORMATIONS.length,
          ")"
        ] }),
        CATEGORIES.map((c) => /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(c), className: `badge ${filter === c ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: [
          CATEGORY_LABEL[c],
          " (",
          FORMATIONS.filter((f) => f.category === c).length,
          ")"
        ] }, c))
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((f) => /* @__PURE__ */ jsx(FormationCard, { f }, f.slug)) }),
      /* @__PURE__ */ jsx("div", { className: "mt-16 card border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-accent-50 p-8", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-6 lg:grid-cols-[1fr_auto]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-bold text-ink", children: "Une question, un cas particulier ?" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-ink-muted", children: "Posez votre question à notre équipe — réponse sous 2 h ouvrées avec la formule Gestion." })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/tarifs", className: "btn-primary", children: "Activer la Gestion 9,90 €/mois" })
      ] }) })
    ] })
  ] });
}
function FormationCard({ f }) {
  return /* @__PURE__ */ jsxs(Link, { to: `/formations/${f.slug}`, className: "card group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-elevated", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "text-4xl", children: f.icon }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
        (f.videoUrl || f.explainer) && /* @__PURE__ */ jsx("span", { className: "badge bg-primary-100 text-primary-800", children: "🎬 Vidéo" }),
        /* @__PURE__ */ jsx("span", { className: "badge bg-ink-muted/10 text-ink-muted", children: f.duration }),
        f.premium && /* @__PURE__ */ jsx("span", { className: "badge bg-amber-100 text-amber-800", children: "Premium" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-bold text-ink group-hover:text-primary-700", children: f.title }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: f.excerpt }),
    /* @__PURE__ */ jsxs("div", { className: "mt-auto flex items-center gap-2 pt-4 text-xs text-ink-muted", children: [
      /* @__PURE__ */ jsx("span", { className: "badge bg-primary-50 text-primary-700", children: CATEGORY_LABEL[f.category] }),
      /* @__PURE__ */ jsx("span", { className: "badge bg-secondary-50 text-secondary-700", children: LEVEL_LABEL[f.level] })
    ] })
  ] });
}
function FormationDetailPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const f = useMemo(() => FORMATIONS.find((x) => x.slug === slug), [slug]);
  const [activeStep, setActiveStep] = useState(0);
  if (!f) {
    return /* @__PURE__ */ jsxs("section", { className: "container-page py-16 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: "Formation introuvable." }),
      /* @__PURE__ */ jsx(Link, { to: "/formations", className: "btn-primary mt-4", children: "Retour aux formations" })
    ] });
  }
  function next() {
    if (f && activeStep < f.steps.length - 1) setActiveStep(activeStep + 1);
  }
  function prev() {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  }
  const progress = (activeStep + 1) / f.steps.length * 100;
  const step = f.steps[activeStep];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: `${f.title} — Swivo`, description: f.excerpt, path: `/formations/${f.slug}` }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10 lg:py-14", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => nav("/formations"), className: "text-sm text-primary-700 hover:underline", children: "← Toutes les formations" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-8 lg:grid-cols-[1fr_300px]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "badge bg-primary-50 text-primary-700", children: CATEGORY_LABEL[f.category] }),
              /* @__PURE__ */ jsx("span", { className: "badge bg-secondary-50 text-secondary-700", children: LEVEL_LABEL[f.level] }),
              /* @__PURE__ */ jsxs("span", { className: "badge bg-ink-muted/10 text-ink-muted", children: [
                "⏱ ",
                f.duration
              ] }),
              f.premium && /* @__PURE__ */ jsx("span", { className: "badge bg-amber-100 text-amber-800", children: "Premium" })
            ] }),
            /* @__PURE__ */ jsxs("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: [
              f.icon,
              " ",
              f.title
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-ink-muted", children: f.excerpt })
          ] }) }),
          (f.videoUrl || f.explainer) && /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsx(FormationVideo, { videoUrl: f.videoUrl, poster: f.videoPoster, explainer: f.explainer }),
            f.explainer && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-ink-muted", children: [
              "▶️ Lance la vidéo pour la version vulgarisée en ",
              f.explainer.totalDuration,
              ". Le contenu détaillé suit ci-dessous."
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 h-1.5 overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all", style: { width: `${progress}%` } }) }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-ink-muted", children: [
            "Étape ",
            activeStep + 1,
            " / ",
            f.steps.length
          ] }),
          /* @__PURE__ */ jsxs("article", { className: "mt-8 card p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold text-ink", children: step.title }),
              step.duration && /* @__PURE__ */ jsxs("span", { className: "badge bg-ink-muted/10 text-ink-muted", children: [
                "⏱ ",
                step.duration
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "prose prose-sm mt-4 max-w-none whitespace-pre-line text-ink", children: step.body })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("button", { onClick: prev, disabled: activeStep === 0, className: "btn-ghost text-sm disabled:opacity-40", children: "← Précédent" }),
            activeStep < f.steps.length - 1 ? /* @__PURE__ */ jsx("button", { onClick: next, className: "btn-primary", children: "Suivant →" }) : /* @__PURE__ */ jsx(Link, { to: "/formations", className: "btn-primary", children: "Voir d'autres formations" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("aside", { className: "space-y-4 lg:sticky lg:top-20 lg:self-start", children: [
          /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold uppercase tracking-wider text-ink-muted", children: "Sommaire" }),
            /* @__PURE__ */ jsx("ol", { className: "mt-3 space-y-2 text-sm", children: f.steps.map((s, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => setActiveStep(i), className: `flex w-full items-start gap-2 rounded-md px-2 py-1 text-left transition ${i === activeStep ? "bg-primary-50 text-primary-800 font-semibold" : "text-ink-muted hover:bg-surface-muted hover:text-ink"}`, children: [
              /* @__PURE__ */ jsx("span", { className: `mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${i < activeStep ? "bg-secondary-500 text-ink-inverse" : i === activeStep ? "bg-primary-600 text-ink-inverse" : "bg-surface-border text-ink-muted"}`, children: i < activeStep ? "✓" : i + 1 }),
              /* @__PURE__ */ jsx("span", { children: s.title })
            ] }) }, i)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold uppercase tracking-wider text-ink-muted", children: "Outils liés" }),
            /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-2 text-sm", children: [
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/pilotage", className: "text-primary-700 hover:underline", children: "→ Cockpit financier" }) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/urssaf", className: "text-primary-700 hover:underline", children: "→ Assistant URSSAF" }) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/outils/calculateurs", className: "text-primary-700 hover:underline", children: "→ Simulateurs" }) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/outils/facturation", className: "text-primary-700 hover:underline", children: "→ Facturation" }) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/outils/modeles", className: "text-primary-700 hover:underline", children: "→ Modèles juridiques" }) })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  FormationDetailPage,
  FormationsPage
};
