/*
  Client REST pour le module pilotage (encaissements, dépenses, profil fiscal,
  émetteur, facturation). Optimistic-first : on met à jour localStorage tout de
  suite puis on synchronise serveur en arrière-plan. Si l'utilisateur n'est pas
  connecté ou le serveur indisponible, on reste en mode local pur.
*/
import { apiBase } from './config';

const BASE = `${apiBase()}/swivo/v1`;

async function call<T>(path: string, init: RequestInit & { nonce?: string | null } = {}): Promise<T | null> {
  try {
    const headers = new Headers(init.headers ?? {});
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (init.nonce) headers.set('X-WP-Nonce', init.nonce);
    const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

/* ====== PROFIL + EMETTEUR ====== */

export async function fetchProfilEmetteur(): Promise<{ profil: any; emetteur: any } | null> {
  return call<{ profil: any; emetteur: any }>('/me/profil');
}
export async function pushProfilEmetteur(body: { profil?: any; emetteur?: any }, nonce?: string | null) {
  return call('/me/profil', { method: 'PUT', body: JSON.stringify(body), nonce });
}

/* ====== ENCAISSEMENTS ====== */

export async function fetchEncaissements(): Promise<any[] | null> { return call('/me/encaissements'); }
export async function pushEncaissement(e: any, nonce?: string | null) { return call('/me/encaissements', { method: 'POST', body: JSON.stringify(e), nonce }); }
export async function delEncaissement(id: string, nonce?: string | null) { return call(`/me/encaissements/${encodeURIComponent(id)}`, { method: 'DELETE', nonce }); }

/* ====== DÉPENSES ====== */

export async function fetchDepenses(): Promise<any[] | null> { return call('/me/depenses'); }
export async function pushDepense(d: any, nonce?: string | null) { return call('/me/depenses', { method: 'POST', body: JSON.stringify(d), nonce }); }
export async function delDepense(id: string, nonce?: string | null) { return call(`/me/depenses/${encodeURIComponent(id)}`, { method: 'DELETE', nonce }); }

/* ====== FACTURATION : CLIENTS ====== */

export async function fetchBillingClients(): Promise<any[] | null> { return call('/me/billing/clients'); }
export async function pushBillingClient(c: any, nonce?: string | null) { return call('/me/billing/clients', { method: 'POST', body: JSON.stringify(c), nonce }); }
export async function delBillingClient(id: string, nonce?: string | null) { return call(`/me/billing/clients/${encodeURIComponent(id)}`, { method: 'DELETE', nonce }); }

/* ====== FACTURATION : CATALOGUE ====== */

export async function fetchBillingCatalog(): Promise<any[] | null> { return call('/me/billing/catalog'); }
export async function pushBillingCatalog(c: any, nonce?: string | null) { return call('/me/billing/catalog', { method: 'POST', body: JSON.stringify(c), nonce }); }
export async function delBillingCatalog(id: string, nonce?: string | null) { return call(`/me/billing/catalog/${encodeURIComponent(id)}`, { method: 'DELETE', nonce }); }

/* ====== FACTURATION : DOCS ====== */

export async function fetchBillingDocs(): Promise<any[] | null> { return call('/me/billing/docs'); }
export async function pushBillingDoc(d: any, nonce?: string | null) { return call('/me/billing/docs', { method: 'POST', body: JSON.stringify(d), nonce }); }
export async function delBillingDoc(id: string, nonce?: string | null) { return call(`/me/billing/docs/${encodeURIComponent(id)}`, { method: 'DELETE', nonce }); }

/* ====== DOCUMENTS UPLOAD ====== */

export type UploadedDoc = { id: number; slot: string; status: string; fileName: string; fileUrl: string | null; mime: string | null; uploadedAt: string; size: number; draftId?: number };

export async function fetchDocuments(): Promise<UploadedDoc[] | null> { return call('/me/documents'); }

export async function uploadDocument(file: File, slot: string, draftId?: number, nonce?: string | null): Promise<{ ok: true; doc: UploadedDoc } | { ok: false; error: string }> {
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('slot', slot);
    if (draftId) fd.append('draft_id', String(draftId));
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (nonce) headers['X-WP-Nonce'] = nonce;
    const res = await fetch(`${BASE}/me/documents`, { method: 'POST', headers, credentials: 'include', body: fd });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const msg = data?.message || data?.code || `Erreur ${res.status}`;
      return { ok: false, error: String(msg) };
    }
    return { ok: true, doc: data as UploadedDoc };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Réseau indisponible' };
  }
}

export async function deleteDocument(id: number, nonce?: string | null) { return call(`/me/documents/${id}`, { method: 'DELETE', nonce }); }
