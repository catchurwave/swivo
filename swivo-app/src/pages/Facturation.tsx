import { useEffect, useMemo, useRef, useState } from 'react';
import { Seo } from '@/lib/seo';
import {
  type BillingDoc,
  type Client,
  type CatalogItem,
  type Emetteur,
  type LineItem,
  type DocStatus,
  type DocType,
  STATUS_LABEL,
  STATUS_COLOR,
  createDoc,
  updateDoc,
  deleteDoc,
  duplicateDoc,
  marquerPayee,
  annulerPaiement,
  marquerRelance,
  buildRelanceMailto,
  listDocs,
  listClients,
  upsertClient,
  deleteClient,
  listCatalog,
  upsertCatalogItem,
  deleteCatalogItem,
  getEmetteur,
  saveEmetteur,
  genererNumero,
  statutRetard,
  exportCSV,
  formatEUR,
  syncBillingFromServer,
  uid,
} from '@/lib/billing';
import { ouvrirImpression, telechargerHtml, telechargerCSV } from '@/lib/billing-pdf';
import { useToast } from '@/components/Toast';
import { CATEGORIE_LABEL, type CategorieMicro } from '@/lib/urssaf';
import { getProfilFiscal } from '@/lib/revenus';
import { searchEntreprise, type EntrepriseResult } from '@/lib/sirene';

type Tab = 'factures' | 'devis' | 'clients' | 'catalogue' | 'parametres';

export function FacturationPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('factures');
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [emetteur, setEmetteur] = useState<Emetteur>(() => getEmetteur());
  const [editingDoc, setEditingDoc] = useState<BillingDoc | null>(null);

  useEffect(() => {
    refresh();
    void syncBillingFromServer().then((ok) => { if (ok) refresh(); });
  }, []);

  function refresh() {
    setDocs(listDocs());
    setClients(listClients());
    setCatalog(listCatalog());
    setEmetteur(getEmetteur());
  }

  const factures = useMemo(() => docs.filter((d) => d.type === 'facture'), [docs]);
  const devis    = useMemo(() => docs.filter((d) => d.type === 'devis'), [docs]);

  const kpiCAEncaisse = factures.filter((f) => f.status === 'paye').reduce((s, f) => s + f.totalTTC, 0);
  const kpiCAFacture  = factures.reduce((s, f) => s + f.totalTTC, 0);
  const kpiImpaye     = factures.filter((f) => f.status === 'envoye' || statutRetard(f)).reduce((s, f) => s + f.totalTTC, 0);
  const kpiRetard     = factures.filter((f) => statutRetard(f)).length;

  return (
    <>
      <Seo title="Facturation & devis — Swivo" description="Factures et devis aux normes micro-entreprise, numérotation auto, relances, exports CSV." path="/outils/facturation" noindex />
      <section className="container-page py-10 lg:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="badge-secondary">Outil Gestion</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Facturation & devis</h1>
            <p className="mt-2 max-w-2xl text-ink-muted">Conformité micro (TVA non applicable art. 293B CGI), numérotation auto, relances, exports.</p>
          </div>
          <button onClick={() => setEditingDoc(emptyDoc('facture', emetteur, getProfilFiscal().categorieDefaut))} className="btn-primary">+ Nouvelle facture</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="CA encaissé" value={formatEUR(kpiCAEncaisse)} accent="secondary" />
          <Kpi label="CA facturé" value={formatEUR(kpiCAFacture)} />
          <Kpi label="Impayés" value={formatEUR(kpiImpaye)} accent="warning" />
          <Kpi label="Factures en retard" value={String(kpiRetard)} accent={kpiRetard > 0 ? 'danger' : undefined} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-surface-border">
          {(['factures', 'devis', 'clients', 'catalogue', 'parametres'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              {tabLabel(t)}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'factures' && <DocList type="facture" docs={factures} clients={clients} emetteur={emetteur} onEdit={setEditingDoc} onRefresh={refresh} toast={toast} />}
          {tab === 'devis' && <DocList type="devis" docs={devis} clients={clients} emetteur={emetteur} onEdit={setEditingDoc} onRefresh={refresh} toast={toast} />}
          {tab === 'clients' && <ClientsTab clients={clients} onRefresh={refresh} toast={toast} />}
          {tab === 'catalogue' && <CatalogTab catalog={catalog} onRefresh={refresh} toast={toast} />}
          {tab === 'parametres' && <ParametresTab emetteur={emetteur} onSaved={(e) => { setEmetteur(e); toast.push({ kind: 'success', message: 'Paramètres enregistrés.', ttl: 2000 }); }} />}
        </div>

        {editingDoc && (
          <DocEditor
            initial={editingDoc}
            clients={clients}
            catalog={catalog}
            emetteur={emetteur}
            onClose={() => setEditingDoc(null)}
            onSaved={() => { setEditingDoc(null); refresh(); }}
            toast={toast}
          />
        )}
      </section>
    </>
  );
}

function tabLabel(t: Tab): string {
  return { factures: 'Factures', devis: 'Devis', clients: 'Clients', catalogue: 'Catalogue', parametres: 'Paramètres' }[t];
}

/* ============================================================ */
/* DOC LIST                                                      */
/* ============================================================ */

function DocList({ type, docs, emetteur, onEdit, onRefresh, toast }: {
  type: DocType;
  docs: BillingDoc[];
  clients: Client[];
  emetteur: Emetteur;
  onEdit: (d: BillingDoc | null) => void;
  onRefresh: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const profil = getProfilFiscal();

  function nouveau() { onEdit(emptyDoc(type, emetteur, profil.categorieDefaut)); }

  function action(act: string, d: BillingDoc) {
    if (act === 'edit') onEdit(d);
    else if (act === 'duplicate') { duplicateDoc(d.id); toast.push({ kind: 'success', message: 'Dupliqué', ttl: 2000 }); onRefresh(); }
    else if (act === 'delete') { if (confirm(`Supprimer ${d.numero} ?`)) { deleteDoc(d.id); onRefresh(); toast.push({ kind: 'info', message: 'Supprimé', ttl: 2000 }); }}
    else if (act === 'print') ouvrirImpression(d, emetteur);
    else if (act === 'download') telechargerHtml(d, emetteur);
    else if (act === 'pay') { marquerPayee(d.id); onRefresh(); toast.push({ kind: 'success', message: 'Facture payée → encaissement créé', ttl: 3000 }); }
    else if (act === 'unpay') { annulerPaiement(d.id); onRefresh(); }
    else if (act === 'send') { updateDoc(d.id, { status: 'envoye' }); onRefresh(); toast.push({ kind: 'info', message: 'Statut → envoyée', ttl: 2000 }); }
    else if (act === 'relance') { window.location.href = buildRelanceMailto(d); marquerRelance(d.id); onRefresh(); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{docs.length} {type === 'facture' ? 'facture(s)' : 'devis'}</p>
        <div className="flex gap-2">
          <button onClick={() => telechargerCSV(exportCSV(docs), `${type}-export.csv`)} className="btn-outline text-xs">Export CSV</button>
          <button onClick={nouveau} className="btn-primary text-xs">+ Nouveau</button>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-muted">Aucun {type === 'facture' ? 'document' : 'devis'} pour le moment.</p>
          <button onClick={nouveau} className="btn-primary mt-4 text-xs">Créer le premier</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3 text-right">TTC</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {docs.map((d) => {
                const enRetard = statutRetard(d);
                const displayStatus: DocStatus = enRetard ? 'retard' : d.status;
                return (
                  <tr key={d.id} className="hover:bg-surface-muted/40">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{d.numero}</td>
                    <td className="px-4 py-3 text-ink">{new Date(d.dateEmission).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-ink">{d.clientSnapshot?.nom || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{formatEUR(d.totalTTC)}</td>
                    <td className="px-4 py-3"><span className={`badge ${STATUS_COLOR[displayStatus]}`}>{STATUS_LABEL[displayStatus]}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        <button onClick={() => action('edit', d)} className="text-xs text-primary-700 hover:underline">Éditer</button>
                        <span className="text-ink-muted/50">·</span>
                        <button onClick={() => action('print', d)} className="text-xs text-primary-700 hover:underline">PDF</button>
                        {type === 'facture' && d.status !== 'paye' && (
                          <>
                            <span className="text-ink-muted/50">·</span>
                            <button onClick={() => action('pay', d)} className="text-xs text-secondary-700 hover:underline">Payée</button>
                          </>
                        )}
                        {type === 'facture' && d.status === 'paye' && (
                          <>
                            <span className="text-ink-muted/50">·</span>
                            <button onClick={() => action('unpay', d)} className="text-xs text-amber-700 hover:underline">Annuler paiement</button>
                          </>
                        )}
                        {type === 'facture' && (enRetard || d.status === 'envoye') && (
                          <>
                            <span className="text-ink-muted/50">·</span>
                            <button onClick={() => action('relance', d)} className="text-xs text-rose-700 hover:underline">Relancer{d.reminderCount ? ` (${d.reminderCount})` : ''}</button>
                          </>
                        )}
                        {d.status === 'brouillon' && (
                          <>
                            <span className="text-ink-muted/50">·</span>
                            <button onClick={() => action('send', d)} className="text-xs text-primary-700 hover:underline">Envoyée</button>
                          </>
                        )}
                        <span className="text-ink-muted/50">·</span>
                        <button onClick={() => action('duplicate', d)} className="text-xs text-ink-muted hover:underline">Dupliquer</button>
                        <span className="text-ink-muted/50">·</span>
                        <button onClick={() => action('delete', d)} className="text-xs text-rose-600 hover:underline">×</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* DOC EDITOR                                                    */
/* ============================================================ */

function DocEditor({ initial, clients, catalog, emetteur, onClose, onSaved, toast }: {
  initial: BillingDoc;
  clients: Client[];
  catalog: CatalogItem[];
  emetteur: Emetteur;
  onClose: () => void;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [doc, setDoc] = useState<BillingDoc>(initial);

  function patch(p: Partial<BillingDoc>) { setDoc((d) => ({ ...d, ...p })); }

  function setClient(clientId: string) {
    const c = clients.find((x) => x.id === clientId);
    if (!c) { patch({ clientId: undefined, clientSnapshot: undefined }); return; }
    patch({ clientId, clientSnapshot: { nom: c.nom, email: c.email, adresse: c.adresse, codePostal: c.codePostal, ville: c.ville, siren: c.siren, tvaIntra: c.tvaIntra } });
  }

  function addLine() {
    patch({ lignes: [...doc.lignes, { id: uid('lig'), libelle: '', quantite: 1, prixUnitaireHT: 0 }] });
  }
  function updateLine(id: string, p: Partial<LineItem>) {
    patch({ lignes: doc.lignes.map((l) => l.id === id ? { ...l, ...p } : l) });
  }
  function removeLine(id: string) {
    patch({ lignes: doc.lignes.filter((l) => l.id !== id) });
  }
  function addFromCatalog(id: string) {
    const c = catalog.find((x) => x.id === id);
    if (!c) return;
    patch({ lignes: [...doc.lignes, { id: uid('lig'), libelle: c.libelle, description: c.description, quantite: 1, prixUnitaireHT: c.prixHT, catalogItemId: c.id }] });
  }

  function valider() {
    if (!doc.clientSnapshot?.nom) { toast.push({ kind: 'error', message: 'Sélectionnez un client.', ttl: 3000 }); return; }
    if (doc.lignes.length === 0) { toast.push({ kind: 'error', message: 'Ajoutez au moins une ligne.', ttl: 3000 }); return; }
    if (doc.lignes.some((l) => !l.libelle.trim())) { toast.push({ kind: 'error', message: 'Toutes les lignes doivent avoir un libellé.', ttl: 3000 }); return; }
    const existing = listDocs().find((d) => d.id === doc.id);
    if (existing) updateDoc(doc.id, doc);
    else createDoc({ ...doc, numero: doc.numero });
    toast.push({ kind: 'success', message: existing ? 'Document mis à jour' : `${doc.type === 'facture' ? 'Facture créée' : 'Devis créé'}`, ttl: 2500 });
    onSaved();
  }

  const totalHT = doc.lignes.reduce((s, l) => s + (l.quantite ?? 0) * (l.prixUnitaireHT ?? 0), 0);
  const totalTVA = doc.tvaApplicable ? totalHT * ((doc.tvaPct ?? 20) / 100) : 0;
  const totalTTC = totalHT + totalTVA;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-4xl rounded-2xl bg-surface shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-border p-5">
          <h2 className="font-display text-lg font-semibold text-ink">{doc.type === 'facture' ? 'Facture' : 'Devis'} {doc.numero}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Fermer">✕</button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Numéro</label>
              <input className="input" value={doc.numero} onChange={(e) => patch({ numero: e.target.value })} />
            </div>
            <div>
              <label className="label">Date d'émission</label>
              <input type="date" className="input" value={doc.dateEmission} onChange={(e) => patch({ dateEmission: e.target.value })} />
            </div>
            <div>
              <label className="label">{doc.type === 'devis' ? 'Validité' : 'Échéance'}</label>
              <input type="date" className="input" value={doc.dateEcheance ?? ''} onChange={(e) => patch({ dateEcheance: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Client</label>
              <select className="input" value={doc.clientId ?? ''} onChange={(e) => setClient(e.target.value)}>
                <option value="">— Choisir un client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              {clients.length === 0 && <p className="mt-1 text-xs text-amber-700">Aucun client. Créez-en un depuis l'onglet « Clients ».</p>}
            </div>
            <div>
              <label className="label">Catégorie fiscale (URSSAF)</label>
              <select className="input" value={doc.categorieFiscale} onChange={(e) => patch({ categorieFiscale: e.target.value as CategorieMicro })}>
                {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{CATEGORIE_LABEL[c]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label">Lignes</label>
              {catalog.length > 0 && (
                <select className="input max-w-xs text-xs" onChange={(e) => { if (e.target.value) { addFromCatalog(e.target.value); e.target.value = ''; }}} defaultValue="">
                  <option value="">+ Depuis catalogue…</option>
                  {catalog.map((c) => <option key={c.id} value={c.id}>{c.libelle} — {formatEUR(c.prixHT)}</option>)}
                </select>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {doc.lignes.map((l) => (
                <div key={l.id} className="grid gap-2 rounded-lg border border-surface-border bg-surface-muted/30 p-2 sm:grid-cols-[1fr_80px_120px_120px_auto]">
                  <input className="input" placeholder="Libellé" value={l.libelle} onChange={(e) => updateLine(l.id, { libelle: e.target.value })} />
                  <input type="number" className="input text-right" min={0} step="any" value={l.quantite} onChange={(e) => updateLine(l.id, { quantite: Number(e.target.value) || 0 })} />
                  <input type="number" className="input text-right" min={0} step="any" value={l.prixUnitaireHT} onChange={(e) => updateLine(l.id, { prixUnitaireHT: Number(e.target.value) || 0 })} />
                  <div className="self-center text-right font-semibold text-ink">{formatEUR((l.quantite ?? 0) * (l.prixUnitaireHT ?? 0))}</div>
                  <button onClick={() => removeLine(l.id)} className="text-rose-600 hover:text-rose-800" aria-label="Supprimer">×</button>
                </div>
              ))}
            </div>
            <button onClick={addLine} className="btn-outline mt-2 text-xs">+ Ajouter une ligne</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">TVA</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={doc.tvaApplicable} onChange={(e) => patch({ tvaApplicable: e.target.checked })} />
                  TVA applicable
                </label>
                {doc.tvaApplicable && (
                  <select className="input max-w-[120px]" value={doc.tvaPct ?? 20} onChange={(e) => patch({ tvaPct: Number(e.target.value) })}>
                    <option value={20}>20 %</option>
                    <option value={10}>10 %</option>
                    <option value={5.5}>5,5 %</option>
                    <option value={2.1}>2,1 %</option>
                  </select>
                )}
              </div>
              {!doc.tvaApplicable && <p className="mt-1 text-xs text-ink-muted">Mention auto : « TVA non applicable, art. 293 B du CGI »</p>}
            </div>
            <div className="rounded-lg border border-surface-border bg-surface-muted/30 p-3 text-sm">
              <Row k="Total HT" v={formatEUR(totalHT)} />
              {doc.tvaApplicable && <Row k={`TVA ${doc.tvaPct ?? 20}%`} v={formatEUR(totalTVA)} />}
              <Row k="Total TTC" v={formatEUR(totalTTC)} accent />
            </div>
          </div>

          <div>
            <label className="label">Conditions de règlement</label>
            <textarea className="input min-h-[60px]" value={doc.conditions ?? ''} onChange={(e) => patch({ conditions: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px]" value={doc.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-surface-border bg-surface-muted/50 px-5 py-3">
          <button onClick={() => ouvrirImpression(doc, emetteur)} className="btn-outline text-sm">Aperçu PDF</button>
          <button onClick={onClose} className="btn-ghost text-sm">Annuler</button>
          <button onClick={valider} className="btn-primary text-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* CLIENTS TAB                                                   */
/* ============================================================ */

function ClientsTab({ clients, onRefresh, toast }: { clients: Client[]; onRefresh: () => void; toast: ReturnType<typeof useToast> }) {
  const [editing, setEditing] = useState<Partial<Client> | null>(null);

  function save() {
    if (!editing?.nom?.trim()) { toast.push({ kind: 'error', message: 'Nom requis.', ttl: 2000 }); return; }
    upsertClient(editing as any);
    setEditing(null);
    onRefresh();
    toast.push({ kind: 'success', message: 'Client enregistré.', ttl: 2000 });
  }

  function remove(id: string) {
    if (confirm('Supprimer ce client ?')) { deleteClient(id); onRefresh(); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">{clients.length} client(s)</p>
        <button onClick={() => setEditing({ pays: 'FR' })} className="btn-primary text-xs">+ Nouveau client</button>
      </div>

      {clients.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-muted">Aucun client enregistré.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink">{c.nom}</p>
                  {c.email && <p className="text-xs text-ink-muted">{c.email}</p>}
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setEditing(c)} className="text-primary-700 hover:underline">Éditer</button>
                  <button onClick={() => remove(c.id)} className="text-rose-600 hover:underline">×</button>
                </div>
              </div>
              {c.adresse && <p className="mt-2 text-xs text-ink-muted">{c.adresse}</p>}
              {(c.codePostal || c.ville) && <p className="text-xs text-ink-muted">{c.codePostal} {c.ville}</p>}
              {c.siren && <p className="mt-1 text-xs text-ink-muted">SIREN {c.siren}</p>}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ClientEditor editing={editing} setEditing={setEditing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* ============================================================ */
/* CLIENT EDITOR (avec Sirene lookup)                            */
/* ============================================================ */

function ClientEditor({ editing, setEditing, onSave, onClose }: { editing: Partial<Client>; setEditing: (c: Partial<Client> | null) => void; onSave: () => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [sugg, setSugg] = useState<EntrepriseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) { setSugg([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const r = await searchEntreprise(q, { limit: 6 });
      setSugg(r);
      setOpen(r.length > 0);
      setLoading(false);
    }, 280);
  }

  function pick(e: EntrepriseResult) {
    setEditing({
      ...editing,
      nom: e.denomination,
      siren: e.siren,
      adresse: e.adresse,
      codePostal: e.codePostal,
      ville: e.ville,
    });
    setQuery(e.denomination);
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-xl rounded-2xl bg-surface p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-ink">{editing.id ? 'Modifier' : 'Nouveau'} client</h2>

        <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/40 p-3">
          <label className="label text-primary-900">🔍 Recherche par nom ou SIREN (base SIRENE)</label>
          <div className="relative">
            <input
              className="input"
              placeholder="Ex : Acme SAS ou 552120222"
              value={query}
              onChange={(e) => search(e.target.value)}
              onFocus={() => sugg.length && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
            />
            {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">…</span>}
            {open && sugg.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-surface-border bg-surface shadow-elevated">
                {sugg.map((s) => (
                  <li key={s.siret}>
                    <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => pick(s)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50">
                      <span className="mt-0.5 text-primary-600">🏢</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{s.denomination}</span>
                        <span className="block truncate text-xs text-ink-muted">SIREN {s.siren} · {s.ville || '—'} · {s.libelleNaf || s.naf || '—'}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">Auto-remplit nom, adresse, SIREN. Données INSEE SIRENE.</p>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Nom / Raison sociale" value={editing.nom ?? ''} onChange={(v) => setEditing({ ...editing, nom: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" value={editing.email ?? ''} onChange={(v) => setEditing({ ...editing, email: v })} type="email" />
            <Field label="Téléphone" value={editing.telephone ?? ''} onChange={(v) => setEditing({ ...editing, telephone: v })} type="tel" />
          </div>
          <Field label="Adresse" value={editing.adresse ?? ''} onChange={(v) => setEditing({ ...editing, adresse: v })} />
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <Field label="Code postal" value={editing.codePostal ?? ''} onChange={(v) => setEditing({ ...editing, codePostal: v })} />
            <Field label="Ville" value={editing.ville ?? ''} onChange={(v) => setEditing({ ...editing, ville: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SIREN" value={editing.siren ?? ''} onChange={(v) => setEditing({ ...editing, siren: v })} />
            <Field label="TVA Intracom" value={editing.tvaIntra ?? ''} onChange={(v) => setEditing({ ...editing, tvaIntra: v })} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm">Annuler</button>
          <button onClick={onSave} className="btn-primary text-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* CATALOG TAB                                                   */
/* ============================================================ */

function CatalogTab({ catalog, onRefresh, toast }: { catalog: CatalogItem[]; onRefresh: () => void; toast: ReturnType<typeof useToast> }) {
  const [editing, setEditing] = useState<Partial<CatalogItem> | null>(null);

  function save() {
    if (!editing?.libelle?.trim()) { toast.push({ kind: 'error', message: 'Libellé requis.', ttl: 2000 }); return; }
    upsertCatalogItem({
      libelle: editing.libelle!,
      description: editing.description,
      prixHT: editing.prixHT ?? 0,
      unite: editing.unite ?? 'forfait',
      categorie: editing.categorie ?? 'service_bnc',
      id: editing.id,
    });
    setEditing(null);
    onRefresh();
    toast.push({ kind: 'success', message: 'Prestation enregistrée.', ttl: 2000 });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">{catalog.length} prestation(s) au catalogue</p>
        <button onClick={() => setEditing({})} className="btn-primary text-xs">+ Nouvelle prestation</button>
      </div>

      {catalog.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-muted">Catalogue vide. Ajoutez vos prestations récurrentes pour gagner du temps.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink">{c.libelle}</p>
                  <p className="text-xs text-ink-muted">{c.unite} · {CATEGORIE_LABEL[c.categorie]}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-primary-700">{formatEUR(c.prixHT)}</p>
                  <p className="text-xs text-ink-muted">HT</p>
                </div>
              </div>
              {c.description && <p className="mt-2 text-xs text-ink-muted">{c.description}</p>}
              <div className="mt-3 flex gap-2 text-xs">
                <button onClick={() => setEditing(c)} className="text-primary-700 hover:underline">Éditer</button>
                <button onClick={() => { deleteCatalogItem(c.id); onRefresh(); }} className="text-rose-600 hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="my-8 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold text-ink">{editing.id ? 'Modifier' : 'Nouvelle'} prestation</h2>
            <div className="mt-4 space-y-3">
              <Field label="Libellé" value={editing.libelle ?? ''} onChange={(v) => setEditing({ ...editing, libelle: v })} />
              <Field label="Description" value={editing.description ?? ''} onChange={(v) => setEditing({ ...editing, description: v })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Prix HT</label>
                  <input type="number" min={0} step="any" className="input" value={editing.prixHT ?? 0} onChange={(e) => setEditing({ ...editing, prixHT: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">Unité</label>
                  <select className="input" value={editing.unite ?? 'forfait'} onChange={(e) => setEditing({ ...editing, unite: e.target.value as CatalogItem['unite'] })}>
                    <option value="forfait">Forfait</option>
                    <option value="heure">Heure</option>
                    <option value="jour">Jour</option>
                    <option value="unite">Unité</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Catégorie fiscale</label>
                <select className="input" value={editing.categorie ?? 'service_bnc'} onChange={(e) => setEditing({ ...editing, categorie: e.target.value as CategorieMicro })}>
                  {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{CATEGORIE_LABEL[c]}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Annuler</button>
              <button onClick={save} className="btn-primary text-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* PARAMETRES TAB                                                */
/* ============================================================ */

function ParametresTab({ emetteur, onSaved }: { emetteur: Emetteur; onSaved: (e: Emetteur) => void }) {
  const [e, setE] = useState<Emetteur>(emetteur);
  const [siretLookup, setSiretLookup] = useState('');
  const [busy, setBusy] = useState(false);

  function patch(p: Partial<Emetteur>) { setE((s) => ({ ...s, ...p })); }
  function save() { const next = saveEmetteur(e); onSaved(next); }

  async function lookupMine() {
    const q = siretLookup.trim();
    if (q.length < 9) return;
    setBusy(true);
    const r = await searchEntreprise(q, { limit: 1 });
    setBusy(false);
    const found = r[0];
    if (!found) return;
    patch({
      nom: found.denomination,
      siret: found.siret,
      adresse: found.adresse,
      codePostal: found.codePostal,
      ville: found.ville,
    });
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Émetteur (vous)</h2>
      <p className="mt-1 text-sm text-ink-muted">Ces informations apparaissent sur chaque facture et devis.</p>

      <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/40 p-3">
        <label className="label text-primary-900">🔍 Auto-remplir depuis SIREN/SIRET (base SIRENE)</label>
        <div className="flex gap-2">
          <input className="input" placeholder="Votre SIREN (9) ou SIRET (14) ou nom" value={siretLookup} onChange={(ev) => setSiretLookup(ev.target.value)} />
          <button onClick={lookupMine} disabled={busy} className="btn-outline whitespace-nowrap text-xs">{busy ? '…' : 'Récupérer'}</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Prénom" value={e.prenom ?? ''} onChange={(v) => patch({ prenom: v })} />
        <Field label="Nom / Raison sociale" value={e.nom ?? ''} onChange={(v) => patch({ nom: v })} />
        <Field label="Email" value={e.email ?? ''} onChange={(v) => patch({ email: v })} type="email" />
        <Field label="Téléphone" value={e.telephone ?? ''} onChange={(v) => patch({ telephone: v })} type="tel" />
        <Field label="Adresse" value={e.adresse ?? ''} onChange={(v) => patch({ adresse: v })} />
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <Field label="CP" value={e.codePostal ?? ''} onChange={(v) => patch({ codePostal: v })} />
          <Field label="Ville" value={e.ville ?? ''} onChange={(v) => patch({ ville: v })} />
        </div>
        <Field label="SIRET" value={e.siret ?? ''} onChange={(v) => patch({ siret: v })} />
        <div />
        <Field label="IBAN" value={e.iban ?? ''} onChange={(v) => patch({ iban: v })} />
        <Field label="BIC" value={e.bic ?? ''} onChange={(v) => patch({ bic: v })} />
      </div>

      <h3 className="mt-6 font-display text-base font-semibold text-ink">Numérotation</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Préfixe factures" value={e.prefixeFacture ?? ''} onChange={(v) => patch({ prefixeFacture: v })} />
        <Field label="Préfixe devis" value={e.prefixeDevis ?? ''} onChange={(v) => patch({ prefixeDevis: v })} />
        <Field label="Préfixe avoirs" value={e.prefixeAvoir ?? ''} onChange={(v) => patch({ prefixeAvoir: v })} />
      </div>

      <h3 className="mt-6 font-display text-base font-semibold text-ink">Conditions par défaut</h3>
      <div className="mt-3 space-y-3">
        <div>
          <label className="label">Conditions de règlement</label>
          <textarea className="input min-h-[80px]" value={e.conditionsParDefaut ?? ''} onChange={(ev) => patch({ conditionsParDefaut: ev.target.value })} />
        </div>
        <div>
          <label className="label">Notes par défaut</label>
          <textarea className="input min-h-[60px]" value={e.notesParDefaut ?? ''} onChange={(ev) => patch({ notesParDefaut: ev.target.value })} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={save} className="btn-primary">Enregistrer</button>
      </div>
    </div>
  );
}

/* ============================================================ */
/* HELPERS                                                       */
/* ============================================================ */

function emptyDoc(type: DocType, emetteur: Emetteur, categorie: CategorieMicro): BillingDoc {
  const today = new Date();
  const ech = new Date(today); ech.setDate(ech.getDate() + 30);
  return {
    id: uid('doc'),
    type,
    numero: genererNumero(type),
    dateEmission: today.toISOString().slice(0, 10),
    dateEcheance: ech.toISOString().slice(0, 10),
    lignes: [],
    notes: emetteur.notesParDefaut ?? '',
    conditions: emetteur.conditionsParDefaut ?? '',
    tvaApplicable: false,
    status: 'brouillon',
    totalHT: 0, totalTVA: 0, totalTTC: 0,
    categorieFiscale: categorie,
  };
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: 'secondary' | 'warning' | 'danger' }) {
  const c = accent === 'secondary' ? 'text-secondary-700' : accent === 'warning' ? 'text-amber-700' : accent === 'danger' ? 'text-rose-700' : 'text-ink';
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${c}`}>{value}</p>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${accent ? 'border-t-2 border-ink/30 pt-2 font-bold text-ink' : 'text-ink-muted'}`}>
      <span>{k}</span>
      <span className={accent ? 'font-display text-lg' : ''}>{v}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
