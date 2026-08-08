import type { FormeJuridique, FaqItem, BlogPost, Pricing } from './types';

export const FORMES_SEED: FormeJuridique[] = [
  {
    slug: 'micro',
    label: 'Micro-entreprise',
    shortLabel: 'Micro',
    tagline: 'Le statut le plus simple, le plus rapide et le moins cher pour démarrer en solo.',
    associesMin: 1,
    associesMax: 1,
    regimeFiscal: 'Micro-fiscal (BIC / BNC / BA — versement libératoire possible)',
    regimeSocial: 'Travailleur non salarié (TNS) — URSSAF proportionnelle au CA',
    responsabilite: 'Patrimoine personnel séparé · résidence principale insaisissable de droit',
    bonPour: [
      'Lancer son activité en quelques minutes, 0 € de frais légaux',
      'Tester un projet sans engagement',
      'Comptabilité ultra-simple, pas de bilan annuel',
      'Cotisations indexées sur ce que vous encaissez',
    ],
  },
];

export const FAQ_SEED: FaqItem[] = [
  { cat: 'creation', q: 'Pourquoi choisir la micro-entreprise ?',
    a: 'C’est le statut le plus simple : création gratuite, comptabilité ultra-allégée, charges proportionnelles au CA. Idéal pour démarrer une activité solo sous 188 700 € (vente) ou 77 700 € (service).' },
  { cat: 'creation', q: 'Combien de temps prend la déclaration ?',
    a: 'Le parcours dure 5 minutes. Une fois validé, nous transmettons au Guichet unique INPI sous 24 h. Vous recevez votre SIRET sous 8 à 15 jours selon votre CFE de rattachement.' },
  { cat: 'creation', q: 'Quels documents faut-il préparer ?',
    a: 'Pièce d’identité, justificatif de domicile -3 mois pour le siège, et pour les activités artisanales : diplôme/CAP ou attestation de qualification (CMA).' },
  { cat: 'creation', q: 'Puis-je obtenir l’ACRE ?',
    a: 'L’ACRE exonère 50 % des cotisations URSSAF la 1ère année si vous êtes demandeur d’emploi indemnisé, bénéficiaire du RSA, moins de 26 ans ou repreneur d’entreprise. Notre assistant vérifie automatiquement votre éligibilité.' },
  { cat: 'tarifs', q: 'Pourquoi 29,90 € si la création INPI est gratuite ?',
    a: 'L’INPI ne facture rien, mais le parcours est complexe (NAF, régime fiscal, ACRE, TVA…). Nos 29,90 € couvrent l’accompagnement, la vérification juriste et la transmission sans erreur. Tarif fixe, sans surprise.' },
  { cat: 'tarifs', q: 'Que comprend la formule Gestion à 9,90 €/mois ?',
    a: 'Tableau de bord CA/charges, simulateur URSSAF temps réel, rappels d’échéances, facturation & devis illimités, relances automatiques, alertes seuils TVA, exports comptables, modèles juridiques. Sans engagement.' },
  { cat: 'gestion', q: 'Comment fonctionnent les cotisations URSSAF ?',
    a: 'Vous déclarez votre CA tous les mois ou trimestres. Les cotisations sont prélevées proportionnellement : 12,3 % (vente), 21,1 % (service BIC) ou 21,2 % (BNC libéral). Zéro CA = zéro cotisation.' },
  { cat: 'gestion', q: 'À quel moment dois-je facturer la TVA ?',
    a: 'En franchise en base jusqu’à 85 000 € (vente) ou 37 500 € (service). Dépassement : passage au régime réel avec TVA à appliquer. Notre dashboard vous alerte 2 mois avant le seuil.' },
  { cat: 'gestion', q: 'Puis-je mettre ma micro-entreprise en pause ?',
    a: 'Oui : déclaration de cessation temporaire d’activité. Pas de cotisations pendant la pause. Vous pouvez reprendre à tout moment sans recréer l’entreprise.' },
  { cat: 'legal', q: 'Swivo est-il un service public ?',
    a: 'Non. Swivo est un service privé indépendant qui prépare et transmet vos déclarations au Guichet unique INPI (service officiel). Nous ne nous substituons ni à l’INPI ni à l’URSSAF.' },
  { cat: 'legal', q: 'Mes données sont-elles protégées ?',
    a: 'Oui. Données hébergées en France, conformité RGPD, chiffrement TLS. Vous pouvez demander à tout moment l’accès, la rectification ou la suppression de vos données (dpo@swivo.fr).' },
];

export const POSTS_SEED: BlogPost[] = [
  { slug: 'micro-entreprise-2026-plafonds', title: 'Micro-entreprise 2026 : plafonds CA et franchise TVA',
    excerpt: 'Tous les seuils mis à jour, ce qui change vraiment pour vos déclarations.',
    body: '<p>Plafonds CA 2026 : 188 700 € (vente) / 77 700 € (service). Franchise TVA : 85 000 € (vente) / 37 500 € (service). Dépassement = passage au réel.</p>',
    date: '2026-05-02T10:00:00', readMin: 5, tag: 'Plafonds', author: 'Équipe Swivo' },
  { slug: 'choisir-code-naf-ape', title: 'Comment choisir son code NAF/APE en micro-entreprise',
    excerpt: 'Le code NAF détermine votre régime social et fiscal. Guide pratique avec exemples.',
    body: '<p>Le code NAF est attribué par l’INSEE après immatriculation, mais le code APE déclaré au Guichet unique l’influence directement. Notre assistant suggère le bon code en fonction de votre description d’activité.</p>',
    date: '2026-04-18T10:00:00', readMin: 6, tag: 'Démarrage', author: 'Équipe Swivo' },
  { slug: 'acre-micro-entrepreneur', title: 'ACRE : qui peut bénéficier de l’exonération en 2026 ?',
    excerpt: 'Conditions, montant, démarches : tout ce qu’il faut savoir pour économiser jusqu’à 50 % de charges la 1ère année.',
    body: '<p>L’ACRE exonère 50 % des cotisations URSSAF la 1ère année si vous êtes demandeur d’emploi, RSA, JEI, repreneur ou moins de 26 ans. Demande à faire dans les 45 jours après immatriculation.</p>',
    date: '2026-03-30T10:00:00', readMin: 7, tag: 'ACRE', author: 'Équipe Swivo' },
  { slug: 'declarer-ca-urssaf-micro', title: 'Déclarer son CA URSSAF : mensuel ou trimestriel ?',
    excerpt: 'Comment fonctionne la déclaration micro, quelles cases remplir, quels pièges éviter.',
    body: '<p>Le micro-entrepreneur déclare son CA encaissé (pas facturé) tous les mois ou trimestres. 0 CA = déclaration à 0 obligatoire. Pénalité : 56,80 € par absence de déclaration.</p>',
    date: '2026-03-12T10:00:00', readMin: 6, tag: 'URSSAF', author: 'Équipe Swivo' },
];

export const PRICING_SEED: Pricing = {
  creation: {
    price: '29,90 €',
    suffix: ' tout compris',
    features: [
      'Déclaration micro-entreprise accompagnée (5 min)',
      'Choix du code NAF + régime fiscal optimisé',
      'Demande ACRE incluse si éligible',
      'Transmission au Guichet unique INPI sous 24 h',
      'Réception du SIRET + suivi temps réel',
      'Support juridique humain par email',
    ],
    note: 'Création INPI : 0 € de frais légaux. Service Swivo : 29,90 € pour vous accompagner.',
  },
  gestion: {
    price: '9,90 €',
    suffix: ' / mois',
    features: [
      'Tableau de bord CA / charges / bénéfices',
      'Simulateur URSSAF temps réel + rappels',
      'Factures & devis illimités, normes 2026',
      'Relances automatiques impayés',
      'Alertes seuils TVA + plafonds micro',
      'Exports comptables CSV / Excel',
      'Modèles juridiques + lettres types',
      'Support prioritaire 24 h',
    ],
    note: 'Sans engagement, résiliable en 1 clic.',
  },
  inpiFees: [
    { k: 'Création micro-entreprise (INPI)', v: '0 €' },
    { k: 'Activité artisanale (CMA)', v: '0 €' },
    { k: 'Versement libératoire (option fiscale)', v: '0 €' },
    { k: 'Service d’accompagnement Swivo', v: '29,90 €' },
  ],
};
