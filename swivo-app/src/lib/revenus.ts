/*
  Persistance hybride : localStorage (offline-first) + sync WP REST.
  Lecture toujours synchrone depuis localStorage.
  Mutations : maj localStorage immédiate + push serveur async (fire-and-forget).
  `syncFromServer()` à appeler au mount pour pull initial.
*/
import type { CategorieMicro } from './urssaf';
import {
  fetchEncaissements, pushEncaissement, delEncaissement,
  fetchDepenses, pushDepense, delDepense,
  fetchProfilEmetteur, pushProfilEmetteur,
} from './pilotage-api';

export type Encaissement = {
  id: string;
  date: string;            // ISO YYYY-MM-DD
  montant: number;         // €
  categorie: CategorieMicro;
  libelle?: string;
  source?: 'facture' | 'manuel' | 'import_bancaire';
  factureId?: string;
};

export type Depense = {
  id: string;
  date: string;
  montant: number;
  libelle: string;
  type: 'fourniture' | 'loyer' | 'logiciel' | 'transport' | 'communication' | 'autre';
};

import { userKey, scrubUserScopedStorage } from './user-storage';

const KEY_ENC = () => userKey('swivo.pilotage.encaissements.v1');
const KEY_DEP = () => userKey('swivo.pilotage.depenses.v1');
const KEY_PROFIL = () => userKey('swivo.pilotage.profil.v1');

export { scrubUserScopedStorage };

export type ProfilFiscal = {
  categorieDefaut: CategorieMicro;
  acreJusquAu?: string;             // ISO YYYY-MM-DD
  versementLiberatoire: boolean;
  regimeDeclaration: 'mensuel' | 'trimestriel';
  caObjectifAnnuel?: number;
};

const PROFIL_DEFAULT: ProfilFiscal = {
  categorieDefaut: 'service_bnc',
  versementLiberatoire: false,
  regimeDeclaration: 'mensuel',
};

/* ====== ENCAISSEMENTS ====== */
export function listEncaissements(): Encaissement[] {
  try {
    const raw = localStorage.getItem(KEY_ENC());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveEncaissements(arr: Encaissement[]): void {
  try { localStorage.setItem(KEY_ENC(), JSON.stringify(arr)); } catch {}
}

export function addEncaissement(e: Omit<Encaissement, 'id'>): Encaissement {
  const item = { ...e, id: uid() };
  saveEncaissements([item, ...listEncaissements()]);
  void pushEncaissement(item);
  return item;
}

export function deleteEncaissement(id: string): void {
  saveEncaissements(listEncaissements().filter((e) => e.id !== id));
  void delEncaissement(id);
}

/* ====== DÉPENSES ====== */
export function listDepenses(): Depense[] {
  try {
    const raw = localStorage.getItem(KEY_DEP());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveDepenses(arr: Depense[]): void {
  try { localStorage.setItem(KEY_DEP(), JSON.stringify(arr)); } catch {}
}

export function addDepense(d: Omit<Depense, 'id'>): Depense {
  const item = { ...d, id: uid() };
  saveDepenses([item, ...listDepenses()]);
  void pushDepense(item);
  return item;
}

export function deleteDepense(id: string): void {
  saveDepenses(listDepenses().filter((d) => d.id !== id));
  void delDepense(id);
}

/* ====== PROFIL FISCAL ====== */
export function getProfilFiscal(): ProfilFiscal {
  try {
    const raw = localStorage.getItem(KEY_PROFIL());
    return raw ? { ...PROFIL_DEFAULT, ...JSON.parse(raw) } : PROFIL_DEFAULT;
  } catch { return PROFIL_DEFAULT; }
}

export function saveProfilFiscal(p: Partial<ProfilFiscal>): ProfilFiscal {
  const merged = { ...getProfilFiscal(), ...p };
  try { localStorage.setItem(KEY_PROFIL(), JSON.stringify(merged)); } catch {}
  void pushProfilEmetteur({ profil: merged });
  return merged;
}

/* ====== AGRÉGATIONS ====== */
export type Periode = { from: string; to: string };

export function periodeMois(date: Date = new Date()): Periode {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export function periodeAnnee(year: number = new Date().getFullYear()): Periode {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function periodeTrimestre(date: Date = new Date()): Periode {
  const q = Math.floor(date.getMonth() / 3);
  const y = date.getFullYear();
  const from = new Date(y, q * 3, 1).toISOString().slice(0, 10);
  const to = new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10);
  return { from, to };
}

export function caPeriode(p: Periode, arr: Encaissement[] = listEncaissements()): number {
  return arr.filter((e) => e.date >= p.from && e.date <= p.to).reduce((s, e) => s + e.montant, 0);
}

export function caParCategorie(p: Periode, arr: Encaissement[] = listEncaissements()): Record<CategorieMicro, number> {
  const out: Record<CategorieMicro, number> = { vente_bic: 0, service_bic: 0, service_bnc: 0, liberal_cipav: 0 };
  for (const e of arr) {
    if (e.date >= p.from && e.date <= p.to) out[e.categorie] += e.montant;
  }
  return out;
}

export function caMensuel12Mois(arr: Encaissement[] = listEncaissements(), ref: Date = new Date()): Array<{ mois: string; ca: number }> {
  const out: Array<{ mois: string; ca: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const p = periodeMois(d);
    out.push({
      mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      ca: caPeriode(p, arr),
    });
  }
  return out;
}

export function depensesPeriode(p: Periode, arr: Depense[] = listDepenses()): number {
  return arr.filter((d) => d.date >= p.from && d.date <= p.to).reduce((s, d) => s + d.montant, 0);
}

/* ====== DONNÉES DE DÉMONSTRATION — désactivées ======
   Ne JAMAIS auto-seeder un compte utilisateur réel : nouveau compte = données
   vides, isolation stricte. Le KPI "CA cumulé" doit refléter uniquement les
   encaissements réels remontés du serveur via syncFromServer().
   No-op conservé pour ne pas casser les imports existants. */
export function ensureDemoData(): void {
  /* intentionally empty */
}

/* ====== HELPERS ====== */
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'enc-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ====== SYNC SERVEUR ====== */

/**
 * Pull encaissements + depenses + profil depuis le serveur, fusionne avec le
 * local (server priorise). Appeler une fois au mount des pages pilotage.
 * Renvoie true si la sync a abouti.
 */
export async function syncFromServer(): Promise<boolean> {
  try {
    const [profEm, encs, deps] = await Promise.all([
      fetchProfilEmetteur(),
      fetchEncaissements(),
      fetchDepenses(),
    ]);
    if (encs) saveEncaissements(encs as Encaissement[]);
    if (deps) saveDepenses(deps as Depense[]);
    if (profEm && profEm.profil && Object.keys(profEm.profil).length > 0) {
      try { localStorage.setItem(KEY_PROFIL(), JSON.stringify({ ...PROFIL_DEFAULT, ...profEm.profil })); } catch {}
    }
    return !!(encs || deps || profEm);
  } catch {
    return false;
  }
}
