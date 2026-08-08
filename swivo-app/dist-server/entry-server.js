import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, lazy, Suspense, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { L as Link, N as NavLink, u as useSearchParams, S as StaticRouter } from "./assets/vendor-router-Izd1qo3Q.js";
import { H as Helmet, a as HelmetProvider } from "./assets/vendor-helmet-A5Xb5BKa.js";
import { O as useAuth, v as listAnonDrafts, w as listDrafts, u as getAnonProfile, H as removeAnonDraft, N as useApi, I as Icon, c as api, b as PRICING_SEED, L as startSubscribe, P as POSTS_SEED, d as apiBase, Q as useToast, e as applyPasswordReset, J as requestPasswordReset, t as finalizeDraft, T as ToastProvider, A as AuthProvider } from "./assets/wizard-CbzVLHaR.js";
import { F } from "./assets/wizard-CbzVLHaR.js";
import { useNavigate, useLocation, Outlet, useParams, Navigate, Routes, Route } from "react-router";
import "react-dom";
import "@remix-run/router";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./assets/formalites-DR4taCu5.js";
function Logo({ className = "h-8 w-auto", mark = false }) {
  if (mark) {
    return /* @__PURE__ */ jsxs("svg", { viewBox: "22 30 60 72", xmlns: "http://www.w3.org/2000/svg", className, "aria-label": "Swivo", role: "img", children: [
      /* @__PURE__ */ jsx("rect", { x: "28", y: "36", width: "38", height: "16", rx: "8", fill: "#7c3aed" }),
      /* @__PURE__ */ jsx("circle", { cx: "47", cy: "62", r: "4", fill: "#ec4899" }),
      /* @__PURE__ */ jsx("rect", { x: "35", y: "76", width: "38", height: "16", rx: "8", fill: "#ec4899" }),
      /* @__PURE__ */ jsx("circle", { cx: "71", cy: "38", r: "3", fill: "#ec4899", opacity: "0.7" })
    ] });
  }
  return /* @__PURE__ */ jsxs("svg", { viewBox: "22 26 240 70", xmlns: "http://www.w3.org/2000/svg", className, "aria-label": "Swivo", role: "img", children: [
    /* @__PURE__ */ jsx("rect", { x: "28", y: "36", width: "38", height: "16", rx: "8", fill: "#7c3aed" }),
    /* @__PURE__ */ jsx("circle", { cx: "47", cy: "62", r: "4", fill: "#ec4899" }),
    /* @__PURE__ */ jsx("rect", { x: "35", y: "76", width: "38", height: "16", rx: "8", fill: "#ec4899" }),
    /* @__PURE__ */ jsx("circle", { cx: "71", cy: "38", r: "3", fill: "#ec4899", opacity: "0.7" }),
    /* @__PURE__ */ jsxs("text", { x: "84", y: "80", fontFamily: "Inter, Arial, sans-serif", fontSize: "52", fontWeight: "500", fill: "#ec4899", letterSpacing: "-2", children: [
      "sw",
      /* @__PURE__ */ jsx("tspan", { fill: "#7c3aed", children: "ivo" })
    ] })
  ] });
}
const KEY$1 = "swivo.theme";
function read() {
  var _a;
  if (typeof document === "undefined") return "light";
  const stored = typeof localStorage !== "undefined" && localStorage.getItem(KEY$1);
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined" && ((_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-color-scheme: dark)").matches)) return "dark";
  return "light";
}
function apply(t) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = t === "dark" ? "dark" : "";
}
function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const initial = read();
    setTheme(initial);
    apply(initial);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(KEY$1, next);
    } catch {
    }
  };
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: toggle,
      "aria-label": theme === "dark" ? "Activer mode clair" : "Activer mode sombre",
      className: "inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted",
      children: theme === "dark" ? /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "4" }),
        /* @__PURE__ */ jsx("path", { d: "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" })
      ] }) : /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" }) })
    }
  );
}
const DEFAULT_HREF = "/creer-mon-entreprise";
function useResumeCta(opts) {
  const { user } = useAuth();
  const [serverCount, setServerCount] = useState(0);
  const [topServer, setTopServer] = useState(null);
  const anonDrafts = typeof window !== "undefined" ? listAnonDrafts() : [];
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setServerCount(0);
      setTopServer(null);
      return;
    }
    listDrafts().then((arr) => {
      if (cancelled) return;
      const list = Array.isArray(arr) ? arr : [];
      setServerCount(list.length);
      setTopServer(list[0] ? { id: list[0].id } : null);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [user]);
  const hasAnon = anonDrafts.length > 0;
  const hasServer = serverCount > 0;
  const hasDraft = hasAnon || hasServer;
  const count = anonDrafts.length + serverCount;
  let href = DEFAULT_HREF;
  if (hasServer && topServer) {
    href = `${DEFAULT_HREF}?draft=${topServer.id}`;
  } else if (hasAnon) {
    const top = anonDrafts[0];
    href = top.token ? `${DEFAULT_HREF}?draft=${top.id}&token=${encodeURIComponent(top.token)}` : `${DEFAULT_HREF}?draft=${top.id}`;
  }
  const start = "Démarrer mon dossier";
  const resume = "Reprendre mon dossier";
  const shortS = "Démarrer";
  const shortR = "Reprendre";
  return {
    label: hasDraft ? resume : start,
    shortLabel: hasDraft ? shortR : shortS,
    href,
    hasDraft,
    count
  };
}
const NAV = [
  { to: "/creer-mon-entreprise", label: "Créer ma micro" },
  { to: "/pilotage", label: "Pilotage" },
  { to: "/urssaf", label: "URSSAF" },
  { to: "/formations", label: "Formations" },
  { to: "/tarifs", label: "Tarifs" },
  { to: "/faq", label: "FAQ" }
];
function Header() {
  var _a;
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { user, logout } = useAuth();
  const cta = useResumeCta();
  const nav = useNavigate();
  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const onLogout = async () => {
    await logout();
    nav("/", { replace: true });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    pinned && /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "h-16" }),
    /* @__PURE__ */ jsxs(
      "header",
      {
        className: `z-40 border-b transition-all duration-300 ` + (pinned ? "fixed top-0 left-0 right-0 border-surface-border bg-surface/90 backdrop-blur shadow-soft animate-slide-down supports-[backdrop-filter]:bg-surface/75" : "relative border-surface-border/50 bg-transparent"),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "container-page flex h-16 items-center justify-between", children: [
            /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center", "aria-label": "Accueil Swivo", children: /* @__PURE__ */ jsx(Logo, {}) }),
            /* @__PURE__ */ jsx("nav", { className: "hidden md:flex items-center gap-1", "aria-label": "Navigation principale", children: NAV.map((n) => /* @__PURE__ */ jsx(
              NavLink,
              {
                to: n.to,
                className: ({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "text-primary-700 bg-primary-50" : "text-ink-muted hover:text-ink hover:bg-surface-muted"}`,
                children: n.label
              },
              n.to
            )) }),
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(ThemeToggle, {}),
              user ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs(Link, { to: "/espace-createur", className: "btn-ghost ml-1 inline-flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { children: user.name || user.email }),
                  ((_a = user.gestion) == null ? void 0 : _a.active) && /* @__PURE__ */ jsxs(
                    "span",
                    {
                      title: "Formule Gestion active",
                      className: "inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-800",
                      children: [
                        /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-secondary-500 animate-pulse" }),
                        "Gestion"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: onLogout, className: "btn-outline", children: "Déconnexion" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Link, { to: "/connexion", className: "btn-ghost", children: "Connexion" }),
                /* @__PURE__ */ jsx(Link, { to: cta.href, className: "btn-primary", children: cta.shortLabel })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:hidden flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(PulseIconLink, { to: cta.href, label: cta.label, tone: "primary", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14M12 5v14" }) }) }),
              /* @__PURE__ */ jsx(PulseIconLink, { to: user ? "/espace-createur" : "/connexion", label: user ? "Mon espace" : "Se connecter", tone: "secondary", children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("circle", { cx: "12", cy: "8", r: "4" }),
                /* @__PURE__ */ jsx("path", { d: "M4 21c0-4 4-6 8-6s8 2 8 6" })
              ] }) }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  "aria-label": "Menu",
                  "aria-expanded": open,
                  className: "inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface-muted",
                  onClick: () => setOpen((v) => !v),
                  children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-6 w-6", fill: "none", stroke: "currentColor", strokeWidth: "2", children: open ? /* @__PURE__ */ jsx("path", { d: "M6 6l12 12M6 18L18 6" }) : /* @__PURE__ */ jsx("path", { d: "M4 7h16M4 12h16M4 17h16" }) })
                }
              )
            ] })
          ] }),
          open && /* @__PURE__ */ jsx("div", { className: "md:hidden border-t border-surface-border bg-surface", children: /* @__PURE__ */ jsxs("div", { className: "container-page py-3 grid gap-1", children: [
            NAV.map((n) => /* @__PURE__ */ jsx(Link, { to: n.to, onClick: () => setOpen(false), className: "rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted", children: n.label }, n.to)),
            /* @__PURE__ */ jsx("div", { className: "mt-2 flex gap-2", children: user ? /* @__PURE__ */ jsx("button", { onClick: () => {
              setOpen(false);
              void onLogout();
            }, className: "btn-outline flex-1", children: "Déconnexion" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Link, { to: "/connexion", onClick: () => setOpen(false), className: "btn-outline flex-1", children: "Connexion" }),
              /* @__PURE__ */ jsx(Link, { to: cta.href, onClick: () => setOpen(false), className: "btn-primary flex-1", children: cta.shortLabel })
            ] }) })
          ] }) })
        ]
      }
    )
  ] });
}
function PulseIconLink({ to, label, tone, children }) {
  const bg = tone === "primary" ? "bg-primary-600 text-ink-inverse" : "bg-secondary-500 text-ink-inverse";
  const ring = tone === "primary" ? "border-primary-500" : "border-secondary-500";
  const delay = tone === "primary" ? "0s" : "1s";
  return /* @__PURE__ */ jsxs(Link, { to, "aria-label": label, title: label, className: "relative inline-flex h-10 w-10 items-center justify-center rounded-full", children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: `pointer-events-none absolute inset-0 rounded-full border-2 ${ring} animate-pulse-ring`, style: { animationDelay: delay } }),
    /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: `pointer-events-none absolute inset-0 rounded-full border-2 ${ring} animate-pulse-ring`, style: { animationDelay: `calc(${delay} + 0.9s)` } }),
    /* @__PURE__ */ jsx("span", { className: `relative inline-flex h-9 w-9 items-center justify-center rounded-full shadow-soft transition hover:scale-105 ${bg}`, children })
  ] });
}
const cols = [
  { title: "Créer ma micro", links: [
    { to: "/creer-mon-entreprise", label: "Démarrer ma déclaration" },
    { to: "/tarifs", label: "Tarifs" },
    { to: "/faq", label: "Questions fréquentes" }
  ] },
  { title: "Piloter ma micro", links: [
    { to: "/espace-createur", label: "Tableau de bord" },
    { to: "/pilotage", label: "Cockpit financier" },
    { to: "/urssaf", label: "Déclaration URSSAF" },
    { to: "/outils/calculateurs", label: "Simulateurs" },
    { to: "/outils/facturation", label: "Facturation & devis" },
    { to: "/outils/modeles", label: "Modèles juridiques" },
    { to: "/gestion/pause", label: "Mettre en pause" },
    { to: "/gestion/fermeture", label: "Fermeture" }
  ] },
  { title: "Ressources", links: [
    { to: "/formations", label: "Formations & guides" },
    { to: "/outils/modeles", label: "Modèles juridiques" },
    { to: "/blog", label: "Blog micro-entreprise" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" }
  ] },
  { title: "Légal", links: [
    { to: "/mentions-legales", label: "Mentions légales" },
    { to: "/politique-de-confidentialite", label: "Confidentialité" },
    { to: "/cgv", label: "CGV" },
    { to: "/cookies", label: "Cookies" }
  ] }
];
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "mt-24 border-t border-surface-border bg-surface", children: /* @__PURE__ */ jsxs("div", { className: "container-page py-14", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-10 grid-cols-2 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsx(Logo, {}),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-sm text-sm text-ink-muted", children: "Le copilote des micro-entrepreneurs français. Création, URSSAF, facturation, pilotage — tout en un. Service privé indépendant." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-center gap-2 text-xs text-ink-muted", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex h-2 w-2 rounded-full bg-secondary-500 animate-pulse" }),
          "Connecté à l’INPI · Guichet unique"
        ] })
      ] }),
      cols.map((c) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "font-display text-sm font-semibold text-ink", children: c.title }),
        /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: c.links.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: l.to, className: "text-sm text-ink-muted hover:text-ink", children: l.label }) }, l.to)) })
      ] }, c.title))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 flex flex-col items-start justify-between gap-3 border-t border-surface-border pt-6 text-xs text-ink-muted sm:flex-row sm:items-center", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Swivo. Tous droits réservés."
      ] }),
      /* @__PURE__ */ jsx("span", { children: "RGPD · Données hébergées en France · Paiement sécurisé Stripe" })
    ] })
  ] }) });
}
const KEY = "swivo.consent.v1";
function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);
  const save = (c) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch {
    }
    setOpen(false);
  };
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { role: "dialog", "aria-labelledby": "cookie-title", className: "fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md", children: /* @__PURE__ */ jsxs("div", { className: "card p-5 shadow-elevated animate-slide-up", children: [
    /* @__PURE__ */ jsx("h2", { id: "cookie-title", className: "font-display text-base font-semibold text-ink", children: "Vos préférences cookies" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "Cookies pour le fonctionnement du site et, avec votre accord, la mesure d’audience." }),
    /* @__PURE__ */ jsxs("fieldset", { className: "mt-3 space-y-2 text-sm", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between gap-3 rounded-md bg-surface-muted px-3 py-2", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Essentiels ",
          /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "(obligatoires)" })
        ] }),
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: true, disabled: true, className: "accent-primary-600" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-muted", children: [
        /* @__PURE__ */ jsx("span", { children: "Mesure d’audience" }),
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: prefs.analytics, onChange: (e) => setPrefs((p) => ({ ...p, analytics: e.target.checked })), className: "accent-primary-600" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-muted", children: [
        /* @__PURE__ */ jsx("span", { children: "Marketing" }),
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: prefs.marketing, onChange: (e) => setPrefs((p) => ({ ...p, marketing: e.target.checked })), className: "accent-primary-600" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx("button", { className: "btn-primary flex-1", onClick: () => save({ essential: true, analytics: true, marketing: true, ts: Date.now() }), children: "Tout accepter" }),
      /* @__PURE__ */ jsx("button", { className: "btn-outline flex-1", onClick: () => save({ essential: true, analytics: false, marketing: false, ts: Date.now() }), children: "Tout refuser" }),
      /* @__PURE__ */ jsx("button", { className: "btn-ghost w-full", onClick: () => save({ essential: true, analytics: prefs.analytics, marketing: prefs.marketing, ts: Date.now() }), children: "Enregistrer mes choix" })
    ] })
  ] }) });
}
function getDayGreeting(date = /* @__PURE__ */ new Date()) {
  const hour = date.getHours();
  return hour >= 18 || hour < 6 ? "Bonsoir" : "Bonjour";
}
const SUGGESTIONS = ["Quelle forme juridique ?", "Combien coûte la création ?", "Documents SARL ?", "Délai d’immatriculation ?"];
function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const greeting = getDayGreeting();
  const [msgs, setMsgs] = useState([{ from: "bot", text: `${greeting} 👋 Quelle question puis-je résoudre ?` }]);
  const [input, setInput] = useState("");
  const send = (text) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { from: "bot", text: "Bonne question. Lancez votre dossier — notre chat de création vous guide précisément, gratuitement, en 5 minutes." }]), 500);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "fixed bottom-5 left-5 z-40", children: [
      !open && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring" }),
        /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring", style: { animationDelay: "0.9s" } })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setOpen((v) => !v),
          "aria-label": open ? "Fermer" : "Ouvrir le chat",
          className: "relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-ink-inverse shadow-elevated hover:bg-primary-700 transition",
          children: open ? /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "h-6 w-6", children: /* @__PURE__ */ jsx("path", { d: "M6 6l12 12M6 18L18 6" }) }) : /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "h-6 w-6", children: /* @__PURE__ */ jsx("path", { d: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" }) })
        }
      )
    ] }),
    open && /* @__PURE__ */ jsx("div", { role: "dialog", "aria-label": "Chat", className: "fixed bottom-24 left-5 z-40 w-[min(360px,calc(100vw-2.5rem))] animate-slide-up", children: /* @__PURE__ */ jsxs("div", { className: "card overflow-hidden shadow-elevated", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b border-surface-border bg-surface-muted px-4 py-3", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-flex h-2 w-2 rounded-full bg-secondary-500" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-ink", children: "Assistant Swivo" }),
        /* @__PURE__ */ jsx("span", { className: "ml-auto text-xs text-ink-muted", children: "en ligne" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-h-80 space-y-2 overflow-y-auto p-4", children: msgs.map((m, i) => /* @__PURE__ */ jsx("div", { className: m.from === "bot" ? "flex" : "flex justify-end", children: /* @__PURE__ */ jsx("p", { className: `max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.from === "bot" ? "bg-surface-muted text-ink rounded-tl-sm" : "bg-primary-600 text-ink-inverse rounded-tr-sm"}`, children: m.text }) }, i)) }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-surface-border p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 flex flex-wrap gap-1.5", children: SUGGESTIONS.map((s) => /* @__PURE__ */ jsx("button", { onClick: () => send(s), className: "badge bg-primary-50 text-primary-700 hover:bg-primary-100", children: s }, s)) }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          send(input);
        }, className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("input", { value: input, onChange: (e) => setInput(e.target.value), placeholder: "Posez votre question…", className: "input" }),
          /* @__PURE__ */ jsx("button", { className: "btn-primary", type: "submit", "aria-label": "Envoyer", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M5 12l14-7-7 14-2-5-5-2z" }) }) })
        ] })
      ] })
    ] }) })
  ] });
}
const DISMISS_KEY = "swivo.anon.banner.dismissed";
function AnonResumeBanner() {
  const { user, loading } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    var _a;
    setDrafts(((_a = getAnonProfile()) == null ? void 0 : _a.drafts) ?? []);
  }, [user]);
  if (loading || user || dismissed || drafts.length === 0) return null;
  const top = drafts[0];
  return /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-40 border-b border-primary-200 bg-primary-50/95 backdrop-blur", children: /* @__PURE__ */ jsxs("div", { className: "container-page flex flex-wrap items-center justify-between gap-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-primary-900", children: [
      "✨ Vous avez ",
      /* @__PURE__ */ jsxs("strong", { children: [
        drafts.length,
        " brouillon",
        drafts.length > 1 ? "s" : ""
      ] }),
      " en cours sur cet appareil",
      top.score != null && ` · ${top.score}% complété`,
      top.savedAt && ` · sauvegardé ${relative(top.savedAt)}`
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Link, { to: `/creer-mon-entreprise?draft=${top.id}&token=${encodeURIComponent(top.token)}`, className: "btn-primary text-xs", children: "Reprendre" }),
      /* @__PURE__ */ jsx(Link, { to: "/inscription", className: "btn-outline text-xs", children: "Créer mon compte" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            var _a;
            removeAnonDraft(top.id);
            setDrafts(((_a = getAnonProfile()) == null ? void 0 : _a.drafts) ?? []);
          },
          className: "text-xs text-rose-600 hover:underline",
          "aria-label": "Supprimer le brouillon",
          children: "Supprimer"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            try {
              sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
            }
            setDismissed(true);
          },
          className: "text-ink-muted hover:text-ink",
          "aria-label": "Masquer le rappel",
          children: "✕"
        }
      )
    ] })
  ] }) });
}
function relative(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  if (diff < 6e4) return "à l’instant";
  const mins = Math.round(diff / 6e4);
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}
function BackToTop({ threshold = 400 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  function up() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return /* @__PURE__ */ jsxs("div", { className: `fixed bottom-5 right-5 z-40 transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`, children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring" }),
    /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring", style: { animationDelay: "0.9s" } }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: up,
        "aria-label": "Retour en haut",
        className: "relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-ink-inverse shadow-elevated transition hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M12 19V5M5 12l7-7 7 7" }) })
      }
    )
  ] });
}
function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsx(AnonResumeBanner, {}),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { id: "main", className: "flex-1", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(Footer, {}),
    /* @__PURE__ */ jsx(CookieBanner, {}),
    /* @__PURE__ */ jsx(ChatbotWidget, {}),
    /* @__PURE__ */ jsx(BackToTop, {})
  ] });
}
const SITE_URL = "https://swivo.fr";
const SITE_NAME = "Swivo";
function Seo({ title, description, path = "", jsonLd, noindex }) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const blocks = jsonLd ? Array.isArray(jsonLd) ? jsonLd : [jsonLd] : [];
  return /* @__PURE__ */ jsxs(Helmet, { children: [
    /* @__PURE__ */ jsx("html", { lang: "fr" }),
    /* @__PURE__ */ jsx("title", { children: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    /* @__PURE__ */ jsx("link", { rel: "canonical", href: url }),
    noindex && /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex,nofollow" }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: SITE_NAME }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: url }),
    /* @__PURE__ */ jsx("meta", { property: "og:locale", content: "fr_FR" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    blocks.map((b, i) => /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(b) }, i))
  ] });
}
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: "Création et gestion d'entreprise en France, 100% en ligne.",
  areaServed: "FR"
};
function Reveal({ children, as: Tag = "div", direction = "up", delay = 0, once = true, className = "", style, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(typeof window === "undefined");
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [once]);
  const dirClass = direction === "left" ? "reveal-left" : direction === "right" ? "reveal-right" : direction === "scale" ? "reveal-scale" : "";
  const Component = Tag;
  return /* @__PURE__ */ jsx(
    Component,
    {
      ref,
      className: `reveal ${dirClass} ${visible ? "is-visible" : ""} ${className}`,
      style: { transitionDelay: `${delay}ms`, ...style },
      ...rest,
      children
    }
  );
}
const grads = /* @__PURE__ */ jsxs("defs", { children: [
  /* @__PURE__ */ jsxs("linearGradient", { id: "g-primary", x1: "0", y1: "0", x2: "1", y2: "1", children: [
    /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "rgb(var(--color-primary-500))" }),
    /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "rgb(var(--color-primary-700))" })
  ] }),
  /* @__PURE__ */ jsxs("linearGradient", { id: "g-accent", x1: "0", y1: "0", x2: "1", y2: "1", children: [
    /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "rgb(var(--color-accent-400))" }),
    /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "rgb(var(--color-accent-600))" })
  ] }),
  /* @__PURE__ */ jsxs("linearGradient", { id: "g-cyan", x1: "0", y1: "0", x2: "1", y2: "1", children: [
    /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "rgb(var(--color-secondary-200))" }),
    /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "rgb(var(--color-secondary-500))" })
  ] }),
  /* @__PURE__ */ jsxs("linearGradient", { id: "g-soft", x1: "0", y1: "0", x2: "0", y2: "1", children: [
    /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "rgb(var(--color-primary-50))" }),
    /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "rgb(var(--color-secondary-100))" })
  ] })
] });
function IllustrationHero(props) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 520 420", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: [
    grads,
    /* @__PURE__ */ jsx("ellipse", { cx: "290", cy: "380", rx: "220", ry: "20", fill: "rgb(var(--color-primary-200) / 0.5)" }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(150 40)", children: [
      /* @__PURE__ */ jsx("path", { d: "M0 30 Q0 0 30 0 L300 0 Q330 0 330 30 L330 220 Q330 250 300 250 L30 250 Q0 250 0 220 Z", fill: "url(#g-primary)" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "20", width: "290", height: "34", rx: "10", fill: "white", opacity: "0.18" }),
      /* @__PURE__ */ jsx("circle", { cx: "36", cy: "37", r: "5", fill: "rgb(var(--color-accent-400))" }),
      /* @__PURE__ */ jsx("circle", { cx: "52", cy: "37", r: "5", fill: "rgb(var(--color-secondary-300))" }),
      /* @__PURE__ */ jsx("circle", { cx: "68", cy: "37", r: "5", fill: "white", opacity: "0.6" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "74", width: "170", height: "14", rx: "7", fill: "white", opacity: "0.9" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "98", width: "220", height: "10", rx: "5", fill: "white", opacity: "0.55" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "118", width: "200", height: "10", rx: "5", fill: "white", opacity: "0.55" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "138", width: "160", height: "10", rx: "5", fill: "white", opacity: "0.55" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "174", width: "120", height: "32", rx: "16", fill: "url(#g-accent)" }),
      /* @__PURE__ */ jsx("text", { x: "80", y: "195", textAnchor: "middle", fontSize: "13", fontWeight: "700", fill: "white", fontFamily: "Inter, sans-serif", children: "Démarrer" }),
      /* @__PURE__ */ jsxs("g", { transform: "translate(200 168)", children: [
        /* @__PURE__ */ jsx("rect", { width: "110", height: "60", rx: "10", fill: "white", opacity: "0.15" }),
        /* @__PURE__ */ jsx("polyline", { points: "10,48 28,32 50,38 72,18 96,28", fill: "none", stroke: "rgb(var(--color-secondary-200))", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }),
        [10, 28, 50, 72, 96].map((x, i) => /* @__PURE__ */ jsx("circle", { cx: x, cy: [48, 32, 38, 18, 28][i], r: "2.6", fill: "rgb(var(--color-secondary-200))" }, i))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(40 100)", className: "animate-float", children: [
      /* @__PURE__ */ jsx("rect", { width: "120", height: "78", rx: "14", fill: "white", stroke: "rgb(var(--color-surface-border))" }),
      /* @__PURE__ */ jsx("rect", { x: "14", y: "14", width: "50", height: "50", rx: "10", fill: "url(#g-cyan)" }),
      /* @__PURE__ */ jsx("path", { d: "M22 38 l8 8 l16 -18", stroke: "white", strokeWidth: "3.2", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
      /* @__PURE__ */ jsx("rect", { x: "74", y: "18", width: "36", height: "7", rx: "3.5", fill: "rgb(var(--color-ink) / 0.7)" }),
      /* @__PURE__ */ jsx("rect", { x: "74", y: "32", width: "30", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.4)" }),
      /* @__PURE__ */ jsx("rect", { x: "74", y: "44", width: "24", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.4)" })
    ] }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(370 280)", className: "animate-float-lg", children: [
      /* @__PURE__ */ jsx("rect", { width: "140", height: "80", rx: "16", fill: "white", stroke: "rgb(var(--color-surface-border))" }),
      /* @__PURE__ */ jsx("circle", { cx: "32", cy: "40", r: "22", fill: "url(#g-accent)" }),
      /* @__PURE__ */ jsx("path", { d: "M32 28 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z", fill: "white" }),
      /* @__PURE__ */ jsx("rect", { x: "64", y: "22", width: "60", height: "8", rx: "4", fill: "rgb(var(--color-ink) / 0.75)" }),
      /* @__PURE__ */ jsx("rect", { x: "64", y: "38", width: "50", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.4)" }),
      /* @__PURE__ */ jsx("rect", { x: "64", y: "50", width: "40", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.4)" })
    ] }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(60 230)", children: [
      /* @__PURE__ */ jsx("circle", { cx: "40", cy: "32", r: "18", fill: "rgb(var(--color-accent-400))" }),
      /* @__PURE__ */ jsx("path", { d: "M14 100 q0 -40 26 -42 q26 2 26 42 z", fill: "url(#g-primary)" }),
      /* @__PURE__ */ jsx("rect", { x: "60", y: "52", width: "14", height: "42", rx: "7", fill: "url(#g-primary)", transform: "rotate(-18 67 73)" }),
      /* @__PURE__ */ jsxs("g", { transform: "translate(80 36) rotate(-12)", children: [
        /* @__PURE__ */ jsx("rect", { width: "46", height: "60", rx: "6", fill: "white", stroke: "rgb(var(--color-surface-border))" }),
        /* @__PURE__ */ jsx("rect", { x: "6", y: "8", width: "34", height: "5", rx: "2.5", fill: "rgb(var(--color-primary-600))" }),
        /* @__PURE__ */ jsx("rect", { x: "6", y: "18", width: "28", height: "3.5", rx: "1.7", fill: "rgb(var(--color-ink-muted) / 0.4)" }),
        /* @__PURE__ */ jsx("rect", { x: "6", y: "26", width: "32", height: "3.5", rx: "1.7", fill: "rgb(var(--color-ink-muted) / 0.4)" }),
        /* @__PURE__ */ jsx("rect", { x: "6", y: "34", width: "20", height: "3.5", rx: "1.7", fill: "rgb(var(--color-ink-muted) / 0.4)" }),
        /* @__PURE__ */ jsx("rect", { x: "6", y: "46", width: "34", height: "9", rx: "4.5", fill: "rgb(var(--color-accent-500))" })
      ] }),
      /* @__PURE__ */ jsx("rect", { x: "34", y: "100", width: "12", height: "22", rx: "3", fill: "rgb(var(--color-primary-800))" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "118", width: "40", height: "6", rx: "3", fill: "rgb(var(--color-primary-900))" })
    ] }),
    /* @__PURE__ */ jsx("circle", { cx: "470", cy: "80", r: "10", fill: "rgb(var(--color-accent-400))", opacity: "0.7" }),
    /* @__PURE__ */ jsx("circle", { cx: "500", cy: "150", r: "6", fill: "rgb(var(--color-secondary-400))" }),
    /* @__PURE__ */ jsx("rect", { x: "20", y: "60", width: "14", height: "14", rx: "3", fill: "rgb(var(--color-accent-300))", transform: "rotate(15 27 67)" })
  ] });
}
function IllustrationChat(props) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 360 240", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: [
    grads,
    /* @__PURE__ */ jsx("rect", { width: "360", height: "240", rx: "20", fill: "url(#g-soft)" }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(100 24)", children: [
      /* @__PURE__ */ jsx("rect", { width: "160", height: "200", rx: "22", fill: "white", stroke: "rgb(var(--color-surface-border))" }),
      /* @__PURE__ */ jsx("rect", { x: "10", y: "10", width: "140", height: "22", rx: "11", fill: "url(#g-primary)" }),
      /* @__PURE__ */ jsx("circle", { cx: "20", cy: "21", r: "5", fill: "white", opacity: "0.5" }),
      /* @__PURE__ */ jsx("rect", { x: "32", y: "17", width: "80", height: "8", rx: "4", fill: "white", opacity: "0.8" }),
      /* @__PURE__ */ jsx("rect", { x: "14", y: "46", width: "90", height: "22", rx: "11", fill: "rgb(var(--color-primary-50))" }),
      /* @__PURE__ */ jsx("rect", { x: "22", y: "52", width: "70", height: "4", rx: "2", fill: "rgb(var(--color-primary-700))" }),
      /* @__PURE__ */ jsx("rect", { x: "22", y: "60", width: "50", height: "4", rx: "2", fill: "rgb(var(--color-primary-500))", opacity: "0.7" }),
      /* @__PURE__ */ jsx("rect", { x: "56", y: "74", width: "90", height: "22", rx: "11", fill: "url(#g-primary)" }),
      /* @__PURE__ */ jsx("rect", { x: "62", y: "80", width: "60", height: "4", rx: "2", fill: "white" }),
      /* @__PURE__ */ jsx("rect", { x: "62", y: "88", width: "40", height: "4", rx: "2", fill: "white", opacity: "0.6" }),
      /* @__PURE__ */ jsx("rect", { x: "14", y: "104", width: "120", height: "44", rx: "14", fill: "rgb(var(--color-secondary-50))" }),
      /* @__PURE__ */ jsx("rect", { x: "22", y: "112", width: "100", height: "5", rx: "2.5", fill: "rgb(var(--color-secondary-700))" }),
      /* @__PURE__ */ jsx("rect", { x: "22", y: "124", width: "80", height: "4", rx: "2", fill: "rgb(var(--color-secondary-500))", opacity: "0.7" }),
      /* @__PURE__ */ jsx("rect", { x: "22", y: "134", width: "60", height: "4", rx: "2", fill: "rgb(var(--color-secondary-500))", opacity: "0.5" }),
      /* @__PURE__ */ jsx("rect", { x: "22", y: "170", width: "116", height: "20", rx: "10", fill: "url(#g-accent)" }),
      /* @__PURE__ */ jsx("text", { x: "80", y: "184", textAnchor: "middle", fontSize: "11", fontWeight: "700", fill: "white", fontFamily: "Inter, sans-serif", children: "Démarrer" })
    ] }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(270 38)", className: "animate-float", children: [
      /* @__PURE__ */ jsx("circle", { r: "22", fill: "url(#g-accent)" }),
      /* @__PURE__ */ jsx("path", { d: "M0 -10 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z", fill: "white" })
    ] }),
    /* @__PURE__ */ jsx("circle", { cx: "60", cy: "50", r: "14", fill: "rgb(var(--color-secondary-300))", opacity: "0.7", className: "animate-float-lg" }),
    /* @__PURE__ */ jsx("circle", { cx: "40", cy: "190", r: "10", fill: "rgb(var(--color-accent-400))", opacity: "0.6" })
  ] });
}
function IllustrationDossier(props) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 360 240", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: [
    grads,
    /* @__PURE__ */ jsx("rect", { width: "360", height: "240", rx: "20", fill: "url(#g-soft)" }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(60 36)", children: [
      /* @__PURE__ */ jsx("rect", { width: "180", height: "170", rx: "14", fill: "white", stroke: "rgb(var(--color-surface-border))" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "22", width: "130", height: "10", rx: "5", fill: "url(#g-primary)" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "42", width: "100", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.3)" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "56", width: "120", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.3)" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "78", width: "70", height: "26", rx: "8", fill: "rgb(var(--color-secondary-100))" }),
      /* @__PURE__ */ jsx("text", { x: "55", y: "96", textAnchor: "middle", fontSize: "11", fill: "rgb(var(--color-secondary-700))", fontFamily: "Inter, sans-serif", fontWeight: "700", children: "SASU" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "118", width: "140", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.3)" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "132", width: "110", height: "6", rx: "3", fill: "rgb(var(--color-ink-muted) / 0.3)" })
    ] }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(240 72)", className: "animate-float-lg", children: [
      /* @__PURE__ */ jsx("circle", { r: "48", fill: "url(#g-accent)" }),
      /* @__PURE__ */ jsx("path", { d: "M-20 0 l12 12 l28 -28", stroke: "white", strokeWidth: "5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" })
    ] }),
    /* @__PURE__ */ jsx("rect", { x: "240", y: "170", width: "60", height: "18", rx: "9", fill: "rgb(var(--color-secondary-300))", opacity: "0.7" })
  ] });
}
function IllustrationGrowth(props) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 360 240", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: [
    grads,
    /* @__PURE__ */ jsx("rect", { width: "360", height: "240", rx: "20", fill: "url(#g-soft)" }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(40 40)", children: [
      /* @__PURE__ */ jsx("rect", { width: "280", height: "160", rx: "14", fill: "white", stroke: "rgb(var(--color-surface-border))" }),
      /* @__PURE__ */ jsx("polyline", { points: "20,130 60,100 100,110 140,60 180,80 220,30 260,40", fill: "none", stroke: "url(#g-primary)", strokeWidth: "3.5", strokeLinecap: "round", strokeLinejoin: "round" }),
      /* @__PURE__ */ jsx("polyline", { points: "20,130 60,100 100,110 140,60 180,80 220,30 260,40 260,140 20,140", fill: "rgb(var(--color-primary-500) / 0.12)", stroke: "none" }),
      [20, 60, 100, 140, 180, 220, 260].map((x, i) => /* @__PURE__ */ jsx("circle", { cx: x, cy: [130, 100, 110, 60, 80, 30, 40][i], r: "5", fill: "white", stroke: "rgb(var(--color-primary-600))", strokeWidth: "2.5" }, i)),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "140", width: "240", height: "2", fill: "rgb(var(--color-ink-muted) / 0.3)" })
    ] }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(290 30)", className: "animate-float", children: [
      /* @__PURE__ */ jsx("circle", { r: "20", fill: "url(#g-accent)" }),
      /* @__PURE__ */ jsx("path", { d: "M-8 4 l5 5 l11 -12", stroke: "white", strokeWidth: "3", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" })
    ] })
  ] });
}
function IllustrationShield(props) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 360 240", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: [
    grads,
    /* @__PURE__ */ jsx("rect", { width: "360", height: "240", rx: "20", fill: "url(#g-soft)" }),
    /* @__PURE__ */ jsxs("g", { transform: "translate(132 28)", children: [
      /* @__PURE__ */ jsx("path", { d: "M48 0 L96 18 V70 C96 110 76 140 48 158 C20 140 0 110 0 70 V18 Z", fill: "url(#g-primary)" }),
      /* @__PURE__ */ jsx("path", { d: "M48 12 L86 26 V72 C86 104 70 130 48 144 C26 130 10 104 10 72 V26 Z", fill: "rgb(var(--color-primary-700))" }),
      /* @__PURE__ */ jsx("path", { d: "M28 80 L44 96 L70 64", stroke: "white", strokeWidth: "6", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" })
    ] }),
    /* @__PURE__ */ jsx("circle", { cx: "70", cy: "60", r: "14", fill: "rgb(var(--color-accent-400))", opacity: "0.8", className: "animate-float" }),
    /* @__PURE__ */ jsx("circle", { cx: "290", cy: "180", r: "20", fill: "rgb(var(--color-secondary-300))", opacity: "0.7", className: "animate-float-lg" })
  ] });
}
const TRUST = [
  { k: "99%", v: "dossiers acceptés" },
  { k: "5 min", v: "pour démarrer" },
  { k: "24h", v: "transmis INPI" },
  { k: "0 €", v: "frais légaux" }
];
const STEPS = [
  { n: "01", title: "Répondez au chat", body: "Activité, adresse, URSSAF — l’assistant pose les bonnes questions, sans jargon.", Icon: Icon.Chat, bg: "from-primary-50 to-primary-100" },
  { n: "02", title: "Validez & payez", body: "29,90 € tout compris pour la déclaration accompagnée et le dossier conforme.", Icon: Icon.Lock, bg: "from-secondary-50 to-secondary-100" },
  { n: "03", title: "On dépose à l’INPI", body: "Transmission au Guichet unique sous 24 h, SIRET sous 8 à 15 jours.", Icon: Icon.Stamp, bg: "from-primary-50 to-secondary-50" }
];
const FEATURES = [
  { Icon: Icon.Bolt, title: "Déclaration en 5 min", body: "Chat adaptatif : NAF/APE, régime fiscal, ACRE — tout est pré-rempli pour vous." },
  { Icon: Icon.Shield, title: "Zéro rejet INPI", body: "Validation juriste sur les pièces sensibles avant transmission au Guichet unique." },
  { Icon: Icon.Calc, title: "Simulateur URSSAF intégré", body: "Cotisations calculées en temps réel selon votre CA et catégorie d’activité." },
  { Icon: Icon.Clock, title: "Rappels d’échéances", body: "Déclarations URSSAF, seuils TVA, plafonds CA — nous vous prévenons à l’avance." },
  { Icon: Icon.Doc, title: "Factures & devis illimités", body: "Génération PDF aux normes, numérotation auto, mentions légales conformes." },
  { Icon: Icon.Globe, title: "Données en France · RGPD", body: "Hébergement souverain, chiffrement TLS, droit d’accès garanti à tout moment." }
];
const COMPARE = [
  { k: "Création micro-entreprise", them: "Formulaires INPI complexes", us: "Chat IA — 5 minutes" },
  { k: "Compte bancaire imposé", them: "Oui — compte pro maison obligatoire", us: "Non — vous gardez votre banque" },
  { k: "Frais légaux", them: "0 €", us: "0 €" },
  { k: "Service accompagnement", them: "89 — 159 €", us: "29,90 € tout compris" },
  { k: "Simulateur URSSAF", them: "À part / payant", us: "Inclus, temps réel" },
  { k: "Rappels déclarations", them: "Aucun", us: "Email + dashboard" },
  { k: "Facturation conforme", them: "Outil tiers", us: "Inclus dans Gestion" }
];
const REVIEWS = [
  { name: "Camille Lefèvre", activite: "Coach yoga", city: "Lyon", rating: 5, date: "avr. 2026", avatar: "https://i.pravatar.cc/600?img=47", text: "J’ai déclaré ma micro en 6 minutes le dimanche soir. SIRET reçu 11 jours plus tard, aucun aller-retour avec l’INPI." },
  { name: "Mehdi Bensalah", activite: "Développeur freelance", city: "Paris", rating: 5, date: "mar. 2026", avatar: "https://i.pravatar.cc/600?img=12", text: "Le simulateur URSSAF intégré, c’est bluffant — je sais exactement ce que je dois mettre de côté chaque mois." },
  { name: "Sophie Marchand", activite: "Naturopathe", city: "Bordeaux", rating: 5, date: "mar. 2026", avatar: "https://i.pravatar.cc/600?img=5", text: "L’assistant m’a expliqué BIC vs BNC sans jargon. Et le module facturation me fait gagner 3h par semaine." },
  { name: "Thomas Rossi", activite: "Photographe événement", city: "Marseille", rating: 5, date: "fév. 2026", avatar: "https://i.pravatar.cc/600?img=33", text: "Rappel d’échéances par email, déclaration URSSAF en 2 clics, factures conformes. Tout ce qu’il me fallait." },
  { name: "Élise Bonnard", activite: "Graphiste UX", city: "Nantes", rating: 5, date: "fév. 2026", avatar: "https://i.pravatar.cc/600?img=44", text: "L’ACRE m’a été proposée automatiquement — je ne savais même pas que j’étais éligible. 1 100 € économisés." },
  { name: "Karim Diallo", activite: "Plombier", city: "Lille", rating: 4, date: "jan. 2026", avatar: "https://i.pravatar.cc/600?img=15", text: "Très clair, très rapide. Le guide artisan m’a aidé à choisir mon code NAF du premier coup." },
  { name: "Léa Vasseur", activite: "Traductrice EN→FR", city: "Toulouse", rating: 5, date: "jan. 2026", avatar: "https://i.pravatar.cc/600?img=49", text: "Création gratuite + accompagnement à 29,90 €, c’est honnête. Et le dashboard est vraiment lisible." },
  { name: "Antoine Mercier", activite: "Consultant SEO", city: "Rennes", rating: 5, date: "déc. 2025", avatar: "https://i.pravatar.cc/600?img=11", text: "J’avais testé 3 plateformes. Swivo gagne sur la simplicité du parcours. Et le chat aide vraiment." },
  { name: "Inès Caron", activite: "Esthéticienne", city: "Strasbourg", rating: 5, date: "déc. 2025", avatar: "https://i.pravatar.cc/600?img=20", text: "Statut artisan, qualification CAP — tout a été vérifié pour moi. Aucun stress." },
  { name: "Julien Garnier", activite: "Coach sportif", city: "Montpellier", rating: 5, date: "nov. 2025", avatar: "https://i.pravatar.cc/600?img=53", text: "L’alerte de seuil TVA m’a sauvé : 2 mois d’avance pour passer en réel. Indispensable." }
];
const FOUNDERS = [
  { name: "Amélie Dufour", age: 31, activite: "Designer UX freelance", city: "Paris", job: "Designer UX freelance", why: "Quittait son CDI en agence pour facturer en direct ses clients européens. La micro permet de tester sans risque, charges proportionnelles au CA.", photo: "https://i.pravatar.cc/800?img=32" },
  { name: "Yanis Benoît", age: 27, activite: "Coach sportif à domicile", city: "Lyon", job: "Coach sportif à domicile", why: "Reconversion après 4 ans en banque. Micro choisie pour la fiscalité ultra-simple et le démarrage en 5 minutes.", photo: "https://i.pravatar.cc/800?img=68" },
  { name: "Clémentine Roy", age: 38, activite: "Consultante RSE", city: "Bordeaux", job: "Consultante RSE indépendante", why: "Après 12 ans en grand groupe, voulait accompagner des PME. Micro idéale tant que le CA reste sous 77 700 €.", photo: "https://i.pravatar.cc/800?img=26" },
  { name: "Marc Lemoine", age: 44, activite: "Artisan menuisier", city: "Lille", job: "Artisan menuisier", why: "Reprise du métier familial en solo. Micro avec qualification professionnelle CAP, immatriculation CMA en parallèle.", photo: "https://i.pravatar.cc/800?img=51" },
  { name: "Salma Idrissi", age: 29, activite: "Traductrice EN-AR-FR", city: "Toulouse", job: "Traductrice freelance", why: "Diplôme INALCO en poche, voulait travailler depuis chez elle. Micro BNC, franchise TVA, ACRE 1ère année.", photo: "https://i.pravatar.cc/800?img=45" }
];
function HomePage() {
  var _a;
  const { data: faq } = useApi((s) => api.fetchFaq(s));
  const { user } = useAuth();
  const cta = useResumeCta();
  const gestionActive = !!((_a = user == null ? void 0 : user.gestion) == null ? void 0 : _a.active);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: "Créer sa micro-entreprise en 5 minutes — Swivo",
        description: "Déclaration micro-entreprise accompagnée à 29,90 €. Simulateur URSSAF, facturation, rappels d’échéances. Le copilote des micro-entrepreneurs français.",
        path: "/",
        jsonLd: [
          orgJsonLd,
          faq && faq.length ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.slice(0, 4).map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a }
            }))
          } : {}
        ]
      }
    ),
    gestionActive ? /* @__PURE__ */ jsx("section", { className: "container-page pt-10 pb-8 lg:pt-12", children: /* @__PURE__ */ jsx(GestionActiveBanner, { user }) }) : /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden pb-4 lg:pb-24", children: [
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute inset-0 -z-30 bg-gradient-to-br from-primary-50 via-surface to-secondary-50 bg-[length:200%_200%] animate-bg-pan" }),
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute inset-0 -z-20 bg-dot-pattern opacity-50" }),
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(55%_45%_at_20%_10%,rgba(124,58,237,0.10),transparent),radial-gradient(45%_35%_at_85%_20%,rgba(236,72,153,0.08),transparent)]" }),
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-300/30 blur-3xl animate-float-lg" }),
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute top-40 -left-24 h-80 w-80 rounded-full bg-secondary-200/40 blur-3xl animate-float" }),
      /* @__PURE__ */ jsx("svg", { "aria-hidden": "true", className: "absolute -bottom-1 left-0 right-0 -z-10 w-full", viewBox: "0 0 1440 120", preserveAspectRatio: "none", children: /* @__PURE__ */ jsx("path", { d: "M0 60 Q 360 0 720 60 T 1440 60 L 1440 120 L 0 120 Z", fill: "rgb(var(--color-surface-muted))" }) }),
      /* @__PURE__ */ jsx("div", { className: "container-page pt-4 lg:pb-32", children: /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-12 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Reveal, { direction: "up", delay: 0, children: /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
            /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" }),
            "Connecté au Guichet unique INPI"
          ] }) }),
          /* @__PURE__ */ jsx(Reveal, { direction: "up", delay: 120, children: /* @__PURE__ */ jsxs("h1", { className: "mt-5 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl", children: [
            "Créez votre ",
            /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-[length:200%_100%] bg-clip-text text-transparent animate-bg-pan", children: "micro-entreprise" }),
            " en 5 minutes."
          ] }) }),
          /* @__PURE__ */ jsx(Reveal, { direction: "up", delay: 240, children: /* @__PURE__ */ jsxs("p", { className: "mt-6 max-w-xl text-sm lg:text-xl text-ink-muted", children: [
            "Déclaration accompagnée, simulateur URSSAF, facturation, rappels d’échéances.",
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: " Tout pour piloter votre micro, sans paperasse." })
          ] }) }),
          /* @__PURE__ */ jsx(Reveal, { direction: "up", delay: 360, children: /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: cta.href,
                className: "btn-primary w-full justify-center px-7 py-4 text-base font-bold shadow-elevated hover:scale-[1.02] sm:w-auto",
                children: [
                  cta.label,
                  " ",
                  /* @__PURE__ */ jsx(Icon.Arrow, { className: "h-5 w-5" })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/tarifs",
                className: "inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-600 bg-surface px-7 py-4 text-base font-bold text-primary-700 shadow-soft transition hover:bg-primary-50 hover:shadow-elevated sm:w-auto",
                children: "Voir les tarifs"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("dl", { className: "mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4", children: TRUST.map((t, i) => /* @__PURE__ */ jsx(Reveal, { direction: "up", delay: 500 + i * 90, children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-surface-border/80 bg-surface/70 px-3 py-3 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft", children: [
            /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase tracking-wider text-ink-muted", children: t.v }),
            /* @__PURE__ */ jsx("dd", { className: "mt-0.5 font-display text-2xl font-bold text-primary-700", children: t.k })
          ] }) }, t.v)) })
        ] }),
        /* @__PURE__ */ jsx(Reveal, { direction: "scale", delay: 200, children: /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(IllustrationHero, { className: "w-full h-auto" }) }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "container-page lg:py-24", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-secondary", children: [
          /* @__PURE__ */ jsx(Icon.Spark, { className: "h-3.5 w-3.5" }),
          " Parcours"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl", children: "Trois étapes, zéro paperasse" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "Pensé pour aller vite, sans sacrifier la conformité." })
      ] }) }),
      /* @__PURE__ */ jsx("ol", { className: "mt-14 grid gap-6 md:grid-cols-3", children: STEPS.map((s, i) => /* @__PURE__ */ jsx(Reveal, { as: "li", delay: i * 120, children: /* @__PURE__ */ jsxs("div", { className: "card relative overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-elevated", children: [
        /* @__PURE__ */ jsx("div", { className: `absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${s.bg} opacity-70 blur-2xl` }),
        /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-ink-inverse shadow-soft", children: /* @__PURE__ */ jsx(s.Icon, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 font-display text-sm font-bold tracking-wider text-primary-700", children: s.n }),
        /* @__PURE__ */ jsx("h3", { className: "mt-1 font-display text-xl font-semibold text-ink", children: s.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-ink-muted", children: s.body })
      ] }) }, s.n)) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "bg-surface border-y border-surface-border", children: /* @__PURE__ */ jsxs("div", { className: "container-page py-4 lg:py-24 space-y-5 lg:space-y-24", children: [
      /* @__PURE__ */ jsx(
        FeatureRow,
        {
          badge: "Chat IA",
          title: "Une conversation, pas un formulaire.",
          body: "L'assistant pose une question à la fois, comprend votre projet, et déduit la forme juridique adaptée. Vous gagnez du temps, et vous évitez les pièges classiques.",
          cta: { to: "/creer-mon-entreprise", label: "Tester le chat" },
          illustration: /* @__PURE__ */ jsx(IllustrationChat, { className: "h-full w-full" })
        }
      ),
      /* @__PURE__ */ jsx(
        FeatureRow,
        {
          reverse: true,
          badge: "Garantie zéro rejet",
          title: "Contrôle juridique avant transmission.",
          body: "Nos juristes valident votre dossier avant dépôt au Guichet unique. Si l'INPI demande une correction, nous la réalisons gratuitement.",
          cta: { to: "/tarifs", label: "Voir les tarifs" },
          illustration: /* @__PURE__ */ jsx(IllustrationShield, { className: "h-full w-full" })
        }
      ),
      /* @__PURE__ */ jsx(
        FeatureRow,
        {
          badge: "Espace gestion",
          title: "Pilotez après la création.",
          body: "Tableau de bord, calculateurs URSSAF/TVA, facturation, modèles juridiques, mise en pause, fermeture. Tout au même endroit.",
          cta: { to: "/espace-createur", label: "Voir le tableau de bord" },
          illustration: /* @__PURE__ */ jsx(IllustrationGrowth, { className: "h-full w-full" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-4 lg:py-24", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl lg:text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Pourquoi nous choisir" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "Six raisons concrètes de démarrer avec Swivo." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: FEATURES.map((f, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 80, children: /* @__PURE__ */ jsxs("div", { className: "card group h-full p-6 transition hover:-translate-y-1 hover:shadow-elevated", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-ink-inverse transition", children: /* @__PURE__ */ jsx(f.Icon, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold text-ink", children: f.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-ink-muted", children: f.body })
      ] }) }, f.title)) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "bg-surface border-y border-surface-border", children: /* @__PURE__ */ jsxs("div", { className: "container-page py-4 lg:py-24", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
          /* @__PURE__ */ jsx(Icon.Briefcase, { className: "h-3.5 w-3.5" }),
          " Pour qui ?"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl", children: "La micro, faite pour qui ?" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-ink-muted", children: "Freelances, artisans, consultants, e-commerçants, créatifs — sous 188 700 € (vente) ou 77 700 € (service) annuel." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        { title: "Freelances tech", body: "Dev, designer, growth, data — BNC libéral non réglementé.", icon: "💻" },
        { title: "Artisans qualifiés", body: "Bâtiment, esthétique, coiffure, alimentation — CAP requis.", icon: "🔨" },
        { title: "Commerçants en ligne", body: "E-commerce, dropshipping, ventes B2C — régime BIC.", icon: "🛍️" },
        { title: "Consultants & coachs", body: "Formation, RH, sport, bien-être — BNC ou BIC selon prestation.", icon: "🎯" }
      ].map((p, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 80, direction: "up", children: /* @__PURE__ */ jsxs("div", { className: "card h-full p-6", children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xl lg:text-3xl", children: p.icon }),
        /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display text-lg font-bold text-ink", children: p.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: p.body })
      ] }) }, p.title)) })
    ] }) }),
    !gestionActive && /* @__PURE__ */ jsx("section", { className: "container-page py-4 lg:py-24", children: /* @__PURE__ */ jsx(GestionUpsell, {}) }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-4 lg:py-24", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl lg:text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Pourquoi Swivo ?" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "Comparaison honnête, chiffres réels." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 inline-flex items-center gap-2 rounded-full border border-secondary-300 bg-secondary-50 px-4 py-1.5 text-sm font-medium text-secondary-800", children: "🏦 Aucun compte bancaire imposé — gardez votre banque" })
      ] }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 120, children: /* @__PURE__ */ jsx("div", { className: "mt-12 overflow-x-auto rounded-3xl border border-surface-border bg-surface shadow-soft", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[520px]", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-surface-muted text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-sm font-medium text-ink-muted", children: "Critère" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-sm font-medium text-ink-muted", children: "Autres services" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-sm font-semibold text-primary-700", children: "Swivo" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-border", children: COMPARE.map((c) => /* @__PURE__ */ jsxs("tr", { className: "transition hover:bg-surface-muted/60", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-medium text-ink", children: c.k }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-ink-muted", children: c.them }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: c.us })
        ] }, c.k)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-4 lg:py-24", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-secondary", children: [
          /* @__PURE__ */ jsx(Icon.Sparkle, { className: "h-3.5 w-3.5" }),
          " Avis vérifiés"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl", children: "Ils ont lancé leur boîte avec Swivo" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "Plus de 12 000 entrepreneurs nous font confiance. Voici ce qu’ils en disent." })
      ] }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 120, children: /* @__PURE__ */ jsx(ReviewsCarousel, {}) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "container-page pb-24", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
          /* @__PURE__ */ jsx(Icon.Building, { className: "h-3.5 w-3.5" }),
          " Portraits"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl", children: "Cinq parcours, une même décision" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "Ils ont sauté le pas. Voici qui ils sont et pourquoi ils ont créé leur entreprise." })
      ] }) }),
      /* @__PURE__ */ jsx(FoundersBlock, {})
    ] }),
    /* @__PURE__ */ jsx("section", { className: "container-page pb-24", children: /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-[28px] border border-surface-border bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 text-ink-inverse", children: [
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute inset-0 bg-grid-pattern opacity-30" }),
      /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float-lg" }),
      /* @__PURE__ */ jsxs("div", { className: "relative grid items-center gap-10 p-12 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl lg:text-4xl font-bold sm:text-5xl", children: "Tarifs simples, sans surprise." }),
          /* @__PURE__ */ jsxs("p", { className: "mt-4 text-lg text-ink-inverse/85", children: [
            /* @__PURE__ */ jsx("strong", { children: "29,90 €" }),
            " pour créer · ",
            /* @__PURE__ */ jsx("strong", { children: "9,90 €/mois" }),
            " pour gérer."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx(Link, { to: "/tarifs", className: "btn bg-ink-inverse text-primary-700 hover:bg-white", children: "Voir les tarifs" }),
            /* @__PURE__ */ jsx(Link, { to: cta.href, className: "btn border border-ink-inverse/40 text-ink-inverse hover:bg-white/10", children: cta.shortLabel })
          ] })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "grid gap-3", children: ["Dossier conforme garanti", "Transmission Guichet unique sous 24h", "Suivi temps réel + alertes", "Support juridique humain", "Données hébergées en France"].map((l) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary-400/20", children: /* @__PURE__ */ jsx(Icon.Check, { className: "h-4 w-4 text-secondary-200" }) }),
          /* @__PURE__ */ jsx("span", { children: l })
        ] }, l)) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "container-page pb-28", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-12 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs(Reveal, { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl lg:text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Questions fréquentes" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "Toutes les réponses sur la création et la gestion d’entreprise." }),
        /* @__PURE__ */ jsx(Link, { to: "/faq", className: "btn-outline mt-6", children: "Voir toutes les FAQ" }),
        /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(IllustrationDossier, { className: "h-44 w-full" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-3", children: (faq ?? []).slice(0, 4).map((f, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 90, direction: "right", children: /* @__PURE__ */ jsxs("details", { className: "card group p-5 open:shadow-elevated", children: [
        /* @__PURE__ */ jsxs("summary", { className: "flex cursor-pointer items-start justify-between gap-4 font-display font-semibold text-ink", children: [
          f.q,
          /* @__PURE__ */ jsx("span", { className: "ml-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition group-open:rotate-45", children: "+" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-ink-muted", children: f.a })
      ] }) }, f.q)) })
    ] }) })
  ] });
}
function GestionUpsell() {
  return /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-[28px] border border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-accent-50 p-10 lg:p-14", children: [
    /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-300/30 blur-3xl animate-float-lg" }),
    /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary-200/50 blur-3xl animate-float" }),
    /* @__PURE__ */ jsxs("div", { className: "relative grid items-center gap-10 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
          /* @__PURE__ */ jsx(Icon.Sparkle, { className: "h-3.5 w-3.5" }),
          " Après création"
        ] }),
        /* @__PURE__ */ jsxs("h2", { className: "mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl", children: [
          "Pilotez votre entreprise pour",
          " ",
          /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-[length:200%_100%] bg-clip-text text-transparent animate-bg-pan", children: "9,90 €/mois" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: "La formule Gestion débloque tous vos outils du quotidien : facturation, modèles juridiques, calculateurs, mise en pause, fermeture assistée. Sans engagement." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/tarifs", className: "btn-primary px-7 py-3.5 text-base", children: [
            "Activer la Gestion ",
            /* @__PURE__ */ jsx(Icon.Arrow, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/espace-createur", className: "btn-outline px-7 py-3.5 text-base", children: "Voir le tableau de bord" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-ink-muted", children: "Sans engagement · Résiliable en 1 clic · Paiement Stripe" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "grid gap-3 sm:grid-cols-2", children: [
        { Ic: Icon.Doc, t: "Facturation & devis", d: "Illimités, conformes" },
        { Ic: Icon.Calc, t: "Calculateurs", d: "URSSAF, TVA, IS" },
        { Ic: Icon.Stamp, t: "Modèles juridiques", d: "PV d’AG, lettres, attestations" },
        { Ic: Icon.Briefcase, t: "Mise en pause", d: "Mise en sommeil assistée" },
        { Ic: Icon.Shield, t: "Fermeture", d: "Procédure complète guidée" },
        { Ic: Icon.Mail, t: "Support prioritaire", d: "Réponse sous 2h ouvrées" }
      ].map((f, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 60, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-surface-border bg-surface/80 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700", children: /* @__PURE__ */ jsx(f.Ic, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-display text-sm font-semibold text-ink", children: f.t }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: f.d })
        ] })
      ] }) }, f.t)) })
    ] })
  ] }) });
}
function GestionActiveBanner({ user }) {
  var _a;
  const cta = useResumeCta();
  const firstName = (user.name || "").split(" ")[0];
  const until = ((_a = user.gestion) == null ? void 0 : _a.until) ? new Date(user.gestion.until) : null;
  const fmtDate = until ? until.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
  const SHORTCUTS = [
    { Ic: Icon.Doc, t: "Facturation", to: "/outils/facturation" },
    { Ic: Icon.Calc, t: "Calculateurs", to: "/outils/calculateurs" },
    { Ic: Icon.Stamp, t: "Modèles juridiques", to: "/outils/modeles" },
    { Ic: Icon.Briefcase, t: "Mes dossiers", to: "/espace-createur" }
  ];
  return /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-[28px] border border-secondary-300 bg-gradient-to-br from-secondary-50 via-surface to-primary-50 p-10 lg:p-14", children: [
    /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary-300/40 blur-3xl animate-float-lg" }),
    /* @__PURE__ */ jsx("div", { "aria-hidden": "true", className: "absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl animate-float" }),
    /* @__PURE__ */ jsxs("div", { className: "relative grid items-start gap-10 lg:grid-cols-[1fr_auto]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-800", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex h-2 w-2 rounded-full bg-secondary-500 animate-pulse" }),
          "Formule Gestion active"
        ] }),
        /* @__PURE__ */ jsxs("h2", { className: "mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-5xl", children: [
          getDayGreeting(),
          " ",
          firstName || "à toi",
          " 👋 Bonne journée chez Swivo."
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: [
          "Tu profites de tous les outils de pilotage : facturation, modèles juridiques, calculateurs avancés, support prioritaire.",
          fmtDate && /* @__PURE__ */ jsxs(Fragment, { children: [
            " Prochaine échéance : ",
            /* @__PURE__ */ jsx("strong", { className: "text-ink", children: fmtDate }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: SHORTCUTS.map((s) => /* @__PURE__ */ jsxs(Link, { to: s.to, className: "group flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/80 px-4 py-3 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft hover:border-primary-300", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-ink-inverse transition", children: /* @__PURE__ */ jsx(s.Ic, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("span", { className: "font-display text-sm font-semibold text-ink group-hover:text-primary-700", children: s.t })
        ] }, s.t)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/espace-createur", className: "btn-primary", children: [
            "Ouvrir mon tableau de bord ",
            /* @__PURE__ */ jsx(Icon.Arrow, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: cta.href, className: "btn-outline", children: cta.hasDraft ? "Reprendre mon dossier" : "Nouveau dossier" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-surface-border bg-surface p-6 text-center shadow-soft", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700", children: /* @__PURE__ */ jsx(Icon.Check, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 font-display text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "Abonnement" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-2xl font-bold text-secondary-700", children: "Actif" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "9,90 €/mois" }),
        /* @__PURE__ */ jsx(Link, { to: "/espace-createur", className: "mt-4 inline-block text-xs font-medium text-primary-700 hover:underline", children: "Gérer mon abonnement →" })
      ] }) })
    ] })
  ] }) });
}
function Stars({ n }) {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5", "aria-label": `Note : ${n}/5`, children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 20 20", className: `h-4 w-4 ${i < n ? "fill-amber-400" : "fill-surface-border"}`, children: /* @__PURE__ */ jsx("path", { d: "M10 1.5l2.7 5.5 6 .9-4.3 4.2 1 6L10 15.3 4.6 18.1l1-6L1.3 7.9l6-.9z" }) }, i)) });
}
function ReviewsCarousel() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const total = REVIEWS.length;
  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    if (!card) return;
    const gap = 16;
    const width = card.offsetWidth + gap;
    el.scrollTo({ left: i * width, behavior: "smooth" });
  };
  const next = () => {
    const i = (index + 1) % total;
    setIndex(i);
    scrollTo(i);
  };
  const prev = () => {
    const i = (index - 1 + total) % total;
    setIndex(i);
    scrollTo(i);
  };
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.querySelector("[data-card]");
      if (!card) return;
      const w = card.offsetWidth + 16;
      const i = Math.round(el.scrollLeft / w);
      if (i !== index) setIndex(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [index]);
  useEffect(() => {
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.querySelector("[data-card]");
      if (!card) return;
      const w = card.offsetWidth + 16;
      const i = Math.round(el.scrollLeft / w);
      const ni = (i + 1) % total;
      el.scrollTo({ left: ni * w, behavior: "smooth" });
    }, 6e3);
    return () => clearInterval(id);
  }, [total]);
  return /* @__PURE__ */ jsxs("div", { className: "relative mt-12", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: trackRef,
        className: "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        children: REVIEWS.map((r) => /* @__PURE__ */ jsxs(
          "article",
          {
            "data-card": true,
            className: "card group relative flex w-[88%] shrink-0 snap-center flex-col gap-4 p-7 sm:w-[420px]",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx(Stars, { n: r.rating }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: r.date })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-ink leading-relaxed", children: [
                "« ",
                r.text,
                " »"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-auto flex items-center gap-3 border-t border-surface-border pt-4", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: r.avatar,
                    alt: "",
                    loading: "lazy",
                    className: "h-11 w-11 rounded-full object-cover ring-2 ring-surface"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-semibold text-ink", children: r.name }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
                    r.activite,
                    " · ",
                    r.city
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "Micro" })
              ] })
            ]
          },
          r.name
        ))
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: prev,
          "aria-label": "Avis précédent",
          className: "inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface text-ink shadow-soft transition hover:bg-surface-muted",
          children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4", children: /* @__PURE__ */ jsx("path", { d: "M15 18l-6-6 6-6" }) })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: REVIEWS.map((_, i) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setIndex(i);
            scrollTo(i);
          },
          "aria-label": `Aller à l’avis ${i + 1}`,
          className: `h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary-600" : "w-1.5 bg-surface-border hover:bg-ink-muted/40"}`
        },
        i
      )) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: next,
          "aria-label": "Avis suivant",
          className: "inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface text-ink shadow-soft transition hover:bg-surface-muted",
          children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4", children: /* @__PURE__ */ jsx("path", { d: "M9 6l6 6-6 6" }) })
        }
      )
    ] })
  ] });
}
function FoundersBlock() {
  return /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: FOUNDERS.map((f, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 80, children: /* @__PURE__ */ jsxs("article", { className: "card group h-full overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative aspect-[4/3] w-full overflow-hidden bg-surface-muted", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: f.photo,
          alt: `Portrait de ${f.name}`,
          loading: "lazy",
          className: "h-full w-full object-cover transition duration-500 group-hover:scale-105"
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-ink-inverse backdrop-blur", children: [
        "Micro · ",
        f.activite
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-ink", children: f.name }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
          f.age,
          " ans · ",
          f.city
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium text-primary-700", children: f.job }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-ink-muted", children: f.why })
    ] })
  ] }) }, f.name)) });
}
function FeatureRow({ badge, title, body, cta, illustration, reverse }) {
  return /* @__PURE__ */ jsxs("div", { className: `grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`, children: [
    /* @__PURE__ */ jsxs(Reveal, { direction: reverse ? "right" : "left", children: [
      /* @__PURE__ */ jsxs("span", { className: "badge-primary", children: [
        /* @__PURE__ */ jsx(Icon.Sparkle, { className: "h-3.5 w-3.5" }),
        " ",
        badge
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display text-2xl lg:text-3xl font-bold tracking-tight text-ink sm:text-2xl lg:text-4xl", children: title }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm lg:text-lg text-ink-muted", children: body }),
      /* @__PURE__ */ jsxs(Link, { to: cta.to, className: "btn-primary mt-6", children: [
        cta.label,
        " ",
        /* @__PURE__ */ jsx(Icon.Arrow, { className: "h-4 w-4" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Reveal, { direction: reverse ? "left" : "right", delay: 100, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-primary-200/30 via-secondary-200/30 to-transparent blur-2xl" }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-surface-border shadow-soft", children: illustration })
    ] }) })
  ] });
}
function TarifsPage() {
  var _a;
  const { data } = useApi((s) => api.fetchPricing(s));
  const { user, nonce } = useAuth();
  const cta = useResumeCta();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const p = data ?? PRICING_SEED;
  const subscribe = async () => {
    var _a2;
    if (!user) {
      nav("/connexion", { state: { from: "/tarifs" } });
      return;
    }
    setBusy(true);
    const r = await startSubscribe(nonce);
    setBusy(false);
    if (r.ok && ((_a2 = r.data) == null ? void 0 : _a2.url)) window.location.href = r.data.url;
  };
  const plans = [
    { name: "Création", ...p.creation, featured: true, kind: "link", cta: cta.label, to: cta.href, description: "Préparation + transmission au Guichet unique INPI." },
    { name: "Gestion", ...p.gestion, featured: false, kind: "action", cta: ((_a = user == null ? void 0 : user.gestion) == null ? void 0 : _a.active) ? "Déjà actif" : "Activer la gestion", description: "Pilotez votre entreprise après création." }
  ];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: "Tarifs Swivo — 29,90 € / 9,90 €/mois",
        description: "Tarifs simples et transparents. Création 29,90 €, gestion 9,90 €/mois sans engagement.",
        path: "/tarifs",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Création Swivo",
          offers: [
            { "@type": "Offer", name: "Création", price: "29.90", priceCurrency: "EUR" },
            { "@type": "Offer", name: "Gestion", price: "9.90", priceCurrency: "EUR" }
          ]
        }
      }
    ),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-secondary", children: "Sans surprise" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Deux formules, zéro frais caché." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-ink-muted", children: "Vous payez ce que vous voyez. Frais légaux reversés à l’INPI." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-secondary-300 bg-secondary-50/70 px-5 py-3 text-sm text-secondary-900", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg", children: "🏦" }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Aucun compte bancaire imposé." }),
            " Contrairement à Shine, Qonto, Hello Bank Pro, vous gardez votre banque actuelle."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-6 lg:grid-cols-2", children: plans.map((pl) => {
        var _a2;
        return /* @__PURE__ */ jsxs("div", { className: `relative card p-8 transition ${pl.featured ? "border-primary-300 shadow-elevated ring-1 ring-primary-200" : ""}`, children: [
          pl.featured && /* @__PURE__ */ jsx("span", { className: "absolute -top-3 left-8 badge-primary", children: "Le plus choisi" }),
          /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold text-ink", children: pl.name }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-baseline gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-display text-5xl font-bold tracking-tight text-ink", children: pl.price }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: pl.suffix })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-ink-muted", children: pl.description }),
          pl.kind === "link" ? /* @__PURE__ */ jsx(Link, { to: pl.to, className: `mt-6 inline-flex w-full justify-center ${pl.featured ? "btn-primary" : "btn-outline"}`, children: pl.cta }) : /* @__PURE__ */ jsx("button", { onClick: subscribe, disabled: busy || ((_a2 = user == null ? void 0 : user.gestion) == null ? void 0 : _a2.active), className: `mt-6 inline-flex w-full justify-center ${pl.featured ? "btn-primary" : "btn-outline"} disabled:opacity-60`, children: busy ? "Redirection Stripe…" : pl.cta }),
          /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-2 text-sm", children: pl.features.map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "mt-0.5 h-5 w-5 shrink-0 text-secondary-600", fill: "none", stroke: "currentColor", strokeWidth: "2.4", children: /* @__PURE__ */ jsx("path", { d: "M5 12l4 4 10-10" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-ink", children: f })
          ] }, f)) }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 rounded-md bg-surface-muted px-3 py-2 text-xs text-ink-muted", children: pl.note })
        ] }, pl.name);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-16 grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-semibold text-ink", children: "Frais légaux INPI" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-ink-muted", children: [
            "Reversés à l’État. Affichés ",
            /* @__PURE__ */ jsx("strong", { children: "avant" }),
            " paiement."
          ] })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "card divide-y divide-surface-border lg:col-span-2", children: p.inpiFees.map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between px-5 py-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-ink", children: f.k }),
          /* @__PURE__ */ jsx("span", { className: "font-display text-sm font-semibold text-ink", children: f.v })
        ] }, f.k)) })
      ] })
    ] })
  ] });
}
const CATS = [
  { key: "all", label: "Toutes" },
  { key: "creation", label: "Création" },
  { key: "gestion", label: "Gestion" },
  { key: "tarifs", label: "Tarifs" },
  { key: "legal", label: "Légal" }
];
function FaqPage() {
  const { data: faq } = useApi((s) => api.fetchFaq(s));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const filtered = useMemo(() => {
    const list = faq ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter((f) => (cat === "all" || f.cat === cat) && (!needle || (f.q + f.a).toLowerCase().includes(needle)));
  }, [q, cat, faq]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: "FAQ — Création et gestion d’entreprise",
        description: "Toutes les réponses sur la création d’entreprise en France.",
        path: "/faq",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (faq ?? []).map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a }
          }))
        }
      }
    ),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Questions fréquentes" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-ink-muted", children: "Trouvez la réponse, ou demandez à notre chatbot." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto mt-8 max-w-2xl", children: [
        /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Rechercher…", className: "input h-12 text-base", "aria-label": "Rechercher" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: CATS.map((c) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setCat(c.key),
            className: `badge px-3 py-1 ${cat === c.key ? "bg-primary-600 text-ink-inverse" : "bg-surface text-ink-muted hover:bg-surface-muted border border-surface-border"}`,
            children: c.label
          },
          c.key
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto mt-10 max-w-3xl space-y-3", children: [
        filtered.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-ink-muted", children: "Aucun résultat." }),
        filtered.map((f) => /* @__PURE__ */ jsxs("details", { className: "card group p-5 open:shadow-elevated", children: [
          /* @__PURE__ */ jsxs("summary", { className: "flex cursor-pointer items-start justify-between gap-4 font-display font-semibold text-ink", children: [
            f.q,
            /* @__PURE__ */ jsx("span", { className: "ml-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition group-open:rotate-45", children: "+" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-ink-muted", children: f.a })
        ] }, f.q))
      ] })
    ] })
  ] });
}
const fmt = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
function BlogIndexPage() {
  const { data, loading } = useApi((s) => api.fetchPosts(s));
  const all = data ?? POSTS_SEED;
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((p) => (p.title + p.excerpt + p.tag).toLowerCase().includes(needle));
  }, [q, all]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Blog — Création et gestion d’entreprise", description: "Articles, comparatifs et actualités.", path: "/blog" }),
    /* @__PURE__ */ jsxs("section", { className: "container-page py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-secondary", children: "Blog" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl", children: "Actualités & guides" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-ink-muted", children: "Ce qu’il faut savoir pour créer et piloter votre entreprise." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mx-auto mt-8 max-w-xl", children: /* @__PURE__ */ jsx(
        "input",
        {
          type: "search",
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "Rechercher un article (SASU, micro, TVA…)",
          className: "input h-12 text-base",
          "aria-label": "Rechercher un article"
        }
      ) }),
      loading && /* @__PURE__ */ jsx("p", { className: "mt-8 text-center text-sm text-ink-muted", children: "Chargement…" }),
      filtered.length === 0 && !loading && /* @__PURE__ */ jsxs("p", { className: "mt-12 text-center text-sm text-ink-muted", children: [
        "Aucun article ne correspond à « ",
        q,
        " »."
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: filtered.map((p) => /* @__PURE__ */ jsxs(Link, { to: `/blog/${p.slug}`, className: "card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-elevated", children: [
        p.cover ? /* @__PURE__ */ jsx("img", { src: p.cover, alt: "", className: "aspect-[16/9] w-full object-cover", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "aspect-[16/9] bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-200" }),
        /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-ink-muted", children: [
            /* @__PURE__ */ jsx("span", { className: "badge-primary", children: p.tag }),
            /* @__PURE__ */ jsx("span", { children: fmt(p.date) }),
            /* @__PURE__ */ jsx("span", { children: "·" }),
            /* @__PURE__ */ jsxs("span", { children: [
              p.readMin,
              " min"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-lg font-semibold text-ink group-hover:text-primary-700", children: p.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: p.excerpt })
        ] })
      ] }, p.slug)) })
    ] })
  ] });
}
function BlogPostPage() {
  const { slug } = useParams();
  const { data, loading } = useApi((s) => api.fetchPost(slug, s), [slug]);
  const post = data ?? POSTS_SEED.find((s) => s.slug === slug);
  if (loading && !post) {
    return /* @__PURE__ */ jsx("section", { className: "container-page py-20 text-center text-ink-muted", children: "Chargement…" });
  }
  if (!post) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Seo, { title: "Article introuvable", description: "", path: `/blog/${slug ?? ""}`, noindex: true }),
      /* @__PURE__ */ jsxs("section", { className: "container-page py-20 text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold text-ink", children: "Article introuvable" }),
        /* @__PURE__ */ jsx(Link, { to: "/blog", className: "btn-outline mt-6", children: "Retour au blog" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: post.title,
        description: post.excerpt,
        path: `/blog/${post.slug}`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          datePublished: post.date,
          author: { "@type": "Organization", name: post.author },
          description: post.excerpt
        }
      }
    ),
    /* @__PURE__ */ jsx("article", { className: "container-page py-14", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl", children: [
      /* @__PURE__ */ jsx(Link, { to: "/blog", className: "text-sm text-primary-700 hover:underline", children: "← Tous les articles" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 text-xs text-ink-muted", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-primary", children: post.tag }),
        /* @__PURE__ */ jsx("span", { children: fmt(post.date) }),
        /* @__PURE__ */ jsx("span", { children: "·" }),
        /* @__PURE__ */ jsxs("span", { children: [
          post.readMin,
          " min"
        ] })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-4xl font-bold tracking-tight text-ink", children: post.title }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-ink-muted", children: post.excerpt }),
      post.cover ? /* @__PURE__ */ jsx("img", { src: post.cover, alt: "", className: "my-8 aspect-[16/9] w-full rounded-2xl object-cover" }) : /* @__PURE__ */ jsx("div", { className: "my-8 aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-200" }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "space-y-4 text-base leading-relaxed text-ink prose-content",
          dangerouslySetInnerHTML: { __html: post.body }
        }
      ),
      /* @__PURE__ */ jsxs("p", { className: "mt-6 text-ink-muted", children: [
        "Pour appliquer ces règles à votre situation, lancez gratuitement notre ",
        /* @__PURE__ */ jsx(Link, { to: "/creer-mon-entreprise", className: "link", children: "diagnostic en ligne" }),
        "."
      ] })
    ] }) })
  ] });
}
function OAuthButtons({ from }) {
  const base = `${apiBase()}/swivo/v1/auth`;
  const ret = encodeURIComponent(from ?? "/espace-createur");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs(
      "a",
      {
        href: `${base}/france-connect/start?return=${ret}`,
        className: "flex w-full items-center justify-center gap-3 rounded-lg border-2 border-[#000091] bg-white px-4 py-3 text-sm font-semibold text-[#000091] transition hover:bg-[#000091] hover:text-white",
        children: [
          /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12 2 L4 7 v6 c0 5 3.5 8.7 8 9 4.5-.3 8-4 8-9 V7 Z" }) }),
          "S'identifier avec ",
          /* @__PURE__ */ jsx("strong", { children: "FranceConnect" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "a",
      {
        href: `${base}/google/start?return=${ret}`,
        className: "flex w-full items-center justify-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary-500 hover:bg-primary-50/30",
        children: [
          /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", children: [
            /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" }),
            /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" }),
            /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" }),
            /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" })
          ] }),
          "Continuer avec ",
          /* @__PURE__ */ jsx("strong", { children: "Google" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "px-2 text-center text-xs text-ink-muted", children: [
      "FranceConnect : identité vérifiée, données pré-remplies (état civil, adresse).",
      /* @__PURE__ */ jsx("br", {}),
      "Google : connexion rapide email + nom."
    ] })
  ] });
}
const SIDE_IMG$1 = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80";
function ConnexionPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const anon = getAnonProfile();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(null);
  const [pending, setPending] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const nav = useNavigate();
  const { state } = useLocation();
  const [sp] = useSearchParams();
  const resetKey = sp.get("reset");
  const resetLogin = sp.get("login");
  if (user) return /* @__PURE__ */ jsx(Navigate, { to: (state == null ? void 0 : state.from) ?? "/espace-createur", replace: true });
  const submit = async (e) => {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const r = await login(email, pass);
    setPending(false);
    if (!r.ok) setErr(r.error ?? "Identifiants invalides.");
    else nav((state == null ? void 0 : state.from) ?? "/espace-createur", { replace: true });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Connexion — Swivo", description: "Accédez à votre espace Swivo.", path: "/connexion", noindex: true }),
    /* @__PURE__ */ jsx("section", { className: "min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-50 via-surface to-secondary-50", children: /* @__PURE__ */ jsx("div", { className: "container-page py-10 lg:py-16", children: /* @__PURE__ */ jsxs("div", { className: "grid items-stretch overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-elevated lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative hidden min-h-[640px] overflow-hidden bg-ink lg:block", children: [
        /* @__PURE__ */ jsx("img", { src: SIDE_IMG$1, alt: "", className: "absolute inset-0 h-full w-full object-cover opacity-85" }),
        /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute inset-0 bg-gradient-to-tr from-primary-900/80 via-primary-700/40 to-transparent" }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex h-full flex-col justify-between p-10 text-ink-inverse", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "badge bg-white/15 text-ink-inverse backdrop-blur", children: "Espace micro-entrepreneur" }),
            /* @__PURE__ */ jsxs("h2", { className: "mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl", children: [
              "Pilotez votre micro",
              /* @__PURE__ */ jsx("br", {}),
              "en toute sérénité."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-md text-white/85", children: "Tableau de bord, URSSAF, factures, alertes seuils — tout votre cockpit, accessible en un clic." })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "✅ ",
              /* @__PURE__ */ jsx("span", { children: "Données hébergées en France" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "🔒 ",
              /* @__PURE__ */ jsx("span", { children: "Chiffrement TLS · conformité RGPD" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "⚡ ",
              /* @__PURE__ */ jsx("span", { children: "5 min pour démarrer · 0 € de frais légaux" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-7 sm:p-10 lg:p-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-bold tracking-tight text-ink", children: "Connexion" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "Heureux de vous revoir 👋" }),
        anon && anon.drafts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800", children: [
          "✨ ",
          /* @__PURE__ */ jsxs("strong", { children: [
            anon.drafts.length,
            " brouillon",
            anon.drafts.length > 1 ? "s" : ""
          ] }),
          " en attente sur cet appareil. Connectez-vous pour ",
          anon.drafts.length > 1 ? "les" : "le",
          " récupérer."
        ] }),
        resetKey && resetLogin ? /* @__PURE__ */ jsx(
          ResetForm,
          {
            login: resetLogin,
            resetKey,
            onDone: () => {
              toast.push({ kind: "success", title: "Mot de passe mis à jour", message: "Connectez-vous avec votre nouveau mot de passe.", ttl: 5e3 });
              nav("/connexion", { replace: true });
            },
            onError: (m) => toast.push({ kind: "error", title: "Erreur", message: m, ttl: 6e3 })
          }
        ) : showForgot ? /* @__PURE__ */ jsx(
          ForgotForm,
          {
            onClose: () => setShowForgot(false),
            onSent: (em) => {
              toast.push({ kind: "success", title: "Email envoyé", message: `Si un compte existe pour ${em}, vous recevrez un lien de réinitialisation.`, ttl: 6e3 });
              setShowForgot(false);
            },
            initialEmail: email
          }
        ) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(OAuthButtons, { from: (state == null ? void 0 : state.from) ?? "/espace-createur" }) }),
          /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted", children: [
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-surface-border" }),
            " ou avec email ",
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-surface-border" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "email", children: "Email" }),
              /* @__PURE__ */ jsx("input", { id: "email", type: "email", autoComplete: "email", required: true, className: "input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "vous@email.fr" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "pass", children: "Mot de passe" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowForgot(true), className: "text-xs text-primary-700 hover:underline", children: "Mot de passe oublié ?" })
              ] }),
              /* @__PURE__ */ jsx("input", { id: "pass", type: "password", autoComplete: "current-password", required: true, minLength: 8, className: "input", value: pass, onChange: (e) => setPass(e.target.value), placeholder: "••••••••" })
            ] }),
            err && /* @__PURE__ */ jsx("p", { className: "rounded-md bg-danger/10 px-3 py-2 text-sm text-danger", children: err }),
            /* @__PURE__ */ jsx("button", { className: "btn-primary w-full", disabled: pending, type: "submit", children: pending ? "Connexion…" : "Se connecter" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-sm text-ink-muted", children: [
            "Pas encore de compte ? ",
            /* @__PURE__ */ jsx(Link, { to: "/inscription", className: "link", children: "Créer un compte" })
          ] })
        ] })
      ] }) })
    ] }) }) })
  ] });
}
function ResetForm({ login, resetKey, onDone, onError }) {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (pass.length < 8) {
      onError("Mot de passe trop court (min 8 caractères).");
      return;
    }
    if (pass !== pass2) {
      onError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    const r = await applyPasswordReset(login, resetKey, pass);
    setBusy(false);
    if (r.ok) onDone();
    else onError(r.error ?? "Lien invalide ou expiré. Refaites une demande.");
  }
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-primary-200 bg-primary-50/40 p-5", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Nouveau mot de passe" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-ink-muted", children: [
      "Compte : ",
      /* @__PURE__ */ jsx("strong", { className: "text-ink", children: login }),
      ". Choisissez un mot de passe d'au moins 8 caractères."
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "np", children: "Nouveau mot de passe" }),
        /* @__PURE__ */ jsx("input", { id: "np", type: "password", required: true, minLength: 8, className: "input", value: pass, onChange: (e) => setPass(e.target.value), autoFocus: true, autoComplete: "new-password" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "np2", children: "Confirmer" }),
        /* @__PURE__ */ jsx("input", { id: "np2", type: "password", required: true, minLength: 8, className: "input", value: pass2, onChange: (e) => setPass2(e.target.value), autoComplete: "new-password" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "btn-primary w-full", children: busy ? "Enregistrement…" : "Enregistrer le nouveau mot de passe" })
    ] })
  ] });
}
function ForgotForm({ initialEmail, onSent, onClose }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    await requestPasswordReset(email.trim());
    setBusy(false);
    onSent(email.trim());
  }
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-primary-200 bg-primary-50/40 p-5", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-lg font-semibold text-ink", children: "Mot de passe oublié ?" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "Entrez votre email, nous vous envoyons un lien sécurisé pour réinitialiser votre mot de passe (valable 24 h)." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsx("input", { type: "email", required: true, className: "input", placeholder: "vous@email.fr", value: email, onChange: (e) => setEmail(e.target.value), autoFocus: true }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "btn-primary flex-1", children: busy ? "Envoi…" : "Envoyer le lien" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "btn-ghost", children: "Annuler" })
      ] })
    ] })
  ] });
}
let siteKeyCache;
async function fetchSiteKey() {
  if (siteKeyCache !== void 0) return siteKeyCache ?? null;
  try {
    const r = await fetch(`${apiBase()}/swivo/v1/security/turnstile`, { credentials: "include" });
    const j = await r.json();
    siteKeyCache = ((j == null ? void 0 : j.siteKey) || "").toString() || null;
  } catch {
    siteKeyCache = null;
  }
  return siteKeyCache ?? null;
}
function loadTurnstileScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.turnstile) return resolve();
    if (document.getElementById("cf-turnstile-js")) {
      const tick = setInterval(() => {
        if (window.turnstile) {
          clearInterval(tick);
          resolve();
        }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.id = "cf-turnstile-js";
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}
function useAntibot() {
  const startedRef = useRef(typeof window !== "undefined" ? Date.now() : 0);
  const [siteKey, setSiteKey] = useState(null);
  const [token, setToken] = useState("");
  const widgetEl = useRef(null);
  const widgetId = useRef(null);
  useEffect(() => {
    let cancelled = false;
    fetchSiteKey().then((k) => {
      if (!cancelled) setSiteKey(k);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled) return;
      const ts = window.turnstile;
      if (!ts || !widgetEl.current) return;
      widgetId.current = ts.render(widgetEl.current, {
        sitekey: siteKey,
        appearance: "interaction-only",
        size: "flexible",
        callback: (t) => setToken(t),
        "error-callback": () => setToken(""),
        "expired-callback": () => setToken("")
      });
    });
    return () => {
      cancelled = true;
      const ts = window.turnstile;
      if (ts && widgetId.current != null) ts.remove(widgetId.current);
    };
  }, [siteKey]);
  return {
    payload() {
      const base = { website: "", formStartedAt: startedRef.current };
      return token ? { ...base, turnstileToken: token } : base;
    },
    HoneypotField() {
      return /* @__PURE__ */ jsxs("div", { "aria-hidden": "true", style: { position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "ab-website", children: "Ne pas remplir" }),
        /* @__PURE__ */ jsx("input", { id: "ab-website", name: "website", type: "text", tabIndex: -1, autoComplete: "off", defaultValue: "" })
      ] });
    },
    TurnstileWidget() {
      if (!siteKey) return null;
      return /* @__PURE__ */ jsx("div", { ref: widgetEl, className: "my-3" });
    },
    hasChallenge: !!siteKey,
    ready: !siteKey || !!token
  };
}
const SIDE_IMG = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80";
function InscriptionPage() {
  var _a, _b;
  const { user, register, nonce } = useAuth();
  const anon = getAnonProfile();
  const [name, setName] = useState(((_a = anon == null ? void 0 : anon.identite) == null ? void 0 : _a.prenom) ? `${anon.identite.prenom} ${anon.identite.nom ?? ""}`.trim() : "");
  const [email, setEmail] = useState(((_b = anon == null ? void 0 : anon.identite) == null ? void 0 : _b.email) ?? "");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(null);
  const [pending, setPending] = useState(false);
  const antibot = useAntibot();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const claimFinalize = sp.get("finalize") === "1";
  const claimId = sp.get("claim");
  const fromPath = sp.get("from") ?? "/espace-createur";
  if (user) return /* @__PURE__ */ jsx(Navigate, { to: "/espace-createur", replace: true });
  const submit = async (e) => {
    var _a2;
    e.preventDefault();
    setPending(true);
    setErr(null);
    const r = await register(email, pass, name, antibot.payload());
    setPending(false);
    if (!r.ok) {
      setErr(r.error ?? "Inscription impossible.");
      return;
    }
    if (claimFinalize && claimId) {
      const fr = await finalizeDraft(parseInt(claimId, 10), null, nonce);
      if (fr.ok) nav(`/espace-createur?finalized=${(_a2 = fr.data) == null ? void 0 : _a2.id}`, { replace: true });
      else nav(fromPath, { replace: true });
    } else {
      nav("/espace-createur", { replace: true });
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: "Créer mon compte — Swivo", description: "Rejoignez Swivo. Tout pour piloter votre micro-entreprise.", path: "/inscription", noindex: true }),
    /* @__PURE__ */ jsx("section", { className: "min-h-[calc(100vh-4rem)] bg-gradient-to-br from-secondary-50 via-surface to-primary-50", children: /* @__PURE__ */ jsx("div", { className: "container-page py-10 lg:py-16", children: /* @__PURE__ */ jsxs("div", { className: "grid items-stretch overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-elevated lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative hidden min-h-[680px] overflow-hidden bg-ink lg:block", children: [
        /* @__PURE__ */ jsx("img", { src: SIDE_IMG, alt: "", className: "absolute inset-0 h-full w-full object-cover opacity-90" }),
        /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute inset-0 bg-gradient-to-tr from-secondary-900/80 via-primary-700/40 to-transparent" }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex h-full flex-col justify-between p-10 text-ink-inverse", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "badge bg-white/15 text-ink-inverse backdrop-blur", children: "Inscription gratuite" }),
            /* @__PURE__ */ jsxs("h2", { className: "mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl", children: [
              "Rejoignez Swivo.",
              /* @__PURE__ */ jsx("br", {}),
              "5 minutes pour démarrer."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-md text-white/85", children: "Création gratuite, accompagnement à 29,90 €, simulateurs URSSAF, facturation incluse." })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "🎯 ",
              /* @__PURE__ */ jsx("span", { children: "Déclaration accompagnée pas-à-pas" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "📊 ",
              /* @__PURE__ */ jsx("span", { children: "Cockpit financier inclus" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "✉️ ",
              /* @__PURE__ */ jsx("span", { children: "Rappels échéances URSSAF + TVA" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              "🛡️ ",
              /* @__PURE__ */ jsx("span", { children: "Données en France · RGPD" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-7 sm:p-10 lg:p-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-bold tracking-tight text-ink", children: "Créer mon compte" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "Pour piloter votre micro et accéder à tous les outils." }),
        anon && anon.drafts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800", children: [
          "✨ ",
          /* @__PURE__ */ jsxs("strong", { children: [
            anon.drafts.length,
            " brouillon",
            anon.drafts.length > 1 ? "s" : ""
          ] }),
          " en attente. Il",
          anon.drafts.length > 1 ? "s seront" : " sera",
          " automatiquement rattaché",
          anon.drafts.length > 1 ? "s" : "",
          " à votre compte."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(OAuthButtons, { from: fromPath }) }),
        /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted", children: [
          /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-surface-border" }),
          " ou avec email ",
          /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-surface-border" })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
          /* @__PURE__ */ jsx(antibot.HoneypotField, {}),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "name", children: "Nom complet" }),
            /* @__PURE__ */ jsx("input", { id: "name", autoComplete: "name", required: true, className: "input", value: name, onChange: (e) => setName(e.target.value), placeholder: "Camille Dupont" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsx("input", { id: "email", type: "email", autoComplete: "email", required: true, className: "input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "vous@email.fr" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", htmlFor: "pass", children: "Mot de passe (8 caractères min.)" }),
            /* @__PURE__ */ jsx("input", { id: "pass", type: "password", autoComplete: "new-password", required: true, minLength: 8, className: "input", value: pass, onChange: (e) => setPass(e.target.value), placeholder: "••••••••" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
            "En créant un compte, vous acceptez nos ",
            /* @__PURE__ */ jsx(Link, { to: "/cgv", className: "link", children: "CGV" }),
            " et notre ",
            /* @__PURE__ */ jsx(Link, { to: "/politique-de-confidentialite", className: "link", children: "politique de confidentialité" }),
            "."
          ] }),
          err && /* @__PURE__ */ jsx("p", { className: "rounded-md bg-danger/10 px-3 py-2 text-sm text-danger", children: err }),
          /* @__PURE__ */ jsx(antibot.TurnstileWidget, {}),
          /* @__PURE__ */ jsx("button", { className: "btn-primary w-full", disabled: pending || !antibot.ready, type: "submit", children: pending ? "Création…" : antibot.hasChallenge && !antibot.ready ? "Vérification anti-bot…" : "Créer mon compte" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-sm text-ink-muted", children: [
          "Déjà inscrit ? ",
          /* @__PURE__ */ jsx(Link, { to: "/connexion", className: "link", children: "Se connecter" })
        ] })
      ] }) })
    ] }) }) })
  ] });
}
function Page({ title, description, path, children }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title, description, path }),
    /* @__PURE__ */ jsx("section", { className: "container-page py-14", children: /* @__PURE__ */ jsxs("article", { className: "mx-auto max-w-3xl", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-4xl font-bold tracking-tight text-ink", children: title }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-ink-muted", children: [
        "Dernière mise à jour : ",
        (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR")
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-6 text-ink leading-relaxed", children })
    ] }) })
  ] });
}
function H2({ children }) {
  return /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-semibold text-ink mt-6", children });
}
function MentionsLegalesPage() {
  return /* @__PURE__ */ jsxs(Page, { title: "Mentions légales", description: "Mentions légales Swivo.", path: "/mentions-legales", children: [
    /* @__PURE__ */ jsx(H2, { children: "Éditeur" }),
    /* @__PURE__ */ jsx("p", { children: "Swivo SAS, capital social 1 000 €, RCS Paris XXX XXX XXX, siège : 1 avenue de l’Entrepreneuriat, 75001 Paris." }),
    /* @__PURE__ */ jsx(H2, { children: "Hébergeur" }),
    /* @__PURE__ */ jsx("p", { children: "Hébergement en France (UE). Coordonnées sur demande : contact@swivo.fr." }),
    /* @__PURE__ */ jsx(H2, { children: "Service indépendant" }),
    /* @__PURE__ */ jsx("p", { children: "Swivo est un service privé. Les formalités sont déposées sur le Guichet unique de l’INPI." })
  ] });
}
function ConfidentialitePage() {
  return /* @__PURE__ */ jsxs(Page, { title: "Politique de confidentialité", description: "Politique RGPD.", path: "/politique-de-confidentialite", children: [
    /* @__PURE__ */ jsx(H2, { children: "Responsable du traitement" }),
    /* @__PURE__ */ jsx("p", { children: "Swivo SAS, contact@swivo.fr." }),
    /* @__PURE__ */ jsx(H2, { children: "Données collectées" }),
    /* @__PURE__ */ jsx("p", { children: "Compte (email, identité), informations du chat (forme, siège, activité), paiement (Stripe), journaux techniques." }),
    /* @__PURE__ */ jsx(H2, { children: "Vos droits" }),
    /* @__PURE__ */ jsx("p", { children: "Accès, rectification, suppression, opposition, portabilité, limitation. Réclamation possible auprès de la CNIL." })
  ] });
}
function CgvPage() {
  return /* @__PURE__ */ jsxs(Page, { title: "Conditions générales de vente", description: "CGV Swivo.", path: "/cgv", children: [
    /* @__PURE__ */ jsx(H2, { children: "1. Objet" }),
    /* @__PURE__ */ jsx("p", { children: "Préparation et transmission de dossiers de formalités au Guichet unique INPI, et outils de gestion." }),
    /* @__PURE__ */ jsx(H2, { children: "2. Prix" }),
    /* @__PURE__ */ jsx("p", { children: "Création : 29,90 € TTC. Gestion : 9,90 € TTC/mois sans engagement." }),
    /* @__PURE__ */ jsx(H2, { children: "3. Garantie 99 % de réussite" }),
    /* @__PURE__ */ jsx("p", { children: "En cas de rejet après corrections, prestation de création remboursée." })
  ] });
}
function CookiesPage() {
  return /* @__PURE__ */ jsx(Page, { title: "Politique cookies", description: "Liste des cookies utilisés.", path: "/cookies", children: /* @__PURE__ */ jsx("p", { children: "Cookies essentiels par défaut. Mesure d’audience et marketing soumis à votre consentement explicite via le bandeau cookies." }) });
}
function NotFoundPage() {
  return /* @__PURE__ */ jsx(Page, { title: "Page introuvable", description: "404", path: "/404", children: /* @__PURE__ */ jsxs("p", { children: [
    "Cette page n’existe pas. ",
    /* @__PURE__ */ jsx("a", { className: "link", href: "/", children: "Retour à l’accueil" }),
    "."
  ] }) });
}
const GESTION_FEATURES = [
  "Facturation & devis illimités",
  "Calculateurs URSSAF / TVA / IS",
  "Modèles juridiques (PV, AG, lettres)",
  "Mise en pause assistée",
  "Fermeture d’entreprise complète",
  "Support juridique prioritaire"
];
function RequireGestion({ children, feature }) {
  var _a;
  const { user, loading, nonce } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  if (loading) return null;
  if (!user) {
    nav("/connexion", { state: { from: location.pathname } });
    return null;
  }
  if ((_a = user.gestion) == null ? void 0 : _a.active) return /* @__PURE__ */ jsx(Fragment, { children });
  const subscribe = async () => {
    var _a2;
    setBusy(true);
    const r = await startSubscribe(nonce);
    setBusy(false);
    if (r.ok && ((_a2 = r.data) == null ? void 0 : _a2.url)) window.location.href = r.data.url;
  };
  return /* @__PURE__ */ jsx("section", { className: "container-page py-16", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-2xl", children: /* @__PURE__ */ jsxs("div", { className: "card relative overflow-hidden p-10 text-center shadow-elevated", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-300/40 blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary-300/40 blur-3xl" }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-ink-inverse shadow-soft", children: /* @__PURE__ */ jsx(Icon.Lock, { className: "h-7 w-7" }) }),
      /* @__PURE__ */ jsx("h1", { className: "mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: feature ? `${feature} — réservé à la formule Gestion` : "Formule Gestion requise" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-3 text-ink-muted", children: [
        "Activez la formule ",
        /* @__PURE__ */ jsx("strong", { children: "Gestion" }),
        " pour débloquer tous les outils de pilotage de votre entreprise.",
        /* @__PURE__ */ jsx("span", { className: "block mt-1", children: "Sans engagement, résiliable en 1 clic." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 inline-flex items-baseline gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "font-display text-5xl font-bold text-primary-700", children: "9,90 €" }),
        /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "/ mois" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "mx-auto mt-8 max-w-md space-y-2 text-left text-sm", children: GESTION_FEATURES.map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(Icon.Check, { className: "mt-0.5 h-5 w-5 shrink-0 text-secondary-600" }),
        /* @__PURE__ */ jsx("span", { children: f })
      ] }, f)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap justify-center gap-3", children: [
        /* @__PURE__ */ jsxs("button", { onClick: subscribe, disabled: busy, className: "btn-primary px-7 py-3 text-base", children: [
          busy ? "Redirection…" : "Activer la Gestion (9,90 €/mois)",
          " ",
          /* @__PURE__ */ jsx(Icon.Arrow, { className: "h-4 w-4" })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/espace-createur", className: "btn-outline", children: "Retour au tableau de bord" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-5 text-xs text-ink-muted", children: "Paiement sécurisé Stripe · Données hébergées en France" })
    ] })
  ] }) }) });
}
const CreerPage = lazy(() => import("./assets/Creer-B955hWJW.js").then((m) => ({ default: m.CreerPage })));
const EspaceCreateurPage = lazy(() => import("./assets/EspaceCreateur-Cp2Cuf0t.js").then((m) => ({ default: m.EspaceCreateurPage })));
const CalculateursPage = lazy(() => import("./assets/Calculateurs-Cqls6chQ.js").then((m) => ({ default: m.CalculateursPage })));
const UrssafPage = lazy(() => import("./assets/Urssaf-BatB7I_J.js").then((m) => ({ default: m.UrssafPage })));
const PilotagePage = lazy(() => import("./assets/Pilotage-rgQ3T0JL.js").then((m) => ({ default: m.PilotagePage })));
const FormationsPage = lazy(() => import("./assets/Formations-0-tGg98f.js").then((m) => ({ default: m.FormationsPage })));
const FormationDetailPage = lazy(() => import("./assets/Formations-0-tGg98f.js").then((m) => ({ default: m.FormationDetailPage })));
const FacturationPage = lazy(() => import("./assets/Facturation-D3YmpG_K.js").then((m) => ({ default: m.FacturationPage })));
const ModelesPage = lazy(() => import("./assets/Modeles-ePE27LvN.js").then((m) => ({ default: m.ModelesPage })));
const GestionPage = lazy(() => import("./assets/Gestion-Bp9bCFkQ.js").then((m) => ({ default: m.GestionPage })));
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return /* @__PURE__ */ jsx(Navigate, { to: "/connexion", replace: true });
  return children;
}
function PageLoader() {
  return /* @__PURE__ */ jsx("div", { className: "container-page py-24 text-center", children: /* @__PURE__ */ jsx("div", { className: "inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600", "aria-label": "Chargement" }) });
}
function L({ children }) {
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(PageLoader, {}), children });
}
function App() {
  return /* @__PURE__ */ jsx(Routes, { children: /* @__PURE__ */ jsxs(Route, { element: /* @__PURE__ */ jsx(Layout, {}), children: [
    /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(HomePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/tarifs", element: /* @__PURE__ */ jsx(TarifsPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/faq", element: /* @__PURE__ */ jsx(FaqPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/blog", element: /* @__PURE__ */ jsx(BlogIndexPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/blog/:slug", element: /* @__PURE__ */ jsx(BlogPostPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/connexion", element: /* @__PURE__ */ jsx(ConnexionPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/inscription", element: /* @__PURE__ */ jsx(InscriptionPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/mentions-legales", element: /* @__PURE__ */ jsx(MentionsLegalesPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/politique-de-confidentialite", element: /* @__PURE__ */ jsx(ConfidentialitePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/cgv", element: /* @__PURE__ */ jsx(CgvPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/cookies", element: /* @__PURE__ */ jsx(CookiesPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/formes-juridiques/:slug", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/creer-mon-entreprise", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(CreerPage, {}) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/espace-createur", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(Protected, { children: /* @__PURE__ */ jsx(EspaceCreateurPage, {}) }) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/outils/calculateurs", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(CalculateursPage, {}) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/urssaf", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(UrssafPage, {}) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/pilotage", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(Protected, { children: /* @__PURE__ */ jsx(PilotagePage, {}) }) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/formations", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(FormationsPage, {}) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/formations/:slug", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(FormationDetailPage, {}) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/outils/facturation", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(Protected, { children: /* @__PURE__ */ jsx(RequireGestion, { feature: "Facturation & devis", children: /* @__PURE__ */ jsx(FacturationPage, {}) }) }) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/outils/modeles", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(Protected, { children: /* @__PURE__ */ jsx(RequireGestion, { feature: "Modèles juridiques", children: /* @__PURE__ */ jsx(ModelesPage, {}) }) }) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/gestion/pause", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(Protected, { children: /* @__PURE__ */ jsx(RequireGestion, { feature: "Mise en pause", children: /* @__PURE__ */ jsx(GestionPage, { kind: "pause" }) }) }) }) }),
    /* @__PURE__ */ jsx(Route, { path: "/gestion/fermeture", element: /* @__PURE__ */ jsx(L, { children: /* @__PURE__ */ jsx(Protected, { children: /* @__PURE__ */ jsx(RequireGestion, { feature: "Fermeture d’entreprise", children: /* @__PURE__ */ jsx(GestionPage, { kind: "fermeture" }) }) }) }) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(NotFoundPage, {}) })
  ] }) });
}
function render(url) {
  const helmetCtx = {};
  const basename = "/".replace(/\/$/, "") || "/";
  const html = renderToString(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(HelmetProvider, { context: helmetCtx, children: /* @__PURE__ */ jsx(StaticRouter, { location: url, basename, children: /* @__PURE__ */ jsx(ToastProvider, { children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(App, {}) }) }) }) }) })
  );
  const helmet = helmetCtx.helmet;
  const head = [
    (helmet == null ? void 0 : helmet.title.toString()) ?? "",
    (helmet == null ? void 0 : helmet.meta.toString()) ?? "",
    (helmet == null ? void 0 : helmet.link.toString()) ?? "",
    (helmet == null ? void 0 : helmet.script.toString()) ?? ""
  ].join("\n");
  return { html, head };
}
export {
  F as FORMES_SEED,
  POSTS_SEED,
  Seo as S,
  getDayGreeting as g,
  render,
  useResumeCta as u
};
