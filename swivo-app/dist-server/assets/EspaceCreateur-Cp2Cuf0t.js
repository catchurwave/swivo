import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { u as useSearchParams, L as Link } from "./vendor-router-Izd1qo3Q.js";
import { u as useResumeCta, S as Seo, g as getDayGreeting } from "../entry-server.js";
import { d as apiBase, O as useAuth, w as listDrafts, D as DocumentsManager, l as deleteDraft, K as startCheckout, x as openBillingPortal, L as startSubscribe } from "./wizard-CbzVLHaR.js";
import { J as syncFromServer, t as getProfilFiscal, g as caPeriode, D as periodeMois, C as periodeAnnee } from "./billing-CroYyT51.js";
import { d as calculerCotisations, c as alertesPlafonds, p as prochainesEcheancesURSSAF, f as formatEUR, e as formatPct, C as CATEGORIE_LABEL } from "./urssaf-CgN1GuuX.js";
import "react-dom";
import "react-router";
import "@remix-run/router";
import "react-dom/server";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./formalites-DR4taCu5.js";
async function fetchMyDossiers() {
  try {
    const res = await fetch(`${apiBase()}/swivo/v1/my-dossiers`, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
const TOOLS = [
  { name: "Cockpit financier", desc: "CA, charges, bénéfices, alertes seuils", to: "/pilotage", icon: "📊" },
  { name: "Déclaration URSSAF", desc: "Simulateur + assistant", to: "/urssaf", icon: "🧾" },
  { name: "Simulateurs", desc: "Cotisations, TVA, revenu net", to: "/outils/calculateurs", icon: "🧮" },
  { name: "Formations", desc: "Trouver clients, fixer prix, optimiser", to: "/formations", icon: "🎓" },
  { name: "Modèles juridiques", desc: "CGV, lettres, mentions légales, RGPD", to: "/outils/modeles", icon: "📄", gated: true },
  { name: "Facturation & devis", desc: "PDF conformes, clients, relances", to: "/outils/facturation", icon: "💸", gated: true },
  { name: "Mettre en pause", desc: "Cessation temporaire d’activité", to: "/gestion/pause", icon: "⏸", gated: true },
  { name: "Fermer ma micro", desc: "Procédure de radiation assistée", to: "/gestion/fermeture", icon: "🛑", gated: true },
  { name: "Support", desc: "Réponse sous 2 h ouvrées", to: "/contact", icon: "💬" }
];
const STATUS_COLOR = {
  pending: "bg-primary-50 text-primary-700",
  awaiting_payment: "bg-warning/10 text-warning",
  paid: "bg-primary-100 text-primary-800",
  deposited: "bg-secondary-50 text-secondary-700",
  completed: "bg-secondary-100 text-secondary-800",
  rejected: "bg-danger/10 text-danger"
};
function EspaceCreateurPage() {
  var _a, _b, _c, _d;
  const { user, nonce } = useAuth();
  const cta = useResumeCta();
  const [payingId, setPayingId] = useState(null);
  async function payDossier(id) {
    var _a2;
    setPayingId(id);
    const r = await startCheckout(id, nonce);
    setPayingId(null);
    if (r.ok && ((_a2 = r.data) == null ? void 0 : _a2.url)) window.location.href = r.data.url;
    else alert(r.error ?? "Paiement indisponible. Réessayez.");
  }
  const [dossiers, setDossiers] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sp] = useSearchParams();
  const paid = sp.get("paid") === "1";
  const finalized = sp.get("finalized");
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMyDossiers(), listDrafts(), syncFromServer()]).then(([d, dr]) => {
      setDossiers(d);
      setDrafts(dr ?? []);
      setLoading(false);
    });
  }, []);
  async function removeDraft(id) {
    const ok = await deleteDraft(id);
    if (ok) setDrafts((arr) => arr.filter((d) => d.id !== id));
  }
  const profil = useMemo(() => {
    return getProfilFiscal();
  }, []);
  const caMensuel = useMemo(() => caPeriode(periodeMois()), []);
  const caAnnuel = useMemo(() => caPeriode(periodeAnnee()), []);
  const cotis = useMemo(() => calculerCotisations(caMensuel, profil.categorieDefaut, { versementLiberatoire: profil.versementLiberatoire }), [caMensuel, profil]);
  const alertes = useMemo(() => alertesPlafonds(caAnnuel, profil.categorieDefaut), [caAnnuel, profil.categorieDefaut]);
  const prochaine = useMemo(() => prochainesEcheancesURSSAF(profil.regimeDeclaration, 1)[0], [profil.regimeDeclaration]);
  const active = dossiers.filter((d) => !["completed", "rejected"].includes(d.status)).length + drafts.length;
  const totalAll = dossiers.length + drafts.length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Espace créateur", description: "Tableau de bord Swivo", path: "/espace-createur", noindex: true }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-10", children: [
      paid && /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-xl border border-secondary-300 bg-secondary-50 p-4 text-sm text-secondary-800", children: "✅ Paiement confirmé. Notre équipe prend votre dossier en charge sous 24h ouvrées." }),
      finalized && /* @__PURE__ */ jsxs("div", { className: "mb-6 rounded-xl border border-primary-300 bg-primary-50 p-4 text-sm text-primary-800", children: [
        "✅ Dossier #",
        finalized,
        " finalisé et transmis. À régler pour transmission INPI."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "Tableau de bord" }),
            ((_a = user == null ? void 0 : user.gestion) == null ? void 0 : _a.active) && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-secondary-500 animate-pulse" }),
              "Formule Gestion active"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "mt-2 font-display text-3xl font-bold tracking-tight text-ink", children: [
            getDayGreeting(),
            " ",
            (user == null ? void 0 : user.name) ? user.name.split(" ")[0] : "",
            " 👋"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-ink-muted", children: "Vos dossiers et vos outils du quotidien." })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: cta.href, className: "btn-primary", children: cta.hasDraft ? "↻ Reprendre mon dossier" : "+ Nouveau dossier" })
      ] }),
      ((_b = user == null ? void 0 : user.gestion) == null ? void 0 : _b.active) && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary-200 bg-gradient-to-r from-secondary-50 via-surface to-primary-50 px-5 py-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700", children: "✓" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-display text-sm font-semibold text-ink", children: "Formule Gestion active" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
              "9,90 €/mois · Tous les outils débloqués",
              user.gestion.until && /* @__PURE__ */ jsxs(Fragment, { children: [
                " · Prochaine échéance ",
                /* @__PURE__ */ jsx("strong", { className: "text-ink", children: new Date(user.gestion.until).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(BillingPortalButton, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-ink-muted", children: "Dossiers actifs" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-2xl font-bold text-ink", children: active }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: totalAll ? `${totalAll} au total` : "Aucun dossier" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-ink-muted", children: "CA du mois" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-2xl font-bold text-primary-700", children: formatEUR(caMensuel) }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-ink-muted", children: [
            formatEUR(caAnnuel),
            " cumulé ",
            (/* @__PURE__ */ new Date()).getFullYear()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-ink-muted", children: "URSSAF estimée (mois)" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-2xl font-bold text-amber-700", children: formatEUR(cotis.totalCharges) }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-ink-muted", children: [
            "Taux effectif ",
            formatPct(cotis.taux.effectif)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-ink-muted", children: "Prochaine échéance" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-2xl font-bold text-ink", children: prochaine ? new Date(prochaine.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted truncate", children: (prochaine == null ? void 0 : prochaine.label) ?? "Configurez votre régime" })
        ] })
      ] }),
      alertes.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: alertes.slice(0, 2).map((a) => /* @__PURE__ */ jsx("div", { className: `rounded-xl border p-3 text-sm ${a.niveau === "critical" ? "border-rose-300 bg-rose-50 text-rose-900" : "border-amber-300 bg-amber-50 text-amber-900"}`, children: /* @__PURE__ */ jsxs("strong", { children: [
        a.niveau === "critical" ? "⛔" : "⚠️",
        " ",
        a.message
      ] }) }, a.code)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 text-xs text-ink-muted", children: [
        "Catégorie : ",
        /* @__PURE__ */ jsx("strong", { className: "text-ink", children: CATEGORIE_LABEL[profil.categorieDefaut] }),
        " · ",
        /* @__PURE__ */ jsx(Link, { to: "/pilotage", className: "link", children: "Modifier le profil fiscal" })
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "mt-10 card p-5", children: [
        /* @__PURE__ */ jsx("summary", { className: "cursor-pointer font-display text-lg font-semibold text-ink", children: "📎 Mes pièces justificatives" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: "Téléversez les pièces nécessaires à votre déclaration INPI. Vous pouvez le faire à tout moment." }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(DocumentsManagerLite, {}) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Mes dossiers" }),
        loading && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-ink-muted", children: "Chargement…" }),
        !loading && dossiers.length === 0 && drafts.length === 0 && /* @__PURE__ */ jsxs("div", { className: "card mt-3 p-6 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Aucun dossier pour le moment." }),
          /* @__PURE__ */ jsx(Link, { to: "/creer-mon-entreprise", className: "btn-primary mt-4", children: "Créer mon premier dossier" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-3", children: [
          drafts.map((d) => {
            var _a2;
            return /* @__PURE__ */ jsxs("div", { className: "card border-primary-200 bg-primary-50/30 p-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "badge bg-primary-100 text-primary-700", children: "Brouillon" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                      "#",
                      d.id,
                      " · ",
                      ((_a2 = d.forme) == null ? void 0 : _a2.toUpperCase()) || "—"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 truncate font-display text-base font-semibold text-ink", children: d.title.replace(/^\[Brouillon\]\s*/, "") || "Sans titre" }),
                  /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-ink-muted", children: [
                    "Dernière sauvegarde : ",
                    new Date(d.savedAt || d.updatedAt).toLocaleString("fr-FR")
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "badge bg-ink-muted/10 text-ink-muted shrink-0", children: [
                  d.score,
                  "% complété"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-3 flex items-center gap-3", children: /* @__PURE__ */ jsx("div", { className: "h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500", style: { width: `${d.score}%` } }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsx(Link, { to: `/creer-mon-entreprise?draft=${d.id}`, className: "btn-primary text-xs", children: "Reprendre la saisie" }),
                /* @__PURE__ */ jsx("button", { onClick: () => removeDraft(d.id), className: "btn-ghost text-xs text-rose-600 hover:bg-rose-50", children: "Supprimer" })
              ] })
            ] }, `draft-${d.id}`);
          }),
          dossiers.map((d) => {
            const payable = d.status === "pending" || d.status === "awaiting_payment";
            return /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: d.reference }),
                  /* @__PURE__ */ jsx("p", { className: "font-display text-base font-semibold text-ink", children: d.title })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `badge ${STATUS_COLOR[d.status] ?? "bg-ink-muted/10 text-ink-muted"}`, children: d.statusLabel })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500", style: { width: `${d.progress}%` } }) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-ink-muted", children: [
                  d.progress,
                  "%"
                ] })
              ] }),
              payable && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-900", children: "⏳ Paiement requis pour transmettre au Guichet unique." }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => payDossier(d.id),
                    disabled: payingId === d.id,
                    className: "btn-primary ml-auto text-xs disabled:opacity-60",
                    children: payingId === d.id ? "Redirection Stripe…" : "Payer 29,90 €"
                  }
                )
              ] })
            ] }, d.id);
          })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Outils de gestion" }),
          !((_c = user == null ? void 0 : user.gestion) == null ? void 0 : _c.active) && /* @__PURE__ */ jsx(SubscribeButton, {})
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: TOOLS.map((t) => {
          var _a2;
          const locked = t.gated && !((_a2 = user == null ? void 0 : user.gestion) == null ? void 0 : _a2.active);
          return /* @__PURE__ */ jsxs(
            Link,
            {
              to: t.to,
              className: `group card relative flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-elevated ${locked ? "opacity-70" : ""}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-2xl", children: t.icon }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-display text-base font-semibold text-ink group-hover:text-primary-700", children: t.name }),
                    locked && /* @__PURE__ */ jsx("span", { className: "badge bg-primary-50 text-primary-700", children: "🔒 Gestion" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "mt-1 block text-sm text-ink-muted", children: t.desc })
                ] })
              ]
            },
            t.name
          );
        }) }),
        !((_d = user == null ? void 0 : user.gestion) == null ? void 0 : _d.active) && /* @__PURE__ */ jsx("div", { className: "mt-8 overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-accent-50 p-8", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-6 md:grid-cols-[1fr_auto]", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "Formule Gestion · 9,90 €/mois" }),
            /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-2xl font-bold text-ink", children: "Débloquez tous vos outils de pilotage" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-ink-muted", children: "Facturation, modèles juridiques, mise en pause, fermeture, calculateurs avancés, support prioritaire." })
          ] }),
          /* @__PURE__ */ jsx(SubscribeButton, { large: true })
        ] }) })
      ] })
    ] })
  ] });
}
function SubscribeButton({ large = false }) {
  const { nonce } = useAuth();
  const [busy, setBusy] = useState(false);
  const click = async () => {
    var _a;
    setBusy(true);
    const r = await startSubscribe(nonce);
    setBusy(false);
    if (r.ok && ((_a = r.data) == null ? void 0 : _a.url)) window.location.href = r.data.url;
  };
  return /* @__PURE__ */ jsx("button", { onClick: click, disabled: busy, className: `btn-primary ${large ? "px-7 py-3.5 text-base" : ""}`, children: busy ? "Redirection…" : "Activer la Gestion 9,90 €/mois" });
}
function DocumentsManagerLite() {
  return /* @__PURE__ */ jsx(DocumentsManager, { dossier: { activites: [], associes: [], dirigeants: [], beneficiairesEffectifs: [], options: {}, version: 1, statut: "brouillon", scoreCompletude: 0, forme: "micro" } });
}
function BillingPortalButton() {
  const { nonce } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const click = async () => {
    var _a;
    setBusy(true);
    setErr(null);
    const r = await openBillingPortal(nonce);
    setBusy(false);
    if (r.ok && ((_a = r.data) == null ? void 0 : _a.url)) window.location.href = r.data.url;
    else setErr(r.error ?? "Portail indisponible.");
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1", children: [
    /* @__PURE__ */ jsx("button", { onClick: click, disabled: busy, className: "btn-outline text-xs", children: busy ? "Ouverture…" : "Gérer mon abonnement" }),
    err && /* @__PURE__ */ jsx("span", { className: "text-xs text-danger", children: err })
  ] });
}
export {
  EspaceCreateurPage
};
