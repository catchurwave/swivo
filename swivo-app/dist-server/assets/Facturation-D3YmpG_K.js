import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from "react";
import { S as Seo } from "../entry-server.js";
import { s as getEmetteur, I as syncBillingFromServer, x as listDocs, v as listClients, u as listCatalog, H as statutRetard, t as getProfilFiscal, q as formatEUR, r as genererNumero, M as uid, K as telechargerCSV, p as exportCSV, a as STATUS_LABEL, S as STATUS_COLOR, i as deleteCatalogItem, B as ouvrirImpression, o as duplicateDoc, l as deleteDoc, L as telechargerHtml, z as marquerPayee, d as annulerPaiement, N as updateDoc, e as buildRelanceMailto, A as marquerRelance, j as deleteClient, P as upsertClient, O as upsertCatalogItem, F as saveEmetteur, h as createDoc } from "./billing-CroYyT51.js";
import { Q as useToast } from "./wizard-CbzVLHaR.js";
import { C as CATEGORIE_LABEL } from "./urssaf-CgN1GuuX.js";
import "react-dom/server";
import "./vendor-router-Izd1qo3Q.js";
import "react-dom";
import "react-router";
import "@remix-run/router";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./formalites-DR4taCu5.js";
const BASE = "https://recherche-entreprises.api.gouv.fr/search";
async function searchEntreprise(query, opts) {
  const q = query.trim();
  if (q.length < 2) return [];
  const limit = (opts == null ? void 0 : opts.limit) ?? 6;
  const url = `${BASE}?q=${encodeURIComponent(q)}&per_page=${limit}&page=1`;
  try {
    const res = await fetch(url, { signal: opts == null ? void 0 : opts.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data == null ? void 0 : data.results) ?? [];
    return results.map(mapResult).filter(Boolean);
  } catch {
    return [];
  }
}
function mapResult(r) {
  if (!(r == null ? void 0 : r.siren)) return null;
  const siege = r.siege ?? {};
  return {
    siren: String(r.siren),
    siret: String(siege.siret ?? r.siren + "00000"),
    denomination: r.nom_raison_sociale || r.nom_complet || "—",
    nomComplet: r.nom_complet,
    formeJuridique: r.nature_juridique || void 0,
    naf: r.activite_principale || void 0,
    libelleNaf: r.libelle_activite_principale || void 0,
    adresse: [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(" ") || siege.geo_adresse || void 0,
    codePostal: siege.code_postal || void 0,
    ville: siege.libelle_commune || void 0,
    trancheEffectif: siege.tranche_effectif_salarie || void 0,
    dateCreation: r.date_creation || void 0,
    estActive: r.etat_administratif === "A"
  };
}
function FacturationPage() {
  const toast = useToast();
  const [tab, setTab] = useState("factures");
  const [docs, setDocs] = useState([]);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [emetteur, setEmetteur] = useState(() => getEmetteur());
  const [editingDoc, setEditingDoc] = useState(null);
  useEffect(() => {
    refresh();
    void syncBillingFromServer().then((ok) => {
      if (ok) refresh();
    });
  }, []);
  function refresh() {
    setDocs(listDocs());
    setClients(listClients());
    setCatalog(listCatalog());
    setEmetteur(getEmetteur());
  }
  const factures = useMemo(() => docs.filter((d) => d.type === "facture"), [docs]);
  const devis = useMemo(() => docs.filter((d) => d.type === "devis"), [docs]);
  const kpiCAEncaisse = factures.filter((f) => f.status === "paye").reduce((s, f) => s + f.totalTTC, 0);
  const kpiCAFacture = factures.reduce((s, f) => s + f.totalTTC, 0);
  const kpiImpaye = factures.filter((f) => f.status === "envoye" || statutRetard(f)).reduce((s, f) => s + f.totalTTC, 0);
  const kpiRetard = factures.filter((f) => statutRetard(f)).length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Facturation & devis — Swivo", description: "Factures et devis aux normes micro-entreprise, numérotation auto, relances, exports CSV.", path: "/outils/facturation", noindex: true }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10 lg:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "badge-secondary", children: "Outil Gestion" }),
          /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: "Facturation & devis" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-ink-muted", children: "Conformité micro (TVA non applicable art. 293B CGI), numérotation auto, relances, exports." })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setEditingDoc(emptyDoc("facture", emetteur, getProfilFiscal().categorieDefaut)), className: "btn-primary", children: "+ Nouvelle facture" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsx(Kpi, { label: "CA encaissé", value: formatEUR(kpiCAEncaisse), accent: "secondary" }),
        /* @__PURE__ */ jsx(Kpi, { label: "CA facturé", value: formatEUR(kpiCAFacture) }),
        /* @__PURE__ */ jsx(Kpi, { label: "Impayés", value: formatEUR(kpiImpaye), accent: "warning" }),
        /* @__PURE__ */ jsx(Kpi, { label: "Factures en retard", value: String(kpiRetard), accent: kpiRetard > 0 ? "danger" : void 0 })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-wrap gap-2 border-b border-surface-border", children: ["factures", "devis", "clients", "catalogue", "parametres"].map((t) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setTab(t),
          className: `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === t ? "border-primary-600 text-primary-700" : "border-transparent text-ink-muted hover:text-ink"}`,
          children: tabLabel(t)
        },
        t
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        tab === "factures" && /* @__PURE__ */ jsx(DocList, { type: "facture", docs: factures, clients, emetteur, onEdit: setEditingDoc, onRefresh: refresh, toast }),
        tab === "devis" && /* @__PURE__ */ jsx(DocList, { type: "devis", docs: devis, clients, emetteur, onEdit: setEditingDoc, onRefresh: refresh, toast }),
        tab === "clients" && /* @__PURE__ */ jsx(ClientsTab, { clients, onRefresh: refresh, toast }),
        tab === "catalogue" && /* @__PURE__ */ jsx(CatalogTab, { catalog, onRefresh: refresh, toast }),
        tab === "parametres" && /* @__PURE__ */ jsx(ParametresTab, { emetteur, onSaved: (e) => {
          setEmetteur(e);
          toast.push({ kind: "success", message: "Paramètres enregistrés.", ttl: 2e3 });
        } })
      ] }),
      editingDoc && /* @__PURE__ */ jsx(
        DocEditor,
        {
          initial: editingDoc,
          clients,
          catalog,
          emetteur,
          onClose: () => setEditingDoc(null),
          onSaved: () => {
            setEditingDoc(null);
            refresh();
          },
          toast
        }
      )
    ] })
  ] });
}
function tabLabel(t) {
  return { factures: "Factures", devis: "Devis", clients: "Clients", catalogue: "Catalogue", parametres: "Paramètres" }[t];
}
function DocList({ type, docs, emetteur, onEdit, onRefresh, toast }) {
  const profil = getProfilFiscal();
  function nouveau() {
    onEdit(emptyDoc(type, emetteur, profil.categorieDefaut));
  }
  function action(act, d) {
    if (act === "edit") onEdit(d);
    else if (act === "duplicate") {
      duplicateDoc(d.id);
      toast.push({ kind: "success", message: "Dupliqué", ttl: 2e3 });
      onRefresh();
    } else if (act === "delete") {
      if (confirm(`Supprimer ${d.numero} ?`)) {
        deleteDoc(d.id);
        onRefresh();
        toast.push({ kind: "info", message: "Supprimé", ttl: 2e3 });
      }
    } else if (act === "print") ouvrirImpression(d, emetteur);
    else if (act === "download") telechargerHtml(d, emetteur);
    else if (act === "pay") {
      marquerPayee(d.id);
      onRefresh();
      toast.push({ kind: "success", message: "Facture payée → encaissement créé", ttl: 3e3 });
    } else if (act === "unpay") {
      annulerPaiement(d.id);
      onRefresh();
    } else if (act === "send") {
      updateDoc(d.id, { status: "envoye" });
      onRefresh();
      toast.push({ kind: "info", message: "Statut → envoyée", ttl: 2e3 });
    } else if (act === "relance") {
      window.location.href = buildRelanceMailto(d);
      marquerRelance(d.id);
      onRefresh();
    }
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
        docs.length,
        " ",
        type === "facture" ? "facture(s)" : "devis"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => telechargerCSV(exportCSV(docs), `${type}-export.csv`), className: "btn-outline text-xs", children: "Export CSV" }),
        /* @__PURE__ */ jsx("button", { onClick: nouveau, className: "btn-primary text-xs", children: "+ Nouveau" })
      ] })
    ] }),
    docs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card p-8 text-center", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
        "Aucun ",
        type === "facture" ? "document" : "devis",
        " pour le moment."
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: nouveau, className: "btn-primary mt-4 text-xs", children: "Créer le premier" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-2xl border border-surface-border bg-surface", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-surface-muted text-left text-xs uppercase text-ink-muted", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "N°" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Date" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Client" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "TTC" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Statut" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-border", children: docs.map((d) => {
        var _a;
        const enRetard = statutRetard(d);
        const displayStatus = enRetard ? "retard" : d.status;
        return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-muted/40", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs text-ink", children: d.numero }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-ink", children: new Date(d.dateEmission).toLocaleDateString("fr-FR") }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-ink", children: ((_a = d.clientSnapshot) == null ? void 0 : _a.nom) || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-ink", children: formatEUR(d.totalTTC) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `badge ${STATUS_COLOR[displayStatus]}`, children: STATUS_LABEL[displayStatus] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex flex-wrap justify-end gap-1", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => action("edit", d), className: "text-xs text-primary-700 hover:underline", children: "Éditer" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
            /* @__PURE__ */ jsx("button", { onClick: () => action("print", d), className: "text-xs text-primary-700 hover:underline", children: "PDF" }),
            type === "facture" && d.status !== "paye" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
              /* @__PURE__ */ jsx("button", { onClick: () => action("pay", d), className: "text-xs text-secondary-700 hover:underline", children: "Payée" })
            ] }),
            type === "facture" && d.status === "paye" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
              /* @__PURE__ */ jsx("button", { onClick: () => action("unpay", d), className: "text-xs text-amber-700 hover:underline", children: "Annuler paiement" })
            ] }),
            type === "facture" && (enRetard || d.status === "envoye") && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
              /* @__PURE__ */ jsxs("button", { onClick: () => action("relance", d), className: "text-xs text-rose-700 hover:underline", children: [
                "Relancer",
                d.reminderCount ? ` (${d.reminderCount})` : ""
              ] })
            ] }),
            d.status === "brouillon" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
              /* @__PURE__ */ jsx("button", { onClick: () => action("send", d), className: "text-xs text-primary-700 hover:underline", children: "Envoyée" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
            /* @__PURE__ */ jsx("button", { onClick: () => action("duplicate", d), className: "text-xs text-ink-muted hover:underline", children: "Dupliquer" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted/50", children: "·" }),
            /* @__PURE__ */ jsx("button", { onClick: () => action("delete", d), className: "text-xs text-rose-600 hover:underline", children: "×" })
          ] }) })
        ] }, d.id);
      }) })
    ] }) })
  ] });
}
function DocEditor({ initial, clients, catalog, emetteur, onClose, onSaved, toast }) {
  const [doc, setDoc] = useState(initial);
  function patch(p) {
    setDoc((d) => ({ ...d, ...p }));
  }
  function setClient(clientId) {
    const c = clients.find((x) => x.id === clientId);
    if (!c) {
      patch({ clientId: void 0, clientSnapshot: void 0 });
      return;
    }
    patch({ clientId, clientSnapshot: { nom: c.nom, email: c.email, adresse: c.adresse, codePostal: c.codePostal, ville: c.ville, siren: c.siren, tvaIntra: c.tvaIntra } });
  }
  function addLine() {
    patch({ lignes: [...doc.lignes, { id: uid("lig"), libelle: "", quantite: 1, prixUnitaireHT: 0 }] });
  }
  function updateLine(id, p) {
    patch({ lignes: doc.lignes.map((l) => l.id === id ? { ...l, ...p } : l) });
  }
  function removeLine(id) {
    patch({ lignes: doc.lignes.filter((l) => l.id !== id) });
  }
  function addFromCatalog(id) {
    const c = catalog.find((x) => x.id === id);
    if (!c) return;
    patch({ lignes: [...doc.lignes, { id: uid("lig"), libelle: c.libelle, description: c.description, quantite: 1, prixUnitaireHT: c.prixHT, catalogItemId: c.id }] });
  }
  function valider() {
    var _a;
    if (!((_a = doc.clientSnapshot) == null ? void 0 : _a.nom)) {
      toast.push({ kind: "error", message: "Sélectionnez un client.", ttl: 3e3 });
      return;
    }
    if (doc.lignes.length === 0) {
      toast.push({ kind: "error", message: "Ajoutez au moins une ligne.", ttl: 3e3 });
      return;
    }
    if (doc.lignes.some((l) => !l.libelle.trim())) {
      toast.push({ kind: "error", message: "Toutes les lignes doivent avoir un libellé.", ttl: 3e3 });
      return;
    }
    const existing = listDocs().find((d) => d.id === doc.id);
    if (existing) updateDoc(doc.id, doc);
    else createDoc({ ...doc, numero: doc.numero });
    toast.push({ kind: "success", message: existing ? "Document mis à jour" : `${doc.type === "facture" ? "Facture créée" : "Devis créé"}`, ttl: 2500 });
    onSaved();
  }
  const totalHT = doc.lignes.reduce((s, l) => s + (l.quantite ?? 0) * (l.prixUnitaireHT ?? 0), 0);
  const totalTVA = doc.tvaApplicable ? totalHT * ((doc.tvaPct ?? 20) / 100) : 0;
  const totalTTC = totalHT + totalTVA;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "my-8 w-full max-w-4xl rounded-2xl bg-surface shadow-elevated", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-surface-border p-5", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-display text-lg font-semibold text-ink", children: [
        doc.type === "facture" ? "Facture" : "Devis",
        " ",
        doc.numero
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-ink-muted hover:text-ink", "aria-label": "Fermer", children: "✕" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-5 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Numéro" }),
          /* @__PURE__ */ jsx("input", { className: "input", value: doc.numero, onChange: (e) => patch({ numero: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Date d'émission" }),
          /* @__PURE__ */ jsx("input", { type: "date", className: "input", value: doc.dateEmission, onChange: (e) => patch({ dateEmission: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: doc.type === "devis" ? "Validité" : "Échéance" }),
          /* @__PURE__ */ jsx("input", { type: "date", className: "input", value: doc.dateEcheance ?? "", onChange: (e) => patch({ dateEcheance: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Client" }),
          /* @__PURE__ */ jsxs("select", { className: "input", value: doc.clientId ?? "", onChange: (e) => setClient(e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "— Choisir un client —" }),
            clients.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.nom }, c.id))
          ] }),
          clients.length === 0 && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-amber-700", children: "Aucun client. Créez-en un depuis l'onglet « Clients »." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Catégorie fiscale (URSSAF)" }),
          /* @__PURE__ */ jsx("select", { className: "input", value: doc.categorieFiscale, onChange: (e) => patch({ categorieFiscale: e.target.value }), children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: CATEGORIE_LABEL[c] }, c)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Lignes" }),
          catalog.length > 0 && /* @__PURE__ */ jsxs("select", { className: "input max-w-xs text-xs", onChange: (e) => {
            if (e.target.value) {
              addFromCatalog(e.target.value);
              e.target.value = "";
            }
          }, defaultValue: "", children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "+ Depuis catalogue…" }),
            catalog.map((c) => /* @__PURE__ */ jsxs("option", { value: c.id, children: [
              c.libelle,
              " — ",
              formatEUR(c.prixHT)
            ] }, c.id))
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: doc.lignes.map((l) => /* @__PURE__ */ jsxs("div", { className: "grid gap-2 rounded-lg border border-surface-border bg-surface-muted/30 p-2 sm:grid-cols-[1fr_80px_120px_120px_auto]", children: [
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Libellé", value: l.libelle, onChange: (e) => updateLine(l.id, { libelle: e.target.value }) }),
          /* @__PURE__ */ jsx("input", { type: "number", className: "input text-right", min: 0, step: "any", value: l.quantite, onChange: (e) => updateLine(l.id, { quantite: Number(e.target.value) || 0 }) }),
          /* @__PURE__ */ jsx("input", { type: "number", className: "input text-right", min: 0, step: "any", value: l.prixUnitaireHT, onChange: (e) => updateLine(l.id, { prixUnitaireHT: Number(e.target.value) || 0 }) }),
          /* @__PURE__ */ jsx("div", { className: "self-center text-right font-semibold text-ink", children: formatEUR((l.quantite ?? 0) * (l.prixUnitaireHT ?? 0)) }),
          /* @__PURE__ */ jsx("button", { onClick: () => removeLine(l.id), className: "text-rose-600 hover:text-rose-800", "aria-label": "Supprimer", children: "×" })
        ] }, l.id)) }),
        /* @__PURE__ */ jsx("button", { onClick: addLine, className: "btn-outline mt-2 text-xs", children: "+ Ajouter une ligne" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "TVA" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: doc.tvaApplicable, onChange: (e) => patch({ tvaApplicable: e.target.checked }) }),
              "TVA applicable"
            ] }),
            doc.tvaApplicable && /* @__PURE__ */ jsxs("select", { className: "input max-w-[120px]", value: doc.tvaPct ?? 20, onChange: (e) => patch({ tvaPct: Number(e.target.value) }), children: [
              /* @__PURE__ */ jsx("option", { value: 20, children: "20 %" }),
              /* @__PURE__ */ jsx("option", { value: 10, children: "10 %" }),
              /* @__PURE__ */ jsx("option", { value: 5.5, children: "5,5 %" }),
              /* @__PURE__ */ jsx("option", { value: 2.1, children: "2,1 %" })
            ] })
          ] }),
          !doc.tvaApplicable && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Mention auto : « TVA non applicable, art. 293 B du CGI »" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-surface-border bg-surface-muted/30 p-3 text-sm", children: [
          /* @__PURE__ */ jsx(Row, { k: "Total HT", v: formatEUR(totalHT) }),
          doc.tvaApplicable && /* @__PURE__ */ jsx(Row, { k: `TVA ${doc.tvaPct ?? 20}%`, v: formatEUR(totalTVA) }),
          /* @__PURE__ */ jsx(Row, { k: "Total TTC", v: formatEUR(totalTTC), accent: true })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Conditions de règlement" }),
        /* @__PURE__ */ jsx("textarea", { className: "input min-h-[60px]", value: doc.conditions ?? "", onChange: (e) => patch({ conditions: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Notes" }),
        /* @__PURE__ */ jsx("textarea", { className: "input min-h-[60px]", value: doc.notes ?? "", onChange: (e) => patch({ notes: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2 border-t border-surface-border bg-surface-muted/50 px-5 py-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => ouvrirImpression(doc, emetteur), className: "btn-outline text-sm", children: "Aperçu PDF" }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "btn-ghost text-sm", children: "Annuler" }),
      /* @__PURE__ */ jsx("button", { onClick: valider, className: "btn-primary text-sm", children: "Enregistrer" })
    ] })
  ] }) });
}
function ClientsTab({ clients, onRefresh, toast }) {
  const [editing, setEditing] = useState(null);
  function save() {
    var _a;
    if (!((_a = editing == null ? void 0 : editing.nom) == null ? void 0 : _a.trim())) {
      toast.push({ kind: "error", message: "Nom requis.", ttl: 2e3 });
      return;
    }
    upsertClient(editing);
    setEditing(null);
    onRefresh();
    toast.push({ kind: "success", message: "Client enregistré.", ttl: 2e3 });
  }
  function remove(id) {
    if (confirm("Supprimer ce client ?")) {
      deleteClient(id);
      onRefresh();
    }
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
        clients.length,
        " client(s)"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setEditing({ pays: "FR" }), className: "btn-primary text-xs", children: "+ Nouveau client" })
    ] }),
    clients.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Aucun client enregistré." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: clients.map((c) => /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "font-display font-semibold text-ink", children: c.nom }),
          c.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: c.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-xs", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setEditing(c), className: "text-primary-700 hover:underline", children: "Éditer" }),
          /* @__PURE__ */ jsx("button", { onClick: () => remove(c.id), className: "text-rose-600 hover:underline", children: "×" })
        ] })
      ] }),
      c.adresse && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-ink-muted", children: c.adresse }),
      (c.codePostal || c.ville) && /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
        c.codePostal,
        " ",
        c.ville
      ] }),
      c.siren && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-ink-muted", children: [
        "SIREN ",
        c.siren
      ] })
    ] }, c.id)) }),
    editing && /* @__PURE__ */ jsx(ClientEditor, { editing, setEditing, onSave: save, onClose: () => setEditing(null) })
  ] });
}
function ClientEditor({ editing, setEditing, onSave, onClose }) {
  const [query, setQuery] = useState("");
  const [sugg, setSugg] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  function search(q) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setSugg([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const r = await searchEntreprise(q, { limit: 6 });
      setSugg(r);
      setOpen(r.length > 0);
      setLoading(false);
    }, 280);
  }
  function pick(e) {
    setEditing({
      ...editing,
      nom: e.denomination,
      siren: e.siren,
      adresse: e.adresse,
      codePostal: e.codePostal,
      ville: e.ville
    });
    setQuery(e.denomination);
    setOpen(false);
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "my-8 w-full max-w-xl rounded-2xl bg-surface p-6 shadow-elevated", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("h2", { className: "font-display text-lg font-semibold text-ink", children: [
      editing.id ? "Modifier" : "Nouveau",
      " client"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary-200 bg-primary-50/40 p-3", children: [
      /* @__PURE__ */ jsx("label", { className: "label text-primary-900", children: "🔍 Recherche par nom ou SIREN (base SIRENE)" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "input",
            placeholder: "Ex : Acme SAS ou 552120222",
            value: query,
            onChange: (e) => search(e.target.value),
            onFocus: () => sugg.length && setOpen(true),
            onBlur: () => setTimeout(() => setOpen(false), 200)
          }
        ),
        loading && /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted", children: "…" }),
        open && sugg.length > 0 && /* @__PURE__ */ jsx("ul", { className: "absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-surface-border bg-surface shadow-elevated", children: sugg.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onMouseDown: (ev) => ev.preventDefault(),
            onClick: () => pick(s),
            className: "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50",
            children: [
              /* @__PURE__ */ jsx("span", { className: "mt-0.5 text-primary-600", children: "🏢" }),
              /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("span", { className: "block truncate font-semibold text-ink", children: s.denomination }),
                /* @__PURE__ */ jsxs("span", { className: "block truncate text-xs text-ink-muted", children: [
                  "SIREN ",
                  s.siren,
                  " · ",
                  s.ville || "—",
                  " · ",
                  s.libelleNaf || s.naf || "—"
                ] })
              ] })
            ]
          }
        ) }, s.siret)) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Auto-remplit nom, adresse, SIREN. Données INSEE SIRENE." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "Nom / Raison sociale", value: editing.nom ?? "", onChange: (v) => setEditing({ ...editing, nom: v }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Email", value: editing.email ?? "", onChange: (v) => setEditing({ ...editing, email: v }), type: "email" }),
        /* @__PURE__ */ jsx(Field, { label: "Téléphone", value: editing.telephone ?? "", onChange: (v) => setEditing({ ...editing, telephone: v }), type: "tel" })
      ] }),
      /* @__PURE__ */ jsx(Field, { label: "Adresse", value: editing.adresse ?? "", onChange: (v) => setEditing({ ...editing, adresse: v }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-[120px_1fr]", children: [
        /* @__PURE__ */ jsx(Field, { label: "Code postal", value: editing.codePostal ?? "", onChange: (v) => setEditing({ ...editing, codePostal: v }) }),
        /* @__PURE__ */ jsx(Field, { label: "Ville", value: editing.ville ?? "", onChange: (v) => setEditing({ ...editing, ville: v }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "SIREN", value: editing.siren ?? "", onChange: (v) => setEditing({ ...editing, siren: v }) }),
        /* @__PURE__ */ jsx(Field, { label: "TVA Intracom", value: editing.tvaIntra ?? "", onChange: (v) => setEditing({ ...editing, tvaIntra: v }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "btn-ghost text-sm", children: "Annuler" }),
      /* @__PURE__ */ jsx("button", { onClick: onSave, className: "btn-primary text-sm", children: "Enregistrer" })
    ] })
  ] }) });
}
function CatalogTab({ catalog, onRefresh, toast }) {
  const [editing, setEditing] = useState(null);
  function save() {
    var _a;
    if (!((_a = editing == null ? void 0 : editing.libelle) == null ? void 0 : _a.trim())) {
      toast.push({ kind: "error", message: "Libellé requis.", ttl: 2e3 });
      return;
    }
    upsertCatalogItem({
      libelle: editing.libelle,
      description: editing.description,
      prixHT: editing.prixHT ?? 0,
      unite: editing.unite ?? "forfait",
      categorie: editing.categorie ?? "service_bnc",
      id: editing.id
    });
    setEditing(null);
    onRefresh();
    toast.push({ kind: "success", message: "Prestation enregistrée.", ttl: 2e3 });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
        catalog.length,
        " prestation(s) au catalogue"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setEditing({}), className: "btn-primary text-xs", children: "+ Nouvelle prestation" })
    ] }),
    catalog.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Catalogue vide. Ajoutez vos prestations récurrentes pour gagner du temps." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: catalog.map((c) => /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "font-display font-semibold text-ink", children: c.libelle }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
            c.unite,
            " · ",
            CATEGORIE_LABEL[c.categorie]
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "font-display text-lg font-bold text-primary-700", children: formatEUR(c.prixHT) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "HT" })
        ] })
      ] }),
      c.description && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-ink-muted", children: c.description }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2 text-xs", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setEditing(c), className: "text-primary-700 hover:underline", children: "Éditer" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          deleteCatalogItem(c.id);
          onRefresh();
        }, className: "text-rose-600 hover:underline", children: "Supprimer" })
      ] })
    ] }, c.id)) }),
    editing && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm", onClick: () => setEditing(null), children: /* @__PURE__ */ jsxs("div", { className: "my-8 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-elevated", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-display text-lg font-semibold text-ink", children: [
        editing.id ? "Modifier" : "Nouvelle",
        " prestation"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsx(Field, { label: "Libellé", value: editing.libelle ?? "", onChange: (v) => setEditing({ ...editing, libelle: v }) }),
        /* @__PURE__ */ jsx(Field, { label: "Description", value: editing.description ?? "", onChange: (v) => setEditing({ ...editing, description: v }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "Prix HT" }),
            /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "any", className: "input", value: editing.prixHT ?? 0, onChange: (e) => setEditing({ ...editing, prixHT: Number(e.target.value) || 0 }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "Unité" }),
            /* @__PURE__ */ jsxs("select", { className: "input", value: editing.unite ?? "forfait", onChange: (e) => setEditing({ ...editing, unite: e.target.value }), children: [
              /* @__PURE__ */ jsx("option", { value: "forfait", children: "Forfait" }),
              /* @__PURE__ */ jsx("option", { value: "heure", children: "Heure" }),
              /* @__PURE__ */ jsx("option", { value: "jour", children: "Jour" }),
              /* @__PURE__ */ jsx("option", { value: "unite", children: "Unité" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Catégorie fiscale" }),
          /* @__PURE__ */ jsx("select", { className: "input", value: editing.categorie ?? "service_bnc", onChange: (e) => setEditing({ ...editing, categorie: e.target.value }), children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: CATEGORIE_LABEL[c] }, c)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setEditing(null), className: "btn-ghost text-sm", children: "Annuler" }),
        /* @__PURE__ */ jsx("button", { onClick: save, className: "btn-primary text-sm", children: "Enregistrer" })
      ] })
    ] }) })
  ] });
}
function ParametresTab({ emetteur, onSaved }) {
  const [e, setE] = useState(emetteur);
  const [siretLookup, setSiretLookup] = useState("");
  const [busy, setBusy] = useState(false);
  function patch(p) {
    setE((s) => ({ ...s, ...p }));
  }
  function save() {
    const next = saveEmetteur(e);
    onSaved(next);
  }
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
      ville: found.ville
    });
  }
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Émetteur (vous)" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "Ces informations apparaissent sur chaque facture et devis." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary-200 bg-primary-50/40 p-3", children: [
      /* @__PURE__ */ jsx("label", { className: "label text-primary-900", children: "🔍 Auto-remplir depuis SIREN/SIRET (base SIRENE)" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Votre SIREN (9) ou SIRET (14) ou nom", value: siretLookup, onChange: (ev) => setSiretLookup(ev.target.value) }),
        /* @__PURE__ */ jsx("button", { onClick: lookupMine, disabled: busy, className: "btn-outline whitespace-nowrap text-xs", children: busy ? "…" : "Récupérer" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Field, { label: "Prénom", value: e.prenom ?? "", onChange: (v) => patch({ prenom: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "Nom / Raison sociale", value: e.nom ?? "", onChange: (v) => patch({ nom: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "Email", value: e.email ?? "", onChange: (v) => patch({ email: v }), type: "email" }),
      /* @__PURE__ */ jsx(Field, { label: "Téléphone", value: e.telephone ?? "", onChange: (v) => patch({ telephone: v }), type: "tel" }),
      /* @__PURE__ */ jsx(Field, { label: "Adresse", value: e.adresse ?? "", onChange: (v) => patch({ adresse: v }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-[120px_1fr]", children: [
        /* @__PURE__ */ jsx(Field, { label: "CP", value: e.codePostal ?? "", onChange: (v) => patch({ codePostal: v }) }),
        /* @__PURE__ */ jsx(Field, { label: "Ville", value: e.ville ?? "", onChange: (v) => patch({ ville: v }) })
      ] }),
      /* @__PURE__ */ jsx(Field, { label: "SIRET", value: e.siret ?? "", onChange: (v) => patch({ siret: v }) }),
      /* @__PURE__ */ jsx("div", {}),
      /* @__PURE__ */ jsx(Field, { label: "IBAN", value: e.iban ?? "", onChange: (v) => patch({ iban: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "BIC", value: e.bic ?? "", onChange: (v) => patch({ bic: v }) })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "mt-6 font-display text-base font-semibold text-ink", children: "Numérotation" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "Préfixe factures", value: e.prefixeFacture ?? "", onChange: (v) => patch({ prefixeFacture: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "Préfixe devis", value: e.prefixeDevis ?? "", onChange: (v) => patch({ prefixeDevis: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "Préfixe avoirs", value: e.prefixeAvoir ?? "", onChange: (v) => patch({ prefixeAvoir: v }) })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "mt-6 font-display text-base font-semibold text-ink", children: "Conditions par défaut" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Conditions de règlement" }),
        /* @__PURE__ */ jsx("textarea", { className: "input min-h-[80px]", value: e.conditionsParDefaut ?? "", onChange: (ev) => patch({ conditionsParDefaut: ev.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Notes par défaut" }),
        /* @__PURE__ */ jsx("textarea", { className: "input min-h-[60px]", value: e.notesParDefaut ?? "", onChange: (ev) => patch({ notesParDefaut: ev.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: save, className: "btn-primary", children: "Enregistrer" }) })
  ] });
}
function emptyDoc(type, emetteur, categorie) {
  const today = /* @__PURE__ */ new Date();
  const ech = new Date(today);
  ech.setDate(ech.getDate() + 30);
  return {
    id: uid("doc"),
    type,
    numero: genererNumero(type),
    dateEmission: today.toISOString().slice(0, 10),
    dateEcheance: ech.toISOString().slice(0, 10),
    lignes: [],
    notes: emetteur.notesParDefaut ?? "",
    conditions: emetteur.conditionsParDefaut ?? "",
    tvaApplicable: false,
    status: "brouillon",
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    categorieFiscale: categorie
  };
}
function Kpi({ label, value, accent }) {
  const c = accent === "secondary" ? "text-secondary-700" : accent === "warning" ? "text-amber-700" : accent === "danger" ? "text-rose-700" : "text-ink";
  return /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-ink-muted", children: label }),
    /* @__PURE__ */ jsx("p", { className: `mt-1 font-display text-2xl font-bold ${c}`, children: value })
  ] });
}
function Row({ k, v, accent }) {
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between py-1 ${accent ? "border-t-2 border-ink/30 pt-2 font-bold text-ink" : "text-ink-muted"}`, children: [
    /* @__PURE__ */ jsx("span", { children: k }),
    /* @__PURE__ */ jsx("span", { className: accent ? "font-display text-lg" : "", children: v })
  ] });
}
function Field({ label, value, onChange, type = "text" }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("label", { className: "label", children: label }),
    /* @__PURE__ */ jsx("input", { type, className: "input", value, onChange: (e) => onChange(e.target.value) })
  ] });
}
export {
  FacturationPage
};
