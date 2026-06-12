/*
  WordPress REST client.
  - Tries WP API first (proxied to VITE_WP_API_URL in dev).
  - Falls back to bundled seed data when WP is unreachable / empty.
*/
import { useEffect, useState } from 'react';
import { FORMES_SEED, FAQ_SEED, POSTS_SEED, PRICING_SEED } from '@/data/seeds';
import type { FormeJuridique, FaqItem, BlogPost, Pricing } from '@/data/types';
import { apiBase } from './config';

const API_BASE = apiBase();

async function get<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' }, credentials: 'include', signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function post<T>(path: string, body: unknown, nonce?: string | null): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (nonce) headers['X-WP-Nonce'] = nonce;
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers, credentials: 'include', body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) return { ok: false, error: data?.message ?? `Erreur ${res.status}` };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Réseau indisponible' };
  }
}

type WpPost = {
  id: number; slug: string; date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: Array<{ source_url?: string }> };
};

async function fetchFormes(signal?: AbortSignal): Promise<FormeJuridique[]> {
  const data = await get<FormeJuridique[]>('/swivo/v1/formes', signal);
  return data && data.length ? data : FORMES_SEED;
}

async function fetchFaq(signal?: AbortSignal): Promise<FaqItem[]> {
  const data = await get<FaqItem[]>('/swivo/v1/faq', signal);
  return data && data.length ? data : FAQ_SEED;
}

async function fetchPricing(signal?: AbortSignal): Promise<Pricing> {
  const data = await get<Pricing>('/swivo/v1/pricing', signal);
  return data ?? PRICING_SEED;
}

function mapWpPost(p: WpPost): BlogPost {
  const text = p.content.rendered;
  return {
    slug: p.slug,
    title: stripHtml(p.title.rendered),
    excerpt: stripHtml(p.excerpt.rendered),
    body: text,
    date: p.date,
    readMin: Math.max(2, Math.ceil(text.split(' ').length / 220)),
    tag: 'Article',
    author: 'Swivo',
    cover: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
  };
}

async function fetchPosts(signal?: AbortSignal): Promise<BlogPost[]> {
  const raw = await get<WpPost[]>('/wp/v2/posts?per_page=12&_embed=wp:featuredmedia', signal);
  return raw && raw.length ? raw.map(mapWpPost) : POSTS_SEED;
}

async function fetchPost(slug: string, signal?: AbortSignal): Promise<BlogPost | undefined> {
  const raw = await get<WpPost[]>(`/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia`, signal);
  if (raw && raw.length) return mapWpPost(raw[0]);
  return POSTS_SEED.find((s) => s.slug === slug);
}

export const api = { fetchFormes, fetchFaq, fetchPricing, fetchPosts, fetchPost };

export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetcher(ctrl.signal)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error };
}

function stripHtml(s: string) { return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }

/* — Mutations — */

export async function submitDossier(dossier: object, nonce?: string | null) {
  const r = await post<{ id: number; status: string }>('/swivo/v1/dossier', dossier, nonce);
  return r.ok ? r.data ?? null : null;
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ChatTurnResponse = { reply: string; extract: Record<string, unknown> };

export async function chatTurn(messages: ChatMessage[], dossier: object, nonce?: string | null) {
  return post<ChatTurnResponse>('/swivo/v1/chat/turn', { messages, dossier }, nonce);
}

export async function startCheckout(dossierId: number, nonce?: string | null) {
  return post<{ url: string }>('/swivo/v1/checkout', { dossierId }, nonce);
}

export async function startSubscribe(nonce?: string | null) {
  return post<{ url: string }>('/swivo/v1/subscribe', {}, nonce);
}

export async function openBillingPortal(nonce?: string | null) {
  return post<{ url: string }>('/swivo/v1/billing-portal', {}, nonce);
}

/* — Drafts (formalités complètes) — */

export type DraftSaveResponse = { id: number; status: string; token: string | null; savedAt: string; score: number };
export type DraftSummary = { id: number; title: string; forme: string; score: number; savedAt: string; updatedAt: string };

export async function saveDraft(payload: object, opts: { id?: number; token?: string | null; nonce?: string | null }) {
  const body: any = { payload };
  if (opts.id) body.id = opts.id;
  if (opts.token) body.token = opts.token;
  return post<DraftSaveResponse>('/swivo/v1/draft', body, opts.nonce);
}

export async function fetchDraft(id: number, token?: string | null) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return get<{ id: number; status: string; savedAt: string; payload: any }>(`/swivo/v1/draft/${id}${qs}`);
}

export async function listDrafts() {
  return get<DraftSummary[]>('/swivo/v1/drafts');
}

export async function deleteDraft(id: number, token?: string | null, nonce?: string | null) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (nonce) headers['X-WP-Nonce'] = nonce;
    const res = await fetch(`${API_BASE}/swivo/v1/draft/${id}${qs}`, { method: 'DELETE', headers, credentials: 'include' });
    return res.ok;
  } catch { return false; }
}

export async function finalizeDraft(id: number, token?: string | null, nonce?: string | null) {
  const body: any = {};
  if (token) body.token = token;
  return post<{ id: number; status: string }>(`/swivo/v1/draft/${id}/finalize`, body, nonce);
}

export async function claimDrafts(items: Array<{ id: number; token: string }>, nonce?: string | null) {
  return post<{ claimed: number[]; skipped: any[]; userId: number }>('/swivo/v1/draft/claim', { drafts: items }, nonce);
}

export async function requestPasswordReset(email: string) {
  return post<{ ok: boolean }>('/swivo/v1/auth/forgot', { email });
}

export async function applyPasswordReset(login: string, key: string, password: string) {
  return post<{ ok: boolean }>('/swivo/v1/auth/reset', { login, key, password });
}
