/*
  Adaptive chat flow. Each step yields a question; user answer mutates the
  dossier object. Next step decided by `next(answer, dossier)` so the flow
  adapts in real time.
*/
import { FORMES_SEED } from '@/data/seeds';
import type { FormeJuridique } from '@/data/types';

export type Answer = string;

export type Dossier = {
  projet?: string;
  associes?: 'seul' | 'plusieurs';
  capitalLevee?: 'oui' | 'non' | 'peutetre';
  ca?: string;
  forme?: FormeJuridique['slug'];
  identite?: { prenom?: string; nom?: string; email?: string };
  siege?: { adresse?: string };
  activite?: string;
};

export type StepOption = { value: string; label: string; hint?: string; icon?: string };

export type Step =
  | {
      id: string;
      kind: 'choice';
      question: (d: Dossier) => string;
      options: StepOption[];
      apply: (a: Answer, d: Dossier) => Dossier;
      next: (a: Answer, d: Dossier) => string | null;
      validate?: (a: Answer, d: Dossier) => string[];
    }
  | {
      id: string;
      kind: 'text';
      question: (d: Dossier) => string;
      placeholder?: string;
      apply: (a: Answer, d: Dossier) => Dossier;
      next: (a: Answer, d: Dossier) => string | null;
      validate?: (a: Answer, d: Dossier) => string[];
    }
  | {
      id: string;
      kind: 'recap';
      question: (d: Dossier) => string;
      summary: (d: Dossier) => string;
      next: () => string | null;
    };

function recommendForme(_d: Dossier): FormeJuridique['slug'] {
  // Pivot micro-only — on recommande toujours la micro-entreprise.
  return 'micro';
}

export const STEPS: Record<string, Step> = {
  start: {
    id: 'start', kind: 'choice',
    question: () => 'Quel est votre projet d’entreprise en une phrase ?',
    options: [
      { value: 'service',   label: 'Prestations de services', hint: 'Consulting, freelance',     icon: '💼' },
      { value: 'commerce',  label: 'Achat / vente',           hint: 'Boutique, e-commerce',      icon: '🏪' },
      { value: 'artisanat', label: 'Artisanat',               hint: 'Métiers manuels',           icon: '🔨' },
      { value: 'autre',     label: 'Autre projet',                                               icon: '💡' },
    ],
    apply: (a, d) => ({ ...d, projet: a }),
    next: () => 'associes',
  },
  associes: {
    id: 'associes', kind: 'choice',
    question: () => 'Vous lancez-vous seul·e ou à plusieurs ?',
    options: [
      { value: 'seul',      label: 'Seul·e',     icon: '🧑‍💼' },
      { value: 'plusieurs', label: 'À plusieurs', icon: '👥' },
    ],
    apply: (a, d) => ({ ...d, associes: a as Dossier['associes'] }),
    next: () => 'capital',
  },
  capital: {
    id: 'capital', kind: 'choice',
    question: () => 'Envisagez-vous une levée de fonds ou des investisseurs ?',
    options: [
      { value: 'non',      label: 'Non',                 icon: '🚫' },
      { value: 'peutetre', label: 'Peut-être plus tard', icon: '🤔' },
      { value: 'oui',      label: 'Oui, à court terme',  icon: '🚀' },
    ],
    apply: (a, d) => ({ ...d, capitalLevee: a as Dossier['capitalLevee'] }),
    next: (_, d) => (d.associes === 'seul' ? 'ca' : 'recommend'),
  },
  ca: {
    id: 'ca', kind: 'choice',
    question: () => 'Chiffre d’affaires prévu la 1re année ?',
    options: [
      { value: 'lt30k', label: 'Moins de 30 000 €',  icon: '🌱' },
      { value: '30_80', label: '30 000 – 80 000 €',  icon: '📈' },
      { value: 'gt80',  label: 'Plus de 80 000 €',   icon: '💰' },
    ],
    apply: (a, d) => ({ ...d, ca: a }),
    next: () => 'recommend',
  },
  recommend: {
    id: 'recommend', kind: 'recap',
    question: (d) => {
      const slug = recommendForme(d);
      const f = FORMES_SEED.find((x) => x.slug === slug)!;
      return `Forme recommandée : ${f.label}. On continue ?`;
    },
    summary: (d) => {
      const slug = recommendForme(d);
      return FORMES_SEED.find((x) => x.slug === slug)!.tagline;
    },
    next: () => 'identite',
  },
  identite: {
    id: 'identite', kind: 'text',
    question: () => 'Votre prénom et nom (du dirigeant) ?',
    placeholder: 'Jean Dupont',
    validate: (a) => {
      const parts = a.trim().split(/\s+/);
      const errs: string[] = [];
      if (parts.length < 2) errs.push('Indiquez prénom ET nom.');
      if (a.trim().length < 4) errs.push('Trop court (≥ 4 caractères).');
      if (/\d/.test(a)) errs.push('Pas de chiffres dans le nom.');
      return errs;
    },
    apply: (a, d) => {
      const [prenom, ...rest] = a.trim().split(/\s+/);
      return { ...d, identite: { ...(d.identite || {}), prenom, nom: rest.join(' ') } };
    },
    next: () => 'email',
  },
  email: {
    id: 'email', kind: 'text',
    question: () => 'Votre email pour recevoir le dossier ?',
    placeholder: 'vous@email.fr',
    validate: (a) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(a.trim()) ? [] : ['Email invalide.'],
    apply: (a, d) => ({ ...d, identite: { ...(d.identite || {}), email: a.trim() } }),
    next: () => 'siege',
  },
  siege: {
    id: 'siege', kind: 'text',
    question: () => 'Adresse du siège social ?',
    placeholder: '12 rue de la République, 75001 Paris',
    validate: (a) => {
      const errs: string[] = [];
      if (a.trim().length < 10) errs.push('Adresse trop courte.');
      if (!/\b\d{5}\b/.test(a)) errs.push('Code postal (5 chiffres) manquant.');
      return errs;
    },
    apply: (a, d) => ({ ...d, siege: { adresse: a } }),
    next: () => 'activite',
  },
  activite: {
    id: 'activite', kind: 'text',
    question: () => 'Décrivez l’activité principale :',
    placeholder: 'Conseil en transformation digitale auprès des PME',
    validate: (a) => a.trim().length < 15 ? ['Description trop courte (≥ 15 caractères).'] : [],
    apply: (a, d) => ({ ...d, activite: a }),
    next: () => 'done',
  },
  done: {
    id: 'done', kind: 'recap',
    question: () => 'Dossier prêt ! Voici votre récapitulatif.',
    summary: (d) =>
      `Forme : ${recommendForme(d).toUpperCase()} · Dirigeant : ${d.identite?.prenom ?? ''} ${d.identite?.nom ?? ''} · Siège : ${d.siege?.adresse ?? ''}`,
    next: () => null,
  },
};

export function recommend(d: Dossier) { return recommendForme(d); }
