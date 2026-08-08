import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { L as Link } from "./vendor-router-Izd1qo3Q.js";
import { S as Seo } from "../entry-server.js";
import { O as useAuth, d as apiBase } from "./wizard-CbzVLHaR.js";
import "react-dom";
import "react-router";
import "@remix-run/router";
import "react-dom/server";
import "./vendor-helmet-A5Xb5BKa.js";
import "react-fast-compare";
import "invariant";
import "shallowequal";
import "./formalites-DR4taCu5.js";
const COPY = {
  pause: {
    title: "Mettre mon entreprise en pause",
    description: "Mise en sommeil (sociétés) ou cessation temporaire d’activité (micro-entreprise). Procédure assistée, transmission au Guichet unique sous 24h.",
    cta: "Demander la mise en pause",
    body1: "Vous suspendez votre activité sans dissoudre la structure. Durée maximale : 2 ans (sociétés), 12 mois renouvelable (micro).",
    body2: "Pendant la pause : pas de CA, pas de cotisations URSSAF sur le CA, comptes annuels à déposer (sociétés)."
  },
  fermeture: {
    title: "Fermer mon entreprise",
    description: "Procédure complète : dissolution + liquidation + radiation. Notre équipe prépare et dépose les formalités.",
    cta: "Demander la fermeture",
    body1: "Étape 1 : décision de dissolution (AGE ou auto-entrepreneur). Étape 2 : liquidation (clôture comptable). Étape 3 : radiation au Guichet unique.",
    body2: "Délai total : 1 à 3 mois selon la structure. Frais légaux INPI affichés avant transmission."
  }
};
function GestionPage({ kind }) {
  const { user } = useAuth();
  const c = COPY[kind];
  const [siret, setSiret] = useState("");
  const [denomination, setDenomination] = useState("");
  const [motif, setMotif] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/swivo/v1/dossier/${kind}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siret, denomination, motif })
      });
      if (!res.ok) throw new Error("Envoi impossible.");
      setState("sent");
    } catch (e2) {
      setState("error");
      setError(e2 instanceof Error ? e2.message : "Erreur inconnue.");
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { title: c.title, description: c.description, path: `/gestion/${kind}`, noindex: true }),
    /* @__PURE__ */ jsx("section", { className: "container-page py-12", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_360px]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "badge-primary", children: kind === "pause" ? "Mise en pause" : "Fermeture" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl", children: c.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-ink-muted", children: c.description }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 card p-6", children: state === "sent" ? /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-3xl", children: "✅" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 font-display text-xl font-semibold text-ink", children: "Demande enregistrée" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: "Notre équipe vous contacte sous 24h ouvrées pour finaliser." }),
          /* @__PURE__ */ jsx(Link, { to: "/espace-createur", className: "btn-primary mt-5", children: "Retour au tableau de bord" })
        ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "SIRET" }),
            /* @__PURE__ */ jsx("input", { className: "input", required: true, pattern: "\\d{14}", placeholder: "14 chiffres", value: siret, onChange: (e) => setSiret(e.target.value.replace(/\s/g, "")) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: "Dénomination sociale" }),
            /* @__PURE__ */ jsx("input", { className: "input", required: true, value: denomination, onChange: (e) => setDenomination(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "label", children: [
              "Motif ",
              kind === "pause" ? "(facultatif)" : "(facultatif)"
            ] }),
            /* @__PURE__ */ jsx("textarea", { className: "input min-h-[100px]", value: motif, onChange: (e) => setMotif(e.target.value), placeholder: "Quelques mots pour contexte" })
          ] }),
          error && /* @__PURE__ */ jsx("p", { className: "rounded-md bg-danger/10 px-3 py-2 text-sm text-danger", children: error }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: state === "sending", className: "btn-primary w-full", children: state === "sending" ? "Envoi…" : c.cta }),
          !user && /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-ink-muted", children: [
            "Connexion requise. ",
            /* @__PURE__ */ jsx(Link, { to: "/connexion", className: "link", children: "Se connecter" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold text-ink", children: "Ce qu’il faut savoir" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: c.body1 }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-ink-muted", children: c.body2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-semibold text-ink", children: "Inclus dans Gestion" }),
          /* @__PURE__ */ jsxs("ul", { className: "mt-2 space-y-1.5 text-sm text-ink-muted", children: [
            /* @__PURE__ */ jsx("li", { children: "· Préparation des actes" }),
            /* @__PURE__ */ jsx("li", { children: "· Dépôt au Guichet unique" }),
            /* @__PURE__ */ jsx("li", { children: "· Suivi temps réel" }),
            /* @__PURE__ */ jsx("li", { children: "· Support juridique" })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  GestionPage
};
