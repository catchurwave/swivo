import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { L as Link } from "./vendor-router-Izd1qo3Q.js";
import { S as Seo } from "../entry-server.js";
import { d as calculerCotisations, C as CATEGORIE_LABEL, e as formatPct, a as ACRE_REDUCTION, f as formatEUR, S as SEUIL_TVA_BASIQUE, P as PLAFOND_CA, A as ABATTEMENT_IR, r as revenuNetImposable, b as SEUIL_TVA_MAJOREE } from "./urssaf-CgN1GuuX.js";
import "react-dom";
import "react-router";
import "@remix-run/router";
import "react-dom/server";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./wizard-CbzVLHaR.js";
import "./formalites-DR4taCu5.js";
function CalculateursPage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: "Simulateurs micro-entreprise — URSSAF, TVA, revenu net",
        description: "Calculez vos cotisations URSSAF, votre revenu net imposable, votre marge avant le seuil de TVA — tout pour piloter votre micro.",
        path: "/outils/calculateurs"
      }
    ),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-secondary", children: "Outils gratuits" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Simulateurs micro" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-ink-muted", children: [
          "Estimations conformes aux taux 2026 (URSSAF + BOFIP). Pour la déclaration assistée, ",
          /* @__PURE__ */ jsx(Link, { to: "/urssaf", className: "link", children: "utilisez le module URSSAF" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsx(UrssafCalc, {}),
        /* @__PURE__ */ jsx(SeuilTvaCalc, {}),
        /* @__PURE__ */ jsx(RevenuNetCalc, {})
      ] })
    ] })
  ] });
}
function UrssafCalc() {
  const [ca, setCa] = useState(4e4);
  const [cat, setCat] = useState("service_bnc");
  const [acre, setAcre] = useState(false);
  const [vl, setVl] = useState(false);
  const calcul = calculerCotisations(ca, cat, { acreActive: acre, versementLiberatoire: vl });
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "URSSAF — Cotisations" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Calcul exact selon catégorie + options." }),
    /* @__PURE__ */ jsx("label", { className: "label mt-4", children: "CA annuel" }),
    /* @__PURE__ */ jsx("input", { type: "number", className: "input", min: 0, step: 500, value: ca, onChange: (e) => setCa(+e.target.value || 0) }),
    /* @__PURE__ */ jsx("label", { className: "label mt-3", children: "Catégorie" }),
    /* @__PURE__ */ jsx("select", { className: "input", value: cat, onChange: (e) => setCat(e.target.value), children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: CATEGORIE_LABEL[c] }, c)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2", children: [
      /* @__PURE__ */ jsxs("label", { className: `flex items-center gap-2 rounded-lg border p-2 text-sm ${acre ? "border-secondary-300 bg-secondary-50" : "border-surface-border"}`, children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: acre, onChange: (e) => setAcre(e.target.checked) }),
        "ACRE 1ère année (- ",
        formatPct(ACRE_REDUCTION),
        ")"
      ] }),
      /* @__PURE__ */ jsxs("label", { className: `flex items-center gap-2 rounded-lg border p-2 text-sm ${vl ? "border-secondary-300 bg-secondary-50" : "border-surface-border"}`, children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: vl, onChange: (e) => setVl(e.target.checked) }),
        "Versement libératoire IR"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl bg-primary-50 p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-primary-700", children: "À verser URSSAF" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-2xl font-bold text-primary-800", children: formatEUR(calcul.totalCharges) }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-primary-700", children: [
        "Taux effectif ",
        formatPct(calcul.taux.effectif)
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 rounded-xl bg-secondary-50 p-3", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-secondary-700", children: [
      "Net restant : ",
      /* @__PURE__ */ jsx("strong", { children: formatEUR(calcul.netRestant) })
    ] }) })
  ] });
}
function SeuilTvaCalc() {
  const [ca, setCa] = useState(3e4);
  const [cat, setCat] = useState("service_bnc");
  const seuilBasique = SEUIL_TVA_BASIQUE[cat];
  const seuilMajore = SEUIL_TVA_MAJOREE[cat];
  const plafond = PLAFOND_CA[cat];
  const margeBasique = Math.max(0, seuilBasique - ca);
  const pctBasique = Math.min(1, ca / seuilBasique);
  const pctPlafond = Math.min(1, ca / plafond);
  const status = ca >= seuilMajore ? { msg: "TVA obligatoire — passage au réel immédiat", cls: "bg-rose-50 text-rose-900 border-rose-300" } : ca >= seuilBasique ? { msg: "TVA à partir du mois suivant", cls: "bg-amber-50 text-amber-900 border-amber-300" } : ca >= seuilBasique * 0.85 ? { msg: "Seuil TVA proche", cls: "bg-amber-50 text-amber-900 border-amber-300" } : { msg: "Franchise en base — pas de TVA à facturer", cls: "bg-secondary-50 text-secondary-900 border-secondary-300" };
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Seuils TVA & plafond micro" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Suivez votre marge avant assujettissement." }),
    /* @__PURE__ */ jsx("label", { className: "label mt-4", children: "CA cumulé année en cours" }),
    /* @__PURE__ */ jsx("input", { type: "number", className: "input", min: 0, step: 500, value: ca, onChange: (e) => setCa(+e.target.value || 0) }),
    /* @__PURE__ */ jsx("label", { className: "label mt-3", children: "Catégorie" }),
    /* @__PURE__ */ jsx("select", { className: "input", value: cat, onChange: (e) => setCat(e.target.value), children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: CATEGORIE_LABEL[c] }, c)) }),
    /* @__PURE__ */ jsx("div", { className: `mt-5 rounded-xl border p-3 text-sm ${status.cls}`, children: status.msg }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsx(Bar, { label: `TVA basique ${formatEUR(seuilBasique)}`, pct: pctBasique }),
      /* @__PURE__ */ jsx(Bar, { label: `Plafond micro ${formatEUR(plafond)}`, pct: pctPlafond }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
        "Marge avant TVA : ",
        /* @__PURE__ */ jsx("strong", { children: formatEUR(margeBasique) })
      ] })
    ] })
  ] });
}
function RevenuNetCalc() {
  const [ca, setCa] = useState(4e4);
  const [cat, setCat] = useState("service_bnc");
  const [tmi, setTmi] = useState(11);
  const cotisations = calculerCotisations(ca, cat);
  const revenuImposable = revenuNetImposable(ca, cat);
  const irEstime = revenuImposable * tmi / 100;
  const netDisponible = ca - cotisations.totalCharges - irEstime;
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Revenu net réel" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Après URSSAF + IR au barème (hors versement libératoire)." }),
    /* @__PURE__ */ jsx("label", { className: "label mt-4", children: "CA annuel" }),
    /* @__PURE__ */ jsx("input", { type: "number", className: "input", min: 0, step: 500, value: ca, onChange: (e) => setCa(+e.target.value || 0) }),
    /* @__PURE__ */ jsx("label", { className: "label mt-3", children: "Catégorie" }),
    /* @__PURE__ */ jsx("select", { className: "input", value: cat, onChange: (e) => setCat(e.target.value), children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsx("option", { value: c, children: CATEGORIE_LABEL[c] }, c)) }),
    /* @__PURE__ */ jsx("label", { className: "label mt-3", children: "Tranche marginale IR" }),
    /* @__PURE__ */ jsxs("select", { className: "input", value: tmi, onChange: (e) => setTmi(+e.target.value), children: [
      /* @__PURE__ */ jsx("option", { value: 0, children: "0 %" }),
      /* @__PURE__ */ jsx("option", { value: 11, children: "11 %" }),
      /* @__PURE__ */ jsx("option", { value: 30, children: "30 %" }),
      /* @__PURE__ */ jsx("option", { value: 41, children: "41 %" }),
      /* @__PURE__ */ jsx("option", { value: 45, children: "45 %" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3", children: [
      /* @__PURE__ */ jsx(Stat, { label: "Abattement forfaitaire IR", value: formatPct(ABATTEMENT_IR[cat]) }),
      /* @__PURE__ */ jsx(Stat, { label: "Revenu net imposable", value: formatEUR(revenuImposable) }),
      /* @__PURE__ */ jsx(Stat, { label: "IR estimé", value: formatEUR(irEstime) }),
      /* @__PURE__ */ jsx(Stat, { label: "URSSAF", value: formatEUR(cotisations.totalCharges) }),
      /* @__PURE__ */ jsx(Stat, { label: "Net disponible", value: formatEUR(netDisponible), accent: true })
    ] })
  ] });
}
function Bar({ label, pct }) {
  const w = Math.round(pct * 100);
  const color = pct >= 1 ? "bg-rose-500" : pct >= 0.85 ? "bg-amber-500" : "bg-secondary-500";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-ink-muted", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      /* @__PURE__ */ jsxs("span", { className: "font-semibold text-ink", children: [
        w,
        " %"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: `h-full transition-all ${color}`, style: { width: `${Math.min(100, w)}%` } }) })
  ] });
}
function Stat({ label, value, accent }) {
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between rounded-xl px-4 py-3 ${accent ? "bg-secondary-50" : "bg-surface-muted"}`, children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wider text-ink-muted", children: label }),
    /* @__PURE__ */ jsx("span", { className: `font-display text-lg font-bold ${accent ? "text-secondary-700" : "text-ink"}`, children: value })
  ] });
}
export {
  CalculateursPage
};
