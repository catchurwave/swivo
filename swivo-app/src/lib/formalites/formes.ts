/*
  Forme juridique unique — micro-entreprise.
  Source : INPI guichet unique, BOFIP, code de la Sécurité sociale.
  Le moteur multi-formes initial a été simplifié au strict nécessaire pour
  la micro depuis le pivot 100 % micro-entreprise.
*/
import type { FormeCode, RegimeFiscal, RegimeSocialDirigeant } from './types';

export type FormeRule = {
  code: FormeCode;
  inseeCode: string;
  label: string;
  shortLabel: string;
  isSociete: boolean;
  capital: {
    requis: boolean;
    montantMin: number;
    montantMax?: number;
    libereMinPct?: number;
    libereMinPctApports?: number;
    permetVariable?: boolean;
    apportNatureCommissaire?: { seuilParApport: number; totalGtCapitalPct: number };
  };
  associes: { min: number; max?: number; permetMorale?: boolean };
  dirigeants: { titres: string[]; min: number; max?: number; obligatoireUnique?: boolean };
  regimesFiscaux: { defaut: RegimeFiscal; options: RegimeFiscal[] };
  regimeSocialDirigeantDefaut: RegimeSocialDirigeant;
  rbeObligatoire: boolean;
  statutsObligatoires: boolean;
  annonceLegaleObligatoire: boolean;
  depotCapitalObligatoire: boolean;
  formaliteINPI: 'creation_micro_entrepreneur';
  responsabiliteAssocies: 'limitee_apports';
  particularites: string[];
};

export const FORMES: Record<FormeCode, FormeRule> = {
  micro: {
    code: 'micro',
    inseeCode: '1000',
    label: 'Micro-entreprise',
    shortLabel: 'Micro',
    isSociete: false,
    capital: { requis: false, montantMin: 0 },
    associes: { min: 1, max: 1 },
    dirigeants: { titres: ['Entrepreneur individuel'], min: 1, max: 1, obligatoireUnique: true },
    regimesFiscaux: { defaut: 'micro_bic', options: ['micro_bic', 'micro_bnc', 'micro_ba'] },
    regimeSocialDirigeantDefaut: 'tns',
    rbeObligatoire: false,
    statutsObligatoires: false,
    annonceLegaleObligatoire: false,
    depotCapitalObligatoire: false,
    formaliteINPI: 'creation_micro_entrepreneur',
    responsabiliteAssocies: 'limitee_apports',
    particularites: [
      'Plafonds CA 2026 : 188 700 € vente / 77 700 € service',
      'Franchise en base de TVA : 85 000 € (vente) / 37 500 € (service)',
      'Cotisations URSSAF proportionnelles au CA déclaré (12,3 % / 21,1 % / 21,2 %)',
      'Versement libératoire IR sous conditions de RFR',
      'Résidence principale insaisissable de droit (loi 14/02/2022)',
      'Comptabilité ultra-simplifiée : livre des recettes + registre des achats',
    ],
  },
};

export function getForme(_code: FormeCode = 'micro'): FormeRule {
  return FORMES.micro;
}

export const ALL_FORMES: FormeCode[] = ['micro'];
