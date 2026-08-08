import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { L as Link } from "./vendor-router-Izd1qo3Q.js";
import { S as Seo } from "../entry-server.js";
import { t as getProfilFiscal, y as listEncaissements, w as listDepenses, J as syncFromServer, C as periodeAnnee, D as periodeMois, g as caPeriode, n as depensesPeriode, f as caMensuel12Mois, m as deleteEncaissement, c as addEncaissement, k as deleteDepense, b as addDepense, G as saveProfilFiscal } from "./billing-CroYyT51.js";
import { d as calculerCotisations, c as alertesPlafonds, P as PLAFOND_CA, f as formatEUR, e as formatPct, C as CATEGORIE_LABEL } from "./urssaf-CgN1GuuX.js";
import { Q as useToast, I as Icon } from "./wizard-CbzVLHaR.js";
import "react-dom";
import "react-router";
import "@remix-run/router";
import "react-dom/server";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./formalites-DR4taCu5.js";
function PilotagePage() {
  const toast = useToast();
  const [profil, setProfil] = useState(() => getProfilFiscal());
  const [encs, setEncs] = useState([]);
  const [deps, setDeps] = useState([]);
  const [yearOffset, setYearOffset] = useState(0);
  useEffect(() => {
    setEncs(listEncaissements());
    setDeps(listDepenses());
    void syncFromServer().then((ok) => {
      if (ok) {
        setEncs(listEncaissements());
        setDeps(listDepenses());
        setProfil(getProfilFiscal());
      }
    });
  }, []);
  const year = (/* @__PURE__ */ new Date()).getFullYear() + yearOffset;
  const periodeY = useMemo(() => periodeAnnee(year), [year]);
  const periodeMo = useMemo(() => periodeMois(), []);
  const caAnnuel = useMemo(() => caPeriode(periodeY, encs), [encs, periodeY]);
  const caMensuel = useMemo(() => caPeriode(periodeMo, encs), [encs, periodeMo]);
  const depAnnuel = useMemo(() => depensesPeriode(periodeY, deps), [deps, periodeY]);
  const data12 = useMemo(() => caMensuel12Mois(encs), [encs]);
  const cotis = useMemo(() => calculerCotisations(caAnnuel, profil.categorieDefaut, {
    versementLiberatoire: profil.versementLiberatoire,
    acreActive: profil.acreJusquAu ? new Date(profil.acreJusquAu) > /* @__PURE__ */ new Date() : false
  }), [caAnnuel, profil]);
  const alertes = useMemo(() => alertesPlafonds(caAnnuel, profil.categorieDefaut), [caAnnuel, profil.categorieDefaut]);
  const beneficeNet = caAnnuel - cotis.totalCharges - depAnnuel;
  const objectifAnnuel = profil.caObjectifAnnuel ?? PLAFOND_CA[profil.categorieDefaut];
  const pctObjectif = Math.min(1, caAnnuel / objectifAnnuel);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Cockpit financier — Swivo", description: "Tableau de bord CA, charges, bénéfices et alertes seuils pour votre micro-entreprise.", path: "/pilotage" }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10 lg:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 flex flex-wrap items-end justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
            /* @__PURE__ */ jsx(Icon.Calc, { className: "h-3.5 w-3.5" }),
            " Pilotage"
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: "Votre cockpit micro-entreprise" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-ink-muted", children: "CA, charges, bénéfices, alertes de seuils — tout votre pilotage en temps réel." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setYearOffset((o) => o - 1), className: "btn-ghost text-xs", children: "←" }),
          /* @__PURE__ */ jsx("span", { className: "font-display text-lg font-semibold text-ink", children: year }),
          /* @__PURE__ */ jsx("button", { onClick: () => setYearOffset((o) => o + 1), className: "btn-ghost text-xs", children: "→" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsx(Kpi, { title: "CA cumulé", value: formatEUR(caAnnuel), sub: `Objectif : ${formatEUR(objectifAnnuel)}`, progress: pctObjectif, accent: "primary" }),
        /* @__PURE__ */ jsx(Kpi, { title: "CA du mois", value: formatEUR(caMensuel), sub: "Encaissements en cours" }),
        /* @__PURE__ */ jsx(Kpi, { title: "Cotisations URSSAF", value: formatEUR(cotis.totalCharges), sub: `Taux effectif ${formatPct(cotis.taux.effectif)}`, accent: "warning" }),
        /* @__PURE__ */ jsx(Kpi, { title: "Bénéfice net estimé", value: formatEUR(beneficeNet), sub: `Après URSSAF + ${formatEUR(depAnnuel)} dépenses`, accent: "secondary" })
      ] }),
      alertes.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-2", children: alertes.map((a) => /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-4 text-sm ${alertCls(a.niveau)}`, children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          a.niveau === "critical" ? "⛔" : "⚠️",
          " ",
          a.message
        ] }),
        a.restant > 0 && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs", children: [
          "Marge restante avant seuil : ",
          formatEUR(a.restant)
        ] })
      ] }, a.code)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 card p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Évolution sur 12 mois" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
            "Cumul : ",
            formatEUR(data12.reduce((s, d) => s + d.ca, 0))
          ] })
        ] }),
        /* @__PURE__ */ jsx(Chart, { data: data12 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsx(
          EncaissementsCard,
          {
            items: encs,
            categorieDefaut: profil.categorieDefaut,
            onAdd: (e) => {
              addEncaissement(e);
              setEncs(listEncaissements());
              toast.push({ kind: "success", message: "Encaissement ajouté.", ttl: 2e3 });
            },
            onDelete: (id) => {
              deleteEncaissement(id);
              setEncs(listEncaissements());
            }
          }
        ),
        /* @__PURE__ */ jsx(
          DepensesCard,
          {
            items: deps,
            onAdd: (d) => {
              addDepense(d);
              setDeps(listDepenses());
              toast.push({ kind: "success", message: "Dépense ajoutée.", ttl: 2e3 });
            },
            onDelete: (id) => {
              deleteDepense(id);
              setDeps(listDepenses());
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 card p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Mon profil fiscal" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "Ces paramètres pilotent les calculs URSSAF et les alertes seuils." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "Catégorie d'activité" }),
            /* @__PURE__ */ jsx("select", { className: "input", value: profil.categorieDefaut, onChange: (e) => {
              const p = saveProfilFiscal({ categorieDefaut: e.target.value });
              setProfil(p);
            }, children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: CATEGORIE_LABEL[c] }, c)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "Versement libératoire" }),
            /* @__PURE__ */ jsxs("select", { className: "input", value: profil.versementLiberatoire ? "oui" : "non", onChange: (e) => {
              const p = saveProfilFiscal({ versementLiberatoire: e.target.value === "oui" });
              setProfil(p);
            }, children: [
              /* @__PURE__ */ jsx("option", { value: "non", children: "Non" }),
              /* @__PURE__ */ jsx("option", { value: "oui", children: "Oui" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "Régime de déclaration" }),
            /* @__PURE__ */ jsxs("select", { className: "input", value: profil.regimeDeclaration, onChange: (e) => {
              const p = saveProfilFiscal({ regimeDeclaration: e.target.value });
              setProfil(p);
            }, children: [
              /* @__PURE__ */ jsx("option", { value: "mensuel", children: "Mensuel" }),
              /* @__PURE__ */ jsx("option", { value: "trimestriel", children: "Trimestriel" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "CA objectif annuel (€)" }),
            /* @__PURE__ */ jsx("input", { className: "input", type: "number", value: profil.caObjectifAnnuel ?? "", placeholder: String(PLAFOND_CA[profil.categorieDefaut]), onChange: (e) => {
              const v = e.target.value ? Number(e.target.value) : void 0;
              const p = saveProfilFiscal({ caObjectifAnnuel: v });
              setProfil(p);
            } })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "ACRE jusqu'au" }),
            /* @__PURE__ */ jsx("input", { className: "input", type: "date", value: profil.acreJusquAu ?? "", onChange: (e) => {
              const p = saveProfilFiscal({ acreJusquAu: e.target.value || void 0 });
              setProfil(p);
            } })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Link, { to: "/urssaf", className: "btn-primary", children: "→ Déclarer mes cotisations URSSAF" }),
          /* @__PURE__ */ jsx(Link, { to: "/outils/calculateurs", className: "btn-outline", children: "Calculateurs détaillés" })
        ] })
      ] })
    ] })
  ] });
}
function Kpi({ title, value, sub, accent, progress }) {
  const color = accent === "primary" ? "text-primary-700" : accent === "secondary" ? "text-secondary-700" : accent === "warning" ? "text-amber-700" : "text-ink";
  return /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-ink-muted", children: title }),
    /* @__PURE__ */ jsx("p", { className: `mt-1 font-display text-2xl font-bold ${color}`, children: value }),
    sub && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: sub }),
    progress != null && /* @__PURE__ */ jsx("div", { className: "mt-3 h-1.5 overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500", style: { width: `${Math.round(progress * 100)}%` } }) })
  ] });
}
function Chart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.ca));
  return /* @__PURE__ */ jsx("div", { className: "mt-4 flex h-48 items-end gap-2", children: data.map((d) => {
    const h = d.ca / max * 100;
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col items-center justify-end gap-1", children: [
      /* @__PURE__ */ jsx("div", { className: "w-full rounded-t bg-gradient-to-t from-primary-600 to-secondary-500 transition-all", style: { height: `${h}%`, minHeight: d.ca > 0 ? "6px" : "2px" }, title: formatEUR(d.ca) }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-ink-muted", children: d.mois })
    ] }, d.mois);
  }) });
}
function EncaissementsCard({ items, categorieDefaut, onAdd, onDelete }) {
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [montant, setMontant] = useState("");
  const [libelle, setLibelle] = useState("");
  const [cat, setCat] = useState(categorieDefaut);
  const submit = (e) => {
    e.preventDefault();
    const m = Number(montant.replace(",", "."));
    if (!m || m <= 0) return;
    onAdd({ date, montant: m, categorie: cat, libelle: libelle || "Encaissement", source: "manuel" });
    setMontant("");
    setLibelle("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-display text-base font-semibold text-ink", children: "Encaissements" }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
        items.length,
        " entrée(s)"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-4 grid gap-2 sm:grid-cols-[120px_1fr_120px_1fr_auto]", children: [
      /* @__PURE__ */ jsx("input", { type: "date", className: "input", value: date, onChange: (e) => setDate(e.target.value) }),
      /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Libellé", value: libelle, onChange: (e) => setLibelle(e.target.value) }),
      /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", className: "input", placeholder: "€", value: montant, onChange: (e) => setMontant(e.target.value) }),
      /* @__PURE__ */ jsx("select", { className: "input", value: cat, onChange: (e) => setCat(e.target.value), children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c.replace("_", " ") }, c)) }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary text-xs", children: "+" })
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "mt-4 max-h-72 space-y-1 overflow-y-auto text-sm", children: items.slice(0, 30).map((e) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 border-b border-surface-border/40 py-1.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "truncate font-medium text-ink", children: e.libelle }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
          new Date(e.date).toLocaleDateString("fr-FR"),
          " · ",
          e.categorie.replace("_", " ")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-secondary-700", children: formatEUR(e.montant) }),
        /* @__PURE__ */ jsx("button", { onClick: () => onDelete(e.id), className: "text-xs text-rose-600", "aria-label": "Supprimer", children: "✕" })
      ] })
    ] }, e.id)) })
  ] });
}
function DepensesCard({ items, onAdd, onDelete }) {
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [montant, setMontant] = useState("");
  const [libelle, setLibelle] = useState("");
  const [type, setType] = useState("logiciel");
  const submit = (e) => {
    e.preventDefault();
    const m = Number(montant.replace(",", "."));
    if (!m || m <= 0) return;
    onAdd({ date, montant: m, libelle: libelle || "Dépense", type });
    setMontant("");
    setLibelle("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-display text-base font-semibold text-ink", children: "Dépenses" }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
        items.length,
        " entrée(s)"
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Suivi à titre indicatif (la micro n'a pas de comptabilité de charges)." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-4 grid gap-2 sm:grid-cols-[120px_1fr_120px_1fr_auto]", children: [
      /* @__PURE__ */ jsx("input", { type: "date", className: "input", value: date, onChange: (e) => setDate(e.target.value) }),
      /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Libellé", value: libelle, onChange: (e) => setLibelle(e.target.value) }),
      /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", className: "input", placeholder: "€", value: montant, onChange: (e) => setMontant(e.target.value) }),
      /* @__PURE__ */ jsxs("select", { className: "input", value: type, onChange: (e) => setType(e.target.value), children: [
        /* @__PURE__ */ jsx("option", { value: "fourniture", children: "Fournitures" }),
        /* @__PURE__ */ jsx("option", { value: "loyer", children: "Loyer" }),
        /* @__PURE__ */ jsx("option", { value: "logiciel", children: "Logiciel" }),
        /* @__PURE__ */ jsx("option", { value: "transport", children: "Transport" }),
        /* @__PURE__ */ jsx("option", { value: "communication", children: "Communication" }),
        /* @__PURE__ */ jsx("option", { value: "autre", children: "Autre" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary text-xs", children: "+" })
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "mt-4 max-h-72 space-y-1 overflow-y-auto text-sm", children: items.slice(0, 30).map((d) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 border-b border-surface-border/40 py-1.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "truncate font-medium text-ink", children: d.libelle }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
          new Date(d.date).toLocaleDateString("fr-FR"),
          " · ",
          d.type
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-semibold text-amber-700", children: [
          "- ",
          formatEUR(d.montant)
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => onDelete(d.id), className: "text-xs text-rose-600", "aria-label": "Supprimer", children: "✕" })
      ] })
    ] }, d.id)) })
  ] });
}
function alertCls(n) {
  if (n === "critical") return "border-rose-300 bg-rose-50 text-rose-900";
  if (n === "warning") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-primary-300 bg-primary-50 text-primary-900";
}
export {
  PilotagePage
};
