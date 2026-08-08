import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiBase } from './config';
import { consumeForClaim, getAnonProfile } from './anon-profile';
import { claimDrafts } from './api';
import { useToast } from '@/components/Toast';
import { setCurrentUid, scrubUserScopedStorage } from './user-storage';

export type User = { id: number; email: string; name: string; roles: string[]; gestion?: { active: boolean; until: string | null } };

type AuthState = {
  user: User | null;
  nonce: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, name: string, extras?: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<{ user: User | null; nonce: string | null }>;
};

const Ctx = createContext<AuthState | null>(null);

const API = `${apiBase()}/swivo/v1`;

async function call<T>(path: string, init?: RequestInit & { nonce?: string | null }): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const headers = new Headers(init?.headers ?? {});
    headers.set('Accept', 'application/json');
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (init?.nonce) headers.set('X-WP-Nonce', init.nonce);
    const res = await fetch(`${API}${path}`, { ...init, headers, credentials: 'include' });
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) return { ok: false, status: res.status, error: data?.message ?? `Erreur ${res.status}` };
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'Réseau indisponible' };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async (): Promise<{ user: User | null; nonce: string | null }> => {
    const r = await call<{ user: User | null; nonce: string | null }>('/auth/me');
    const u = r.data?.user ?? null;
    const n = r.data?.nonce ?? null;
    setCurrentUid(u ? u.id : null);
    setUser(u);
    setNonce(n);
    setLoading(false);
    return { user: u, nonce: n };
  };

  useEffect(() => { void refresh(); }, []);

  const claimPending = async (nonceArg: string | null) => {
    const anon = getAnonProfile();
    if (!anon || !anon.drafts.length) return;
    const items = consumeForClaim().filter((d) => d.token).map((d) => ({ id: d.id, token: d.token }));
    if (!items.length) return;
    await claimDrafts(items, nonceArg);
  };

  const login = async (email: string, password: string) => {
    const r = await call<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!r.ok) {
      toast.push({ kind: 'error', title: 'Connexion impossible', message: r.error ?? 'Identifiants invalides.', ttl: 4500 });
      return { ok: false, error: r.error };
    }
    const fresh = await refresh();
    await claimPending(fresh.nonce);
    toast.push({ kind: 'success', title: `Bienvenue${fresh.user?.name ? ' ' + fresh.user.name.split(' ')[0] : ''}`, message: 'Vous êtes connecté·e.', ttl: 3500 });
    return { ok: true };
  };

  const register = async (email: string, password: string, name: string, extras?: Record<string, unknown>) => {
    const r = await call<User>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, ...(extras ?? {}) }) });
    if (!r.ok) {
      toast.push({ kind: 'error', title: 'Inscription impossible', message: r.error ?? 'Erreur création compte.', ttl: 4500 });
      return { ok: false, error: r.error };
    }
    const fresh = await refresh();
    void claimPending(fresh.nonce);
    toast.push({ kind: 'success', title: 'Compte créé', message: `Bienvenue ${name.split(' ')[0]}, votre espace est prêt.`, ttl: 4500 });
    return { ok: true };
  };

  const logout = async () => {
    await call('/auth/logout', { method: 'POST', nonce });
    scrubUserScopedStorage();
    setCurrentUid(null);
    setUser(null);
    setNonce(null);
    toast.push({ kind: 'info', message: 'Vous êtes déconnecté·e. À bientôt.', ttl: 3000 });
  };

  return <Ctx.Provider value={{ user, nonce, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside <AuthProvider>');
  return v;
}
