/*
  Stub recommandation — site centré sur la micro-entreprise.
  Conservé pour la compatibilité du wizard, mais retourne toujours `micro`.
*/
import type { Dossier, FormeCode } from './types';

export type Profil = {
  associes: number;
  associesMorale?: boolean;
  leveeFonds?: 'non' | 'peutetre' | 'oui';
  caPrevisionnel?: number;
  patrimoinePerso?: 'protege' | 'engage' | 'indiff';
  protectionSociale?: 'tns_economique' | 'salarie_complete' | 'indiff';
  fiscalite?: 'ir_passthrough' | 'is_dividendes' | 'indiff';
  activiteCategorie?: 'commerciale' | 'artisanale' | 'liberale_reglementee' | 'liberale_non_reglementee' | 'agricole' | 'mixte';
  activiteImmobiliere?: boolean;
  pluriProfessionsLiberales?: boolean;
  capitalEnvisage?: number;
  conjointParticipe?: boolean;
  rapidite?: 'ultra' | 'rapide' | 'standard';
};

export type Reco = {
  forme: FormeCode;
  score: number;
  pour: string[];
  contre: string[];
  eligible: boolean;
};

const MICRO_RECO: Reco = {
  forme: 'micro',
  score: 100,
  pour: [
    'Création gratuite et 100 % en ligne en 5 minutes',
    'Comptabilité ultra-simplifiée : livre des recettes',
    'Cotisations URSSAF proportionnelles au CA — zéro CA, zéro charge',
    'Franchise de TVA jusqu’à 85 000 € / 37 500 €',
  ],
  contre: [],
  eligible: true,
};

export function recommander(_profil: Profil): Reco[] {
  return [MICRO_RECO];
}

export function meilleureForme(_profil: Profil): FormeCode {
  return 'micro';
}

export function profilDepuisDossier(d: Partial<Dossier>): Profil {
  return {
    associes: 1,
    activiteCategorie: d.activites?.[0]?.categorie === 'mixte' ? 'commerciale' : d.activites?.[0]?.categorie,
    capitalEnvisage: 0,
  };
}
