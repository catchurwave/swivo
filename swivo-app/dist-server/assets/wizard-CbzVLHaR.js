import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, createContext, useContext, useCallback, useRef, useMemo } from "react";
import { b as buildMandat, n as newDossier, l as lastStepId, Q as QUESTIONS, c as computeProfil, e as nextQuestion, v as validate, q as questionIndex, t as totalQuestions, d as documentsRequis, r as recommander, a as currentValue, F as FORMES, w as withLastStep, f as previousQuestion, M as MANDAT_TEXTE, m as mandatTexteRendu, s as searchActivites, p as parseNir } from "./formalites-DR4taCu5.js";
import { useNavigate } from "react-router";
function apiBase() {
  const url = "https://swivo.fr/wp".replace(/\/$/, "");
  return url ? `${url}/wp-json` : "/wp-json";
}
const KEY = "swivo.anon.profile.v1";
function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "anon-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function getAnonProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || !p.anonId) return null;
    if (!Array.isArray(p.drafts)) p.drafts = [];
    return p;
  } catch {
    return null;
  }
}
function ensureAnonProfile() {
  const existing = getAnonProfile();
  if (existing) return existing;
  const fresh = { anonId: uuid(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), drafts: [] };
  saveAnonProfile(fresh);
  return fresh;
}
function saveAnonProfile(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
  }
}
function setAnonIdentite(patch) {
  const p = ensureAnonProfile();
  p.identite = { ...p.identite ?? {}, ...patch };
  saveAnonProfile(p);
  return p;
}
function upsertAnonDraft(ref) {
  const p = ensureAnonProfile();
  const i = p.drafts.findIndex((d) => d.id === ref.id);
  if (i >= 0) p.drafts[i] = { ...p.drafts[i], ...ref };
  else p.drafts.push(ref);
  saveAnonProfile(p);
  return p;
}
function removeAnonDraft(id) {
  const p = getAnonProfile();
  if (!p) return;
  p.drafts = p.drafts.filter((d) => d.id !== id);
  saveAnonProfile(p);
}
function listAnonDrafts() {
  var _a;
  return ((_a = getAnonProfile()) == null ? void 0 : _a.drafts) ?? [];
}
function consumeForClaim() {
  const p = getAnonProfile();
  if (!p) return [];
  const drafts = [...p.drafts];
  p.drafts = [];
  saveAnonProfile(p);
  return drafts;
}
const FORMES_SEED = [
  {
    slug: "micro",
    label: "Micro-entreprise",
    shortLabel: "Micro",
    tagline: "Le statut le plus simple, le plus rapide et le moins cher pour démarrer en solo.",
    associesMin: 1,
    associesMax: 1,
    regimeFiscal: "Micro-fiscal (BIC / BNC / BA — versement libératoire possible)",
    regimeSocial: "Travailleur non salarié (TNS) — URSSAF proportionnelle au CA",
    responsabilite: "Patrimoine personnel séparé · résidence principale insaisissable de droit",
    bonPour: [
      "Lancer son activité en quelques minutes, 0 € de frais légaux",
      "Tester un projet sans engagement",
      "Comptabilité ultra-simple, pas de bilan annuel",
      "Cotisations indexées sur ce que vous encaissez"
    ]
  }
];
const FAQ_SEED = [
  {
    cat: "creation",
    q: "Pourquoi choisir la micro-entreprise ?",
    a: "C’est le statut le plus simple : création gratuite, comptabilité ultra-allégée, charges proportionnelles au CA. Idéal pour démarrer une activité solo sous 188 700 € (vente) ou 77 700 € (service)."
  },
  {
    cat: "creation",
    q: "Combien de temps prend la déclaration ?",
    a: "Le parcours dure 5 minutes. Une fois validé, nous transmettons au Guichet unique INPI sous 24 h. Vous recevez votre SIRET sous 8 à 15 jours selon votre CFE de rattachement."
  },
  {
    cat: "creation",
    q: "Quels documents faut-il préparer ?",
    a: "Pièce d’identité, justificatif de domicile -3 mois pour le siège, et pour les activités artisanales : diplôme/CAP ou attestation de qualification (CMA)."
  },
  {
    cat: "creation",
    q: "Puis-je obtenir l’ACRE ?",
    a: "L’ACRE exonère 50 % des cotisations URSSAF la 1ère année si vous êtes demandeur d’emploi indemnisé, bénéficiaire du RSA, moins de 26 ans ou repreneur d’entreprise. Notre assistant vérifie automatiquement votre éligibilité."
  },
  {
    cat: "tarifs",
    q: "Pourquoi 29,90 € si la création INPI est gratuite ?",
    a: "L’INPI ne facture rien, mais le parcours est complexe (NAF, régime fiscal, ACRE, TVA…). Nos 29,90 € couvrent l’accompagnement, la vérification juriste et la transmission sans erreur. Tarif fixe, sans surprise."
  },
  {
    cat: "tarifs",
    q: "Que comprend la formule Gestion à 9,90 €/mois ?",
    a: "Tableau de bord CA/charges, simulateur URSSAF temps réel, rappels d’échéances, facturation & devis illimités, relances automatiques, alertes seuils TVA, exports comptables, modèles juridiques. Sans engagement."
  },
  {
    cat: "gestion",
    q: "Comment fonctionnent les cotisations URSSAF ?",
    a: "Vous déclarez votre CA tous les mois ou trimestres. Les cotisations sont prélevées proportionnellement : 12,3 % (vente), 21,1 % (service BIC) ou 21,2 % (BNC libéral). Zéro CA = zéro cotisation."
  },
  {
    cat: "gestion",
    q: "À quel moment dois-je facturer la TVA ?",
    a: "En franchise en base jusqu’à 85 000 € (vente) ou 37 500 € (service). Dépassement : passage au régime réel avec TVA à appliquer. Notre dashboard vous alerte 2 mois avant le seuil."
  },
  {
    cat: "gestion",
    q: "Puis-je mettre ma micro-entreprise en pause ?",
    a: "Oui : déclaration de cessation temporaire d’activité. Pas de cotisations pendant la pause. Vous pouvez reprendre à tout moment sans recréer l’entreprise."
  },
  {
    cat: "legal",
    q: "Swivo est-il un service public ?",
    a: "Non. Swivo est un service privé indépendant qui prépare et transmet vos déclarations au Guichet unique INPI (service officiel). Nous ne nous substituons ni à l’INPI ni à l’URSSAF."
  },
  {
    cat: "legal",
    q: "Mes données sont-elles protégées ?",
    a: "Oui. Données hébergées en France, conformité RGPD, chiffrement TLS. Vous pouvez demander à tout moment l’accès, la rectification ou la suppression de vos données (dpo@swivo.fr)."
  }
];
const POSTS_SEED = [
  {
    slug: "micro-entreprise-2026-plafonds",
    title: "Micro-entreprise 2026 : plafonds CA et franchise TVA",
    excerpt: "Tous les seuils mis à jour, ce qui change vraiment pour vos déclarations.",
    body: "<p>Plafonds CA 2026 : 188 700 € (vente) / 77 700 € (service). Franchise TVA : 85 000 € (vente) / 37 500 € (service). Dépassement = passage au réel.</p>",
    date: "2026-05-02T10:00:00",
    readMin: 5,
    tag: "Plafonds",
    author: "Équipe Swivo"
  },
  {
    slug: "choisir-code-naf-ape",
    title: "Comment choisir son code NAF/APE en micro-entreprise",
    excerpt: "Le code NAF détermine votre régime social et fiscal. Guide pratique avec exemples.",
    body: "<p>Le code NAF est attribué par l’INSEE après immatriculation, mais le code APE déclaré au Guichet unique l’influence directement. Notre assistant suggère le bon code en fonction de votre description d’activité.</p>",
    date: "2026-04-18T10:00:00",
    readMin: 6,
    tag: "Démarrage",
    author: "Équipe Swivo"
  },
  {
    slug: "acre-micro-entrepreneur",
    title: "ACRE : qui peut bénéficier de l’exonération en 2026 ?",
    excerpt: "Conditions, montant, démarches : tout ce qu’il faut savoir pour économiser jusqu’à 50 % de charges la 1ère année.",
    body: "<p>L’ACRE exonère 50 % des cotisations URSSAF la 1ère année si vous êtes demandeur d’emploi, RSA, JEI, repreneur ou moins de 26 ans. Demande à faire dans les 45 jours après immatriculation.</p>",
    date: "2026-03-30T10:00:00",
    readMin: 7,
    tag: "ACRE",
    author: "Équipe Swivo"
  },
  {
    slug: "declarer-ca-urssaf-micro",
    title: "Déclarer son CA URSSAF : mensuel ou trimestriel ?",
    excerpt: "Comment fonctionne la déclaration micro, quelles cases remplir, quels pièges éviter.",
    body: "<p>Le micro-entrepreneur déclare son CA encaissé (pas facturé) tous les mois ou trimestres. 0 CA = déclaration à 0 obligatoire. Pénalité : 56,80 € par absence de déclaration.</p>",
    date: "2026-03-12T10:00:00",
    readMin: 6,
    tag: "URSSAF",
    author: "Équipe Swivo"
  }
];
const PRICING_SEED = {
  creation: {
    price: "29,90 €",
    suffix: " tout compris",
    features: [
      "Déclaration micro-entreprise accompagnée (5 min)",
      "Choix du code NAF + régime fiscal optimisé",
      "Demande ACRE incluse si éligible",
      "Transmission au Guichet unique INPI sous 24 h",
      "Réception du SIRET + suivi temps réel",
      "Support juridique humain par email"
    ],
    note: "Création INPI : 0 € de frais légaux. Service Swivo : 29,90 € pour vous accompagner."
  },
  gestion: {
    price: "9,90 €",
    suffix: " / mois",
    features: [
      "Tableau de bord CA / charges / bénéfices",
      "Simulateur URSSAF temps réel + rappels",
      "Factures & devis illimités, normes 2026",
      "Relances automatiques impayés",
      "Alertes seuils TVA + plafonds micro",
      "Exports comptables CSV / Excel",
      "Modèles juridiques + lettres types",
      "Support prioritaire 24 h"
    ],
    note: "Sans engagement, résiliable en 1 clic."
  },
  inpiFees: [
    { k: "Création micro-entreprise (INPI)", v: "0 €" },
    { k: "Activité artisanale (CMA)", v: "0 €" },
    { k: "Versement libératoire (option fiscale)", v: "0 €" },
    { k: "Service d’accompagnement Swivo", v: "29,90 €" }
  ]
};
const API_BASE = apiBase();
async function get(path, signal) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" }, credentials: "include", signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function post(path, body, nonce) {
  try {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (nonce) headers["X-WP-Nonce"] = nonce;
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body)
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : void 0;
    if (!res.ok) return { ok: false, error: (data == null ? void 0 : data.message) ?? `Erreur ${res.status}` };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Réseau indisponible" };
  }
}
async function fetchFormes(signal) {
  const data = await get("/swivo/v1/formes", signal);
  return data && data.length ? data : FORMES_SEED;
}
async function fetchFaq(signal) {
  const data = await get("/swivo/v1/faq", signal);
  return data && data.length ? data : FAQ_SEED;
}
async function fetchPricing(signal) {
  const data = await get("/swivo/v1/pricing", signal);
  return data ?? PRICING_SEED;
}
function mapWpPost(p) {
  var _a, _b, _c;
  const text = p.content.rendered;
  return {
    slug: p.slug,
    title: stripHtml(p.title.rendered),
    excerpt: stripHtml(p.excerpt.rendered),
    body: text,
    date: p.date,
    readMin: Math.max(2, Math.ceil(text.split(" ").length / 220)),
    tag: "Article",
    author: "Swivo",
    cover: (_c = (_b = (_a = p._embedded) == null ? void 0 : _a["wp:featuredmedia"]) == null ? void 0 : _b[0]) == null ? void 0 : _c.source_url
  };
}
async function fetchPosts(signal) {
  const raw = await get("/wp/v2/posts?per_page=12&_embed=wp:featuredmedia", signal);
  return raw && raw.length ? raw.map(mapWpPost) : POSTS_SEED;
}
async function fetchPost(slug, signal) {
  const raw = await get(`/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia`, signal);
  if (raw && raw.length) return mapWpPost(raw[0]);
  return POSTS_SEED.find((s) => s.slug === slug);
}
const api = { fetchFormes, fetchFaq, fetchPricing, fetchPosts, fetchPost };
function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetcher(ctrl.signal).then(setData).catch((e) => setError(e instanceof Error ? e : new Error(String(e)))).finally(() => setLoading(false));
    return () => ctrl.abort();
  }, deps);
  return { data, loading, error };
}
function stripHtml(s) {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
async function submitDossier(dossier, nonce) {
  const r = await post("/swivo/v1/dossier", dossier, nonce);
  return r.ok ? r.data ?? null : null;
}
async function chatTurn(messages, dossier, nonce) {
  return post("/swivo/v1/chat/turn", { messages, dossier }, nonce);
}
async function startCheckout(dossierId, nonce) {
  return post("/swivo/v1/checkout", { dossierId }, nonce);
}
async function startSubscribe(nonce) {
  return post("/swivo/v1/subscribe", {}, nonce);
}
async function openBillingPortal(nonce) {
  return post("/swivo/v1/billing-portal", {}, nonce);
}
async function saveDraft(payload, opts) {
  const body = { payload };
  if (opts.id) body.id = opts.id;
  if (opts.token) body.token = opts.token;
  return post("/swivo/v1/draft", body, opts.nonce);
}
async function fetchDraft(id, token) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return get(`/swivo/v1/draft/${id}${qs}`);
}
async function listDrafts() {
  return get("/swivo/v1/drafts");
}
async function deleteDraft(id, token, nonce) {
  const qs = "";
  try {
    const headers = { Accept: "application/json" };
    if (nonce) ;
    const res = await fetch(`${API_BASE}/swivo/v1/draft/${id}${qs}`, { method: "DELETE", headers, credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}
async function finalizeDraft(id, token, nonce) {
  const body = {};
  if (token) body.token = token;
  return post(`/swivo/v1/draft/${id}/finalize`, body, nonce);
}
async function claimDrafts(items, nonce) {
  return post("/swivo/v1/draft/claim", { drafts: items }, nonce);
}
async function requestPasswordReset(email) {
  return post("/swivo/v1/auth/forgot", { email });
}
async function applyPasswordReset(login, key, password) {
  return post("/swivo/v1/auth/reset", { login, key, password });
}
const Ctx$1 = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((arr) => arr.filter((t) => t.id !== id)), []);
  const push = useCallback((t) => {
    const id = Date.now() + Math.random();
    const toast = { id, kind: t.kind, title: t.title, message: t.message, ttl: t.ttl ?? 5e3 };
    setToasts((arr) => [...arr, toast]);
    if (toast.ttl > 0) setTimeout(() => dismiss(id), toast.ttl);
    return id;
  }, [dismiss]);
  const pushMany = useCallback((ts) => {
    ts.forEach(push);
  }, [push]);
  return /* @__PURE__ */ jsxs(Ctx$1.Provider, { value: { push, pushMany, dismiss }, children: [
    children,
    /* @__PURE__ */ jsx(ToastHost, { toasts, dismiss })
  ] });
}
function useToast() {
  const v = useContext(Ctx$1);
  if (!v) {
    return {
      push: () => 0,
      pushMany: () => void 0,
      dismiss: () => void 0
    };
  }
  return v;
}
function ToastHost({ toasts, dismiss }) {
  return /* @__PURE__ */ jsx("div", { className: "pointer-events-none fixed top-4 right-4 z-[9999] flex w-[min(380px,calc(100%-2rem))] flex-col gap-2", role: "region", "aria-label": "Notifications", children: toasts.map((t) => /* @__PURE__ */ jsx(ToastItem, { t, onDismiss: () => dismiss(t.id) }, t.id)) });
}
function ToastItem({ t, onDismiss }) {
  const [enter, setEnter] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEnter(true));
  }, []);
  const cfg = STYLES[t.kind];
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: t.kind === "error" ? "alert" : "status",
      "aria-live": t.kind === "error" ? "assertive" : "polite",
      className: `pointer-events-auto overflow-hidden rounded-xl border shadow-elevated backdrop-blur transition-all duration-300 ${cfg.cls} ${enter ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`,
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 px-4 py-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-lg leading-none", "aria-hidden": true, children: cfg.icon }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          t.title && /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: t.title }),
          /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line text-sm leading-snug", children: t.message })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onDismiss, className: "text-xs opacity-60 hover:opacity-100", "aria-label": "Fermer", children: "✕" })
      ] })
    }
  );
}
const STYLES = {
  error: { cls: "border-rose-300 bg-rose-50 text-rose-900", icon: "⚠️" },
  warning: { cls: "border-amber-300 bg-amber-50 text-amber-900", icon: "⚠️" },
  success: { cls: "border-emerald-300 bg-emerald-50 text-emerald-900", icon: "✅" },
  info: { cls: "border-primary-300 bg-primary-50 text-primary-900", icon: "ℹ️" }
};
const UID_KEY = "swivo.current_uid";
const SCOPED_PREFIXES = ["swivo.pilotage.", "swivo.billing."];
function currentUid() {
  if (typeof localStorage === "undefined") return "anon";
  try {
    return localStorage.getItem(UID_KEY) || "anon";
  } catch {
    return "anon";
  }
}
function setCurrentUid(uid) {
  if (typeof localStorage === "undefined") return;
  try {
    const prev = localStorage.getItem(UID_KEY);
    const next = uid == null ? "" : String(uid);
    if (prev && prev !== next) scrubUserScopedStorage(prev);
    if (next) localStorage.setItem(UID_KEY, next);
    else localStorage.removeItem(UID_KEY);
  } catch {
  }
}
function userKey(base2) {
  return `${base2}:u${currentUid()}`;
}
function scrubUserScopedStorage(uidSuffix) {
  if (typeof localStorage === "undefined") return;
  try {
    const suffix = uidSuffix ? `:u${uidSuffix}` : "";
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const hits = SCOPED_PREFIXES.some((p) => k.startsWith(p));
      if (!hits) continue;
      if (suffix && !k.endsWith(suffix)) continue;
      remove.push(k);
    }
    remove.forEach((k) => localStorage.removeItem(k));
  } catch {
  }
}
const Ctx = createContext(null);
const API = `${apiBase()}/swivo/v1`;
async function call$1(path, init) {
  try {
    const headers = new Headers((init == null ? void 0 : init.headers) ?? {});
    headers.set("Accept", "application/json");
    if ((init == null ? void 0 : init.body) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (init == null ? void 0 : init.nonce) headers.set("X-WP-Nonce", init.nonce);
    const res = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
    const text = await res.text();
    const data = text ? JSON.parse(text) : void 0;
    if (!res.ok) return { ok: false, status: res.status, error: (data == null ? void 0 : data.message) ?? `Erreur ${res.status}` };
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "Réseau indisponible" };
  }
}
function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    var _a, _b;
    const r = await call$1("/auth/me");
    const u = ((_a = r.data) == null ? void 0 : _a.user) ?? null;
    const n = ((_b = r.data) == null ? void 0 : _b.nonce) ?? null;
    setCurrentUid(u ? u.id : null);
    setUser(u);
    setNonce(n);
    setLoading(false);
    return { user: u, nonce: n };
  };
  useEffect(() => {
    void refresh();
  }, []);
  const claimPending = async (nonceArg) => {
    const anon = getAnonProfile();
    if (!anon || !anon.drafts.length) return;
    const items = consumeForClaim().filter((d) => d.token).map((d) => ({ id: d.id, token: d.token }));
    if (!items.length) return;
    await claimDrafts(items, nonceArg);
  };
  const login = async (email, password) => {
    var _a;
    const r = await call$1("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (!r.ok) {
      toast.push({ kind: "error", title: "Connexion impossible", message: r.error ?? "Identifiants invalides.", ttl: 4500 });
      return { ok: false, error: r.error };
    }
    const fresh = await refresh();
    await claimPending(fresh.nonce);
    toast.push({ kind: "success", title: `Bienvenue${((_a = fresh.user) == null ? void 0 : _a.name) ? " " + fresh.user.name.split(" ")[0] : ""}`, message: "Vous êtes connecté·e.", ttl: 3500 });
    return { ok: true };
  };
  const register = async (email, password, name, extras) => {
    const r = await call$1("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name, ...extras ?? {} }) });
    if (!r.ok) {
      toast.push({ kind: "error", title: "Inscription impossible", message: r.error ?? "Erreur création compte.", ttl: 4500 });
      return { ok: false, error: r.error };
    }
    const fresh = await refresh();
    void claimPending(fresh.nonce);
    toast.push({ kind: "success", title: "Compte créé", message: `Bienvenue ${name.split(" ")[0]}, votre espace est prêt.`, ttl: 4500 });
    return { ok: true };
  };
  const logout = async () => {
    await call$1("/auth/logout", { method: "POST", nonce });
    scrubUserScopedStorage();
    setCurrentUid(null);
    setUser(null);
    setNonce(null);
    toast.push({ kind: "info", message: "Vous êtes déconnecté·e. À bientôt.", ttl: 3e3 });
  };
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: { user, nonce, loading, login, register, logout, refresh }, children });
}
function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside <AuthProvider>");
  return v;
}
const base = (p) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  ...p
});
const Icon = {
  Chat: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("path", { d: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" }),
    /* @__PURE__ */ jsx("circle", { cx: "9", cy: "12", r: ".7", fill: "currentColor" }),
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: ".7", fill: "currentColor" }),
    /* @__PURE__ */ jsx("circle", { cx: "15", cy: "12", r: ".7", fill: "currentColor" })
  ] }),
  Doc: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("path", { d: "M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" }),
    /* @__PURE__ */ jsx("path", { d: "M14 3v5h5" }),
    /* @__PURE__ */ jsx("path", { d: "M9 13h6M9 17h4" })
  ] }),
  Check: (p) => /* @__PURE__ */ jsx("svg", { ...base(p), children: /* @__PURE__ */ jsx("path", { d: "M5 12l4 4 10-10" }) }),
  Shield: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("path", { d: "M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" }),
    /* @__PURE__ */ jsx("path", { d: "M9 12l2 2 4-4" })
  ] }),
  Clock: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ jsx("path", { d: "M12 7v5l3 2" })
  ] }),
  Spark: (p) => /* @__PURE__ */ jsx("svg", { ...base(p), children: /* @__PURE__ */ jsx("path", { d: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" }) }),
  Building: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "16", height: "17", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2M10 21v-3h4v3" })
  ] }),
  Calc: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("rect", { x: "5", y: "3", width: "14", height: "18", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M8 7h8M8 11h2M11 11h2M14 11h2M8 15h2M11 15h2M14 15h2M8 19h8" })
  ] }),
  Lock: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("rect", { x: "5", y: "11", width: "14", height: "9", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M8 11V8a4 4 0 0 1 8 0v3" })
  ] }),
  Sparkle: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("path", { d: "M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z" }),
    /* @__PURE__ */ jsx("path", { d: "M19 16l.7 1.7L21 18l-1.3.3L19 20l-.7-1.7L17 18l1.3-.3z" })
  ] }),
  Stamp: (p) => /* @__PURE__ */ jsx("svg", { ...base(p), children: /* @__PURE__ */ jsx("path", { d: "M5 21h14M7 18h10v3H7zM12 4a3 3 0 0 1 3 3c0 1.7-1 3-1 4v2h-4v-2c0-1-1-2.3-1-4a3 3 0 0 1 3-3z" }) }),
  Arrow: (p) => /* @__PURE__ */ jsx("svg", { ...base(p), children: /* @__PURE__ */ jsx("path", { d: "M5 12h14M13 5l7 7-7 7" }) }),
  Briefcase: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("rect", { x: "3", y: "7", width: "18", height: "13", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" })
  ] }),
  Bolt: (p) => /* @__PURE__ */ jsx("svg", { ...base(p), children: /* @__PURE__ */ jsx("path", { d: "M13 2L4 14h6l-1 8 9-12h-6z" }) }),
  Globe: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ jsx("path", { d: "M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" })
  ] }),
  Mail: (p) => /* @__PURE__ */ jsxs("svg", { ...base(p), children: [
    /* @__PURE__ */ jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M3 7l9 6 9-6" })
  ] })
};
const BASE = `${apiBase()}/swivo/v1`;
async function call(path, init = {}) {
  try {
    const headers = new Headers(init.headers ?? {});
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (init.nonce) headers.set("X-WP-Nonce", init.nonce);
    const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
async function fetchProfilEmetteur() {
  return call("/me/profil");
}
async function pushProfilEmetteur(body, nonce) {
  return call("/me/profil", { method: "PUT", body: JSON.stringify(body), nonce });
}
async function fetchEncaissements() {
  return call("/me/encaissements");
}
async function pushEncaissement(e, nonce) {
  return call("/me/encaissements", { method: "POST", body: JSON.stringify(e), nonce });
}
async function delEncaissement(id, nonce) {
  return call(`/me/encaissements/${encodeURIComponent(id)}`, { method: "DELETE", nonce });
}
async function fetchDepenses() {
  return call("/me/depenses");
}
async function pushDepense(d, nonce) {
  return call("/me/depenses", { method: "POST", body: JSON.stringify(d), nonce });
}
async function delDepense(id, nonce) {
  return call(`/me/depenses/${encodeURIComponent(id)}`, { method: "DELETE", nonce });
}
async function fetchBillingClients() {
  return call("/me/billing/clients");
}
async function pushBillingClient(c, nonce) {
  return call("/me/billing/clients", { method: "POST", body: JSON.stringify(c), nonce });
}
async function delBillingClient(id, nonce) {
  return call(`/me/billing/clients/${encodeURIComponent(id)}`, { method: "DELETE", nonce });
}
async function fetchBillingCatalog() {
  return call("/me/billing/catalog");
}
async function pushBillingCatalog(c, nonce) {
  return call("/me/billing/catalog", { method: "POST", body: JSON.stringify(c), nonce });
}
async function delBillingCatalog(id, nonce) {
  return call(`/me/billing/catalog/${encodeURIComponent(id)}`, { method: "DELETE", nonce });
}
async function fetchBillingDocs() {
  return call("/me/billing/docs");
}
async function pushBillingDoc(d, nonce) {
  return call("/me/billing/docs", { method: "POST", body: JSON.stringify(d), nonce });
}
async function delBillingDoc(id, nonce) {
  return call(`/me/billing/docs/${encodeURIComponent(id)}`, { method: "DELETE", nonce });
}
async function fetchDocuments() {
  return call("/me/documents");
}
async function uploadDocument(file, slot, draftId, nonce) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slot", slot);
    if (draftId) fd.append("draft_id", String(draftId));
    const headers = { Accept: "application/json" };
    if (nonce) headers["X-WP-Nonce"] = nonce;
    const res = await fetch(`${BASE}/me/documents`, { method: "POST", headers, credentials: "include", body: fd });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
    }
    if (!res.ok) {
      const msg = (data == null ? void 0 : data.message) || (data == null ? void 0 : data.code) || `Erreur ${res.status}`;
      return { ok: false, error: String(msg) };
    }
    return { ok: true, doc: data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Réseau indisponible" };
  }
}
async function deleteDocument(id, nonce) {
  return call(`/me/documents/${id}`, { method: "DELETE", nonce });
}
const DOCUMENTS_SLOTS_MICRO = [
  { key: "cni_recto", titre: "Pièce d’identité (recto)", description: "CNI ou passeport en cours de validité, lisible couleur.", obligatoire: true, formatAccepte: "image/*,application/pdf" },
  { key: "cni_verso", titre: "Pièce d’identité (verso)", description: "Verso CNI (avec MRZ) — optionnel si passeport.", obligatoire: false, formatAccepte: "image/*,application/pdf" },
  { key: "justif_domicile", titre: "Justificatif de domicile", description: "Facture EDF/GDF/internet ou quittance de loyer < 3 mois.", obligatoire: true, formatAccepte: "application/pdf,image/*" },
  { key: "non_condamnation", titre: "Déclaration de non-condamnation", description: "Modèle disponible dans /outils/modeles. À dater et signer.", obligatoire: true, formatAccepte: "application/pdf" },
  { key: "attestation_dom_dir", titre: "Attestation domiciliation chez le dirigeant", description: "Si siège chez vous. Modèle dans /outils/modeles.", obligatoire: false, formatAccepte: "application/pdf", conditions: (d) => {
    var _a;
    return ((_a = d.etablissementPrincipal) == null ? void 0 : _a.domiciliation) === "chez_dirigeant";
  } },
  { key: "bail_local", titre: "Bail commercial / professionnel", description: "Si local loué pour le siège.", obligatoire: false, formatAccepte: "application/pdf", conditions: (d) => {
    var _a, _b;
    return ((_a = d.etablissementPrincipal) == null ? void 0 : _a.domiciliation) === "locataire_bail" || ((_b = d.etablissementPrincipal) == null ? void 0 : _b.domiciliation) === "bail_commercial";
  } },
  { key: "contrat_dom", titre: "Contrat de domiciliation", description: "Avec société agréée préfecture.", obligatoire: false, formatAccepte: "application/pdf", conditions: (d) => {
    var _a;
    return ((_a = d.etablissementPrincipal) == null ? void 0 : _a.domiciliation) === "societe_domiciliation";
  } },
  { key: "qualif_pro", titre: "Qualification professionnelle", description: "Diplôme / CAP / BEP / attestation expérience pour activité réglementée ou artisanale qualifiée.", obligatoire: false, formatAccepte: "application/pdf,image/*", conditions: (d) => {
    var _a, _b, _c, _d;
    return !!((_b = (_a = d.activites) == null ? void 0 : _a[0]) == null ? void 0 : _b.reglementee) || ((_d = (_c = d.activites) == null ? void 0 : _c[0]) == null ? void 0 : _d.categorie) === "artisanale";
  } },
  { key: "rib_perso", titre: "RIB compte bancaire", description: "Pour les prélèvements URSSAF (compte dédié si CA > 10 000 €/an pendant 2 ans).", obligatoire: false, formatAccepte: "application/pdf,image/*" },
  { key: "acre", titre: "Formulaire ACRE", description: "Si demande ACRE. À transmettre URSSAF sous 45 jours.", obligatoire: false, formatAccepte: "application/pdf", conditions: (d) => {
    var _a;
    return ((_a = d.options) == null ? void 0 : _a.acre) === true;
  } }
];
function documentsApplicables(d) {
  return DOCUMENTS_SLOTS_MICRO.filter((s) => !s.conditions || s.conditions(d));
}
function DocumentsManager({ dossier, draftId }) {
  const { nonce } = useAuth();
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [busySlot, setBusySlot] = useState(null);
  const slots = documentsApplicables(dossier);
  useEffect(() => {
    fetchDocuments().then((d) => {
      if (d) setDocs(d);
    });
  }, []);
  async function handleUpload(slot, file) {
    setBusySlot(slot.key);
    const res = await uploadDocument(file, slot.key, draftId, nonce);
    setBusySlot(null);
    if (res.ok) {
      const doc = res.doc;
      setDocs((arr) => [doc, ...arr.filter((x) => x.slot !== slot.key || x.id !== doc.id)]);
      toast.push({ kind: "success", message: `${slot.titre} téléversé`, ttl: 2500 });
    } else {
      toast.push({ kind: "error", title: "Échec de l'upload", message: res.error, ttl: 6e3 });
    }
  }
  async function remove(d) {
    if (!confirm("Supprimer ce fichier ?")) return;
    await deleteDocument(d.id, nonce);
    setDocs((arr) => arr.filter((x) => x.id !== d.id));
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Téléversez maintenant ou plus tard depuis votre espace. Les pièces obligatoires doivent être fournies avant la transmission INPI. Formats acceptés : PDF, JPG, PNG, HEIC. Max 10 Mo par fichier." }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: slots.map((s) => {
      const uploaded = docs.find((d) => d.slot === s.key);
      return /* @__PURE__ */ jsx(
        SlotRow,
        {
          slot: s,
          uploaded,
          busy: busySlot === s.key,
          onUpload: (f) => handleUpload(s, f),
          onRemove: (d) => remove(d)
        },
        s.key
      );
    }) }),
    docs.filter((d) => !slots.find((s) => s.key === d.slot)).length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "Autres documents" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1", children: docs.filter((d) => !slots.find((s) => s.key === d.slot)).map((d) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("a", { href: d.fileUrl ?? "#", target: "_blank", rel: "noopener", className: "truncate font-medium text-primary-700 hover:underline", children: d.fileName }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
            (d.size / 1024).toFixed(0),
            " Ko · ",
            d.slot
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => remove(d), className: "text-rose-600 hover:text-rose-800", "aria-label": "Supprimer", children: "×" })
      ] }, d.id)) })
    ] })
  ] });
}
function SlotRow({ slot, uploaded, busy, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  function onDrop(e) {
    var _a;
    e.preventDefault();
    setDrag(false);
    const f = (_a = e.dataTransfer.files) == null ? void 0 : _a[0];
    if (f) onUpload(f);
  }
  return /* @__PURE__ */ jsx(
    "li",
    {
      onDragOver: (e) => {
        e.preventDefault();
        setDrag(true);
      },
      onDragLeave: () => setDrag(false),
      onDrop,
      className: `rounded-xl border p-4 transition ${drag ? "border-primary-500 bg-primary-50" : uploaded ? "border-secondary-300 bg-secondary-50/40" : slot.obligatoire ? "border-rose-200 bg-rose-50/30" : "border-surface-border bg-surface"}`,
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("strong", { className: "text-sm text-ink", children: slot.titre }),
            slot.obligatoire ? /* @__PURE__ */ jsx("span", { className: "badge bg-rose-100 text-rose-700", children: "Obligatoire" }) : /* @__PURE__ */ jsx("span", { className: "badge bg-ink-muted/10 text-ink-muted", children: "Facultatif" }),
            uploaded && /* @__PURE__ */ jsx("span", { className: "badge bg-secondary-100 text-secondary-800", children: "✓ Téléversé" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: slot.description }),
          uploaded && /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2 text-xs", children: [
            /* @__PURE__ */ jsx("a", { href: uploaded.fileUrl ?? "#", target: "_blank", rel: "noopener", className: "truncate text-primary-700 hover:underline", children: uploaded.fileName }),
            /* @__PURE__ */ jsxs("span", { className: "text-ink-muted", children: [
              (uploaded.size / 1024).toFixed(0),
              " Ko"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: slot.formatAccepte,
              hidden: true,
              onChange: (e) => {
                var _a;
                const f = (_a = e.target.files) == null ? void 0 : _a[0];
                if (f) onUpload(f);
                e.target.value = "";
              }
            }
          ),
          uploaded ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { onClick: () => {
              var _a;
              return (_a = inputRef.current) == null ? void 0 : _a.click();
            }, className: "btn-ghost text-xs", disabled: busy, children: busy ? "…" : "Remplacer" }),
            /* @__PURE__ */ jsx("button", { onClick: () => onRemove(uploaded), className: "text-xs text-rose-600 hover:underline", children: "Supprimer" })
          ] }) : /* @__PURE__ */ jsx("button", { onClick: () => {
            var _a;
            return (_a = inputRef.current) == null ? void 0 : _a.click();
          }, className: "btn-outline text-xs", disabled: busy, children: busy ? "…" : "+ Téléverser" })
        ] })
      ] })
    }
  );
}
const LOCAL_KEY = "swivo.formalites.dossier.v2";
const LOCAL_DRAFT_KEY = "swivo.formalites.draft.ref.v1";
function FormalitesWizard({ initialDraft, onComplete }) {
  const nav = useNavigate();
  const { nonce, user } = useAuth();
  const toast = useToast();
  const [dossier, setDossier] = useState(() => {
    if (initialDraft == null ? void 0 : initialDraft.payload) return initialDraft.payload;
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
    }
    return { ...newDossier(), mandat: buildMandat() };
  });
  const [currentId, setCurrentId] = useState(() => {
    var _a;
    const saved = lastStepId(dossier);
    if (saved) {
      const q = QUESTIONS.find((qq) => qq.id === saved);
      const p = computeProfil(dossier);
      if (q && q.applicable(dossier, p)) return saved;
    }
    return ((_a = nextQuestion(dossier)) == null ? void 0 : _a.id) ?? QUESTIONS[0].id;
  });
  const [draftRef, setDraftRef] = useState(() => {
    if (initialDraft) return { id: initialDraft.id, token: initialDraft.token };
    try {
      const stored = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
    }
    return null;
  });
  const [saveState, setSaveState] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const lastSerialized = useRef("");
  const cardRef = useRef(null);
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(dossier));
    } catch {
    }
  }, [dossier]);
  useEffect(() => {
    var _a;
    if (typeof window === "undefined") return;
    const reduce = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-reduced-motion: reduce)").matches;
    const behavior = reduce ? "auto" : "smooth";
    if (cardRef.current) {
      const top = cardRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, top), behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }, [currentId]);
  useEffect(() => {
    try {
      if (draftRef) localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draftRef));
      else localStorage.removeItem(LOCAL_DRAFT_KEY);
    } catch {
    }
  }, [draftRef]);
  useEffect(() => {
    const serialized = JSON.stringify(dossier);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      var _a, _b, _c, _d;
      setSaveState("saving");
      const report2 = validate(dossier);
      const payload = { ...dossier, scoreCompletude: report2.scoreCompletude };
      const r = await saveDraft(payload, { id: draftRef == null ? void 0 : draftRef.id, token: draftRef == null ? void 0 : draftRef.token, nonce });
      if (r.ok && r.data) {
        const ref = { id: r.data.id, token: r.data.token ?? (draftRef == null ? void 0 : draftRef.token) ?? null };
        setDraftRef(ref);
        setSavedAt(r.data.savedAt);
        setSaveState("saved");
        if (!user && ref.token) {
          upsertAnonDraft({ id: ref.id, token: ref.token, forme: dossier.forme, score: report2.scoreCompletude, savedAt: r.data.savedAt });
          const persoDir = ((_b = (_a = dossier.dirigeants) == null ? void 0 : _a[0]) == null ? void 0 : _b.personne) ?? ((_d = (_c = dossier.associes) == null ? void 0 : _c[0]) == null ? void 0 : _d.personne);
          if (persoDir && (persoDir.prenom || persoDir.email)) {
            setAnonIdentite({ prenom: persoDir.prenom, nom: persoDir.nom, email: persoDir.email, telephone: persoDir.telephone });
          }
        }
      } else {
        setSaveState("offline");
        toast.push({ kind: "warning", title: "Sauvegarde hors-ligne", message: "Le serveur est injoignable. Vos données restent en local jusqu’à reconnexion.", ttl: 4e3 });
      }
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dossier, draftRef, nonce, user]);
  const current = QUESTIONS.find((q) => q.id === currentId) ?? QUESTIONS[0];
  const idx = questionIndex(dossier, currentId);
  const total = totalQuestions(dossier);
  const progress = Math.round((idx + 1) / total * 100);
  const report = useMemo(() => validate(dossier), [dossier]);
  const docs = useMemo(() => documentsRequis(dossier), [dossier]);
  const recos = useMemo(() => recommander(computeProfil(dossier)), [dossier]);
  function submit(value) {
    var _a;
    const errors = ((_a = current.validateStep) == null ? void 0 : _a.call(current, value, dossier)) ?? [];
    if (errors.length) {
      toast.push({
        kind: "error",
        title: `Erreur — ${current.title}`,
        message: errors.join("\n"),
        ttl: 6e3
      });
      return;
    }
    const updated = current.apply(value, dossier);
    if (current.id === "final_recap") {
      const report2 = validate(updated);
      if (!report2.pretATransmettre) {
        toast.push({
          kind: "error",
          title: "Dossier incomplet",
          message: report2.issues.filter((i) => i.level === "error").slice(0, 5).map((i) => "• " + i.message).join("\n") || "Erreurs détectées.",
          ttl: 8e3
        });
        return;
      }
    }
    const nxt = nextQuestion(updated, currentId);
    const nextId = (nxt == null ? void 0 : nxt.id) ?? currentId;
    setDossier(withLastStep(updated, nextId));
    if (nxt) setCurrentId(nxt.id);
    else onComplete == null ? void 0 : onComplete(updated);
  }
  function back() {
    const prev = previousQuestion(dossier, currentId);
    if (prev) {
      setDossier((d) => withLastStep(d, prev.id));
      setCurrentId(prev.id);
    }
  }
  async function pauseAndExit() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    const report2 = validate(dossier);
    const payload = { ...dossier, scoreCompletude: report2.scoreCompletude };
    const r = await saveDraft(payload, { id: draftRef == null ? void 0 : draftRef.id, token: draftRef == null ? void 0 : draftRef.token, nonce });
    if (r.ok && r.data) {
      setDraftRef({ id: r.data.id, token: r.data.token ?? (draftRef == null ? void 0 : draftRef.token) ?? null });
      setSavedAt(r.data.savedAt);
      setSaveState("saved");
    }
    nav("/espace-createur");
  }
  async function finalize(opts) {
    var _a, _b;
    if (!draftRef) return;
    const r = await finalizeDraft(draftRef.id, draftRef.token, nonce);
    if (!r.ok) return;
    const newId = ((_a = r.data) == null ? void 0 : _a.id) ?? draftRef.id;
    try {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      localStorage.removeItem(LOCAL_KEY);
    } catch {
    }
    onComplete == null ? void 0 : onComplete(dossier);
    if (opts == null ? void 0 : opts.pay) {
      const co = await startCheckout(newId, nonce);
      if (co.ok && ((_b = co.data) == null ? void 0 : _b.url)) {
        window.location.href = co.data.url;
        return;
      }
      nav("/espace-createur?finalized=" + newId + "&pay=1");
      return;
    }
    nav("/espace-createur?finalized=" + newId);
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_360px]", children: [
    /* @__PURE__ */ jsxs("div", { ref: cardRef, className: "card overflow-hidden scroll-mt-24", children: [
      /* @__PURE__ */ jsxs("header", { className: "border-b border-surface-border bg-surface-muted px-4 py-3 sm:px-5 sm:py-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] uppercase tracking-wider text-ink-muted", children: [
              idx + 1,
              "/",
              total,
              " · ",
              current.category
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "font-display text-base font-semibold leading-snug text-ink sm:text-lg", title: current.title, children: current.title })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(SaveBadge, { state: saveState, savedAt }),
            /* @__PURE__ */ jsxs("span", { className: "badge-secondary whitespace-nowrap", children: [
              progress,
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all", style: { width: `${progress}%` } }) }),
        current.help && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-ink-muted sm:text-sm", children: current.help })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsx(FieldRenderer, { field: current.field, dossier, question: current, onSubmit: submit, onFinalize: finalize, recos, docs, report, initial: currentValue(dossier, current.id) }) }, current.id),
      /* @__PURE__ */ jsxs("footer", { className: "grid grid-cols-2 gap-2 border-t border-surface-border bg-surface px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:px-5", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "btn-ghost col-span-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm",
            onClick: back,
            disabled: idx <= 0,
            children: [
              "← ",
              /* @__PURE__ */ jsx("span", { className: "sm:inline", children: " Précédent" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1 flex items-center justify-end gap-1.5 sm:gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: pauseAndExit,
              className: "btn-outline inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-xs",
              title: "Reprendre plus tard",
              children: [
                "⏸ ",
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: " Reprendre plus tard" }),
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: " Plus tard" })
              ]
            }
          ),
          report.pretATransmettre && draftRef && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => void finalize({ pay: true }),
              className: "btn-secondary inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-xs",
              title: "Finaliser et payer maintenant",
              children: [
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Finaliser & transmettre" }),
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Finaliser" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("aside", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold text-ink", children: "Conformité INPI" }),
          /* @__PURE__ */ jsxs("span", { className: `badge ${report.scoreConformite >= 90 ? "bg-secondary-100 text-secondary-800" : report.scoreConformite >= 70 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`, children: [
            report.scoreConformite,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: report.pretATransmettre ? "✅ Dossier prêt à transmettre" : `${report.issues.filter((i) => i.level === "error").length} erreur(s), ${report.issues.filter((i) => i.level === "warn").length} avertissement(s)` }),
        !report.pretATransmettre && /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-1.5 text-xs", children: [
          report.issues.slice(0, 5).map((i) => /* @__PURE__ */ jsxs("li", { className: i.level === "error" ? "text-rose-700" : "text-amber-700", children: [
            "• ",
            i.message
          ] }, i.code)),
          report.issues.length > 5 && /* @__PURE__ */ jsxs("li", { className: "text-ink-muted", children: [
            "+ ",
            report.issues.length - 5,
            " autres"
          ] })
        ] })
      ] }),
      dossier.forme && /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "Forme" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-lg font-semibold text-ink", children: FORMES[dossier.forme].label }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 list-disc space-y-0.5 pl-4 text-xs text-ink-muted", children: FORMES[dossier.forme].particularites.slice(0, 3).map((p) => /* @__PURE__ */ jsx("li", { children: p }, p)) }),
        recos.length > 1 && /* @__PURE__ */ jsxs("details", { className: "mt-3 text-xs", children: [
          /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-primary-700", children: "Autres formes éligibles" }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1", children: recos.filter((r) => r.forme !== dossier.forme && r.eligible).slice(0, 3).map((r) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-ink", children: FORMES[r.forme].shortLabel }),
            /* @__PURE__ */ jsxs("span", { className: "text-ink-muted", children: [
              r.score,
              "%"
            ] })
          ] }, r.forme)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-display text-sm font-semibold text-ink", children: [
          "Pièces requises (",
          docs.filter((d) => d.obligatoire).length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-2 space-y-1 text-xs text-ink-muted", children: [
          docs.slice(0, 6).map((d) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${d.obligatoire ? "bg-rose-500" : "bg-ink-muted/40"}` }),
            /* @__PURE__ */ jsx("span", { className: d.obligatoire ? "text-ink" : "", children: d.titre })
          ] }, d.code)),
          docs.length > 6 && /* @__PURE__ */ jsxs("li", { className: "text-primary-700", children: [
            "+ ",
            docs.length - 6,
            " autres"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function FieldRenderer({
  field,
  dossier,
  question,
  onSubmit,
  onFinalize,
  recos,
  docs,
  report,
  initial
}) {
  var _a;
  switch (field.kind) {
    case "choice":
      return /* @__PURE__ */ jsx(ChoiceField, { field, onSubmit, initial: typeof initial === "string" ? initial : void 0 });
    case "text":
    case "email":
    case "tel": {
      const placeholder = "placeholder" in field ? field.placeholder : void 0;
      const multi = "multiline" in field && field.multiline;
      return /* @__PURE__ */ jsx(TextField, { multiline: !!multi, placeholder, type: field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text", onSubmit, initial: initial ?? "" });
    }
    case "number":
      return /* @__PURE__ */ jsx(NumberField, { placeholder: "0", suffix: field.suffix, min: field.min, max: field.max, onSubmit: (v) => onSubmit(v), initial });
    case "date":
      return /* @__PURE__ */ jsx(DateField, { onSubmit, initial: typeof initial === "string" ? initial : "" });
    case "address":
      return /* @__PURE__ */ jsx(AddressField, { initial: initial ?? ((_a = dossier.etablissementPrincipal) == null ? void 0 : _a.adresse), onSubmit });
    case "activity-search":
      return /* @__PURE__ */ jsx(ActivitySearch, { onSubmit, initial: typeof initial === "string" ? initial : "" });
    case "persons":
      return /* @__PURE__ */ jsx(PersonsEditor, { subject: field.subject, dossier, onSubmit });
    case "capital-table":
      return /* @__PURE__ */ jsx(CapitalTable, { dossier, onSubmit });
    case "documents-checklist":
      return /* @__PURE__ */ jsx(DocsChecklist, { docs, onContinue: () => onSubmit(true) });
    case "documents-upload":
      return /* @__PURE__ */ jsx(DocsUploadStep, { dossier, onContinue: () => onSubmit(true) });
    case "nir":
      return /* @__PURE__ */ jsx(NirStep, { onSubmit, onSkip: () => onSubmit("") });
    case "id-scan":
      return /* @__PURE__ */ jsx(IdScanStep, { onSubmit, onSkip: () => onSubmit(null) });
    case "mandat-accept":
      return /* @__PURE__ */ jsx(MandatAccept, { dossier, onSubmit });
    case "recap":
      return /* @__PURE__ */ jsx(Recap, { dossier, report, recos, question, onSubmit, onFinalize });
  }
}
function ChoiceField({ field, onSubmit, initial }) {
  const { options, columns = 2, visual = "compact" } = field;
  const cols = columns === 4 ? "sm:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : columns === 1 ? "" : "sm:grid-cols-2";
  const baseDelay = 70;
  if (visual === "tiles") {
    return /* @__PURE__ */ jsx("div", { className: `grid gap-3 ${cols}`, children: options.map((o, i) => {
      const onlyIcon = o.iconOnly && o.icon;
      const selected = initial === o.value;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onSubmit(o.value),
          className: `group relative flex flex-col items-center justify-center gap-2 rounded-2xl border bg-surface px-4 py-6 text-center opacity-0 transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-soft motion-safe:animate-tile-in ${selected ? "border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/20" : "border-surface-border"}`,
          style: { animationDelay: `${i * baseDelay}ms`, animationFillMode: "forwards" },
          children: [
            o.icon && /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: `block ${onlyIcon ? "text-5xl" : "text-3xl"} transition-transform group-hover:scale-110`, children: o.icon }),
            !onlyIcon && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: o.label }),
              o.hint && /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: o.hint })
            ] }),
            onlyIcon && /* @__PURE__ */ jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-ink-muted", children: o.label })
          ]
        },
        o.value
      );
    }) });
  }
  return /* @__PURE__ */ jsx("div", { className: `grid gap-2 ${cols}`, children: options.map((o, i) => {
    const selected = initial === o.value;
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onSubmit(o.value),
        className: `group flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-left opacity-0 transition hover:border-primary-500 hover:bg-primary-50/40 motion-safe:animate-tile-in ${selected ? "border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/20" : "border-surface-border"}`,
        style: { animationDelay: `${i * baseDelay}ms`, animationFillMode: "forwards" },
        children: [
          o.icon ? /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "text-xl", children: o.icon }) : /* @__PURE__ */ jsx("span", { className: "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-surface-border group-hover:border-primary-600 group-hover:bg-primary-600 group-hover:text-ink-inverse", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-3 w-3 opacity-0 group-hover:opacity-100", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { d: "M5 12l4 4 10-10" }) }) }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: o.label }),
            o.hint && /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: o.hint })
          ] })
        ]
      },
      o.value
    );
  }) });
}
function TextField({ placeholder, multiline, type = "text", onSubmit, initial = "" }) {
  const [v, setV] = useState(initial);
  const submit = (e) => {
    e.preventDefault();
    if (!v.trim()) return;
    onSubmit(v.trim());
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
    multiline ? /* @__PURE__ */ jsx("textarea", { className: "input min-h-[100px]", placeholder, value: v, onChange: (e) => setV(e.target.value), autoFocus: true }) : /* @__PURE__ */ jsx("input", { type, className: "input", placeholder, value: v, onChange: (e) => setV(e.target.value), autoFocus: true }),
    /* @__PURE__ */ jsxs("button", { className: "btn-primary", type: "submit", children: [
      "Continuer ",
      /* @__PURE__ */ jsx(Icon.Arrow, { className: "h-4 w-4" })
    ] })
  ] });
}
function NumberField({ placeholder, suffix, min, max, onSubmit, initial }) {
  const [v, setV] = useState(initial != null ? String(initial) : "");
  return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    const n = parseFloat(v.replace(",", "."));
    if (Number.isNaN(n)) return;
    onSubmit(n);
  }, className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("input", { type: "number", className: "input", placeholder, value: v, onChange: (e) => setV(e.target.value), min, max, step: "any", autoFocus: true }),
      suffix && /* @__PURE__ */ jsx("span", { className: "self-center text-sm text-ink-muted", children: suffix })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "btn-primary", type: "submit", children: "Continuer" })
  ] });
}
function DateField({ onSubmit, initial = "" }) {
  const [v, setV] = useState(initial);
  return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    if (!v) return;
    onSubmit(v);
  }, className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "swivo-date", className: "label", children: "📅 Date de naissance" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "swivo-date",
          type: "date",
          className: "input max-w-[220px]",
          value: v,
          onChange: (e) => setV(e.target.value),
          autoFocus: true,
          min: "1900-01-01",
          max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          "aria-label": "Date de naissance"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: "Format JJ/MM/AAAA — utilisé pour la vérification d'identité Guichet unique." })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "btn-primary", type: "submit", disabled: !v, children: "Continuer" })
  ] });
}
function AddressField({ initial, onSubmit }) {
  const [a, setA] = useState(initial ?? { pays: "FRA" });
  const [query, setQuery] = useState((initial == null ? void 0 : initial.voie) ? [initial.voie, initial.codePostal, initial.commune].filter(Boolean).join(" ") : "");
  const [sugg, setSugg] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (query.trim().length < 3) {
      setSugg([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      const { searchAddress } = await import("./ban-B2NQLvb3.js");
      const r = await searchAddress(query, { signal: ctrl.signal, limit: 6 });
      setSugg(r);
      setLoading(false);
      setOpen(r.length > 0);
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);
  function applySuggestion(s) {
    const next = { ...a, voie: s.voie, codePostal: s.codePostal, commune: s.commune, pays: "FRA" };
    setA(next);
    setQuery(s.label);
    setOpen(false);
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    onSubmit(a);
  }, className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "input",
          placeholder: "Tapez votre adresse (ex : 12 rue de la République Paris)",
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            setOpen(true);
          },
          onFocus: () => sugg.length && setOpen(true),
          onBlur: () => setTimeout(() => setOpen(false), 150),
          autoFocus: true,
          "aria-autocomplete": "list",
          "aria-expanded": open
        }
      ),
      loading && /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted", children: "…" }),
      open && sugg.length > 0 && /* @__PURE__ */ jsx("ul", { className: "absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-surface-border bg-surface shadow-elevated", children: sugg.map((s, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onMouseDown: (e) => e.preventDefault(),
          onClick: () => applySuggestion(s),
          className: "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50",
          children: [
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "mt-0.5 text-primary-600", children: "📍" }),
            /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: "block truncate font-medium text-ink", children: s.label }),
              /* @__PURE__ */ jsx("span", { className: "block truncate text-xs text-ink-muted", children: s.context })
            ] })
          ]
        }
      ) }, `${s.label}-${i}`)) })
    ] }),
    /* @__PURE__ */ jsxs("details", { className: "text-xs text-ink-muted", children: [
      /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Modifier manuellement" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
        /* @__PURE__ */ jsx("input", { className: "input", placeholder: "N° + voie", value: a.voie ?? "", onChange: (e) => setA({ ...a, voie: e.target.value }) }),
        /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Complément (bât., étage)", value: a.complement ?? "", onChange: (e) => setA({ ...a, complement: e.target.value }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-[120px_1fr]", children: [
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "75001", inputMode: "numeric", maxLength: 5, value: a.codePostal ?? "", onChange: (e) => setA({ ...a, codePostal: e.target.value }) }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Commune", value: a.commune ?? "", onChange: (e) => setA({ ...a, commune: e.target.value }) })
        ] })
      ] })
    ] }),
    (a.voie || a.codePostal || a.commune) && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm text-secondary-900", children: [
      "✅ ",
      /* @__PURE__ */ jsx("strong", { children: a.voie }),
      a.complement ? `, ${a.complement}` : "",
      a.codePostal || a.commune ? `, ${a.codePostal ?? ""} ${a.commune ?? ""}` : ""
    ] }),
    /* @__PURE__ */ jsx("button", { className: "btn-primary", type: "submit", disabled: !a.voie || !a.codePostal || !a.commune, children: "Continuer" })
  ] });
}
function ActivitySearch({ onSubmit, initial = "" }) {
  const [q, setQ] = useState(initial);
  const sugg = useMemo(() => searchActivites(q), [q]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Tapez votre activité (ex : coiffure, dev web, restaurant)", value: q, onChange: (e) => setQ(e.target.value), autoFocus: true }),
    q && /* @__PURE__ */ jsxs("button", { onClick: () => onSubmit(q), className: "btn-outline text-xs", children: [
      "Garder « ",
      q.slice(0, 50),
      " »"
    ] }),
    sugg.length > 0 && /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: sugg.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => onSubmit(s.libelle), className: "flex w-full items-start justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 text-left hover:border-primary-500", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { className: "block text-sm text-ink", children: s.libelle }),
        /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: s.categorie })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-primary-700", children: s.ape })
    ] }) }, s.ape)) })
  ] });
}
function PersonsEditor({ subject, dossier, onSubmit }) {
  const initial = subject === "associes" ? dossier.associes ?? [] : subject === "dirigeants" ? dossier.dirigeants ?? [] : dossier.beneficiairesEffectifs ?? [];
  const [items, setItems] = useState(initial.length ? initial : [emptyItem(subject)]);
  function update(i, patch) {
    setItems((arr) => arr.map((it, j) => j === i ? { ...it, ...patch } : it));
  }
  function updatePersonne(i, patch) {
    setItems((arr) => arr.map((it, j) => j === i ? { ...it, personne: { ...it.personne ?? {}, ...patch } } : it));
  }
  function add() {
    setItems((arr) => [...arr, emptyItem(subject)]);
  }
  function remove(i) {
    setItems((arr) => arr.filter((_, j) => j !== i));
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    items.map((it, i) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
      return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-surface-border bg-surface-muted/40 p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("strong", { className: "text-sm", children: [
            titreSubject(subject),
            " #",
            i + 1
          ] }),
          items.length > 1 && /* @__PURE__ */ jsx("button", { onClick: () => remove(i), className: "text-xs text-rose-600", children: "Retirer" })
        ] }),
        subject === "dirigeants" && /* @__PURE__ */ jsxs("select", { className: "input mb-3", value: it.fonction ?? "", onChange: (e) => update(i, { fonction: e.target.value }), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "— Fonction —" }),
          /* @__PURE__ */ jsx("option", { value: "president", children: "Président" }),
          /* @__PURE__ */ jsx("option", { value: "directeur_general", children: "Directeur général" }),
          /* @__PURE__ */ jsx("option", { value: "gerant", children: "Gérant" }),
          /* @__PURE__ */ jsx("option", { value: "gerant_majoritaire", children: "Gérant majoritaire" }),
          /* @__PURE__ */ jsx("option", { value: "gerant_minoritaire", children: "Gérant minoritaire" }),
          /* @__PURE__ */ jsx("option", { value: "cogerant", children: "Co-gérant" })
        ] }),
        subject === "beneficiaires" && /* @__PURE__ */ jsxs("div", { className: "mb-3 grid gap-2 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("select", { className: "input", value: it.qualite ?? "", onChange: (e) => update(i, { qualite: e.target.value }), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Qualité contrôle" }),
            /* @__PURE__ */ jsx("option", { value: "detention_capital", children: "Détention > 25% capital" }),
            /* @__PURE__ */ jsx("option", { value: "detention_droits_vote", children: "Détention > 25% vote" }),
            /* @__PURE__ */ jsx("option", { value: "controle_autre", children: "Autre contrôle" }),
            /* @__PURE__ */ jsx("option", { value: "dirigeant_defaut", children: "Dirigeant (à défaut)" })
          ] }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "% capital", inputMode: "decimal", value: it.pctCapital ?? "", onChange: (e) => update(i, { pctCapital: parseFloat(e.target.value) || 0 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-[100px_1fr_1fr]", children: [
          /* @__PURE__ */ jsxs("select", { className: "input", value: ((_a = it.personne) == null ? void 0 : _a.civilite) ?? "", onChange: (e) => updatePersonne(i, { civilite: e.target.value }), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Civilité" }),
            /* @__PURE__ */ jsx("option", { value: "M", children: "M." }),
            /* @__PURE__ */ jsx("option", { value: "Mme", children: "Mme" })
          ] }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Prénom", value: ((_b = it.personne) == null ? void 0 : _b.prenom) ?? "", onChange: (e) => updatePersonne(i, { prenom: e.target.value }) }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Nom", value: ((_c = it.personne) == null ? void 0 : _c.nom) ?? "", onChange: (e) => updatePersonne(i, { nom: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-2 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] uppercase tracking-wider text-ink-muted", children: "📅 Date de naissance" }),
            /* @__PURE__ */ jsx("input", { type: "date", className: "input max-w-[220px]", value: ((_d = it.personne) == null ? void 0 : _d.dateNaissance) ?? "", onChange: (e) => updatePersonne(i, { dateNaissance: e.target.value }), "aria-label": "Date de naissance", min: "1900-01-01", max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) })
          ] }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Lieu de naissance", value: ((_e = it.personne) == null ? void 0 : _e.lieuNaissance) ?? "", onChange: (e) => updatePersonne(i, { lieuNaissance: e.target.value }) }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Nationalité (FRA)", maxLength: 3, value: ((_f = it.personne) == null ? void 0 : _f.nationalite) ?? "FRA", onChange: (e) => updatePersonne(i, { nationalite: e.target.value.toUpperCase() }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 grid gap-2 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Email", type: "email", value: ((_g = it.personne) == null ? void 0 : _g.email) ?? "", onChange: (e) => updatePersonne(i, { email: e.target.value }) }),
          /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Téléphone", type: "tel", value: ((_h = it.personne) == null ? void 0 : _h.telephone) ?? "", onChange: (e) => updatePersonne(i, { telephone: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("details", { className: "mt-2 text-xs", children: [
          /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-primary-700", children: "Adresse de domicile" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-2", children: [
            /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Voie", value: ((_j = (_i = it.personne) == null ? void 0 : _i.domicile) == null ? void 0 : _j.voie) ?? "", onChange: (e) => {
              var _a2;
              return updatePersonne(i, { domicile: { ...((_a2 = it.personne) == null ? void 0 : _a2.domicile) ?? {}, voie: e.target.value } });
            } }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-[100px_1fr]", children: [
              /* @__PURE__ */ jsx("input", { className: "input", placeholder: "CP", maxLength: 5, value: ((_l = (_k = it.personne) == null ? void 0 : _k.domicile) == null ? void 0 : _l.codePostal) ?? "", onChange: (e) => {
                var _a2;
                return updatePersonne(i, { domicile: { ...((_a2 = it.personne) == null ? void 0 : _a2.domicile) ?? {}, codePostal: e.target.value } });
              } }),
              /* @__PURE__ */ jsx("input", { className: "input", placeholder: "Commune", value: ((_n = (_m = it.personne) == null ? void 0 : _m.domicile) == null ? void 0 : _n.commune) ?? "", onChange: (e) => {
                var _a2;
                return updatePersonne(i, { domicile: { ...((_a2 = it.personne) == null ? void 0 : _a2.domicile) ?? {}, commune: e.target.value } });
              } })
            ] })
          ] })
        ] })
      ] }, i);
    }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: add, className: "btn-outline", children: "+ Ajouter" }),
      /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(items), className: "btn-primary", children: "Valider" })
    ] })
  ] });
}
function CapitalTable({ dossier, onSubmit }) {
  const [rows, setRows] = useState(dossier.associes.length ? dossier.associes : [{ type: "personne_physique", apport: { numeraire: 0 } }]);
  const total = rows.reduce((s, a) => s + (a.apport.numeraire ?? 0) + (a.apport.nature ?? []).reduce((x, n) => x + n.valeur, 0), 0);
  function update(i, patch) {
    setRows((arr) => arr.map((it, j) => {
      if (j !== i) return it;
      const updated = { ...it, ...patch };
      if (patch.apport) updated.apport = { ...it.apport, ...patch.apport };
      return updated;
    }));
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Détaillez l’apport de chaque associé. Le total constitue le capital social." }),
    /* @__PURE__ */ jsx("div", { className: "-mx-2 overflow-x-auto px-2", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[560px] text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "text-xs uppercase text-ink-muted", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left", children: "Associé" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Numéraire" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Libéré" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Nature" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Parts" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-border", children: rows.map((a, i) => {
        var _a;
        return /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "py-2", children: ((_a = a.personne) == null ? void 0 : _a.prenom) ? `${a.personne.prenom} ${a.personne.nom ?? ""}` : `Associé #${i + 1}` }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { className: "input text-right", type: "number", min: 0, value: a.apport.numeraire ?? 0, onChange: (e) => update(i, { apport: { numeraire: parseFloat(e.target.value) || 0 } }) }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { className: "input text-right", type: "number", min: 0, value: a.apport.numeraireLibere ?? 0, onChange: (e) => update(i, { apport: { numeraireLibere: parseFloat(e.target.value) || 0 } }) }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { className: "input text-right", type: "number", min: 0, value: (a.apport.nature ?? []).reduce((s, n) => s + n.valeur, 0), onChange: (e) => update(i, { apport: { nature: [{ description: "Apport en nature", valeur: parseFloat(e.target.value) || 0 }] } }) }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { className: "input text-right", type: "number", min: 0, value: a.partsSociales ?? 0, onChange: (e) => update(i, { partsSociales: parseInt(e.target.value, 10) || 0 }) }) })
        ] }, i);
      }) }),
      /* @__PURE__ */ jsx("tfoot", { className: "border-t-2 border-surface-border font-semibold", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { className: "py-2", children: "Total capital" }),
        /* @__PURE__ */ jsxs("td", { colSpan: 4, className: "text-right", children: [
          total.toLocaleString("fr-FR"),
          " €"
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(rows), className: "btn-primary", children: "Valider la répartition" })
  ] });
}
function DocsChecklist({ docs, onContinue }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Voici les pièces justificatives à téléverser pour votre formalité. Vous pourrez les déposer après paiement, dans votre espace." }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: docs.map((d) => /* @__PURE__ */ jsx("li", { className: `rounded-lg border p-3 ${d.obligatoire ? "border-rose-200 bg-rose-50/50" : "border-surface-border bg-surface-muted/30"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: `mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${d.obligatoire ? "bg-rose-500" : "bg-ink-muted/40"}` }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("strong", { className: "text-sm", children: d.titre }),
          /* @__PURE__ */ jsx("span", { className: "badge bg-primary-50 text-primary-700", children: d.format }),
          d.obligatoire ? /* @__PURE__ */ jsx("span", { className: "badge bg-rose-100 text-rose-700", children: "Obligatoire" }) : /* @__PURE__ */ jsx("span", { className: "badge bg-ink-muted/10 text-ink-muted", children: "Facultatif" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted", children: d.description }),
        d.contexte.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-muted/80", children: d.contexte.map((c) => /* @__PURE__ */ jsx("li", { children: c }, c)) })
      ] })
    ] }) }, d.code)) }),
    /* @__PURE__ */ jsx("button", { onClick: onContinue, className: "btn-primary", children: "J’ai noté la liste — Continuer" })
  ] });
}
function MandatAccept({ dossier, onSubmit }) {
  var _a, _b, _c;
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(!!((_a = dossier.mandat) == null ? void 0 : _a.accepte));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "max-h-72 overflow-y-auto rounded-xl border border-surface-border bg-surface-muted/30 p-4 font-mono text-xs leading-relaxed text-ink",
        onScroll: (e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setScrolled(true);
        },
        children: /* @__PURE__ */ jsx("pre", { className: "whitespace-pre-wrap font-sans", children: ((_b = dossier.mandat) == null ? void 0 : _b.accepte) ? mandatTexteRendu(dossier) : MANDAT_TEXTE })
      }
    ),
    !scrolled && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "↓ Faites défiler jusqu’en bas pour activer l’acceptation." }),
    /* @__PURE__ */ jsxs("label", { className: `flex items-start gap-3 rounded-lg border p-3 ${checked ? "border-secondary-300 bg-secondary-50" : "border-surface-border bg-surface"} ${!scrolled ? "opacity-50" : ""}`, children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: !scrolled, checked, onChange: (e) => setChecked(e.target.checked), className: "mt-1 h-4 w-4" }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
        "J’accepte le mandat de dépôt INPI (version ",
        (_c = dossier.mandat) == null ? void 0 : _c.versionTexte,
        ") et confirme que les informations fournies sont exactes."
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(checked), disabled: !checked, className: "btn-primary disabled:opacity-50", children: "Signer électroniquement" })
  ] });
}
function Recap({ dossier, report, recos, question, onSubmit, onFinalize }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  if (question.id === "micro_intro") {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-secondary-50 p-6", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-primary", children: "🌱 Micro-entreprise" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display text-2xl font-bold text-ink", children: "Le statut le plus simple pour démarrer" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "✅ ",
            /* @__PURE__ */ jsx("strong", { children: "0 €" }),
            " de frais légaux INPI"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "✅ Comptabilité ",
            /* @__PURE__ */ jsx("strong", { children: "ultra-simplifiée" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "✅ Cotisations URSSAF ",
            /* @__PURE__ */ jsx("strong", { children: "au CA réel" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "✅ Franchise ",
            /* @__PURE__ */ jsx("strong", { children: "TVA" }),
            " jusqu’aux seuils"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "✅ Patrimoine perso ",
            /* @__PURE__ */ jsx("strong", { children: "protégé" }),
            " (RP insaisissable)"
          ] }),
          /* @__PURE__ */ jsx("li", { children: "✅ Pas de capital, pas de statuts" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-ink-muted", children: "Plafonds CA 2026 : 188 700 € (vente) / 77 700 € (service)." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(true), className: "btn-primary w-full sm:w-auto", children: "Démarrer ma déclaration →" })
    ] });
  }
  if (question.id === "recommend") {
    const top = recos[0];
    if (!top) return null;
    const alts = recos.filter((r) => r.eligible && r.forme !== top.forme).slice(0, 5);
    return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-secondary-200 bg-secondary-50 p-5", children: [
        /* @__PURE__ */ jsx("span", { className: "badge-secondary", children: "Recommandation" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-2xl font-bold text-ink", children: FORMES[top.forme].label }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-ink-muted", children: [
          "Score d’adéquation : ",
          /* @__PURE__ */ jsxs("strong", { children: [
            top.score,
            "/100"
          ] })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-1 text-sm", children: top.pour.map((p) => /* @__PURE__ */ jsxs("li", { children: [
          "✅ ",
          p
        ] }, p)) }),
        /* @__PURE__ */ jsxs("button", { onClick: () => onSubmit(true), className: "btn-primary mt-5 w-full sm:w-auto", children: [
          "Continuer avec ",
          FORMES[top.forme].shortLabel,
          " →"
        ] })
      ] }),
      alts.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "mb-3 text-sm font-medium text-ink-muted", children: "Ou choisir une autre forme éligible :" }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: alts.map((alt, i) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onSubmit(alt.forme),
            className: "group flex w-full min-w-0 items-start justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4 text-left opacity-0 transition hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50/40 hover:shadow-soft motion-safe:animate-tile-in",
            style: { animationDelay: `${i * 70}ms`, animationFillMode: "forwards" },
            title: FORMES[alt.forme].label,
            children: [
              /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 flex-1 flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "truncate font-semibold text-ink", children: FORMES[alt.forme].shortLabel }),
                /* @__PURE__ */ jsx("span", { className: "truncate text-xs text-ink-muted", children: alt.pour[0] ?? FORMES[alt.forme].particularites[0] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "badge shrink-0 whitespace-nowrap bg-ink-muted/10 text-ink-muted", children: [
                alt.score,
                "%"
              ] })
            ]
          },
          alt.forme
        )) })
      ] })
    ] });
  }
  if (question.id === "act_ape_confirm") {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        "Code APE indicatif : ",
        /* @__PURE__ */ jsx("strong", { className: "font-mono text-primary-700", children: ((_a = dossier.activites[0]) == null ? void 0 : _a.ape) ?? "—" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
        "Catégorie : ",
        (_b = dossier.activites[0]) == null ? void 0 : _b.categorie
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(true), className: "btn-primary", children: "Continuer" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-surface-border bg-surface-muted/30 p-5", children: [
      /* @__PURE__ */ jsxs("h3", { className: "font-display text-lg font-semibold text-ink", children: [
        "Dossier ",
        report.pretATransmettre ? "✅ prêt" : "⚠️ incomplet"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-ink-muted", children: [
        "Complétude : ",
        report.scoreCompletude,
        "% · Conformité : ",
        report.scoreConformite,
        "%"
      ] }),
      /* @__PURE__ */ jsxs("dl", { className: "mt-4 grid gap-2 text-sm sm:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Row, { k: "Forme", v: dossier.forme ? FORMES[dossier.forme].label : "—" }),
        /* @__PURE__ */ jsx(Row, { k: "Dénomination", v: dossier.denomination }),
        /* @__PURE__ */ jsx(Row, { k: "Activité", v: (_e = (_d = (_c = dossier.activites) == null ? void 0 : _c[0]) == null ? void 0 : _d.description) == null ? void 0 : _e.slice(0, 60) }),
        /* @__PURE__ */ jsx(Row, { k: "Siège", v: (_g = (_f = dossier.etablissementPrincipal) == null ? void 0 : _f.adresse) == null ? void 0 : _g.commune }),
        /* @__PURE__ */ jsx(Row, { k: "Capital", v: ((_h = dossier.capital) == null ? void 0 : _h.montantTotal) ? `${dossier.capital.montantTotal} €` : "—" }),
        /* @__PURE__ */ jsx(Row, { k: "Associés", v: String(((_i = dossier.associes) == null ? void 0 : _i.length) ?? 0) }),
        /* @__PURE__ */ jsx(Row, { k: "Dirigeants", v: String(((_j = dossier.dirigeants) == null ? void 0 : _j.length) ?? 0) }),
        /* @__PURE__ */ jsx(Row, { k: "Mandat", v: ((_k = dossier.mandat) == null ? void 0 : _k.accepte) ? `Signé ${(_l = dossier.mandat.dateAcceptation) == null ? void 0 : _l.slice(0, 10)}` : "À signer" })
      ] })
    ] }),
    question.id === "final_recap" && onFinalize ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-primary-200 bg-primary-50/60 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "font-display text-base font-semibold text-ink", children: "Finaliser et transmettre votre dossier" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-muted", children: "29,90 € TTC — paiement Stripe sécurisé. Frais INPI inclus pour micro-entreprise (0 €). Vous gardez votre banque actuelle." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => void onFinalize({ pay: true }), disabled: !report.pretATransmettre, className: "btn-primary flex-1 disabled:opacity-50", children: "💳 Payer 29,90 € et transmettre" }),
        /* @__PURE__ */ jsx("button", { onClick: () => void onFinalize({ pay: false }), disabled: !report.pretATransmettre, className: "btn-outline flex-1 disabled:opacity-50", children: "⏰ Payer plus tard" })
      ] }),
      !report.pretATransmettre && /* @__PURE__ */ jsxs("p", { className: "text-xs text-rose-600", children: [
        "Complétez les erreurs du dossier avant de finaliser (",
        report.issues.filter((i) => i.level === "error").length,
        ")."
      ] })
    ] }) : /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(true), className: "btn-primary", children: "Transmettre au Guichet unique INPI" })
  ] });
}
function Row({ k, v }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 border-b border-surface-border/40 pb-1", children: [
    /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase tracking-wider text-ink-muted", children: k }),
    /* @__PURE__ */ jsx("dd", { className: `text-right text-sm ${v ? "text-ink" : "text-ink-muted/50"}`, children: v || "—" })
  ] });
}
function DocsUploadStep({ dossier, onContinue }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(DocumentsManager, { dossier }),
    /* @__PURE__ */ jsx("button", { onClick: onContinue, className: "btn-primary", children: "Continuer" })
  ] });
}
function NirStep({ onSubmit, onSkip }) {
  const [v, setV] = useState("");
  const [parsed, setParsed] = useState(null);
  function check(value) {
    setV(value);
    if (value.replace(/\s/g, "").length >= 15) {
      setParsed(parseNir(value));
    } else setParsed(null);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "input font-mono tracking-wider",
        placeholder: "1 95 02 75 114 042 87",
        value: v,
        onChange: (e) => check(e.target.value),
        inputMode: "numeric",
        maxLength: 21,
        autoFocus: true
      }
    ),
    parsed && /* @__PURE__ */ jsx("div", { className: `rounded-lg border p-3 text-sm ${parsed.valid ? "border-secondary-300 bg-secondary-50 text-secondary-900" : "border-rose-300 bg-rose-50 text-rose-900"}`, children: parsed.valid ? /* @__PURE__ */ jsxs(Fragment, { children: [
      "✅ Numéro valide. Pré-rempli : ",
      parsed.sexe === "M" ? "Homme" : "Femme",
      parsed.anneeNaissance && parsed.moisNaissance && ` · Né(e) en ${String(parsed.moisNaissance).padStart(2, "0")}/${parsed.anneeNaissance}`,
      parsed.departementCode && ` · Dépt ${parsed.departementCode}`
    ] }) : "⚠️ Numéro invalide. Vérifiez la saisie." }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(v.trim()), disabled: !(parsed == null ? void 0 : parsed.valid), className: "btn-primary disabled:opacity-50", children: "Valider et pré-remplir" }),
      /* @__PURE__ */ jsx("button", { onClick: onSkip, className: "btn-ghost text-sm", children: "Passer cette étape" })
    ] })
  ] });
}
function IdScanStep({ onSubmit, onSkip }) {
  var _a;
  const [busyRecto, setBusyRecto] = useState(false);
  const [busyVerso, setBusyVerso] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recto, setRecto] = useState(null);
  const [verso, setVerso] = useState(null);
  const [merged, setMerged] = useState(null);
  const [error, setError] = useState(null);
  const [warn, setWarn] = useState(null);
  const rectoRef = useRef(null);
  const versoRef = useRef(null);
  async function handleFile(file, side) {
    if (side === "recto") setBusyRecto(true);
    else setBusyVerso(true);
    setError(null);
    setWarn(null);
    setProgress(0);
    try {
      const { scanIdCard, mergeIdScans } = await import("./ocr-BAnfJVd1.js");
      const r = await scanIdCard(file, { side, onProgress: (p) => setProgress(p) });
      if (side === "recto") setRecto(r);
      else setVerso(r);
      const next = side === "recto" ? mergeIdScans([r, verso]) : mergeIdScans([recto, r]);
      setMerged(next);
      if (side === "verso" && r.type === "unknown") {
        setWarn("Zone MRZ non détectée sur le verso. Réessayez avec un cadrage serré sur la bande MRZ (2 lignes de caractères en bas), bonne lumière, sans reflet.");
      }
    } catch (e) {
      setError((e == null ? void 0 : e.message) ?? "Erreur OCR");
    } finally {
      if (side === "recto") setBusyRecto(false);
      else setBusyVerso(false);
    }
  }
  const tile = (side, label, hint, busy, data) => {
    const ref = side === "recto" ? rectoRef : versoRef;
    return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          var _a2;
          return (_a2 = ref.current) == null ? void 0 : _a2.click();
        },
        disabled: busy,
        className: `flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 transition disabled:opacity-60 ${data ? "border-secondary-400 bg-secondary-50/40" : "border-primary-300 bg-primary-50/30 hover:border-primary-500 hover:bg-primary-50/60"}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-4xl", children: data ? "✅" : "📷" }),
          /* @__PURE__ */ jsx("span", { className: "font-display text-sm font-semibold text-ink", children: label }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-ink-muted", children: hint }),
          data && /* @__PURE__ */ jsx("span", { className: "text-[11px] text-secondary-700", children: "Re-téléverser" })
        ]
      }
    ) });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("input", { ref: rectoRef, type: "file", accept: "image/*", hidden: true, onChange: (e) => {
      var _a2;
      const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
      if (f) handleFile(f, "recto");
      e.target.value = "";
    } }),
    /* @__PURE__ */ jsx("input", { ref: versoRef, type: "file", accept: "image/*", hidden: true, onChange: (e) => {
      var _a2;
      const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
      if (f) handleFile(f, "verso");
      e.target.value = "";
    } }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
      tile("recto", "Recto", "Photo + libellés (nom, prénoms, lieu de naissance)", busyRecto, recto),
      tile("verso", "Verso (MRZ)", "Bande de 2 lignes ICAO en bas de la carte", busyVerso, verso)
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Passeport : photographiez la page principale uniquement (côté verso suffit). Conseil : posez à plat sur surface sombre, lumière douce, sans reflet, MRZ entièrement visible." }),
    (busyRecto || busyVerso) && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm", children: [
      "📖 Lecture OCR… ",
      Math.round(progress * 100),
      " %",
      /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 overflow-hidden rounded-full bg-surface-border", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary-600 transition-all", style: { width: `${progress * 100}%` } }) })
    ] }),
    warn && /* @__PURE__ */ jsxs("p", { className: "rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900", children: [
      "⚠️ ",
      warn
    ] }),
    error && /* @__PURE__ */ jsxs("p", { className: "rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900", children: [
      "⚠️ ",
      error
    ] }),
    merged && merged.type !== "unknown" && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-secondary-300 bg-secondary-50 p-4 text-sm", children: [
      /* @__PURE__ */ jsxs("p", { className: "font-semibold text-secondary-900", children: [
        "✨ Données fusionnées (",
        merged.type === "cni" ? "CNI MRZ" : merged.type === "passport" ? "Passeport" : "CNI recto",
        ")"
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-secondary-900", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          "Civilité : ",
          /* @__PURE__ */ jsx("strong", { children: merged.civilite ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Sexe : ",
          /* @__PURE__ */ jsx("strong", { children: merged.sexe ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Prénom : ",
          /* @__PURE__ */ jsx("strong", { children: merged.prenom ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Tous prénoms : ",
          /* @__PURE__ */ jsx("strong", { children: ((_a = merged.prenomsTous) == null ? void 0 : _a.join(" ")) ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Nom : ",
          /* @__PURE__ */ jsx("strong", { children: merged.nom ?? "—" })
        ] }),
        merged.nomUsage && /* @__PURE__ */ jsxs("li", { children: [
          "Nom d'usage : ",
          /* @__PURE__ */ jsx("strong", { children: merged.nomUsage })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Date de naissance : ",
          /* @__PURE__ */ jsx("strong", { children: merged.dateNaissance ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Lieu de naissance : ",
          /* @__PURE__ */ jsx("strong", { children: merged.lieuNaissance ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Nationalité : ",
          /* @__PURE__ */ jsx("strong", { children: merged.nationalite ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "N° document : ",
          /* @__PURE__ */ jsx("strong", { children: merged.numeroDocument ?? "—" })
        ] }),
        merged.dateExpiration && /* @__PURE__ */ jsxs("li", { children: [
          "Expiration : ",
          /* @__PURE__ */ jsx("strong", { children: merged.dateExpiration })
        ] }),
        merged.confiance !== void 0 && /* @__PURE__ */ jsxs("li", { className: "col-span-2 text-xs text-secondary-700", children: [
          "Confiance OCR : ",
          Math.round(merged.confiance * 100),
          " %"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => onSubmit(merged), className: "btn-primary text-sm", children: "Pré-remplir les champs" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          setRecto(null);
          setVerso(null);
          setMerged(null);
          setError(null);
          setWarn(null);
        }, className: "btn-ghost text-sm", children: "Tout réessayer" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: onSkip, className: "btn-ghost text-sm", children: "Saisir manuellement plus tard" })
  ] });
}
function SaveBadge({ state, savedAt }) {
  const labelFull = state === "saving" ? "Sauvegarde…" : state === "saved" ? `✓ Sauvegardé${savedAt ? " " + relative(savedAt) : ""}` : state === "offline" ? "⚠ Hors-ligne (local seulement)" : state === "error" ? "⚠ Erreur sauvegarde" : "Sauvegarde auto";
  const labelShort = state === "saving" ? "…" : state === "saved" ? "✓" : state === "offline" ? "⚠" : state === "error" ? "⚠" : "⏺";
  const cls = state === "saving" ? "bg-primary-50 text-primary-700" : state === "saved" ? "bg-secondary-50 text-secondary-700" : state === "offline" ? "bg-amber-100 text-amber-800" : state === "error" ? "bg-rose-100 text-rose-700" : "bg-ink-muted/10 text-ink-muted";
  return /* @__PURE__ */ jsxs("span", { className: `badge whitespace-nowrap ${cls}`, title: labelFull, children: [
    /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: labelShort }),
    /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: labelFull })
  ] });
}
function relative(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  if (diff < 6e4) return "à l’instant";
  const mins = Math.round(diff / 6e4);
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  return `il y a ${h} h`;
}
function titreSubject(s) {
  return s === "associes" ? "Associé" : s === "dirigeants" ? "Dirigeant" : "Bénéficiaire effectif";
}
function emptyItem(subject, _dossier) {
  if (subject === "associes") return { type: "personne_physique", personne: { nationalite: "FRA" }, apport: { numeraire: 0 } };
  if (subject === "dirigeants") {
    return { type: "personne_physique", fonction: "gerant", personne: { nationalite: "FRA" } };
  }
  return { qualite: "detention_capital", personne: { nationalite: "FRA" }, pctCapital: 0 };
}
export {
  AuthProvider as A,
  pushBillingDoc as B,
  pushDepense as C,
  DocumentsManager as D,
  pushEncaissement as E,
  FORMES_SEED as F,
  pushProfilEmetteur as G,
  removeAnonDraft as H,
  Icon as I,
  requestPasswordReset as J,
  startCheckout as K,
  startSubscribe as L,
  submitDossier as M,
  useApi as N,
  useAuth as O,
  POSTS_SEED as P,
  useToast as Q,
  userKey as R,
  ToastProvider as T,
  FormalitesWizard as a,
  PRICING_SEED as b,
  api as c,
  apiBase as d,
  applyPasswordReset as e,
  chatTurn as f,
  delBillingCatalog as g,
  delBillingClient as h,
  delBillingDoc as i,
  delDepense as j,
  delEncaissement as k,
  deleteDraft as l,
  fetchBillingCatalog as m,
  fetchBillingClients as n,
  fetchBillingDocs as o,
  fetchDepenses as p,
  fetchDraft as q,
  fetchEncaissements as r,
  fetchProfilEmetteur as s,
  finalizeDraft as t,
  getAnonProfile as u,
  listAnonDrafts as v,
  listDrafts as w,
  openBillingPortal as x,
  pushBillingCatalog as y,
  pushBillingClient as z
};
