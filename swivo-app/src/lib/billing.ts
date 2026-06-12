/*
  Facturation micro-entreprise — types + persistance localStorage.
  Numérotation auto séquentielle (obligation art. 242 nonies A CGI), mentions
  légales micro (franchise TVA art. 293B CGI), liaison auto facture payée → encaissement.
*/
import type { CategorieMicro } from './urssaf';
import { addEncaissement, listEncaissements, saveEncaissements } from './revenus';
import {
  fetchBillingClients, pushBillingClient, delBillingClient,
  fetchBillingCatalog, pushBillingCatalog, delBillingCatalog,
  fetchBillingDocs, pushBillingDoc, delBillingDoc,
  fetchProfilEmetteur, pushProfilEmetteur,
} from './pilotage-api';
import { userKey } from './user-storage';

export type Client = {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  siren?: string;
  tvaIntra?: string;
  notes?: string;
  createdAt: string;
};

export type CatalogItem = {
  id: string;
  libelle: string;
  description?: string;
  prixHT: number;
  unite: 'heure' | 'jour' | 'forfait' | 'unite';
  categorie: CategorieMicro;
};

export type LineItem = {
  id: string;
  libelle: string;
  description?: string;
  quantite: number;
  prixUnitaireHT: number;
  catalogItemId?: string;
};

export type DocStatus =
  | 'brouillon'
  | 'envoye'
  | 'accepte'        // devis seulement
  | 'refuse'         // devis
  | 'paye'           // facture
  | 'retard'         // facture
  | 'annule';

export type DocType = 'facture' | 'devis' | 'avoir';

export type BillingDoc = {
  id: string;
  type: DocType;
  numero: string;             // F-2026-001 / D-2026-001 / A-2026-001
  clientId?: string;
  clientSnapshot?: Pick<Client, 'nom' | 'email' | 'adresse' | 'codePostal' | 'ville' | 'siren' | 'tvaIntra'>;
  dateEmission: string;       // ISO
  dateEcheance?: string;      // facture : J+30 défaut ; devis : validité
  lignes: LineItem[];
  notes?: string;
  conditions?: string;
  tvaApplicable: boolean;     // false = micro franchise base
  tvaPct?: number;            // si tvaApplicable
  status: DocStatus;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  paidAt?: string;
  paidAmount?: number;
  reminderCount?: number;
  lastReminderAt?: string;
  acompte?: number;           // % acompte pour devis
  categorieFiscale: CategorieMicro; // pour liaison encaissement
  encaissementId?: string;    // ref vers /lib/revenus quand payée
};

export type Emetteur = {
  nom: string;
  prenom?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siret?: string;
  email?: string;
  telephone?: string;
  iban?: string;
  bic?: string;
  prefixeFacture?: string;    // ex: "F-2026-"
  prefixeDevis?: string;      // ex: "D-2026-"
  prefixeAvoir?: string;
  derniereNumeroFacture?: number;
  derniereNumeroDevis?: number;
  derniereNumeroAvoir?: number;
  conditionsParDefaut?: string;
  notesParDefaut?: string;
};

const KEY_DOCS    = 'swivo.billing.docs.v1';
const KEY_CLIENTS = 'swivo.billing.clients.v1';
const KEY_CATALOG = 'swivo.billing.catalog.v1';
const KEY_EMETTEUR = 'swivo.billing.emetteur.v1';

const DEFAULT_EMETTEUR: Emetteur = {
  nom: '',
  prefixeFacture: `F-${new Date().getFullYear()}-`,
  prefixeDevis:   `D-${new Date().getFullYear()}-`,
  prefixeAvoir:   `A-${new Date().getFullYear()}-`,
  derniereNumeroFacture: 0,
  derniereNumeroDevis: 0,
  derniereNumeroAvoir: 0,
  conditionsParDefaut: 'Paiement à 30 jours. Aucun escompte pour paiement anticipé. Pénalités de retard : taux légal + 40 € forfaitaires (art. L441-10 C. commerce).',
  notesParDefaut: 'TVA non applicable, art. 293 B du CGI.',
};

/* ============================================================ */
/* PERSISTENCE                                                   */
/* ============================================================ */

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(userKey(key)); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save<T>(key: string, value: T): void {
  try { localStorage.setItem(userKey(key), JSON.stringify(value)); } catch {}
}

export function getEmetteur(): Emetteur {
  return { ...DEFAULT_EMETTEUR, ...load<Partial<Emetteur>>(KEY_EMETTEUR, {}) };
}
export function saveEmetteur(patch: Partial<Emetteur>): Emetteur {
  const merged = { ...getEmetteur(), ...patch };
  save(KEY_EMETTEUR, merged);
  void pushProfilEmetteur({ emetteur: merged });
  return merged;
}

export function listClients(): Client[] {
  return load<Client[]>(KEY_CLIENTS, []);
}
export function upsertClient(c: Omit<Client, 'id' | 'createdAt'> & { id?: string }): Client {
  const arr = listClients();
  if (c.id) {
    const updated = arr.map((x) => x.id === c.id ? { ...x, ...c, id: c.id! } as Client : x);
    save(KEY_CLIENTS, updated);
    const next = updated.find((x) => x.id === c.id)!;
    void pushBillingClient(next);
    return next;
  }
  const item: Client = { ...c, id: uid('cli'), createdAt: new Date().toISOString() };
  save(KEY_CLIENTS, [item, ...arr]);
  void pushBillingClient(item);
  return item;
}
export function deleteClient(id: string): void {
  save(KEY_CLIENTS, listClients().filter((c) => c.id !== id));
  void delBillingClient(id);
}

export function listCatalog(): CatalogItem[] {
  return load<CatalogItem[]>(KEY_CATALOG, []);
}
export function upsertCatalogItem(c: Omit<CatalogItem, 'id'> & { id?: string }): CatalogItem {
  const arr = listCatalog();
  if (c.id) {
    const updated = arr.map((x) => x.id === c.id ? { ...x, ...c, id: c.id! } as CatalogItem : x);
    save(KEY_CATALOG, updated);
    const next = updated.find((x) => x.id === c.id)!;
    void pushBillingCatalog(next);
    return next;
  }
  const item: CatalogItem = { ...c, id: uid('cat') };
  save(KEY_CATALOG, [item, ...arr]);
  void pushBillingCatalog(item);
  return item;
}
export function deleteCatalogItem(id: string): void {
  save(KEY_CATALOG, listCatalog().filter((c) => c.id !== id));
  void delBillingCatalog(id);
}

export function listDocs(): BillingDoc[] {
  return load<BillingDoc[]>(KEY_DOCS, []);
}
function saveDocs(arr: BillingDoc[]): void {
  save(KEY_DOCS, arr);
}

/* ============================================================ */
/* NUMÉROTATION                                                  */
/* ============================================================ */

export function genererNumero(type: DocType): string {
  const e = getEmetteur();
  if (type === 'facture') {
    const next = (e.derniereNumeroFacture ?? 0) + 1;
    return `${e.prefixeFacture ?? ''}${String(next).padStart(3, '0')}`;
  }
  if (type === 'devis') {
    const next = (e.derniereNumeroDevis ?? 0) + 1;
    return `${e.prefixeDevis ?? ''}${String(next).padStart(3, '0')}`;
  }
  const next = (e.derniereNumeroAvoir ?? 0) + 1;
  return `${e.prefixeAvoir ?? ''}${String(next).padStart(3, '0')}`;
}

function incrementerCompteur(type: DocType): void {
  const e = getEmetteur();
  if (type === 'facture')  saveEmetteur({ derniereNumeroFacture: (e.derniereNumeroFacture ?? 0) + 1 });
  else if (type === 'devis') saveEmetteur({ derniereNumeroDevis: (e.derniereNumeroDevis ?? 0) + 1 });
  else saveEmetteur({ derniereNumeroAvoir: (e.derniereNumeroAvoir ?? 0) + 1 });
}

/* ============================================================ */
/* DOC CRUD                                                      */
/* ============================================================ */

export function createDoc(input: Omit<BillingDoc, 'id' | 'numero' | 'totalHT' | 'totalTVA' | 'totalTTC' | 'status'> & { numero?: string; status?: DocStatus }): BillingDoc {
  const totals = computeTotals(input.lignes, input.tvaApplicable, input.tvaPct ?? 20);
  const numero = input.numero ?? genererNumero(input.type);
  const doc: BillingDoc = {
    ...input,
    id: uid('doc'),
    numero,
    status: input.status ?? 'brouillon',
    ...totals,
  };
  if (!input.numero) incrementerCompteur(input.type);
  saveDocs([doc, ...listDocs()]);
  void pushBillingDoc(doc);
  return doc;
}

export function updateDoc(id: string, patch: Partial<BillingDoc>): BillingDoc | null {
  const arr = listDocs();
  const i = arr.findIndex((d) => d.id === id);
  if (i < 0) return null;
  const next: BillingDoc = { ...arr[i]!, ...patch };
  if (patch.lignes || patch.tvaApplicable !== undefined || patch.tvaPct !== undefined) {
    Object.assign(next, computeTotals(next.lignes, next.tvaApplicable, next.tvaPct ?? 20));
  }
  arr[i] = next;
  saveDocs(arr);
  void pushBillingDoc(next);
  return next;
}

export function deleteDoc(id: string): void {
  saveDocs(listDocs().filter((d) => d.id !== id));
  void delBillingDoc(id);
}

export function duplicateDoc(id: string): BillingDoc | null {
  const arr = listDocs();
  const src = arr.find((d) => d.id === id);
  if (!src) return null;
  return createDoc({
    type: src.type,
    clientId: src.clientId,
    clientSnapshot: src.clientSnapshot,
    dateEmission: new Date().toISOString().slice(0, 10),
    dateEcheance: src.dateEcheance,
    lignes: src.lignes.map((l) => ({ ...l, id: uid('lig') })),
    notes: src.notes,
    conditions: src.conditions,
    tvaApplicable: src.tvaApplicable,
    tvaPct: src.tvaPct,
    categorieFiscale: src.categorieFiscale,
    acompte: src.acompte,
  });
}

/* ============================================================ */
/* MARQUER PAYÉE → liaison encaissement                          */
/* ============================================================ */

export function marquerPayee(id: string, opts?: { dateEncaissement?: string; montant?: number }): BillingDoc | null {
  const doc = listDocs().find((d) => d.id === id);
  if (!doc || doc.type !== 'facture') return null;
  const dateE = opts?.dateEncaissement ?? new Date().toISOString().slice(0, 10);
  const montant = opts?.montant ?? doc.totalTTC;
  const enc = addEncaissement({
    date: dateE,
    montant,
    categorie: doc.categorieFiscale,
    libelle: `${doc.numero} — ${doc.clientSnapshot?.nom ?? ''}`.trim(),
    source: 'facture',
    factureId: doc.id,
  });
  return updateDoc(id, { status: 'paye', paidAt: dateE, paidAmount: montant, encaissementId: enc.id });
}

export function annulerPaiement(id: string): BillingDoc | null {
  const doc = listDocs().find((d) => d.id === id);
  if (!doc?.encaissementId) return null;
  const encs = listEncaissements().filter((e) => e.id !== doc.encaissementId);
  saveEncaissements(encs);
  return updateDoc(id, { status: 'envoye', paidAt: undefined, paidAmount: undefined, encaissementId: undefined });
}

/* ============================================================ */
/* RELANCE                                                       */
/* ============================================================ */

export function marquerRelance(id: string): BillingDoc | null {
  const doc = listDocs().find((d) => d.id === id);
  if (!doc) return null;
  return updateDoc(id, {
    reminderCount: (doc.reminderCount ?? 0) + 1,
    lastReminderAt: new Date().toISOString(),
  });
}

export function buildRelanceMailto(doc: BillingDoc): string {
  const to = doc.clientSnapshot?.email ?? '';
  const subject = `Relance — Facture ${doc.numero}`;
  const body = `Bonjour,

Sauf erreur de notre part, le règlement de la facture ${doc.numero} d'un montant de ${formatEUR(doc.totalTTC)} émise le ${doc.dateEmission} reste à ce jour en attente.

Merci de bien vouloir procéder au règlement dans les meilleurs délais.

Cordialement,`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ============================================================ */
/* CALCULS                                                       */
/* ============================================================ */

export function computeTotals(lignes: LineItem[], tvaApplicable: boolean, tvaPct: number): { totalHT: number; totalTVA: number; totalTTC: number } {
  const ht = round2(lignes.reduce((s, l) => s + (l.quantite ?? 0) * (l.prixUnitaireHT ?? 0), 0));
  const tva = tvaApplicable ? round2((ht * tvaPct) / 100) : 0;
  const ttc = round2(ht + tva);
  return { totalHT: ht, totalTVA: tva, totalTTC: ttc };
}

export function statutRetard(doc: BillingDoc, today: Date = new Date()): boolean {
  if (doc.type !== 'facture') return false;
  if (doc.status !== 'envoye') return false;
  if (!doc.dateEcheance) return false;
  return new Date(doc.dateEcheance) < today;
}

/* ============================================================ */
/* EXPORT CSV                                                    */
/* ============================================================ */

export function exportCSV(docs: BillingDoc[]): string {
  const headers = ['Numero', 'Type', 'Date', 'Client', 'HT', 'TVA', 'TTC', 'Statut', 'Payé le'];
  const rows = docs.map((d) => [
    d.numero,
    d.type,
    d.dateEmission,
    d.clientSnapshot?.nom ?? '',
    d.totalHT.toFixed(2),
    d.totalTVA.toFixed(2),
    d.totalTTC.toFixed(2),
    d.status,
    d.paidAt ?? '',
  ]);
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/* ============================================================ */
/* HELPERS                                                       */
/* ============================================================ */

export function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function uid(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const STATUS_LABEL: Record<DocStatus, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyée',
  accepte: 'Acceptée',
  refuse: 'Refusée',
  paye: 'Payée',
  retard: 'En retard',
  annule: 'Annulée',
};

/* ====== SYNC SERVEUR ====== */

export async function syncBillingFromServer(): Promise<boolean> {
  try {
    const [clients, catalog, docs, profEm] = await Promise.all([
      fetchBillingClients(),
      fetchBillingCatalog(),
      fetchBillingDocs(),
      fetchProfilEmetteur(),
    ]);
    if (clients) save(KEY_CLIENTS, clients);
    if (catalog) save(KEY_CATALOG, catalog);
    if (docs) save(KEY_DOCS, docs);
    if (profEm?.emetteur && Object.keys(profEm.emetteur).length > 0) {
      save(KEY_EMETTEUR, { ...DEFAULT_EMETTEUR, ...profEm.emetteur });
    }
    return !!(clients || catalog || docs || profEm);
  } catch { return false; }
}

export const STATUS_COLOR: Record<DocStatus, string> = {
  brouillon: 'bg-ink-muted/10 text-ink-muted',
  envoye: 'bg-primary-50 text-primary-700',
  accepte: 'bg-secondary-100 text-secondary-800',
  refuse: 'bg-rose-100 text-rose-700',
  paye: 'bg-secondary-100 text-secondary-800',
  retard: 'bg-rose-100 text-rose-700',
  annule: 'bg-ink-muted/10 text-ink-muted',
};
