import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { u as useSearchParams } from "./vendor-router-Izd1qo3Q.js";
import { S as Seo } from "../entry-server.js";
import { F as FORMES_SEED, O as useAuth, q as fetchDraft, Q as useToast, a as FormalitesWizard, M as submitDossier, K as startCheckout, f as chatTurn } from "./wizard-CbzVLHaR.js";
import { useNavigate } from "react-router";
import "react-dom";
import "@remix-run/router";
import "react-dom/server";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./formalites-DR4taCu5.js";
function recommendForme(_d) {
  return "micro";
}
const STEPS = {
  start: {
    id: "start",
    kind: "choice",
    question: () => "Quel est votre projet d’entreprise en une phrase ?",
    options: [
      { value: "service", label: "Prestations de services", hint: "Consulting, freelance", icon: "💼" },
      { value: "commerce", label: "Achat / vente", hint: "Boutique, e-commerce", icon: "🏪" },
      { value: "artisanat", label: "Artisanat", hint: "Métiers manuels", icon: "🔨" },
      { value: "autre", label: "Autre projet", icon: "💡" }
    ],
    apply: (a, d) => ({ ...d, projet: a }),
    next: () => "associes"
  },
  associes: {
    id: "associes",
    kind: "choice",
    question: () => "Vous lancez-vous seul·e ou à plusieurs ?",
    options: [
      { value: "seul", label: "Seul·e", icon: "🧑‍💼" },
      { value: "plusieurs", label: "À plusieurs", icon: "👥" }
    ],
    apply: (a, d) => ({ ...d, associes: a }),
    next: () => "capital"
  },
  capital: {
    id: "capital",
    kind: "choice",
    question: () => "Envisagez-vous une levée de fonds ou des investisseurs ?",
    options: [
      { value: "non", label: "Non", icon: "🚫" },
      { value: "peutetre", label: "Peut-être plus tard", icon: "🤔" },
      { value: "oui", label: "Oui, à court terme", icon: "🚀" }
    ],
    apply: (a, d) => ({ ...d, capitalLevee: a }),
    next: (_, d) => d.associes === "seul" ? "ca" : "recommend"
  },
  ca: {
    id: "ca",
    kind: "choice",
    question: () => "Chiffre d’affaires prévu la 1re année ?",
    options: [
      { value: "lt30k", label: "Moins de 30 000 €", icon: "🌱" },
      { value: "30_80", label: "30 000 – 80 000 €", icon: "📈" },
      { value: "gt80", label: "Plus de 80 000 €", icon: "💰" }
    ],
    apply: (a, d) => ({ ...d, ca: a }),
    next: () => "recommend"
  },
  recommend: {
    id: "recommend",
    kind: "recap",
    question: (d) => {
      const slug = recommendForme();
      const f = FORMES_SEED.find((x) => x.slug === slug);
      return `Forme recommandée : ${f.label}. On continue ?`;
    },
    summary: (d) => {
      const slug = recommendForme();
      return FORMES_SEED.find((x) => x.slug === slug).tagline;
    },
    next: () => "identite"
  },
  identite: {
    id: "identite",
    kind: "text",
    question: () => "Votre prénom et nom (du dirigeant) ?",
    placeholder: "Jean Dupont",
    validate: (a) => {
      const parts = a.trim().split(/\s+/);
      const errs = [];
      if (parts.length < 2) errs.push("Indiquez prénom ET nom.");
      if (a.trim().length < 4) errs.push("Trop court (≥ 4 caractères).");
      if (/\d/.test(a)) errs.push("Pas de chiffres dans le nom.");
      return errs;
    },
    apply: (a, d) => {
      const [prenom, ...rest] = a.trim().split(/\s+/);
      return { ...d, identite: { ...d.identite || {}, prenom, nom: rest.join(" ") } };
    },
    next: () => "email"
  },
  email: {
    id: "email",
    kind: "text",
    question: () => "Votre email pour recevoir le dossier ?",
    placeholder: "vous@email.fr",
    validate: (a) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(a.trim()) ? [] : ["Email invalide."],
    apply: (a, d) => ({ ...d, identite: { ...d.identite || {}, email: a.trim() } }),
    next: () => "siege"
  },
  siege: {
    id: "siege",
    kind: "text",
    question: () => "Adresse du siège social ?",
    placeholder: "12 rue de la République, 75001 Paris",
    validate: (a) => {
      const errs = [];
      if (a.trim().length < 10) errs.push("Adresse trop courte.");
      if (!/\b\d{5}\b/.test(a)) errs.push("Code postal (5 chiffres) manquant.");
      return errs;
    },
    apply: (a, d) => ({ ...d, siege: { adresse: a } }),
    next: () => "activite"
  },
  activite: {
    id: "activite",
    kind: "text",
    question: () => "Décrivez l’activité principale :",
    placeholder: "Conseil en transformation digitale auprès des PME",
    validate: (a) => a.trim().length < 15 ? ["Description trop courte (≥ 15 caractères)."] : [],
    apply: (a, d) => ({ ...d, activite: a }),
    next: () => "done"
  },
  done: {
    id: "done",
    kind: "recap",
    question: () => "Dossier prêt ! Voici votre récapitulatif.",
    summary: (d) => {
      var _a, _b, _c;
      return `Forme : ${recommendForme().toUpperCase()} · Dirigeant : ${((_a = d.identite) == null ? void 0 : _a.prenom) ?? ""} ${((_b = d.identite) == null ? void 0 : _b.nom) ?? ""} · Siège : ${((_c = d.siege) == null ? void 0 : _c.adresse) ?? ""}`;
    },
    next: () => null
  }
};
function recommend(d) {
  return recommendForme();
}
const LOCAL_KEY = "swivo.dossier.v1";
const TOTAL = Object.keys(STEPS).length;
function CreerPage() {
  var _a, _b, _c;
  const { user, nonce } = useAuth();
  const nav = useNavigate();
  const [dossier, setDossier] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [currentId, setCurrentId] = useState("start");
  const [history, setHistory] = useState([{ from: "bot", text: STEPS.start.question({}), stepId: "start" }]);
  const [sp] = useSearchParams();
  const draftId = sp.get("draft");
  const draftToken = sp.get("token");
  const [mode, setMode] = useState("expert");
  const [draftLoaded, setDraftLoaded] = useState(null);
  const [draftLoading, setDraftLoading] = useState(!!draftId);
  useEffect(() => {
    if (!draftId) return;
    (async () => {
      setDraftLoading(true);
      const r = await fetchDraft(parseInt(draftId, 10), draftToken);
      if (r) setDraftLoaded({ id: r.id, token: draftToken, payload: r.payload });
      setDraftLoading(false);
    })();
  }, [draftId, draftToken]);
  const aiMode = mode === "ia";
  const setAiMode = (v) => {
    const next = typeof v === "function" ? v(aiMode) : v;
    setMode(next ? "ia" : "guide");
  };
  const toast = useToast();
  const [aiPending, setAiPending] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [savedDossierId, setSavedDossierId] = useState(null);
  const [payState, setPayState] = useState("idle");
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(dossier));
    } catch {
    }
  }, [dossier]);
  const step = !aiMode && currentId ? STEPS[currentId] : null;
  const progress = useMemo(() => {
    const done = history.filter((m) => m.from === "user").length;
    return Math.min(100, Math.round(done / (TOTAL - 1) * 100));
  }, [history]);
  const submitScripted = (rawValue, label) => {
    if (!step) return;
    const value = rawValue;
    const errs = "validate" in step && step.validate ? step.validate(value, dossier) : [];
    if (errs.length) {
      toast.push({ kind: "error", title: `Erreur — ${step.kind === "text" ? "champ requis" : "choix"}`, message: errs.join("\n"), ttl: 5e3 });
      return;
    }
    const userText = label ?? value;
    const next = "apply" in step ? step.apply(value, dossier) : dossier;
    setDossier(next);
    const nextId = "next" in step ? step.next(value, next) : null;
    const newMsgs = [...history, { from: "user", text: userText }];
    if (nextId) {
      const ns = STEPS[nextId];
      newMsgs.push({ from: "bot", text: ns.question(next), stepId: nextId });
      if (ns.kind === "recap") newMsgs.push({ from: "bot", text: ns.summary(next), stepId: nextId });
    }
    setHistory(newMsgs);
    setCurrentId(nextId);
  };
  const sendAi = async (text) => {
    if (!text.trim() || aiPending) return;
    const userMsg = { from: "user", text };
    setHistory((h) => [...h, userMsg]);
    setAiPending(true);
    const transcript = [...history, userMsg].map((m) => ({
      role: m.from === "bot" ? "assistant" : "user",
      content: m.text
    }));
    const r = await chatTurn(transcript, dossier, nonce);
    setAiPending(false);
    if (!r.ok || !r.data) {
      setHistory((h) => [...h, { from: "bot", text: "⚠️ Assistant indisponible — vérifiez la clé Anthropic dans WP, ou repassez en mode guidé." }]);
      return;
    }
    const merged = { ...dossier, ...r.data.extract };
    setDossier(merged);
    setHistory((h) => [...h, { from: "bot", text: r.data.reply }]);
  };
  const persistAndPay = async () => {
    var _a2;
    setSubmitState("sending");
    const saved = await submitDossier({ ...dossier, forme: recommend() }, nonce);
    if (!saved) {
      setSubmitState("error");
      return;
    }
    setSavedDossierId(saved.id);
    setSubmitState("sent");
    if (!user) {
      nav("/inscription", { state: { from: "/creer-mon-entreprise" } });
      return;
    }
    setPayState("redirecting");
    const ck = await startCheckout(saved.id, nonce);
    if (!ck.ok || !((_a2 = ck.data) == null ? void 0 : _a2.url)) {
      setPayState("error");
      return;
    }
    window.location.href = ck.data.url;
  };
  const recoForme = FORMES_SEED.find((f) => f.slug === recommend());
  const flowDone = !aiMode && !step;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Créer mon entreprise — Chat assistant", description: "Répondez à quelques questions, nous générons votre dossier prêt à transmettre.", path: "/creer-mon-entreprise" }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-4 lg:py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setMode("expert"), className: `badge justify-center whitespace-nowrap py-1.5 text-[11px] sm:text-xs ${mode === "expert" ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: [
          /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "⚙ Expert" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "⚙ Mode expert (formalités complètes INPI)" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setMode("ia"), className: `badge justify-center whitespace-nowrap py-1.5 text-[11px] sm:text-xs ${mode === "ia" ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: [
          "✨ IA",
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: " libre" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setMode("guide"), className: `badge justify-center whitespace-nowrap py-1.5 text-[11px] sm:text-xs ${mode === "guide" ? "bg-primary-600 text-ink-inverse" : "bg-primary-50 text-primary-700"}`, children: "Guidé" })
      ] }),
      mode === "expert" ? draftLoading ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Chargement du brouillon…" }) : /* @__PURE__ */ jsx(FormalitesWizard, { initialDraft: draftLoaded ?? void 0 }) : /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_360px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "card overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "border-b border-surface-border bg-surface-muted px-5 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h1", { className: "font-display text-lg font-semibold text-ink", children: "Assistant de création" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: aiMode ? "Mode IA (Claude) — conversation libre." : "Mode guidé — questions ciblées." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => setAiMode((v) => !v), className: "badge bg-primary-50 text-primary-700 hover:bg-primary-100", children: aiMode ? "↩ Mode guidé" : "✨ Mode IA" }),
                /* @__PURE__ */ jsxs("span", { className: "badge-secondary", children: [
                  progress,
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all", style: { width: `${progress}%` } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 p-5 max-h-[60vh] overflow-y-auto", children: [
            history.map((m, i) => /* @__PURE__ */ jsx("div", { className: m.from === "bot" ? "flex animate-fade-in" : "flex justify-end animate-fade-in", children: /* @__PURE__ */ jsx("p", { className: `max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.from === "bot" ? "bg-surface-muted text-ink rounded-tl-sm" : "bg-primary-600 text-ink-inverse rounded-tr-sm"}`, children: m.text }) }, i)),
            aiPending && /* @__PURE__ */ jsx("div", { className: "flex", children: /* @__PURE__ */ jsx("p", { className: "rounded-2xl bg-surface-muted px-3.5 py-2 text-xs text-ink-muted", children: "assistant écrit…" }) }),
            flowDone && submitState !== "sent" && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-secondary-200 bg-secondary-50 p-4 text-sm text-secondary-800", children: [
              /* @__PURE__ */ jsx("strong", { children: "Dossier prêt." }),
              " ",
              user ? "Lancez le paiement pour transmettre." : "Créez votre compte pour valider et payer.",
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsx("button", { onClick: persistAndPay, disabled: submitState === "sending" || payState === "redirecting", className: "btn-secondary", children: submitState === "sending" ? "Enregistrement…" : payState === "redirecting" ? "Redirection Stripe…" : user ? "Payer 29,90 €" : "Créer mon compte" }),
                payState === "error" && /* @__PURE__ */ jsx("p", { className: "text-xs text-danger", children: "Stripe indisponible — réessayez." })
              ] }),
              submitState === "error" && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-danger", children: "API WordPress indisponible." })
            ] }),
            submitState === "sent" && savedDossierId && payState === "idle" && !user && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-secondary-300 bg-secondary-50 p-4 text-sm text-secondary-800", children: [
              "✅ Dossier #",
              savedDossierId,
              " enregistré. Créez un compte pour payer."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-surface-border bg-surface p-4", children: [
            (step == null ? void 0 : step.kind) === "choice" && /* @__PURE__ */ jsx("div", { className: `grid gap-3 ${step.options.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`, children: step.options.map((o, i) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => submitScripted(o.value, o.label),
                className: "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface px-4 py-5 text-center opacity-0 transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-soft motion-safe:animate-tile-in",
                style: { animationDelay: `${i * 70}ms`, animationFillMode: "forwards" },
                children: [
                  o.icon && /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "text-3xl transition-transform group-hover:scale-110", children: o.icon }),
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: o.label }),
                  o.hint && /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: o.hint })
                ]
              },
              o.value
            )) }, step.id),
            (step == null ? void 0 : step.kind) === "text" && /* @__PURE__ */ jsx(TextInput, { placeholder: step.placeholder, onSubmit: (v) => submitScripted(v) }, step.id),
            (step == null ? void 0 : step.kind) === "recap" && /* @__PURE__ */ jsx("button", { onClick: () => submitScripted("ok", "Continuer"), className: "btn-primary w-full", children: "Continuer" }),
            aiMode && /* @__PURE__ */ jsx(AiInput, { onSubmit: sendAi, disabled: aiPending })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("aside", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-display text-sm font-semibold text-ink", children: "Récapitulatif" }),
            /* @__PURE__ */ jsxs("dl", { className: "mt-3 space-y-2 text-sm", children: [
              /* @__PURE__ */ jsx(Row, { k: "Projet", v: dossier.projet }),
              /* @__PURE__ */ jsx(Row, { k: "Associés", v: dossier.associes }),
              /* @__PURE__ */ jsx(Row, { k: "Levée", v: dossier.capitalLevee }),
              /* @__PURE__ */ jsx(Row, { k: "CA prévu", v: dossier.ca }),
              /* @__PURE__ */ jsx(Row, { k: "Dirigeant", v: ((_a = dossier.identite) == null ? void 0 : _a.prenom) ? `${dossier.identite.prenom} ${dossier.identite.nom ?? ""}` : void 0 }),
              /* @__PURE__ */ jsx(Row, { k: "Email", v: (_b = dossier.identite) == null ? void 0 : _b.email }),
              /* @__PURE__ */ jsx(Row, { k: "Siège", v: (_c = dossier.siege) == null ? void 0 : _c.adresse }),
              /* @__PURE__ */ jsx(Row, { k: "Activité", v: dossier.activite })
            ] })
          ] }),
          recoForme && /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
            /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "Recommandation" }),
            /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-lg font-semibold text-ink", children: recoForme.label }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: recoForme.tagline })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "px-1 text-xs text-ink-muted", children: "🔒 Données stockées localement avant compte. RGPD." })
        ] })
      ] })
    ] })
  ] });
}
function Row({ k, v }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 border-b border-surface-border/60 pb-2 last:border-0 last:pb-0", children: [
    /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase tracking-wider text-ink-muted", children: k }),
    /* @__PURE__ */ jsx("dd", { className: `text-right text-sm ${v ? "text-ink" : "text-ink-muted/50"}`, children: v || "—" })
  ] });
}
function TextInput({ placeholder, onSubmit }) {
  const [v, setV] = useState("");
  return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    if (!v.trim()) return;
    onSubmit(v);
    setV("");
  }, className: "flex gap-2", children: [
    /* @__PURE__ */ jsx("input", { className: "input", value: v, onChange: (e) => setV(e.target.value), placeholder, autoFocus: true }),
    /* @__PURE__ */ jsx("button", { className: "btn-primary", type: "submit", children: "Valider" })
  ] });
}
function AiInput({ onSubmit, disabled }) {
  const [v, setV] = useState("");
  return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    if (!v.trim()) return;
    onSubmit(v);
    setV("");
  }, className: "flex gap-2", children: [
    /* @__PURE__ */ jsx("input", { className: "input", value: v, onChange: (e) => setV(e.target.value), placeholder: "Discutez librement avec l’assistant…", autoFocus: true, disabled }),
    /* @__PURE__ */ jsx("button", { className: "btn-primary", type: "submit", disabled, children: "Envoyer" })
  ] });
}
export {
  CreerPage
};
