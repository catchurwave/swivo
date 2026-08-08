import{r as d,j as i}from"./vendor-react-BDw8OB7t.js";import{S as T}from"./index-EAl8BqbH.js";import{Q as h}from"./wizard-BrepEI2s.js";import"./vendor-react-dom-J1jNVxuu.js";import"./vendor-Dbtyb6JQ.js";import"./vendor-router-Bu5RpuXu.js";import"./vendor-helmet-B-uauX_U.js";import"./formalites-3sMuTJrZ.js";const s=()=>new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}),o=[{slug:"radiation-micro",title:"Déclaration de radiation (cessation définitive)",description:"Fermeture définitive de votre micro-entreprise via le Guichet unique INPI.",category:"Démarches INPI",fields:[{key:"nom",label:"Nom complet"},{key:"siret",label:"SIRET"},{key:"naf",label:"Code NAF/APE"},{key:"adresseSiege",label:"Adresse du siège"},{key:"dateCessation",label:"Date de cessation",placeholder:"31/12/2026",type:"date"},{key:"motif",label:"Motif (texte libre)",type:"textarea",placeholder:"Reconversion professionnelle / passage en société / autre"}],body:e=>`DÉCLARATION DE CESSATION D'ACTIVITÉ — MICRO-ENTREPRENEUR
À effectuer sur procedures.inpi.fr (Guichet unique formalités des entreprises)

Déclarant : ${e.nom}
SIRET : ${e.siret}
NAF/APE : ${e.naf}
Adresse du siège : ${e.adresseSiege}

Date de cessation définitive : ${e.dateCessation}
Motif : ${e.motif}

Démarches à effectuer (rappel) :
1. Déclaration de cessation au Guichet unique INPI (procedures.inpi.fr) dans les 30 jours.
2. Dernière déclaration de chiffre d'affaires à l'URSSAF (autoentrepreneur.urssaf.fr) sous 30 jours après la cessation.
3. Déclaration des revenus 2042-C-PRO à l'impôt sur le revenu en N+1.
4. Conservation des justificatifs comptables pendant 10 ans (livre des recettes, factures, registre achats).

Pièces à fournir au Guichet unique :
- Pièce d'identité du déclarant
- Justificatif d'adresse du siège (-3 mois)

Date : ${s()}
Signature : ____________________________`},{slug:"modification-activite-micro",title:"Déclaration de modification d'activité",description:"Changer ou ajouter une activité dans votre micro-entreprise.",category:"Démarches INPI",fields:[{key:"nom",label:"Nom complet"},{key:"siret",label:"SIRET"},{key:"ancienne",label:"Activité actuelle"},{key:"nouvelle",label:"Nouvelle activité",type:"textarea"},{key:"naf",label:"Code NAF/APE estimé"},{key:"dateEffet",label:"Date d'effet",placeholder:"01/06/2026",type:"date"}],body:e=>`DÉCLARATION DE MODIFICATION D'ACTIVITÉ — MICRO-ENTREPRENEUR
À effectuer sur procedures.inpi.fr

Déclarant : ${e.nom}
SIRET : ${e.siret}

Activité actuelle : ${e.ancienne}
Nouvelle activité (ajoutée ou remplacement) : ${e.nouvelle}
Code NAF/APE estimé : ${e.naf}
Date d'effet : ${e.dateEffet}

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

Date : ${s()}
Signature : ____________________________`},{slug:"changement-adresse-siege",title:"Déclaration de changement d'adresse du siège",description:"Notifier un déménagement du siège social au Guichet unique.",category:"Démarches INPI",fields:[{key:"nom",label:"Nom complet"},{key:"siret",label:"SIRET"},{key:"ancienne",label:"Ancienne adresse"},{key:"nouvelle",label:"Nouvelle adresse"},{key:"dateEffet",label:"Date d'effet",placeholder:"01/06/2026",type:"date"}],body:e=>`DÉCLARATION DE TRANSFERT DE SIÈGE — MICRO-ENTREPRENEUR
À effectuer sur procedures.inpi.fr dans les 30 jours.

Déclarant : ${e.nom}
SIRET : ${e.siret}

Ancienne adresse du siège : ${e.ancienne}
Nouvelle adresse du siège : ${e.nouvelle}
Date d'effet du transfert : ${e.dateEffet}

Conséquences :
- Mise à jour de l'extrait INSEE (SIRENE)
- Modification du CFE / centre des impôts de rattachement (selon dépt)
- Mise à jour des mentions sur vos factures et site web

Pièces à fournir :
- Pièce d'identité
- Justificatif de domicile -3 mois (facture EDF/GDF/internet ou quittance)
- Si domiciliation chez tiers : attestation + justificatif du tiers

Date : ${s()}
Signature : ____________________________`},{slug:"attestation-domiciliation",title:"Attestation de domiciliation à domicile",description:"Justifier la domiciliation du siège à votre adresse personnelle.",category:"Attestations",fields:[{key:"nom",label:"Nom du dirigeant"},{key:"adresse",label:"Adresse personnelle"},{key:"societe",label:'Dénomination (ou "Mon nom — entrepreneur individuel")'}],body:e=>`ATTESTATION DE DOMICILIATION

Je soussigné(e) ${e.nom}, occupant régulièrement le logement situé ${e.adresse} en qualité de résident principal, atteste par la présente domicilier l'établissement principal de mon activité de micro-entrepreneur (${e.societe}) à cette adresse.

Cette domiciliation respecte les dispositions de l'article L.123-11-1 du Code de commerce. Je certifie qu'aucune disposition contractuelle (bail, règlement de copropriété) ne s'y oppose, ou qu'à défaut, la durée de domiciliation est limitée à 5 ans.

Cette attestation est délivrée pour faire valoir ce que de droit dans le cadre des formalités d'immatriculation au RNE (procedures.inpi.fr).

Fait à _________________, le ${s()}.

Signature :


Pièces jointes :
- Pièce d'identité
- Justificatif de domicile -3 mois`},{slug:"attestation-non-condamnation",title:"Déclaration sur l'honneur de non-condamnation",description:"Document obligatoire à l'immatriculation au RNE.",category:"Attestations",fields:[{key:"nom",label:"Nom complet"},{key:"dateNaissance",label:"Date de naissance",type:"date"},{key:"lieuNaissance",label:"Lieu de naissance"},{key:"pere",label:"Nom et prénom du père"},{key:"mere",label:"Nom de jeune fille et prénom de la mère"}],body:e=>`DÉCLARATION SUR L'HONNEUR DE NON-CONDAMNATION ET DE FILIATION

Je soussigné(e) ${e.nom}
Né(e) le ${e.dateNaissance} à ${e.lieuNaissance}
Père : ${e.pere}
Mère : ${e.mere}

Déclare sur l'honneur :
1. Ne faire l'objet d'aucune condamnation pénale ou de sanction civile ou administrative de nature à m'interdire d'exercer une activité commerciale, artisanale ou libérale ou de gérer, administrer ou diriger une personne morale (art. L.128-1 du Code de commerce, art. 19-1 de la loi 84-46).
2. Avoir pris connaissance des dispositions législatives et réglementaires régissant mon activité.

Cette déclaration est faite pour servir et valoir ce que de droit, notamment dans le cadre de mon immatriculation au RNE.

Fait à _________________, le ${s()}.

Signature :`},{slug:"lettre-mise-en-demeure",title:"Lettre de mise en demeure (impayé)",description:"Relance formelle d'un client en retard de paiement.",category:"Lettres",fields:[{key:"emetteur",label:"Vos nom + adresse"},{key:"destinataire",label:"Client (raison sociale)"},{key:"adresse",label:"Adresse du client"},{key:"facture",label:"N° de facture"},{key:"montant",label:"Montant dû (€)"},{key:"echeance",label:"Date d'échéance",placeholder:"15/04/2026",type:"date"}],body:e=>`${e.emetteur}

Lettre recommandée avec accusé de réception

À l'attention de : ${e.destinataire}
${e.adresse}

Objet : Mise en demeure de payer — facture n° ${e.facture}

Madame, Monsieur,

Sauf erreur de notre part, votre compte présente un solde débiteur de ${e.montant} €, correspondant à la facture n° ${e.facture}, échue depuis le ${e.echeance}.

Malgré nos précédentes relances restées sans réponse, nous n'avons à ce jour reçu aucun règlement.

En conséquence, nous vous mettons en demeure de procéder au paiement de cette somme dans un délai de huit (8) jours à compter de la réception de la présente.

À défaut, nous nous réservons le droit d'engager toute action contentieuse, ainsi que de réclamer les pénalités de retard légales (taux BCE majoré de 10 points) et l'indemnité forfaitaire pour frais de recouvrement de 40 € (art. L.441-10 du Code de commerce).

Cordialement,

Fait le ${s()}.

Signature :`},{slug:"lettre-resiliation-bail",title:"Lettre de résiliation de bail commercial",description:"Préavis de 6 mois (bail 3-6-9).",category:"Lettres",fields:[{key:"emetteur",label:"Vos nom + adresse"},{key:"bailleur",label:"Nom et adresse du bailleur"},{key:"adresse",label:"Adresse du local"},{key:"effet",label:"Date d'effet (échéance triennale)",type:"date"}],body:e=>`${e.emetteur}

Lettre recommandée avec accusé de réception

À ${e.bailleur}

Objet : Résiliation du bail commercial — local ${e.adresse}

Madame, Monsieur,

Conformément à l'article L.145-9 du Code de commerce, je vous notifie par la présente la résiliation du bail commercial portant sur le local situé ${e.adresse}, à effet du ${e.effet}, en respectant le préavis légal de six (6) mois.

Je vous remercie de bien vouloir m'indiquer les modalités de restitution des locaux et d'organiser l'état des lieux de sortie.

Restant à votre disposition,

Cordialement,

Fait le ${s()}.

Signature :`},{slug:"mentions-legales-site",title:"Mentions légales pour site web",description:"Mentions obligatoires (LCEN 2004-575, art. 6-III).",category:"Site web",fields:[{key:"nomSite",label:"Nom du site"},{key:"urlSite",label:"URL du site",placeholder:"https://exemple.fr"},{key:"editeur",label:"Nom et prénom de l'éditeur"},{key:"siret",label:"SIRET"},{key:"naf",label:"Code NAF"},{key:"adresse",label:"Adresse du siège"},{key:"email",label:"Email de contact",type:"email"},{key:"telephone",label:"Téléphone"},{key:"directeurPub",label:"Directeur de la publication"},{key:"hebergeur",label:"Hébergeur (nom + adresse)",placeholder:"OVH SAS, 2 rue Kellermann, 59100 Roubaix"}],body:e=>`MENTIONS LÉGALES — ${e.nomSite}

Article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).

ÉDITEUR DU SITE
${e.editeur} — micro-entrepreneur
SIRET : ${e.siret}
Code NAF : ${e.naf}
Adresse : ${e.adresse}
Email : ${e.email}
Téléphone : ${e.telephone}
TVA non applicable, art. 293 B du CGI.

DIRECTEUR DE LA PUBLICATION
${e.directeurPub}

HÉBERGEUR
${e.hebergeur}

PROPRIÉTÉ INTELLECTUELLE
L'ensemble des contenus du site (textes, images, logos, vidéos) est protégé par le droit d'auteur (art. L.111-1 du Code de la propriété intellectuelle). Toute reproduction, représentation, modification ou exploitation totale ou partielle sans accord écrit préalable de l'éditeur est interdite.

DONNÉES PERSONNELLES
Voir la politique de confidentialité du site.

COOKIES
Voir la politique de cookies.

LITIGES
En cas de litige, les tribunaux français sont seuls compétents. Loi applicable : droit français.

Date de mise à jour : ${s()}`},{slug:"politique-confidentialite",title:"Politique de confidentialité (RGPD)",description:"Conforme RGPD (UE 2016/679) et loi Informatique et Libertés modifiée.",category:"Site web",fields:[{key:"nomSite",label:"Nom du site"},{key:"editeur",label:"Responsable de traitement"},{key:"email",label:"Email contact (DPO)",type:"email"},{key:"finalites",label:"Finalités du traitement",type:"textarea",placeholder:"Contact via formulaire, abonnement newsletter, gestion des commandes"},{key:"duree",label:"Durée de conservation",placeholder:"3 ans à compter du dernier contact"}],body:e=>`POLITIQUE DE CONFIDENTIALITÉ — ${e.nomSite}

Conforme au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée.

1. RESPONSABLE DU TRAITEMENT
${e.editeur}
Contact : ${e.email}

2. DONNÉES COLLECTÉES
Nous collectons les données suivantes lorsque vous utilisez notre site :
- Identité : nom, prénom, adresse email
- Données de connexion : adresse IP, horodatage, navigateur
- Données de navigation : pages visitées, temps passé (via cookies analytics)

3. FINALITÉS DU TRAITEMENT
${e.finalites}

4. BASE LÉGALE
- Consentement (formulaires, newsletter, cookies non-essentiels)
- Exécution du contrat (commandes, prestations)
- Obligation légale (facturation, comptabilité)
- Intérêt légitime (sécurité du site)

5. DESTINATAIRES
Vos données sont strictement destinées à ${e.editeur}. Aucune cession à des tiers commerciaux. Sous-traitants RGPD-conformes uniquement (hébergeur, outils analytics anonymisés).

6. DURÉE DE CONSERVATION
${e.duree}
Données comptables : conservées 10 ans (obligation légale).

7. VOS DROITS
Conformément aux art. 15 à 22 du RGPD, vous disposez des droits suivants :
- Accès, rectification, effacement
- Limitation du traitement
- Portabilité
- Opposition
- Retrait du consentement à tout moment

Pour les exercer : ${e.email}
Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).

8. TRANSFERTS HORS UE
Aucun transfert hors Union européenne sans garanties adaptées (clauses contractuelles types CE).

9. SÉCURITÉ
Mesures techniques et organisationnelles : chiffrement TLS, accès restreint, sauvegardes chiffrées.

Date de mise à jour : ${s()}`},{slug:"cookies-policy",title:"Politique de cookies",description:"Information cookies + consentement (CNIL).",category:"Site web",fields:[{key:"nomSite",label:"Nom du site"},{key:"email",label:"Email contact",type:"email"}],body:e=>`POLITIQUE DE COOKIES — ${e.nomSite}

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
${e.email}

Date de mise à jour : ${s()}`},{slug:"cgv-micro",title:"Conditions générales de vente (CGV) — micro",description:"CGV B2B pour prestations de services, adaptées micro-entrepreneur.",category:"Contrats",fields:[{key:"emetteur",label:"Nom + raison sociale"},{key:"siret",label:"SIRET"},{key:"adresse",label:"Adresse"},{key:"email",label:"Email contact",type:"email"},{key:"activite",label:"Activité principale",placeholder:"Conseil en stratégie digitale"}],body:e=>`CONDITIONS GÉNÉRALES DE VENTE — ${e.emetteur}

Version en vigueur au ${s()}.

ARTICLE 1 — IDENTITÉ DU PRESTATAIRE
${e.emetteur} — micro-entrepreneur
SIRET : ${e.siret}
Adresse : ${e.adresse}
Email : ${e.email}
Activité : ${e.activite}
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
En cas de litige, une solution amiable sera recherchée avant toute action. À défaut, compétence exclusive des tribunaux du ressort du siège du Prestataire. Droit français applicable.`},{slug:"contrat-prestation-simple",title:"Contrat de prestation de services (simple)",description:"Contrat court pour mission ponctuelle entre micro et client pro.",category:"Contrats",fields:[{key:"prestataire",label:"Prestataire (vos infos)"},{key:"client",label:"Client (raison sociale + SIRET)"},{key:"mission",label:"Description de la mission",type:"textarea"},{key:"duree",label:"Durée de la mission",placeholder:"Du 01/06/2026 au 31/07/2026"},{key:"montant",label:"Montant total HT (€)"},{key:"paiement",label:"Modalités de paiement",placeholder:"50 % à la signature, 50 % à la livraison"}],body:e=>`CONTRAT DE PRESTATION DE SERVICES

ENTRE LES SOUSSIGNÉS

Le Prestataire : ${e.prestataire}
ET
Le Client : ${e.client}

ARTICLE 1 — OBJET
Le Prestataire s'engage à réaliser pour le Client la mission suivante :
${e.mission}

ARTICLE 2 — DURÉE
Mission exécutée sur la période : ${e.duree}.

ARTICLE 3 — RÉMUNÉRATION
Montant total : ${e.montant} € HT (TVA non applicable, art. 293 B du CGI).
Modalités : ${e.paiement}.

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

Fait à _________________, en deux exemplaires, le ${s()}.

Pour le Prestataire :                       Pour le Client :
(Signature précédée de                       (Signature précédée de
la mention « Lu et approuvé »)              la mention « Lu et approuvé »)`}],C=["Démarches INPI","Attestations","Lettres","Site web","Contrats"];function $(){const e=h(),[a,b]=d.useState(o[0]),[c,m]=d.useState({}),[l,f]=d.useState("all"),u=d.useMemo(()=>a.body({...x(a),...c}),[a,c]),E=d.useMemo(()=>l==="all"?o:o.filter(t=>t.category===l),[l]);function y(){const t=g(a.title,u),n=new Blob([t],{type:"text/html;charset=utf-8"}),r=document.createElement("a");r.href=URL.createObjectURL(n),r.download=`${a.slug}.html`,r.click(),URL.revokeObjectURL(r.href),e.push({kind:"success",message:"Téléchargé (HTML imprimable, Ctrl+P pour PDF).",ttl:3e3})}function I(){const t=window.open("","_blank","width=900,height=1100");t&&(t.document.open(),t.document.write(g(a.title,u)),t.document.close(),setTimeout(()=>t.print(),350))}function N(){var t;(t=navigator.clipboard)==null||t.writeText(u).then(()=>e.push({kind:"success",message:"Texte copié dans le presse-papier.",ttl:2500}))}return i.jsxs(i.Fragment,{children:[i.jsx(T,{title:"Modèles juridiques & administratifs — Swivo",description:"Bibliothèque de modèles : lettres, attestations, mentions légales, RGPD, CGV, contrats.",path:"/outils/modeles",noindex:!0}),i.jsxs("section",{className:"container-page py-10 lg:py-14",children:[i.jsxs("div",{className:"mb-8",children:[i.jsx("span",{className:"badge-secondary",children:"Outil Gestion"}),i.jsx("h1",{className:"mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl",children:"Modèles juridiques & administratifs"}),i.jsxs("p",{className:"mt-2 max-w-2xl text-ink-muted",children:["Complétez les champs, prévisualisez en temps réel, téléchargez ou imprimez. ",o.length," modèles couvrant les démarches micro-entrepreneur courantes."]})]}),i.jsxs("div",{className:"mb-5 flex flex-wrap gap-2",children:[i.jsxs("button",{onClick:()=>f("all"),className:`badge ${l==="all"?"bg-primary-600 text-ink-inverse":"bg-primary-50 text-primary-700"}`,children:["Tous (",o.length,")"]}),C.map(t=>i.jsxs("button",{onClick:()=>f(t),className:`badge ${l===t?"bg-primary-600 text-ink-inverse":"bg-primary-50 text-primary-700"}`,children:[t," (",o.filter(n=>n.category===t).length,")"]},t))]}),i.jsxs("div",{className:"grid gap-6 lg:grid-cols-[300px_1fr]",children:[i.jsx("nav",{"aria-label":"Modèles",className:"card p-3 self-start lg:sticky lg:top-20",children:i.jsx("ul",{className:"space-y-1 max-h-[70vh] overflow-y-auto",children:E.map(t=>i.jsx("li",{children:i.jsxs("button",{onClick:()=>{b(t),m({})},className:`w-full rounded-lg px-3 py-2 text-left text-sm transition ${a.slug===t.slug?"bg-primary-50 text-primary-800 font-semibold":"text-ink-muted hover:bg-surface-muted hover:text-ink"}`,children:[i.jsx("span",{className:"block",children:t.title}),i.jsx("span",{className:"block text-xs font-normal text-ink-muted",children:t.category})]})},t.slug))})}),i.jsxs("div",{className:"space-y-4",children:[i.jsxs("div",{className:"card p-6",children:[i.jsx("div",{className:"flex items-start justify-between gap-3",children:i.jsxs("div",{children:[i.jsx("span",{className:"badge bg-primary-50 text-primary-700",children:a.category}),i.jsx("h2",{className:"mt-2 font-display text-xl font-semibold text-ink",children:a.title}),i.jsx("p",{className:"mt-1 text-sm text-ink-muted",children:a.description})]})}),i.jsx("div",{className:"mt-5 grid gap-3 sm:grid-cols-2",children:a.fields.map(t=>i.jsxs("div",{className:t.type==="textarea"?"sm:col-span-2":"",children:[i.jsx("label",{className:"label",htmlFor:`f-${t.key}`,children:t.label}),t.type==="textarea"?i.jsx("textarea",{id:`f-${t.key}`,className:"input min-h-[80px]",placeholder:t.placeholder??"",value:c[t.key]??"",onChange:n=>m(r=>({...r,[t.key]:n.target.value}))}):i.jsx("input",{id:`f-${t.key}`,type:t.type==="date"?"date":t.type==="email"?"email":"text",className:"input",placeholder:t.placeholder??"",value:c[t.key]??"",onChange:n=>m(r=>({...r,[t.key]:n.target.value}))})]},t.key))}),i.jsxs("div",{className:"mt-5 flex flex-wrap gap-2",children:[i.jsx("button",{onClick:y,className:"btn-primary",children:"↓ Télécharger HTML"}),i.jsx("button",{onClick:I,className:"btn-outline",children:"Imprimer / PDF"}),i.jsx("button",{onClick:N,className:"btn-ghost text-sm",children:"Copier le texte"})]})]}),i.jsxs("div",{className:"card overflow-hidden",children:[i.jsx("div",{className:"border-b border-surface-border bg-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted",children:"Aperçu"}),i.jsx("pre",{className:"whitespace-pre-wrap p-6 text-sm leading-relaxed text-ink",children:u})]})]})]})]})]})}function x(e){return Object.fromEntries(e.fields.map(a=>[a.key,a.placeholder??`[${a.label}]`]))}function p(e){return e.replace(/[&<>]/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[a])}function g(e,a){return`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${p(e)}</title>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 32px; line-height: 1.6; color: #0f172a; }
  h1 { font-size: 22px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 24px; letter-spacing: -0.01em; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
  @media print { body { padding: 18mm; } }
</style>
</head>
<body>
  <h1>${p(e)}</h1>
  <pre>${p(a)}</pre>
  <script>if(location.search.includes('print=1')){setTimeout(()=>window.print(),250);}<\/script>
</body>
</html>`}export{$ as ModelesPage};
