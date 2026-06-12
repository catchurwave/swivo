/*
  Per-user localStorage scoping. Every pilotage/billing key is suffixed with
  ":u<userId>" so two accounts on the same browser cannot read each other's
  data. Anonymous reads fall back to ":anon" — the wizard's anon profile still
  needs to work pre-login.

  Set `swivo.current_uid` on login/register; clear on logout. When uid changes
  we proactively scrub the previous scope so a fresh sync from the server is
  the only source of truth.
*/

const UID_KEY = 'swivo.current_uid';
const SCOPED_PREFIXES = ['swivo.pilotage.', 'swivo.billing.'];

export function currentUid(): string {
  if (typeof localStorage === 'undefined') return 'anon';
  try { return localStorage.getItem(UID_KEY) || 'anon'; } catch { return 'anon'; }
}

export function setCurrentUid(uid: number | string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const prev = localStorage.getItem(UID_KEY);
    const next = uid == null ? '' : String(uid);
    if (prev && prev !== next) scrubUserScopedStorage(prev);
    if (next) localStorage.setItem(UID_KEY, next);
    else localStorage.removeItem(UID_KEY);
  } catch {}
}

export function userKey(base: string): string {
  return `${base}:u${currentUid()}`;
}

export function scrubUserScopedStorage(uidSuffix?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const suffix = uidSuffix ? `:u${uidSuffix}` : '';
    const remove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const hits = SCOPED_PREFIXES.some((p) => k.startsWith(p));
      if (!hits) continue;
      if (suffix && !k.endsWith(suffix)) continue;
      remove.push(k);
    }
    remove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
