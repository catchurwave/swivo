import { s as fetchProfilEmetteur, r as fetchEncaissements, p as fetchDepenses, k as delEncaissement, E as pushEncaissement, j as delDepense, C as pushDepense, G as pushProfilEmetteur, R as userKey, n as fetchBillingClients, m as fetchBillingCatalog, o as fetchBillingDocs, g as delBillingCatalog, i as delBillingDoc, B as pushBillingDoc, h as delBillingClient, z as pushBillingClient, y as pushBillingCatalog } from "./wizard-CbzVLHaR.js";
const KEY_ENC = () => userKey("swivo.pilotage.encaissements.v1");
const KEY_DEP = () => userKey("swivo.pilotage.depenses.v1");
const KEY_PROFIL = () => userKey("swivo.pilotage.profil.v1");
const PROFIL_DEFAULT = {
  categorieDefaut: "service_bnc",
  versementLiberatoire: false,
  regimeDeclaration: "mensuel"
};
function listEncaissements() {
  try {
    const raw = localStorage.getItem(KEY_ENC());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveEncaissements(arr) {
  try {
    localStorage.setItem(KEY_ENC(), JSON.stringify(arr));
  } catch {
  }
}
function addEncaissement(e) {
  const item = { ...e, id: uid$1() };
  saveEncaissements([item, ...listEncaissements()]);
  void pushEncaissement(item);
  return item;
}
function deleteEncaissement(id) {
  saveEncaissements(listEncaissements().filter((e) => e.id !== id));
  void delEncaissement(id);
}
function listDepenses() {
  try {
    const raw = localStorage.getItem(KEY_DEP());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveDepenses(arr) {
  try {
    localStorage.setItem(KEY_DEP(), JSON.stringify(arr));
  } catch {
  }
}
function addDepense(d) {
  const item = { ...d, id: uid$1() };
  saveDepenses([item, ...listDepenses()]);
  void pushDepense(item);
  return item;
}
function deleteDepense(id) {
  saveDepenses(listDepenses().filter((d) => d.id !== id));
  void delDepense(id);
}
function getProfilFiscal() {
  try {
    const raw = localStorage.getItem(KEY_PROFIL());
    return raw ? { ...PROFIL_DEFAULT, ...JSON.parse(raw) } : PROFIL_DEFAULT;
  } catch {
    return PROFIL_DEFAULT;
  }
}
function saveProfilFiscal(p) {
  const merged = { ...getProfilFiscal(), ...p };
  try {
    localStorage.setItem(KEY_PROFIL(), JSON.stringify(merged));
  } catch {
  }
  void pushProfilEmetteur({ profil: merged });
  return merged;
}
function periodeMois(date = /* @__PURE__ */ new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}
function periodeAnnee(year = (/* @__PURE__ */ new Date()).getFullYear()) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}
function periodeTrimestre(date = /* @__PURE__ */ new Date()) {
  const q = Math.floor(date.getMonth() / 3);
  const y = date.getFullYear();
  const from = new Date(y, q * 3, 1).toISOString().slice(0, 10);
  const to = new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10);
  return { from, to };
}
function caPeriode(p, arr = listEncaissements()) {
  return arr.filter((e) => e.date >= p.from && e.date <= p.to).reduce((s, e) => s + e.montant, 0);
}
function caMensuel12Mois(arr = listEncaissements(), ref = /* @__PURE__ */ new Date()) {
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const p = periodeMois(d);
    out.push({
      mois: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      ca: caPeriode(p, arr)
    });
  }
  return out;
}
function depensesPeriode(p, arr = listDepenses()) {
  return arr.filter((d) => d.date >= p.from && d.date <= p.to).reduce((s, d) => s + d.montant, 0);
}
function uid$1() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "enc-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function syncFromServer() {
  try {
    const [profEm, encs, deps] = await Promise.all([
      fetchProfilEmetteur(),
      fetchEncaissements(),
      fetchDepenses()
    ]);
    if (encs) saveEncaissements(encs);
    if (deps) saveDepenses(deps);
    if (profEm && profEm.profil && Object.keys(profEm.profil).length > 0) {
      try {
        localStorage.setItem(KEY_PROFIL(), JSON.stringify({ ...PROFIL_DEFAULT, ...profEm.profil }));
      } catch {
      }
    }
    return !!(encs || deps || profEm);
  } catch {
    return false;
  }
}
const KEY_DOCS = "swivo.billing.docs.v1";
const KEY_CLIENTS = "swivo.billing.clients.v1";
const KEY_CATALOG = "swivo.billing.catalog.v1";
const KEY_EMETTEUR = "swivo.billing.emetteur.v1";
const DEFAULT_EMETTEUR = {
  nom: "",
  prefixeFacture: `F-${(/* @__PURE__ */ new Date()).getFullYear()}-`,
  prefixeDevis: `D-${(/* @__PURE__ */ new Date()).getFullYear()}-`,
  prefixeAvoir: `A-${(/* @__PURE__ */ new Date()).getFullYear()}-`,
  derniereNumeroFacture: 0,
  derniereNumeroDevis: 0,
  derniereNumeroAvoir: 0,
  conditionsParDefaut: "Paiement à 30 jours. Aucun escompte pour paiement anticipé. Pénalités de retard : taux légal + 40 € forfaitaires (art. L441-10 C. commerce).",
  notesParDefaut: "TVA non applicable, art. 293 B du CGI."
};
function load(key, fallback) {
  try {
    const v = localStorage.getItem(userKey(key));
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(userKey(key), JSON.stringify(value));
  } catch {
  }
}
function getEmetteur() {
  return { ...DEFAULT_EMETTEUR, ...load(KEY_EMETTEUR, {}) };
}
function saveEmetteur(patch) {
  const merged = { ...getEmetteur(), ...patch };
  save(KEY_EMETTEUR, merged);
  void pushProfilEmetteur({ emetteur: merged });
  return merged;
}
function listClients() {
  return load(KEY_CLIENTS, []);
}
function upsertClient(c) {
  const arr = listClients();
  if (c.id) {
    const updated = arr.map((x) => x.id === c.id ? { ...x, ...c, id: c.id } : x);
    save(KEY_CLIENTS, updated);
    const next = updated.find((x) => x.id === c.id);
    void pushBillingClient(next);
    return next;
  }
  const item = { ...c, id: uid("cli"), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  save(KEY_CLIENTS, [item, ...arr]);
  void pushBillingClient(item);
  return item;
}
function deleteClient(id) {
  save(KEY_CLIENTS, listClients().filter((c) => c.id !== id));
  void delBillingClient(id);
}
function listCatalog() {
  return load(KEY_CATALOG, []);
}
function upsertCatalogItem(c) {
  const arr = listCatalog();
  if (c.id) {
    const updated = arr.map((x) => x.id === c.id ? { ...x, ...c, id: c.id } : x);
    save(KEY_CATALOG, updated);
    const next = updated.find((x) => x.id === c.id);
    void pushBillingCatalog(next);
    return next;
  }
  const item = { ...c, id: uid("cat") };
  save(KEY_CATALOG, [item, ...arr]);
  void pushBillingCatalog(item);
  return item;
}
function deleteCatalogItem(id) {
  save(KEY_CATALOG, listCatalog().filter((c) => c.id !== id));
  void delBillingCatalog(id);
}
function listDocs() {
  return load(KEY_DOCS, []);
}
function saveDocs(arr) {
  save(KEY_DOCS, arr);
}
function genererNumero(type) {
  const e = getEmetteur();
  if (type === "facture") {
    const next2 = (e.derniereNumeroFacture ?? 0) + 1;
    return `${e.prefixeFacture ?? ""}${String(next2).padStart(3, "0")}`;
  }
  if (type === "devis") {
    const next2 = (e.derniereNumeroDevis ?? 0) + 1;
    return `${e.prefixeDevis ?? ""}${String(next2).padStart(3, "0")}`;
  }
  const next = (e.derniereNumeroAvoir ?? 0) + 1;
  return `${e.prefixeAvoir ?? ""}${String(next).padStart(3, "0")}`;
}
function incrementerCompteur(type) {
  const e = getEmetteur();
  if (type === "facture") saveEmetteur({ derniereNumeroFacture: (e.derniereNumeroFacture ?? 0) + 1 });
  else if (type === "devis") saveEmetteur({ derniereNumeroDevis: (e.derniereNumeroDevis ?? 0) + 1 });
  else saveEmetteur({ derniereNumeroAvoir: (e.derniereNumeroAvoir ?? 0) + 1 });
}
function createDoc(input) {
  const totals = computeTotals(input.lignes, input.tvaApplicable, input.tvaPct ?? 20);
  const numero = input.numero ?? genererNumero(input.type);
  const doc = {
    ...input,
    id: uid("doc"),
    numero,
    status: input.status ?? "brouillon",
    ...totals
  };
  if (!input.numero) incrementerCompteur(input.type);
  saveDocs([doc, ...listDocs()]);
  void pushBillingDoc(doc);
  return doc;
}
function updateDoc(id, patch) {
  const arr = listDocs();
  const i = arr.findIndex((d) => d.id === id);
  if (i < 0) return null;
  const next = { ...arr[i], ...patch };
  if (patch.lignes || patch.tvaApplicable !== void 0 || patch.tvaPct !== void 0) {
    Object.assign(next, computeTotals(next.lignes, next.tvaApplicable, next.tvaPct ?? 20));
  }
  arr[i] = next;
  saveDocs(arr);
  void pushBillingDoc(next);
  return next;
}
function deleteDoc(id) {
  saveDocs(listDocs().filter((d) => d.id !== id));
  void delBillingDoc(id);
}
function duplicateDoc(id) {
  const arr = listDocs();
  const src = arr.find((d) => d.id === id);
  if (!src) return null;
  return createDoc({
    type: src.type,
    clientId: src.clientId,
    clientSnapshot: src.clientSnapshot,
    dateEmission: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    dateEcheance: src.dateEcheance,
    lignes: src.lignes.map((l) => ({ ...l, id: uid("lig") })),
    notes: src.notes,
    conditions: src.conditions,
    tvaApplicable: src.tvaApplicable,
    tvaPct: src.tvaPct,
    categorieFiscale: src.categorieFiscale,
    acompte: src.acompte
  });
}
function marquerPayee(id, opts) {
  var _a;
  const doc = listDocs().find((d) => d.id === id);
  if (!doc || doc.type !== "facture") return null;
  const dateE = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const montant = doc.totalTTC;
  const enc = addEncaissement({
    date: dateE,
    montant,
    categorie: doc.categorieFiscale,
    libelle: `${doc.numero} — ${((_a = doc.clientSnapshot) == null ? void 0 : _a.nom) ?? ""}`.trim(),
    source: "facture",
    factureId: doc.id
  });
  return updateDoc(id, { status: "paye", paidAt: dateE, paidAmount: montant, encaissementId: enc.id });
}
function annulerPaiement(id) {
  const doc = listDocs().find((d) => d.id === id);
  if (!(doc == null ? void 0 : doc.encaissementId)) return null;
  const encs = listEncaissements().filter((e) => e.id !== doc.encaissementId);
  saveEncaissements(encs);
  return updateDoc(id, { status: "envoye", paidAt: void 0, paidAmount: void 0, encaissementId: void 0 });
}
function marquerRelance(id) {
  const doc = listDocs().find((d) => d.id === id);
  if (!doc) return null;
  return updateDoc(id, {
    reminderCount: (doc.reminderCount ?? 0) + 1,
    lastReminderAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function buildRelanceMailto(doc) {
  var _a;
  const to = ((_a = doc.clientSnapshot) == null ? void 0 : _a.email) ?? "";
  const subject = `Relance — Facture ${doc.numero}`;
  const body = `Bonjour,

Sauf erreur de notre part, le règlement de la facture ${doc.numero} d'un montant de ${formatEUR(doc.totalTTC)} émise le ${doc.dateEmission} reste à ce jour en attente.

Merci de bien vouloir procéder au règlement dans les meilleurs délais.

Cordialement,`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function computeTotals(lignes, tvaApplicable, tvaPct) {
  const ht = round2(lignes.reduce((s, l) => s + (l.quantite ?? 0) * (l.prixUnitaireHT ?? 0), 0));
  const tva = tvaApplicable ? round2(ht * tvaPct / 100) : 0;
  const ttc = round2(ht + tva);
  return { totalHT: ht, totalTVA: tva, totalTTC: ttc };
}
function statutRetard(doc, today = /* @__PURE__ */ new Date()) {
  if (doc.type !== "facture") return false;
  if (doc.status !== "envoye") return false;
  if (!doc.dateEcheance) return false;
  return new Date(doc.dateEcheance) < today;
}
function exportCSV(docs) {
  const headers = ["Numero", "Type", "Date", "Client", "HT", "TVA", "TTC", "Statut", "Payé le"];
  const rows = docs.map((d) => {
    var _a;
    return [
      d.numero,
      d.type,
      d.dateEmission,
      ((_a = d.clientSnapshot) == null ? void 0 : _a.nom) ?? "",
      d.totalHT.toFixed(2),
      d.totalTVA.toFixed(2),
      d.totalTTC.toFixed(2),
      d.status,
      d.paidAt ?? ""
    ];
  });
  return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
function formatEUR(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
const STATUS_LABEL = {
  brouillon: "Brouillon",
  envoye: "Envoyée",
  accepte: "Acceptée",
  refuse: "Refusée",
  paye: "Payée",
  retard: "En retard",
  annule: "Annulée"
};
async function syncBillingFromServer() {
  try {
    const [clients, catalog, docs, profEm] = await Promise.all([
      fetchBillingClients(),
      fetchBillingCatalog(),
      fetchBillingDocs(),
      fetchProfilEmetteur()
    ]);
    if (clients) save(KEY_CLIENTS, clients);
    if (catalog) save(KEY_CATALOG, catalog);
    if (docs) save(KEY_DOCS, docs);
    if ((profEm == null ? void 0 : profEm.emetteur) && Object.keys(profEm.emetteur).length > 0) {
      save(KEY_EMETTEUR, { ...DEFAULT_EMETTEUR, ...profEm.emetteur });
    }
    return !!(clients || catalog || docs || profEm);
  } catch {
    return false;
  }
}
const STATUS_COLOR = {
  brouillon: "bg-ink-muted/10 text-ink-muted",
  envoye: "bg-primary-50 text-primary-700",
  accepte: "bg-secondary-100 text-secondary-800",
  refuse: "bg-rose-100 text-rose-700",
  paye: "bg-secondary-100 text-secondary-800",
  retard: "bg-rose-100 text-rose-700",
  annule: "bg-ink-muted/10 text-ink-muted"
};
function renderDocHtml(doc, emetteur) {
  const titre = doc.type === "facture" ? "FACTURE" : doc.type === "devis" ? "DEVIS" : "AVOIR";
  const mentionTVA = doc.tvaApplicable ? `TVA appliquée : ${doc.tvaPct ?? 20} %` : "TVA non applicable, art. 293 B du CGI";
  const cli = doc.clientSnapshot ?? {};
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString("fr-FR") : "";
  const e = (s) => s ? s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]) : "";
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre} ${e(doc.numero)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 32px; max-width: 820px; line-height: 1.45; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 18px; margin-bottom: 28px; }
  h1 { margin: 0; font-size: 28px; color: #1d4ed8; letter-spacing: -0.02em; }
  h1 .num { display: block; font-size: 14px; color: #475569; font-weight: 500; margin-top: 4px; }
  .blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .block { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin-bottom: 4px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  thead th { background: #f1f5f9; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #475569; text-align: left; border-bottom: 1px solid #cbd5e1; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody td.num { text-align: right; white-space: nowrap; }
  tbody td.desc { color: #475569; font-size: 12px; }
  tfoot td { padding: 6px 8px; }
  tfoot .total td { font-weight: 700; border-top: 2px solid #0f172a; padding-top: 10px; font-size: 16px; }
  .right { text-align: right; }
  .muted { color: #64748b; font-size: 12px; }
  .conditions { margin-top: 24px; padding: 14px 16px; background: #f8fafc; border-radius: 10px; font-size: 12px; color: #334155; }
  .footer { margin-top: 30px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  .status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; margin-left: 8px; vertical-align: middle; }
  .status.paye, .status.accepte { background: #ecfdf5; color: #047857; }
  .status.retard, .status.refuse { background: #fef2f2; color: #b91c1c; }
  .status.envoye { background: #eff6ff; color: #1d4ed8; }
  .status.brouillon, .status.annule { background: #f1f5f9; color: #64748b; }
  @media print { body { padding: 18mm; } }
</style>
</head>
<body>
  <header>
    <div>
      <div style="font-weight:700;font-size:18px;letter-spacing:-0.01em">${e(emetteur.nom) || "Mon entreprise"}</div>
      <div class="muted">${e(emetteur.adresse) || ""}</div>
      <div class="muted">${e([emetteur.codePostal, emetteur.ville].filter(Boolean).join(" "))}</div>
      <div class="muted">${e(emetteur.email) || ""} ${emetteur.telephone ? "· " + e(emetteur.telephone) : ""}</div>
      ${emetteur.siret ? `<div class="muted">SIRET : ${e(emetteur.siret)}</div>` : ""}
    </div>
    <div style="text-align:right">
      <h1>${titre} <span class="status ${doc.status}">${STATUS_LABEL[doc.status]}</span>
        <span class="num">N° ${e(doc.numero)}</span>
      </h1>
      <div class="muted">Émise le <strong>${fmtDate(doc.dateEmission)}</strong></div>
      ${doc.dateEcheance ? `<div class="muted">${doc.type === "devis" ? "Validité jusqu’au" : "Échéance le"} <strong>${fmtDate(doc.dateEcheance)}</strong></div>` : ""}
    </div>
  </header>

  <div class="blocks">
    <div class="block">
      <div class="label">Émetteur</div>
      <div><strong>${e(emetteur.nom) || "—"}</strong></div>
      ${emetteur.adresse ? `<div>${e(emetteur.adresse)}</div>` : ""}
      ${emetteur.codePostal || emetteur.ville ? `<div>${e([emetteur.codePostal, emetteur.ville].filter(Boolean).join(" "))}</div>` : ""}
      ${emetteur.siret ? `<div class="muted">SIRET ${e(emetteur.siret)}</div>` : ""}
    </div>
    <div class="block">
      <div class="label">Client</div>
      <div><strong>${e(cli.nom) || "—"}</strong></div>
      ${cli.adresse ? `<div>${e(cli.adresse)}</div>` : ""}
      ${cli.codePostal || cli.ville ? `<div>${e([cli.codePostal, cli.ville].filter(Boolean).join(" "))}</div>` : ""}
      ${cli.siren ? `<div class="muted">SIREN ${e(cli.siren)}</div>` : ""}
      ${cli.tvaIntra ? `<div class="muted">TVA ${e(cli.tvaIntra)}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:55%">Désignation</th>
        <th style="width:10%" class="right">Qté</th>
        <th style="width:15%" class="right">PU HT</th>
        <th style="width:20%" class="right">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${doc.lignes.map((l) => `
        <tr>
          <td>
            <div><strong>${e(l.libelle)}</strong></div>
            ${l.description ? `<div class="desc">${e(l.description)}</div>` : ""}
          </td>
          <td class="num">${l.quantite}</td>
          <td class="num">${formatEUR(l.prixUnitaireHT)}</td>
          <td class="num">${formatEUR((l.quantite ?? 0) * (l.prixUnitaireHT ?? 0))}</td>
        </tr>
      `).join("")}
    </tbody>
    <tfoot>
      <tr><td colspan="3" class="right muted">Total HT</td><td class="right"><strong>${formatEUR(doc.totalHT)}</strong></td></tr>
      ${doc.tvaApplicable ? `<tr><td colspan="3" class="right muted">TVA ${doc.tvaPct ?? 20} %</td><td class="right">${formatEUR(doc.totalTVA)}</td></tr>` : ""}
      <tr class="total"><td colspan="3" class="right">Total ${doc.tvaApplicable ? "TTC" : "à payer"}</td><td class="right">${formatEUR(doc.totalTTC)}</td></tr>
    </tfoot>
  </table>

  <div class="conditions">
    <div class="label">Mentions légales & conditions</div>
    <div>${e(mentionTVA)}</div>
    ${doc.conditions ? `<div style="margin-top:6px">${e(doc.conditions)}</div>` : ""}
    ${doc.notes ? `<div style="margin-top:6px"><em>${e(doc.notes)}</em></div>` : ""}
    ${emetteur.iban ? `<div style="margin-top:6px"><strong>Coordonnées bancaires :</strong> IBAN ${e(emetteur.iban)}${emetteur.bic ? " · BIC " + e(emetteur.bic) : ""}</div>` : ""}
  </div>

  <div class="footer">
    ${e(emetteur.nom) || "Mon entreprise"}${emetteur.siret ? " · SIRET " + e(emetteur.siret) : ""} · Document généré via Swivo
  </div>

  <script>
    // Auto-print on direct open (?print=1)
    if (location.search.includes('print=1')) { setTimeout(() => window.print(), 250); }
  <\/script>
</body>
</html>`;
}
function ouvrirImpression(doc, emetteur) {
  const html = renderDocHtml(doc, emetteur);
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 350);
}
function telechargerHtml(doc, emetteur) {
  const html = renderDocHtml(doc, emetteur);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.type}-${doc.numero}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function telechargerCSV(content, filename = "factures.csv") {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
export {
  marquerRelance as A,
  ouvrirImpression as B,
  periodeAnnee as C,
  periodeMois as D,
  periodeTrimestre as E,
  saveEmetteur as F,
  saveProfilFiscal as G,
  statutRetard as H,
  syncBillingFromServer as I,
  syncFromServer as J,
  telechargerCSV as K,
  telechargerHtml as L,
  uid as M,
  updateDoc as N,
  upsertCatalogItem as O,
  upsertClient as P,
  STATUS_COLOR as S,
  STATUS_LABEL as a,
  addDepense as b,
  addEncaissement as c,
  annulerPaiement as d,
  buildRelanceMailto as e,
  caMensuel12Mois as f,
  caPeriode as g,
  createDoc as h,
  deleteCatalogItem as i,
  deleteClient as j,
  deleteDepense as k,
  deleteDoc as l,
  deleteEncaissement as m,
  depensesPeriode as n,
  duplicateDoc as o,
  exportCSV as p,
  formatEUR as q,
  genererNumero as r,
  getEmetteur as s,
  getProfilFiscal as t,
  listCatalog as u,
  listClients as v,
  listDepenses as w,
  listDocs as x,
  listEncaissements as y,
  marquerPayee as z
};
