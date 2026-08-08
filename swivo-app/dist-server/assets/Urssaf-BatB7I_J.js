import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { L as Link } from "./vendor-router-Izd1qo3Q.js";
import { S as Seo } from "../entry-server.js";
import { d as calculerCotisations, p as prochainesEcheancesURSSAF, f as formatEUR, C as CATEGORIE_LABEL, e as formatPct, a as ACRE_REDUCTION } from "./urssaf-CgN1GuuX.js";
import { t as getProfilFiscal, J as syncFromServer, D as periodeMois, E as periodeTrimestre, g as caPeriode, G as saveProfilFiscal } from "./billing-CroYyT51.js";
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
function UrssafPage() {
  const toast = useToast();
  const [profil, setProfil] = useState(() => getProfilFiscal());
  const [ca, setCa] = useState("");
  const [acre, setAcre] = useState(false);
  const [vl, setVl] = useState(profil.versementLiberatoire);
  const [categorie, setCategorie] = useState(profil.categorieDefaut);
  const [regime, setRegime] = useState(profil.regimeDeclaration);
  useEffect(() => {
    void syncFromServer().then((ok) => {
      if (ok) setProfil(getProfilFiscal());
    });
  }, []);
  const periodeAuto = useMemo(() => regime === "mensuel" ? periodeMois() : periodeTrimestre(), [regime]);
  const caAuto = useMemo(() => caPeriode(periodeAuto), [periodeAuto]);
  const caNum = Number(ca.replace(",", ".")) || 0;
  const calcul = useMemo(() => calculerCotisations(caNum, categorie, { acreActive: acre, versementLiberatoire: vl }), [caNum, categorie, acre, vl]);
  const echeances = useMemo(() => prochainesEcheancesURSSAF(regime, 4), [regime]);
  function applyAuto() {
    setCa(String(caAuto));
    toast.push({ kind: "info", message: `CA pré-rempli depuis vos encaissements : ${formatEUR(caAuto)}`, ttl: 3e3 });
  }
  function saveProfil() {
    const next = saveProfilFiscal({ categorieDefaut: categorie, versementLiberatoire: vl, regimeDeclaration: regime });
    setProfil(next);
    toast.push({ kind: "success", message: "Profil fiscal mis à jour.", ttl: 3e3 });
  }
  function simulateDeclaration() {
    if (caNum <= 0) {
      toast.push({ kind: "warning", message: "Saisissez un CA pour simuler la déclaration.", ttl: 4e3 });
      return;
    }
    toast.push({
      kind: "success",
      title: "Simulation prête",
      message: `Vous devrez payer ${formatEUR(calcul.totalCharges)} à l'URSSAF. Connectez-vous sur autoentrepreneur.urssaf.fr pour déclarer ${formatEUR(caNum)}.`,
      ttl: 8e3
    });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Assistant déclaration URSSAF — Swivo", description: "Calculez vos cotisations URSSAF en temps réel et préparez votre déclaration micro-entrepreneur.", path: "/urssaf" }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10 lg:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
          /* @__PURE__ */ jsx(Icon.Calc, { className: "h-3.5 w-3.5" }),
          " URSSAF"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: "Assistant de déclaration URSSAF" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-ink-muted", children: "Simulez vos cotisations en temps réel selon votre CA encaissé, votre catégorie d'activité et vos options fiscales." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_360px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-display text-lg font-semibold text-ink", children: [
            "Période — ",
            regime === "mensuel" ? "Mensuelle" : "Trimestrielle"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-ink-muted", children: [
            periodeAuto.from,
            " → ",
            periodeAuto.to
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "ca", children: "Chiffre d'affaires encaissé" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("input", { id: "ca", type: "number", inputMode: "decimal", className: "input", placeholder: "0", value: ca, onChange: (e) => setCa(e.target.value) }),
                /* @__PURE__ */ jsx("span", { className: "self-center text-sm text-ink-muted", children: "€" }),
                caAuto > 0 && /* @__PURE__ */ jsxs("button", { onClick: applyAuto, className: "btn-outline text-xs whitespace-nowrap", children: [
                  "Auto ",
                  formatEUR(caAuto)
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "CA réellement encaissé sur la période (pas le facturé)." })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: "Catégorie d'activité" }),
              /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: Object.keys(CATEGORIE_LABEL).map((c) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCategorie(c),
                  className: `rounded-xl border p-3 text-left text-sm transition ${categorie === c ? "border-primary-500 bg-primary-50/40 ring-2 ring-primary-500/20" : "border-surface-border hover:border-primary-300"}`,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "block font-semibold text-ink", children: CATEGORIE_LABEL[c] }),
                    /* @__PURE__ */ jsxs("span", { className: "block text-xs text-ink-muted", children: [
                      "Cotisations ",
                      formatPct({ vente_bic: 0.123, service_bic: 0.212, service_bnc: 0.211, liberal_cipav: 0.232 }[c])
                    ] })
                  ]
                },
                c
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("label", { className: `flex items-start gap-3 rounded-lg border p-3 ${acre ? "border-secondary-300 bg-secondary-50" : "border-surface-border"}`, children: [
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: acre, onChange: (e) => setAcre(e.target.checked), className: "mt-1" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: "ACRE — 1ère année" }),
                  /* @__PURE__ */ jsxs("span", { className: "block text-xs text-ink-muted", children: [
                    "Exonération de ",
                    formatPct(ACRE_REDUCTION),
                    " des cotisations"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: `flex items-start gap-3 rounded-lg border p-3 ${vl ? "border-secondary-300 bg-secondary-50" : "border-surface-border"}`, children: [
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: vl, onChange: (e) => setVl(e.target.checked), className: "mt-1" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: "Versement libératoire IR" }),
                  /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: "Payez l'IR en même temps que l'URSSAF" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: "Régime de déclaration" }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => setRegime("mensuel"), className: `rounded-xl border p-3 text-sm transition ${regime === "mensuel" ? "border-primary-500 bg-primary-50/40" : "border-surface-border"}`, children: "Mensuel" }),
                /* @__PURE__ */ jsx("button", { onClick: () => setRegime("trimestriel"), className: `rounded-xl border p-3 text-sm transition ${regime === "trimestriel" ? "border-primary-500 bg-primary-50/40" : "border-surface-border"}`, children: "Trimestriel" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 pt-2", children: [
              /* @__PURE__ */ jsx("button", { onClick: simulateDeclaration, className: "btn-primary", children: "Simuler ma déclaration" }),
              /* @__PURE__ */ jsx("button", { onClick: saveProfil, className: "btn-outline", children: "Enregistrer ce profil" }),
              /* @__PURE__ */ jsx("a", { href: "https://autoentrepreneur.urssaf.fr", target: "_blank", rel: "noopener noreferrer", className: "btn-ghost text-sm", children: "→ URSSAF.fr" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("aside", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold uppercase tracking-wider text-ink-muted", children: "À payer URSSAF" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 font-display text-4xl font-bold text-primary-700", children: formatEUR(calcul.totalCharges) }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-ink-muted", children: [
              "Taux effectif : ",
              formatPct(calcul.taux.effectif)
            ] }),
            /* @__PURE__ */ jsxs("dl", { className: "mt-4 space-y-2 text-sm", children: [
              /* @__PURE__ */ jsx(Row, { k: "Cotisations sociales", v: formatEUR(calcul.urssaf), sub: formatPct(calcul.taux.urssaf) }),
              /* @__PURE__ */ jsx(Row, { k: "CFP", v: formatEUR(calcul.cfp), sub: formatPct(calcul.taux.cfp) }),
              calcul.taxeChambre > 0 && /* @__PURE__ */ jsx(Row, { k: "Taxe CCI/CMA", v: formatEUR(calcul.taxeChambre), sub: formatPct(calcul.taux.taxeChambre) }),
              vl && /* @__PURE__ */ jsx(Row, { k: "Versement IR", v: formatEUR(calcul.versementLiberatoire), sub: formatPct(calcul.taux.versementLiberatoire) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-secondary-900", children: /* @__PURE__ */ jsxs("strong", { children: [
              "Net restant : ",
              formatEUR(calcul.netRestant)
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold uppercase tracking-wider text-ink-muted", children: "Prochaines échéances" }),
            /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2 text-sm", children: echeances.map((e) => /* @__PURE__ */ jsxs("li", { className: "flex items-start justify-between gap-3 border-b border-surface-border/40 pb-2 last:border-0", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink", children: e.label }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: e.periode })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "badge bg-primary-50 text-primary-700", children: new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) })
            ] }, e.date)) })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/pilotage", className: "card block p-4 transition hover:border-primary-300 hover:shadow-soft", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-primary-700", children: "→ Voir le cockpit financier" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Vue globale CA / charges / bénéfices, alertes seuils." })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Row({ k, v, sub }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3 border-b border-surface-border/40 pb-1 last:border-0", children: [
    /* @__PURE__ */ jsxs("dt", { children: [
      /* @__PURE__ */ jsx("span", { className: "block text-ink", children: k }),
      sub && /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: sub })
    ] }),
    /* @__PURE__ */ jsx("dd", { className: "font-semibold text-ink", children: v })
  ] });
}
export {
  UrssafPage
};
