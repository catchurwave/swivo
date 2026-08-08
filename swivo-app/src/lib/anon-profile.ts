/*
  Profil anonyme — identité temporaire stockée dans localStorage.
  Permet à un visiteur non connecté de commencer un dossier, de revenir plus
  tard depuis le même navigateur, et de migrer ses brouillons vers son compte
  dès qu'il s'inscrit. Périmètre : pas de PII tant que l'utilisateur ne saisit
  pas son identité dans le wizard.
*/

const KEY = 'swivo.anon.profile.v1';

export type AnonDraftRef = {
  id: number;
  token: string;
  forme?: string;
  score?: number;
  savedAt?: string;
};

export type AnonProfile = {
  anonId: string;             // UUID local — sert d'identifiant de session
  createdAt: string;
  identite?: {
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
  };
  drafts: AnonDraftRef[];
};

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getAnonProfile(): AnonProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object' || !p.anonId) return null;
    if (!Array.isArray(p.drafts)) p.drafts = [];
    return p as AnonProfile;
  } catch {
    return null;
  }
}

export function ensureAnonProfile(): AnonProfile {
  const existing = getAnonProfile();
  if (existing) return existing;
  const fresh: AnonProfile = { anonId: uuid(), createdAt: new Date().toISOString(), drafts: [] };
  saveAnonProfile(fresh);
  return fresh;
}

export function saveAnonProfile(p: AnonProfile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function clearAnonProfile() {
  try { localStorage.removeItem(KEY); } catch {}
}

/* Identité */
export function setAnonIdentite(patch: Partial<NonNullable<AnonProfile['identite']>>) {
  const p = ensureAnonProfile();
  p.identite = { ...(p.identite ?? {}), ...patch };
  saveAnonProfile(p);
  return p;
}

/* Brouillons */
export function upsertAnonDraft(ref: AnonDraftRef) {
  const p = ensureAnonProfile();
  const i = p.drafts.findIndex((d) => d.id === ref.id);
  if (i >= 0) p.drafts[i] = { ...p.drafts[i], ...ref };
  else p.drafts.push(ref);
  saveAnonProfile(p);
  return p;
}

export function removeAnonDraft(id: number) {
  const p = getAnonProfile();
  if (!p) return;
  p.drafts = p.drafts.filter((d) => d.id !== id);
  saveAnonProfile(p);
}

export function listAnonDrafts(): AnonDraftRef[] {
  return getAnonProfile()?.drafts ?? [];
}

/* Migration vers compte */
export function consumeForClaim(): AnonDraftRef[] {
  const p = getAnonProfile();
  if (!p) return [];
  const drafts = [...p.drafts];
  p.drafts = [];
  saveAnonProfile(p);
  return drafts;
}

export function hasPendingDraft(): boolean {
  return (getAnonProfile()?.drafts.length ?? 0) > 0;
}
