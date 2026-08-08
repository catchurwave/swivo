import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { S as Seo } from "../entry-server.js";
import { Q as useToast } from "./wizard-CbzVLHaR.js";
import "react-dom/server";
import "./vendor-router-Izd1qo3Q.js";
import "react-dom";
import "react-router";
import "@remix-run/router";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./formalites-DR4taCu5.js";
const today = () => (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
const TEMPLATES = [
  /* ============ DÉMARCHES INPI ============ */
  {
    slug: "radiation-micro",
    title: "Déclaration de radiation (cessation définitive)",
    description: "Fermeture définitive de votre micro-entreprise via le Guichet unique INPI.",
    category: "Démarches INPI",
    fields: [
      { key: "nom", label: "Nom complet" },
      { key: "siret", label: "SIRET" },
      { key: "naf", label: "Code NAF/APE" },
      { key: "adresseSiege", label: "Adresse du siège" },
      { key: "dateCessation", label: "Date de cessation", placeholder: "31/12/2026", type: "date" },
      { key: "motif", label: "Motif (texte libre)", type: "textarea", placeholder: "Reconversion professionnelle / passage en société / autre" }
    ],
    body: (v) => `DÉCLARATION DE CESSATION D'ACTIVITÉ — MICRO-ENTREPRENEUR
À effectuer sur procedures.inpi.fr (Guichet unique formalités des entreprises)

Déclarant : ${v.nom}
SIRET : ${v.siret}
NAF/APE : ${v.naf}
Adresse du siège : ${v.adresseSiege}

Date de cessation définitive : ${v.dateCessation}
Motif : ${v.motif}

Démarches à effectuer (rappel) :
1. Déclaration de cessation au Guichet unique INPI (procedures.inpi.fr) dans les 30 jours.
2. Dernière déclaration de chiffre d'affaires à l'URSSAF (autoentrepreneur.urssaf.fr) sous 30 jours après la cessation.
3. Déclaration des revenus 2042-C-PRO à l'impôt sur le revenu en N+1.
4. Conservation des justificatifs comptables pendant 10 ans (livre des recettes, factures, registre achats).

Pièces à fournir au Guichet unique :
- Pièce d'identité du déclarant
- Justificatif d'adresse du siège (-3 mois)

Date : ${today()}
Signature : ____________________________`
  },
  {
    slug: "modification-activite-micro",
    title: "Déclaration de modification d'activité",
    description: "Changer ou ajouter une activité dans votre micro-entreprise.",
    category: "Démarches INPI",
    fields: [
      { key: "nom", label: "Nom complet" },
      { key: "siret", label: "SIRET" },
      { key: "ancienne", label: "Activité actuelle" },
      { key: "nouvelle", label: "Nouvelle activité", type: "textarea" },
      { key: "naf", label: "Code NAF/APE estimé" },
      { key: "dateEffet", label: "Date d'effet", placeholder: "01/06/2026", type: "date" }
    ],
    body: (v) => `DÉCLARATION DE MODIFICATION D'ACTIVITÉ — MICRO-ENTREPRENEUR
À effectuer sur procedures.inpi.fr

Déclarant : ${v.nom}
SIRET : ${v.siret}

Activité actuelle : ${v.ancienne}
Nouvelle activité (ajoutée ou remplacement) : ${v.nouvelle}
Code NAF/APE estimé : ${v.naf}
Date d'effet : ${v.dateEffet}

Conséquences possibles :
- Modification du régime social/fiscal (BIC ↔ BNC ↔ vente)
- Modification du taux de cotisations URSSAF
- Modification du seuil de TVA
- Possible exigence de qualification professionnelle (activités artisanales)

Démarches associées :
1. Déclaration de modification au Guichet unique INPI.
2. Mise à jour du profil URSSAF (autoentrepreneur.urssaf.fr).
3. Si activité réglementée : transmettre les justificatifs (diplôme, ordre, etc.).

Pièces à fournir :
- Pièce d'identité
- Justificatif de qualification (si activité réglementée)

Date : ${today()}
Signature : ____________________________`
  },
  {
    slug: "changement-adresse-siege",
    title: "Déclaration de changement d'adresse du siège",
    description: "Notifier un déménagement du siège social au Guichet unique.",
    category: "Démarches INPI",
    fields: [
      { key: "nom", label: "Nom complet" },
      { key: "siret", label: "SIRET" },
      { key: "ancienne", label: "Ancienne adresse" },
      { key: "nouvelle", label: "Nouvelle adresse" },
      { key: "dateEffet", label: "Date d'effet", placeholder: "01/06/2026", type: "date" }
    ],
    body: (v) => `DÉCLARATION DE TRANSFERT DE SIÈGE — MICRO-ENTREPRENEUR
À effectuer sur procedures.inpi.fr dans les 30 jours.

Déclarant : ${v.nom}
SIRET : ${v.siret}

Ancienne adresse du siège : ${v.ancienne}
Nouvelle adresse du siège : ${v.nouvelle}
Date d'effet du transfert : ${v.dateEffet}

Conséquences :
- Mise à jour de l'extrait INSEE (SIRENE)
- Modification du CFE / centre des impôts de rattachement (selon dépt)
- Mise à jour des mentions sur vos factures et site web

Pièces à fournir :
- Pièce d'identité
- Justificatif de domicile -3 mois (facture EDF/GDF/internet ou quittance)
- Si domiciliation chez tiers : attestation + justificatif du tiers

Date : ${today()}
Signature : ____________________________`
  },
  /* ============ ATTESTATIONS ============ */
  {
    slug: "attestation-domiciliation",
    title: "Attestation de domiciliation à domicile",
    description: "Justifier la domiciliation du siège à votre adresse personnelle.",
    category: "Attestations",
    fields: [
      { key: "nom", label: "Nom du dirigeant" },
      { key: "adresse", label: "Adresse personnelle" },
      { key: "societe", label: 'Dénomination (ou "Mon nom — entrepreneur individuel")' }
    ],
    body: (v) => `ATTESTATION DE DOMICILIATION

Je soussigné(e) ${v.nom}, occupant régulièrement le logement situé ${v.adresse} en qualité de résident principal, atteste par la présente domicilier l'établissement principal de mon activité de micro-entrepreneur (${v.societe}) à cette adresse.

Cette domiciliation respecte les dispositions de l'article L.123-11-1 du Code de commerce. Je certifie qu'aucune disposition contractuelle (bail, règlement de copropriété) ne s'y oppose, ou qu'à défaut, la durée de domiciliation est limitée à 5 ans.

Cette attestation est délivrée pour faire valoir ce que de droit dans le cadre des formalités d'immatriculation au RNE (procedures.inpi.fr).

Fait à _________________, le ${today()}.

Signature :


Pièces jointes :
- Pièce d'identité
- Justificatif de domicile -3 mois`
  },
  {
    slug: "attestation-non-condamnation",
    title: "Déclaration sur l'honneur de non-condamnation",
    description: "Document obligatoire à l'immatriculation au RNE.",
    category: "Attestations",
    fields: [
      { key: "nom", label: "Nom complet" },
      { key: "dateNaissance", label: "Date de naissance", type: "date" },
      { key: "lieuNaissance", label: "Lieu de naissance" },
      { key: "pere", label: "Nom et prénom du père" },
      { key: "mere", label: "Nom de jeune fille et prénom de la mère" }
    ],
    body: (v) => `DÉCLARATION SUR L'HONNEUR DE NON-CONDAMNATION ET DE FILIATION

Je soussigné(e) ${v.nom}
Né(e) le ${v.dateNaissance} à ${v.lieuNaissance}
Père : ${v.pere}
Mère : ${v.mere}

Déclare sur l'honneur :
1. Ne faire l'objet d'aucune condamnation pénale ou de sanction civile ou administrative de nature à m'interdire d'exercer une activité commerciale, artisanale ou libérale ou de gérer, administrer ou diriger une personne morale (art. L.128-1 du Code de commerce, art. 19-1 de la loi 84-46).
2. Avoir pris connaissance des dispositions législatives et réglementaires régissant mon activité.

Cette déclaration est faite pour servir et valoir ce que de droit, notamment dans le cadre de mon immatriculation au RNE.

Fait à _________________, le ${today()}.

Signature :`
  },
  /* ============ LETTRES ============ */
  {
    slug: "lettre-mise-en-demeure",
    title: "Lettre de mise en demeure (impayé)",
    description: "Relance formelle d'un client en retard de paiement.",
    category: "Lettres",
    fields: [
      { key: "emetteur", label: "Vos nom + adresse" },
      { key: "destinataire", label: "Client (raison sociale)" },
      { key: "adresse", label: "Adresse du client" },
      { key: "facture", label: "N° de facture" },
      { key: "montant", label: "Montant dû (€)" },
      { key: "echeance", label: "Date d'échéance", placeholder: "15/04/2026", type: "date" }
    ],
    body: (v) => `${v.emetteur}

Lettre recommandée avec accusé de réception

À l'attention de : ${v.destinataire}
${v.adresse}

Objet : Mise en demeure de payer — facture n° ${v.facture}

Madame, Monsieur,

Sauf erreur de notre part, votre compte présente un solde débiteur de ${v.montant} €, correspondant à la facture n° ${v.facture}, échue depuis le ${v.echeance}.

Malgré nos précédentes relances restées sans réponse, nous n'avons à ce jour reçu aucun règlement.

En conséquence, nous vous mettons en demeure de procéder au paiement de cette somme dans un délai de huit (8) jours à compter de la réception de la présente.

À défaut, nous nous réservons le droit d'engager toute action contentieuse, ainsi que de réclamer les pénalités de retard légales (taux BCE majoré de 10 points) et l'indemnité forfaitaire pour frais de recouvrement de 40 € (art. L.441-10 du Code de commerce).

Cordialement,

Fait le ${today()}.

Signature :`
  },
  {
    slug: "lettre-resiliation-bail",
    title: "Lettre de résiliation de bail commercial",
    description: "Préavis de 6 mois (bail 3-6-9).",
    category: "Lettres",
    fields: [
      { key: "emetteur", label: "Vos nom + adresse" },
      { key: "bailleur", label: "Nom et adresse du bailleur" },
      { key: "adresse", label: "Adresse du local" },
      { key: "effet", label: "Date d'effet (échéance triennale)", type: "date" }
    ],
    body: (v) => `${v.emetteur}

Lettre recommandée avec accusé de réception

À ${v.bailleur}

Objet : Résiliation du bail commercial — local ${v.adresse}

Madame, Monsieur,

Conformément à l'article L.145-9 du Code de commerce, je vous notifie par la présente la résiliation du bail commercial portant sur le local situé ${v.adresse}, à effet du ${v.effet}, en respectant le préavis légal de six (6) mois.

Je vous remercie de bien vouloir m'indiquer les modalités de restitution des locaux et d'organiser l'état des lieux de sortie.

Restant à votre disposition,

Cordialement,

Fait le ${today()}.

Signature :`
  },
  /* ============ SITE WEB ============ */
  {
    slug: "mentions-legales-site",
    title: "Mentions légales pour site web",
    description: "Mentions obligatoires (LCEN 2004-575, art. 6-III).",
    category: "Site web",
    fields: [
      { key: "nomSite", label: "Nom du site" },
      { key: "urlSite", label: "URL du site", placeholder: "https://exemple.fr" },
      { key: "editeur", label: "Nom et prénom de l'éditeur" },
      { key: "siret", label: "SIRET" },
      { key: "naf", label: "Code NAF" },
      { key: "adresse", label: "Adresse du siège" },
      { key: "email", label: "Email de contact", type: "email" },
      { key: "telephone", label: "Téléphone" },
      { key: "directeurPub", label: "Directeur de la publication" },
      { key: "hebergeur", label: "Hébergeur (nom + adresse)", placeholder: "OVH SAS, 2 rue Kellermann, 59100 Roubaix" }
    ],
    body: (v) => `MENTIONS LÉGALES — ${v.nomSite}

Article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).

ÉDITEUR DU SITE
${v.editeur} — micro-entrepreneur
SIRET : ${v.siret}
Code NAF : ${v.naf}
Adresse : ${v.adresse}
Email : ${v.email}
Téléphone : ${v.telephone}
TVA non applicable, art. 293 B du CGI.

DIRECTEUR DE LA PUBLICATION
${v.directeurPub}

HÉBERGEUR
${v.hebergeur}

PROPRIÉTÉ INTELLECTUELLE
L'ensemble des contenus du site (textes, images, logos, vidéos) est protégé par le droit d'auteur (art. L.111-1 du Code de la propriété intellectuelle). Toute reproduction, représentation, modification ou exploitation totale ou partielle sans accord écrit préalable de l'éditeur est interdite.

DONNÉES PERSONNELLES
Voir la politique de confidentialité du site.

COOKIES
Voir la politique de cookies.

LITIGES
En cas de litige, les tribunaux français sont seuls compétents. Loi applicable : droit français.

Date de mise à jour : ${today()}`
  },
  {
    slug: "politique-confidentialite",
    title: "Politique de confidentialité (RGPD)",
    description: "Conforme RGPD (UE 2016/679) et loi Informatique et Libertés modifiée.",
    category: "Site web",
    fields: [
      { key: "nomSite", label: "Nom du site" },
      { key: "editeur", label: "Responsable de traitement" },
      { key: "email", label: "Email contact (DPO)", type: "email" },
      { key: "finalites", label: "Finalités du traitement", type: "textarea", placeholder: "Contact via formulaire, abonnement newsletter, gestion des commandes" },
      { key: "duree", label: "Durée de conservation", placeholder: "3 ans à compter du dernier contact" }
    ],
    body: (v) => `POLITIQUE DE CONFIDENTIALITÉ — ${v.nomSite}

Conforme au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée.

1. RESPONSABLE DU TRAITEMENT
${v.editeur}
Contact : ${v.email}

2. DONNÉES COLLECTÉES
Nous collectons les données suivantes lorsque vous utilisez notre site :
- Identité : nom, prénom, adresse email
- Données de connexion : adresse IP, horodatage, navigateur
- Données de navigation : pages visitées, temps passé (via cookies analytics)

3. FINALITÉS DU TRAITEMENT
${v.finalites}

4. BASE LÉGALE
- Consentement (formulaires, newsletter, cookies non-essentiels)
- Exécution du contrat (commandes, prestations)
- Obligation légale (facturation, comptabilité)
- Intérêt légitime (sécurité du site)

5. DESTINATAIRES
Vos données sont strictement destinées à ${v.editeur}. Aucune cession à des tiers commerciaux. Sous-traitants RGPD-conformes uniquement (hébergeur, outils analytics anonymisés).

6. DURÉE DE CONSERVATION
${v.duree}
Données comptables : conservées 10 ans (obligation légale).

7. VOS DROITS
Conformément aux art. 15 à 22 du RGPD, vous disposez des droits suivants :
- Accès, rectification, effacement
- Limitation du traitement
- Portabilité
- Opposition
- Retrait du consentement à tout moment

Pour les exercer : ${v.email}
Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).

8. TRANSFERTS HORS UE
Aucun transfert hors Union européenne sans garanties adaptées (clauses contractuelles types CE).

9. SÉCURITÉ
Mesures techniques et organisationnelles : chiffrement TLS, accès restreint, sauvegardes chiffrées.

Date de mise à jour : ${today()}`
  },
  {
    slug: "cookies-policy",
    title: "Politique de cookies",
    description: "Information cookies + consentement (CNIL).",
    category: "Site web",
    fields: [
      { key: "nomSite", label: "Nom du site" },
      { key: "email", label: "Email contact", type: "email" }
    ],
    body: (v) => `POLITIQUE DE COOKIES — ${v.nomSite}

Conforme aux lignes directrices et recommandation CNIL du 17/09/2020.

QU'EST-CE QU'UN COOKIE ?
Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site, permettant de mémoriser des informations sur votre navigation.

COOKIES UTILISÉS
- Cookies strictement nécessaires (session, sécurité) : exemptés de consentement.
- Cookies de mesure d'audience anonymisée : exemptés de consentement si configurés conformément aux préconisations CNIL.
- Cookies tiers (publicité, réseaux sociaux, analytics non-anonymisés) : déposés uniquement après consentement explicite.

DURÉE DE CONSERVATION
13 mois maximum pour les cookies analytiques. Le consentement est lui-même conservé 6 mois.

GESTION DE VOS PRÉFÉRENCES
Vous pouvez à tout moment modifier vos préférences via le bandeau de consentement (lien « Cookies » en pied de page) ou directement dans les paramètres de votre navigateur.

CONTACT
${v.email}

Date de mise à jour : ${today()}`
  },
  /* ============ CONTRATS ============ */
  {
    slug: "cgv-micro",
    title: "Conditions générales de vente (CGV) — micro",
    description: "CGV B2B pour prestations de services, adaptées micro-entrepreneur.",
    category: "Contrats",
    fields: [
      { key: "emetteur", label: "Nom + raison sociale" },
      { key: "siret", label: "SIRET" },
      { key: "adresse", label: "Adresse" },
      { key: "email", label: "Email contact", type: "email" },
      { key: "activite", label: "Activité principale", placeholder: "Conseil en stratégie digitale" }
    ],
    body: (v) => `CONDITIONS GÉNÉRALES DE VENTE — ${v.emetteur}

Version en vigueur au ${today()}.

ARTICLE 1 — IDENTITÉ DU PRESTATAIRE
${v.emetteur} — micro-entrepreneur
SIRET : ${v.siret}
Adresse : ${v.adresse}
Email : ${v.email}
Activité : ${v.activite}
TVA non applicable, art. 293 B du CGI.

ARTICLE 2 — OBJET
Les présentes CGV régissent les relations contractuelles entre le Prestataire et tout Client professionnel ayant recours à ses prestations.

ARTICLE 3 — DEVIS ET COMMANDES
Toute prestation fait l'objet d'un devis détaillé, valable 30 jours. La signature du devis (« Bon pour accord ») vaut acceptation pleine et entière des présentes CGV.

ARTICLE 4 — PRIX ET MODALITÉS DE PAIEMENT
Les prix sont indiqués en euros, nets de TVA (franchise art. 293 B du CGI). Sauf mention contraire, paiement à 30 jours date de facture. Modes acceptés : virement, chèque.

ARTICLE 5 — RETARD DE PAIEMENT
Tout retard entraîne de plein droit :
- Pénalités au taux BCE majoré de 10 points (art. L.441-10 C. com.)
- Indemnité forfaitaire pour frais de recouvrement : 40 € (art. D.441-5 C. com.)
- Suspension immédiate des prestations en cours

ARTICLE 6 — OBLIGATION DE MOYENS
Le Prestataire est tenu à une obligation de moyens. Sa responsabilité ne saurait être engagée pour des dommages indirects (perte de chiffre d'affaires, atteinte à l'image, etc.).

ARTICLE 7 — PROPRIÉTÉ INTELLECTUELLE
Les livrables sont la propriété du Client après paiement intégral. Le Prestataire conserve ses méthodologies, outils et savoir-faire.

ARTICLE 8 — CONFIDENTIALITÉ
Chaque partie s'engage à préserver la confidentialité des informations échangées pendant et après la mission.

ARTICLE 9 — RGPD
Le Prestataire respecte le Règlement (UE) 2016/679. Voir la politique de confidentialité.

ARTICLE 10 — RÉSILIATION
En cas de manquement grave, la partie lésée peut résilier le contrat par LRAR avec mise en demeure préalable de 15 jours restée infructueuse.

ARTICLE 11 — LITIGES
En cas de litige, une solution amiable sera recherchée avant toute action. À défaut, compétence exclusive des tribunaux du ressort du siège du Prestataire. Droit français applicable.`
  },
  {
    slug: "contrat-prestation-simple",
    title: "Contrat de prestation de services (simple)",
    description: "Contrat court pour mission ponctuelle entre micro et client pro.",
    category: "Contrats",
    fields: [
      { key: "prestataire", label: "Prestataire (vos infos)" },
      { key: "client", label: "Client (raison sociale + SIRET)" },
      { key: "mission", label: "Description de la mission", type: "textarea" },
      { key: "duree", label: "Durée de la mission", placeholder: "Du 01/06/2026 au 31/07/2026" },
      { key: "montant", label: "Montant total HT (€)" },
      { key: "paiement", label: "Modalités de paiement", placeholder: "50 % à la signature, 50 % à la livraison" }
    ],
    body: (v) => `CONTRAT DE PRESTATION DE SERVICES

ENTRE LES SOUSSIGNÉS

Le Prestataire : ${v.prestataire}
ET
Le Client : ${v.client}

ARTICLE 1 — OBJET
Le Prestataire s'engage à réaliser pour le Client la mission suivante :
${v.mission}

ARTICLE 2 — DURÉE
Mission exécutée sur la période : ${v.duree}.

ARTICLE 3 — RÉMUNÉRATION
Montant total : ${v.montant} € HT (TVA non applicable, art. 293 B du CGI).
Modalités : ${v.paiement}.

ARTICLE 4 — OBLIGATIONS DU PRESTATAIRE
Obligation de moyens. Le Prestataire mettra en œuvre toutes les diligences nécessaires pour mener à bien la mission.

ARTICLE 5 — OBLIGATIONS DU CLIENT
Le Client s'engage à fournir au Prestataire tous les éléments, accès et validations nécessaires à la bonne exécution de la mission, dans des délais raisonnables.

ARTICLE 6 — PROPRIÉTÉ INTELLECTUELLE
Les livrables produits dans le cadre de la mission deviennent la propriété du Client après paiement intégral.

ARTICLE 7 — CONFIDENTIALITÉ
Chaque partie s'engage à ne pas divulguer les informations confidentielles de l'autre, pendant la durée du contrat et pour une durée de 3 ans après son terme.

ARTICLE 8 — RÉSILIATION
En cas de manquement grave d'une partie à ses obligations, l'autre partie pourra résilier le contrat par LRAR avec mise en demeure préalable de 15 jours restée infructueuse.

ARTICLE 9 — LOI APPLICABLE
Droit français. Compétence des tribunaux du ressort du siège du Prestataire.

Fait à _________________, en deux exemplaires, le ${today()}.

Pour le Prestataire :                       Pour le Client :
(Signature précédée de                       (Signature précédée de
la mention « Lu et approuvé »)              la mention « Lu et approuvé »)`
  }
];
const CATEGORIES = ["Démarches INPI", "Attestations", "Lettres", "Site web", "Contrats"];
function ModelesPage() {
  const toast = useToast();
  const [selected, setSelected] = useState(TEMPLATES[0]);
  const [vars, setVars] = useState({});
  const [filter, setFilter] = useState("all");
  const text = useMemo(() => selected.body({ ...defaults(selected), ...vars }), [selected, vars]);
  const filtered = useMemo(() => filter === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === filter), [filter]);
  function download() {
    const html = wrapHtml(selected.title, text);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.slug}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.push({ kind: "success", message: "Téléchargé (HTML imprimable, Ctrl+P pour PDF).", ttl: 3e3 });
  }
  function printNow() {
    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) return;
    win.document.open();
    win.document.write(wrapHtml(selected.title, text));
    win.document.close();
    setTimeout(() => win.print(), 350);
  }
  function copyText() {
    var _a;
    (_a = navigator.clipboard) == null ? void 0 : _a.writeText(text).then(
      () => toast.push({ kind: "success", message: "Texte copié dans le presse-papier.", ttl: 2500 })
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Modèles juridiques & administratifs — Swivo", description: "Bibliothèque de modèles : lettres, attestations, mentions légales, RGPD, CGV, contrats.", path: "/outils/modeles", noindex: true }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10 lg:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-secondary", children: "Outil Gestion" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: "Modèles juridiques & administratifs" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 max-w-2xl text-ink-muted", children: [
          "Complétez les champs, prévisualisez en temps réel, téléchargez ou imprimez. ",
          TEMPLATES.length,
          " modèles couvrant les démarches micro-entrepreneur courantes."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setFilter("all"), className: `badge ${filter === "all" ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: [
          "Tous (",
          TEMPLATES.length,
          ")"
        ] }),
        CATEGORIES.map((c) => /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(c), className: `badge ${filter === c ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: [
          c,
          " (",
          TEMPLATES.filter((t) => t.category === c).length,
          ")"
        ] }, c))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[300px_1fr]", children: [
        /* @__PURE__ */ jsx("nav", { "aria-label": "Modèles", className: "card p-3 self-start lg:sticky lg:top-20", children: /* @__PURE__ */ jsx("ul", { className: "space-y-1 max-h-[70vh] overflow-y-auto", children: filtered.map((t) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setSelected(t);
              setVars({});
            },
            className: `w-full rounded-lg px-3 py-2 text-left text-sm transition ${selected.slug === t.slug ? "bg-primary-50 text-primary-800 font-semibold" : "text-ink-muted hover:bg-surface-muted hover:text-ink"}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "block", children: t.title }),
              /* @__PURE__ */ jsx("span", { className: "block text-xs font-normal text-ink-muted", children: t.category })
            ]
          }
        ) }, t.slug)) }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "badge bg-primary-50 text-primary-700", children: selected.category }),
              /* @__PURE__ */ jsx("h2", { className: "mt-2 font-display text-xl font-semibold text-ink", children: selected.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: selected.description })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: selected.fields.map((f) => /* @__PURE__ */ jsxs("div", { className: f.type === "textarea" ? "sm:col-span-2" : "", children: [
              /* @__PURE__ */ jsx("label", { className: "label", htmlFor: `f-${f.key}`, children: f.label }),
              f.type === "textarea" ? /* @__PURE__ */ jsx("textarea", { id: `f-${f.key}`, className: "input min-h-[80px]", placeholder: f.placeholder ?? "", value: vars[f.key] ?? "", onChange: (e) => setVars((v) => ({ ...v, [f.key]: e.target.value })) }) : /* @__PURE__ */ jsx(
                "input",
                {
                  id: `f-${f.key}`,
                  type: f.type === "date" ? "date" : f.type === "email" ? "email" : "text",
                  className: "input",
                  placeholder: f.placeholder ?? "",
                  value: vars[f.key] ?? "",
                  onChange: (e) => setVars((v) => ({ ...v, [f.key]: e.target.value }))
                }
              )
            ] }, f.key)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx("button", { onClick: download, className: "btn-primary", children: "↓ Télécharger HTML" }),
              /* @__PURE__ */ jsx("button", { onClick: printNow, className: "btn-outline", children: "Imprimer / PDF" }),
              /* @__PURE__ */ jsx("button", { onClick: copyText, className: "btn-ghost text-sm", children: "Copier le texte" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "card overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "border-b border-surface-border bg-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "Aperçu" }),
            /* @__PURE__ */ jsx("pre", { className: "whitespace-pre-wrap p-6 text-sm leading-relaxed text-ink", children: text })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function defaults(t) {
  return Object.fromEntries(t.fields.map((f) => [f.key, f.placeholder ?? `[${f.label}]`]));
}
function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}
function wrapHtml(title, body) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 32px; line-height: 1.6; color: #0f172a; }
  h1 { font-size: 22px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 24px; letter-spacing: -0.01em; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
  @media print { body { padding: 18mm; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(body)}</pre>
  <script>if(location.search.includes('print=1')){setTimeout(()=>window.print(),250);}<\/script>
</body>
</html>`;
}
export {
  ModelesPage
};
