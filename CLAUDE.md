# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Swivo (ex-WeSwift)

French micro-entreprise service. Scope pivoted in May 2026 to **micro-entreprise only** (no SA/SARL/EURL flows in the active product, even if legacy pages remain). Concurrents: legalstart.fr, legalplace.fr, shine.fr, dougs.fr. Headless architecture: WordPress as CMS / backoffice, React app (SSR + hydrate) as the public website.

**Two paid plans:**
- €29,90 — création micro-entreprise (+ INPI / guichet unique fees)
- €9,90/month — gestion (pilotage, facturation, URSSAF, calculateurs, modèles, formations)

## Architecture

```
swivo-app/                          Vite + React + TS + Tailwind (front, SSR active)
  src/
    entry-client.tsx                Browser entry (hydrate)
    entry-server.tsx                SSR entry (renderToPipeableStream)
    components/                     React components
    pages/                          Routes
    stories/                        Storybook stories <Nom>.stories.tsx
    lib/                            nir.ts, ocr.ts, micro-algo.ts, formalites/, api.ts, auth.tsx
    styles/                         theme.css + index.css
  scripts/                          prerender scripts
weswift/                            WordPress installation (dir name kept)
  wp-content/
    themes/generatepress/           Theme (admin previews; SPA renders public site)
    plugins/swivo-headless/         Custom REST API + CPTs + CORS + admin clients
weswift-app/                        DEPRECATED — superseded by swivo-app/
Documentation guichet unique/       INPI / Guichet unique API docs (PDF/xlsx)
```

The React app fetches everything from WordPress over REST (`/wp-json/wp/v2/*` for native posts/pages, `/wp-json/swivo/v1/*` for custom data). Bundled seed data keeps it usable when WP is unreachable — useful for local dev and graceful degradation.

## Local Development

### Front-end (Vite + SSR)
```bash
cd swivo-app
cp .env.example .env          # set VITE_WP_API_URL to your WP host
npm install
npm run dev                   # http://localhost:5173
npm run build                 # client dist/ + server dist-server/ + prerender
```
Vite dev proxies `/wp-json/*` to `VITE_WP_API_URL` (`vite.config.ts`), avoiding CORS pain in dev. Build pipeline produces a client bundle + SSR bundle + prerendered HTML for top routes (Home, Tarifs, FAQ, legal). Heavy routes (Creer wizard, Pilotage, Facturation, Urssaf, Calculateurs, Modeles, Gestion) are **lazy-loaded** via dynamic imports; `vite.config.ts` defines `manualChunks` groups (formalites, pilotage, ocr…).

### Storybook — workflow composant
```bash
npm run storybook         # http://localhost:6006 — catalogue interactif
npm run dev:all           # Vite + Storybook en parallèle
npm run build-storybook   # bundle statique storybook-static/
```
Composant React → `src/components/`. Story associée → `src/stories/<Nom>.stories.tsx`. Décorateurs globaux dans `.storybook/preview.tsx` : `MemoryRouter`, `HelmetProvider`, `AuthProvider`, toggle thème light/dark, viewports mobile/tablet/desktop, addon a11y. Workflow : story d'abord → tester en isolation → intégrer aux pages.

### Back-end (WordPress)
1. Configure DB in `weswift/wp-config.php` (copy from `wp-config-sample.php`)
2. Serve `weswift/` via Apache/Nginx/PHP built-in server
3. WP admin: `http://localhost/weswift/wp-admin/`
4. Activate the **Swivo Headless** plugin → registers CPTs (`swivo_forme`, `swivo_faq`, `swivo_dossier`, drafts, documents, factures…), seeds default content, exposes routes, sets CORS
5. Settings → Swivo: edit pricing, add production CORS origin

## Key REST endpoints (namespace `swivo/v1`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/formes` | public | Formes juridiques (legacy data; micro is primary) |
| GET | `/faq` | public | FAQ items |
| GET | `/pricing` | public | Current pricing + INPI fee table |
| POST | `/dossier` | public, throttled 30s/IP | Persist a dossier from the wizard |
| GET, POST | `/drafts` | user / temp-profile | Save & resume in-progress dossiers |
| POST | `/documents` | user | Upload documents (CNI, justif. domicile…) into WP media + meta |
| POST | `/auth/reset` | public | Password reset (uses native WP `check_password_reset_key`) |
| GET, POST | `/oauth/*` | public | OAuth / France Connect stub endpoints |
| GET | `/my-dossiers` | user | List dossiers for current user |
| GET, POST | `/pilotage/*`, `/billing/*`, `/gestion/*` | user | Pilotage SaaS APIs |
| GET | `/wp/v2/posts?_embed` | public | Blog (native WP) |

`POST /dossier` payload mirrors the SPA `Dossier` type. New posts land in the `swivo_dossier` CPT, status `private`. Action hook `swivo_dossier_created` fires for Stripe / email plugins.

## Wizard formalités (création micro)

3 modes : **Guidé** / **Expert ⚙** / **IA ✨** (`src/pages/Creer.tsx` + `src/components/FormalitesWizard.tsx` + `src/lib/formalites/flow.ts`).

**Pré-fill multi-sources:**
- `src/lib/nir.ts` — parse NIR (sexe, année reconstituée, mois, dept, Corse 2A/2B, DOM-TOM 97x, étranger 99) + clé contrôle mod 97. `nirToPersonne()` → civilité + dateNaissance + dept.
- `src/lib/ocr.ts` — Tesseract.js lazy + MRZ CNI/passeport → prénom + nom + date + nationalité.
- `src/lib/micro-algo.ts` — état machine, scoring complétude, next-best-question, ACRE/VL/SPI eligibility.
- Adresse autosuggestion → pré-remplit CP + ville.

**Reprise saisie:** brouillons via `/drafts` endpoint. Profil temporaire créé si user pas connecté, fusion au signup. Wizard reprend à l'étape laissée, champs déjà remplis.

**Documents:** `DocumentsManager.tsx` drag-drop. Backend `swivo-headless/includes/documents.php` upload WP media + categorize (CNI, justif domicile, etc).

**Validation:** par étape, toast erreur si invalide.

## Back-office WordPress (admin Swivo)

- Menu **Swivo · Clients** (`/wp-admin/admin.php?page=swivo-clients`) — table tous users : nom, email, gestion ✓/—, dossiers, brouillons, factures, CA encaissé, date inscription. Dashboard détail par user agrège toutes entités.
- Colonne **User** + filtre par user sur tous les CPTs Swivo (`admin-cpt-cols.php`).

## Design system (single source of truth)

`swivo-app/src/styles/theme.css` definit toutes les couleurs / surfaces / inks / radius comme custom properties en **R G B** triplets (requis pour Tailwind `<alpha-value>`). Modifier `--color-primary-*` ou `--color-secondary-*` rebrand tout le site — classes Tailwind (`bg-primary-600`, `text-secondary-500`) et utilities (`.btn-primary`, `.card`, `.badge-primary`) consomment les variables.

`data-theme="dark"` sur `<html>` bascule en dark mode (mêmes noms variables, valeurs différentes).

**Animations clés:**
- `animate-slide-down` — header sticky entrée (-100% → 0, 0.3s)
- `animate-pulse-ring` — halo discret (scale 1→1.12, opacity 0.5→0, 1.8s loop) sur icônes mobile header, BackToTop, ChatbotWidget

**Layout:**
- Header : `relative` par défaut (transparent + border 50% opacity), bascule `fixed` + blur + shadow quand `scrollY > 80`. Spacer injecté pour éviter saut.
- ChatbotWidget : `left-5` (anti-collision avec BackToTop à `right-5`).
- Mobile header : `[+ pulse] [user pulse] [☰]` à droite du logo.

## Critical Priorities

1. **SEO** — Rank Math sur WP ; SSR + prerender ; per-page meta + JSON-LD via `react-helmet-async`
2. **Performance** — Core Web Vitals green ; index chunk ~89 KB (post code-split, ~62% réduction vs avant) ; chunk warning < 500 KB respecté
3. **RGPD** — `CookieBanner` (3-tier consent), data hébergée France
4. **Security** — WP hardening (xmlrpc off, hide version, limit login, HTTPS) ; CORS allow-list strict ; throttle endpoints sensibles ; reset password via API WP native
5. **Trust** — design institutionnel (bleu + emerald), official-feeling sans usurper l'État

## SPA route map

- `/` — hero + chat mock, trust signals, étapes, carrousel avis (10), profils créateurs (5), comparator, pricing teaser, FAQ teaser ; animations apparition décalées
- `/creer-mon-entreprise` — wizard 3 modes (Guidé / Expert / IA), reprise brouillon, OCR/NIR pré-fill, upload docs
- `/tarifs` — pricing depuis options WP, INPI fees
- `/espace-createur` — dashboard user (dossiers en cours/finalisés, KPIs, DocumentsManagerLite, billing portal)
- `/pilotage`, `/facturation`, `/urssaf`, `/calculateurs`, `/modeles`, `/gestion` — outils SaaS micro (lazy-loaded)
- `/formations` — vidéos IA présentateur, voix homme FR pro
- `/faq` — searchable, filterable
- `/blog`, `/blog/:slug` — native WP posts
- `/connexion`, `/inscription` — split 2 cols (visuel + form), `?reset=KEY&login=LOGIN` → ResetForm
- `/mentions-legales`, `/politique-de-confidentialite`, `/cgv`, `/cookies`

## Installed WP plugins (à utiliser activement)

| Plugin | Rôle dans Swivo |
|---|---|
| **Paid Memberships Pro** | Source de vérité pour l'abonnement **Gestion** (€9.90/mo). Niveau PMP mappé via option `swivo_pmp_gestion_level_id`. `swivo_user_has_gestion()` lit PMP en premier, fallback meta legacy. SPA `/subscribe` → redirige vers `pmpro_url('checkout', '?level=X')`. `/billing-portal` → `pmpro_url('account')`. |
| **WooCommerce** | Gère uniquement la **Création** one-time (€29.90). Pas d'abonnements (PMP s'en occupe). Produit configuré via `swivo_wc_creation_product_id`. |
| **Advanced Custom Fields PRO** | Field groups enregistrés en code (`includes/acf-fields.php`) pour CPT `swivo_dossier` (forme, identité, siège, activité, capital, ACRE, notes) + options page « Réglages éditoriaux » accessible aux éditeurs sans `manage_options`. Sync auto ACF → `payload` meta sur `acf/save_post`. |
| **AI Provider for Anthropic** (`ai-provider-for-anthropic`) | Fournit Claude au SDK WP AI Client. Activé → `swivo_ai_chat()` route via `\WordPress\AiClient\AiClient::prompt()->usingProvider('anthropic')`. |
| **AI Provider for Google** (`ai-provider-for-google`) | Fournit Gemini via le même SDK. Bascule provider via option `swivo_ai_provider` (anthropic\|google). |
| Akismet | Anti-spam (formulaires contact). |

**Recommandés à ajouter:**

| Purpose | Plugin |
|---|---|
| SEO | Rank Math |
| Cache/perf | LiteSpeed Cache (free) or WP Rocket |
| RGPD | Complianz GDPR (admin-side ; SPA a son propre banner) |
| Security | Wordfence |
| Backups | UpdraftPlus |
| Analytics | MonsterInsights + GA4 |

## Subscriptions & paiements — flux actuel

**Création (€29.90 one-time):** SPA `POST /swivo/v1/checkout` → `swivo_wc_create_creation_order()` crée commande WC → SPA redirige vers URL paiement WC → WC Stripe Gateway encaisse → hook `woocommerce_payment_complete` → meta `swivo_dossier.status = paid` + action `swivo_dossier_paid`.

**Gestion (€9.90/mo):** SPA `POST /swivo/v1/subscribe` → `swivo_pmp_intercept_subscribe()` renvoie URL `pmpro_url('checkout', '?level=N')` → user finalise via PMP (Stripe intégré) → hook `pmpro_after_change_membership_level` → `swivo_pmp_sync_legacy_meta()` met à jour `swivo_gestion_active/until` (compat) + action `swivo_gestion_started`.

**Gérer abonnement:** SPA bouton « Gérer mon abonnement » → `POST /swivo/v1/billing-portal` → renvoie `pmpro_url('account')`.

**Helpers code:**
- `swivo_user_has_gestion( $uid )` — booléen, **utiliser partout** (jamais lire `swivo_gestion_active` direct).
- `swivo_user_gestion_until( $uid )` — timestamp expiration ou 0.
- `swivo_pmp_active()` — détecte PMP.

## IA — abstraction (includes/ai.php)

`swivo_ai_chat( array $messages, array $opts ): string|WP_Error`

- `opts.provider` : `'anthropic'` (défaut) | `'google'`. Override per-call ou option globale `swivo_ai_provider`.
- `opts.system` : prompt système.
- `opts.max_tokens` : 800 défaut.

**Routing:** détecte `\WordPress\AiClient\AiClient` (SDK shippé par les plugins AI Provider). Si présent → `AiClient::prompt(...)->usingProvider($p)->generateTextResult()->toText()`. Sinon → fallback REST direct Anthropic (clé `swivo_anthropic_key`). Google sans plugin = erreur 503.

Tout point d'entrée IA (chat formulaire, suggestions, génération) doit passer par `swivo_ai_chat()` — jamais d'appel direct à l'API Anthropic/Google dans le code Swivo.

## Guichet unique / INPI APIs

PDFs et xlsx dans `Documentation guichet unique/`:
- `documentation technique API formalités_v4.0.pdf` — formalités (file submissions)
- `documentation technique API_comptes_annuels v5.pdf` — annual accounts
- `documentation technique API Actes v4.0.pdf` — corporate acts
- `Contrat d'interface juin 2025 (1).pdf` — interface contract
- `Dictionnaire_de_donnees_INPI_2026_04_29.xlsx` — INPI data dictionary
- `Dictionnaire_de_donnees_mandataire_version_2025_05.xlsx` — mandataire data dict

**Current access:** APIs publiques uniquement (pas de credentials mandataire). Architecture pensée pour swap-in mandataire later sans restructuring. Stub Sirene fallback déjà en place (`inpi-client.php`, `inpi.php`).
