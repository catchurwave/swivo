import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo, orgJsonLd } from '@/lib/seo';
import { api, useApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useResumeCta } from '@/lib/useResumeCta';
import { getDayGreeting } from '@/lib/greeting';
import { Reveal } from '@/components/Reveal';
import { Icon } from '@/components/Icons';
import { IllustrationChat, IllustrationDossier, IllustrationGrowth, IllustrationShield, IllustrationHero } from '@/components/Illustrations';

const TRUST = [
  { k: '99%',  v: 'dossiers acceptés' },
  { k: '5 min', v: 'pour démarrer' },
  { k: '24h',  v: 'transmis INPI' },
  { k: '0 €', v: 'frais légaux' },
];

const STEPS = [
  { n: '01', title: 'Répondez au chat', body: 'Activité, adresse, URSSAF — l’assistant pose les bonnes questions, sans jargon.', Icon: Icon.Chat,    bg: 'from-primary-50 to-primary-100' },
  { n: '02', title: 'Validez & payez',  body: '29,90 € tout compris pour la déclaration accompagnée et le dossier conforme.',     Icon: Icon.Lock,    bg: 'from-secondary-50 to-secondary-100' },
  { n: '03', title: 'On dépose à l’INPI', body: 'Transmission au Guichet unique sous 24 h, SIRET sous 8 à 15 jours.',              Icon: Icon.Stamp,   bg: 'from-primary-50 to-secondary-50' },
];

const FEATURES = [
  { Icon: Icon.Bolt,      title: 'Déclaration en 5 min',      body: 'Chat adaptatif : NAF/APE, régime fiscal, ACRE — tout est pré-rempli pour vous.' },
  { Icon: Icon.Shield,    title: 'Zéro rejet INPI',           body: 'Validation juriste sur les pièces sensibles avant transmission au Guichet unique.' },
  { Icon: Icon.Calc,      title: 'Simulateur URSSAF intégré', body: 'Cotisations calculées en temps réel selon votre CA et catégorie d’activité.' },
  { Icon: Icon.Clock,     title: 'Rappels d’échéances',       body: 'Déclarations URSSAF, seuils TVA, plafonds CA — nous vous prévenons à l’avance.' },
  { Icon: Icon.Doc,       title: 'Factures & devis illimités',body: 'Génération PDF aux normes, numérotation auto, mentions légales conformes.' },
  { Icon: Icon.Globe,     title: 'Données en France · RGPD',  body: 'Hébergement souverain, chiffrement TLS, droit d’accès garanti à tout moment.' },
];

const COMPARE = [
  { k: 'Création micro-entreprise',  them: 'Formulaires INPI complexes',                 us: 'Chat IA — 5 minutes' },
  { k: 'Compte bancaire imposé',     them: 'Oui — compte pro maison obligatoire',        us: 'Non — vous gardez votre banque' },
  { k: 'Frais légaux',               them: '0 €',                                        us: '0 €' },
  { k: 'Service accompagnement',     them: '89 — 159 €',                                 us: '29,90 € tout compris' },
  { k: 'Simulateur URSSAF',          them: 'À part / payant',                            us: 'Inclus, temps réel' },
  { k: 'Rappels déclarations',       them: 'Aucun',                                      us: 'Email + dashboard' },
  { k: 'Facturation conforme',       them: 'Outil tiers',                                us: 'Inclus dans Gestion' },
];

const REVIEWS = [
  { name: 'Camille Lefèvre',   activite: 'Coach yoga',          city: 'Lyon',        rating: 5, date: 'avr. 2026', avatar: 'https://i.pravatar.cc/600?img=47', text: 'J’ai déclaré ma micro en 6 minutes le dimanche soir. SIRET reçu 11 jours plus tard, aucun aller-retour avec l’INPI.' },
  { name: 'Mehdi Bensalah',    activite: 'Développeur freelance', city: 'Paris',     rating: 5, date: 'mar. 2026', avatar: 'https://i.pravatar.cc/600?img=12', text: 'Le simulateur URSSAF intégré, c’est bluffant — je sais exactement ce que je dois mettre de côté chaque mois.' },
  { name: 'Sophie Marchand',   activite: 'Naturopathe',         city: 'Bordeaux',    rating: 5, date: 'mar. 2026', avatar: 'https://i.pravatar.cc/600?img=5',  text: 'L’assistant m’a expliqué BIC vs BNC sans jargon. Et le module facturation me fait gagner 3h par semaine.' },
  { name: 'Thomas Rossi',      activite: 'Photographe événement', city: 'Marseille', rating: 5, date: 'fév. 2026', avatar: 'https://i.pravatar.cc/600?img=33', text: 'Rappel d’échéances par email, déclaration URSSAF en 2 clics, factures conformes. Tout ce qu’il me fallait.' },
  { name: 'Élise Bonnard',     activite: 'Graphiste UX',        city: 'Nantes',      rating: 5, date: 'fév. 2026', avatar: 'https://i.pravatar.cc/600?img=44', text: 'L’ACRE m’a été proposée automatiquement — je ne savais même pas que j’étais éligible. 1 100 € économisés.' },
  { name: 'Karim Diallo',      activite: 'Plombier',            city: 'Lille',       rating: 4, date: 'jan. 2026', avatar: 'https://i.pravatar.cc/600?img=15', text: 'Très clair, très rapide. Le guide artisan m’a aidé à choisir mon code NAF du premier coup.' },
  { name: 'Léa Vasseur',       activite: 'Traductrice EN→FR',    city: 'Toulouse',    rating: 5, date: 'jan. 2026', avatar: 'https://i.pravatar.cc/600?img=49', text: 'Création gratuite + accompagnement à 29,90 €, c’est honnête. Et le dashboard est vraiment lisible.' },
  { name: 'Antoine Mercier',   activite: 'Consultant SEO',      city: 'Rennes',      rating: 5, date: 'déc. 2025', avatar: 'https://i.pravatar.cc/600?img=11', text: 'J’avais testé 3 plateformes. Swivo gagne sur la simplicité du parcours. Et le chat aide vraiment.' },
  { name: 'Inès Caron',        activite: 'Esthéticienne',       city: 'Strasbourg',  rating: 5, date: 'déc. 2025', avatar: 'https://i.pravatar.cc/600?img=20', text: 'Statut artisan, qualification CAP — tout a été vérifié pour moi. Aucun stress.' },
  { name: 'Julien Garnier',    activite: 'Coach sportif',       city: 'Montpellier', rating: 5, date: 'nov. 2025', avatar: 'https://i.pravatar.cc/600?img=53', text: 'L’alerte de seuil TVA m’a sauvé : 2 mois d’avance pour passer en réel. Indispensable.' },
];

const FOUNDERS = [
  { name: 'Amélie Dufour',  age: 31, activite: 'Designer UX freelance',  city: 'Paris',     job: 'Designer UX freelance',     why: 'Quittait son CDI en agence pour facturer en direct ses clients européens. La micro permet de tester sans risque, charges proportionnelles au CA.', photo: 'https://i.pravatar.cc/800?img=32' },
  { name: 'Yanis Benoît',   age: 27, activite: 'Coach sportif à domicile', city: 'Lyon',   job: 'Coach sportif à domicile',  why: 'Reconversion après 4 ans en banque. Micro choisie pour la fiscalité ultra-simple et le démarrage en 5 minutes.', photo: 'https://i.pravatar.cc/800?img=68' },
  { name: 'Clémentine Roy', age: 38, activite: 'Consultante RSE',         city: 'Bordeaux', job: 'Consultante RSE indépendante', why: 'Après 12 ans en grand groupe, voulait accompagner des PME. Micro idéale tant que le CA reste sous 77 700 €.', photo: 'https://i.pravatar.cc/800?img=26' },
  { name: 'Marc Lemoine',   age: 44, activite: 'Artisan menuisier',       city: 'Lille',    job: 'Artisan menuisier',         why: 'Reprise du métier familial en solo. Micro avec qualification professionnelle CAP, immatriculation CMA en parallèle.', photo: 'https://i.pravatar.cc/800?img=51' },
  { name: 'Salma Idrissi',  age: 29, activite: 'Traductrice EN-AR-FR',    city: 'Toulouse', job: 'Traductrice freelance',     why: 'Diplôme INALCO en poche, voulait travailler depuis chez elle. Micro BNC, franchise TVA, ACRE 1ère année.', photo: 'https://i.pravatar.cc/800?img=45' },
];

export function HomePage() {
  const { data: faq } = useApi((s) => api.fetchFaq(s));
  const { user } = useAuth();
  const cta = useResumeCta();
  const gestionActive = !!user?.gestion?.active;

  return (
    <>
      <Seo
        title="Créer sa micro-entreprise en 5 minutes — Swivo"
        description="Déclaration micro-entreprise accompagnée à 29,90 €. Simulateur URSSAF, facturation, rappels d’échéances. Le copilote des micro-entrepreneurs français."
        path="/"
        jsonLd={[
          orgJsonLd,
          faq && faq.length
            ? {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.slice(0, 4).map((f) => ({
                  '@type': 'Question', name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              }
            : {},
        ]}
      />

      {gestionActive ? (
        <section className="container-page pt-10 pb-8 lg:pt-12">
          <GestionActiveBanner user={user!} />
        </section>
      ) : (
      <section className="relative overflow-hidden pb-24">
        {/* base pastel backdrop */}
        <div aria-hidden="true" className="absolute inset-0 -z-30 bg-gradient-to-br from-primary-50 via-surface to-secondary-50 bg-[length:200%_200%] animate-bg-pan" />
        {/* dot pattern very faint */}
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-dot-pattern opacity-50" />
        {/* radial highlights — very light tints */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(55%_45%_at_20%_10%,rgba(124,58,237,0.10),transparent),radial-gradient(45%_35%_at_85%_20%,rgba(236,72,153,0.08),transparent)]" />
        {/* floating decorative blobs — pastel */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-300/30 blur-3xl animate-float-lg" />
        <div aria-hidden="true" className="pointer-events-none absolute top-40 -left-24 h-80 w-80 rounded-full bg-secondary-200/40 blur-3xl animate-float" />
        {/* wave bottom — masks into next section */}
        <svg aria-hidden="true" className="absolute -bottom-1 left-0 right-0 -z-10 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 60 Q 360 0 720 60 T 1440 60 L 1440 120 L 0 120 Z" fill="rgb(var(--color-surface-muted))" />
        </svg>

        <div className="container-page pt-4 pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Reveal direction="up" delay={0}>
                <span className="badge-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
                  Connecté au Guichet unique INPI
                </span>
              </Reveal>
              <Reveal direction="up" delay={120}>
                <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                  Créez votre <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-[length:200%_100%] bg-clip-text text-transparent animate-bg-pan">micro-entreprise</span> en 5 minutes.
                </h1>
              </Reveal>
              <Reveal direction="up" delay={240}>
                <p className="mt-6 max-w-xl text-xl text-ink-muted">
                  Déclaration accompagnée, simulateur URSSAF, facturation, rappels d’échéances.
                  <span className="font-semibold text-ink"> Tout pour piloter votre micro, sans paperasse.</span>
                </p>
              </Reveal>
              <Reveal direction="up" delay={360}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to={cta.href}
                    className="btn-primary w-full justify-center px-7 py-4 text-base font-bold shadow-elevated hover:scale-[1.02] sm:w-auto"
                  >
                    {cta.label} <Icon.Arrow className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/tarifs"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-600 bg-surface px-7 py-4 text-base font-bold text-primary-700 shadow-soft transition hover:bg-primary-50 hover:shadow-elevated sm:w-auto"
                  >
                    Voir les tarifs
                  </Link>
                </div>
              </Reveal>
              <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {TRUST.map((t, i) => (
                  <Reveal key={t.v} direction="up" delay={500 + i * 90}>
                    <div className="rounded-2xl border border-surface-border/80 bg-surface/70 px-3 py-3 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft">
                      <dt className="text-xs uppercase tracking-wider text-ink-muted">{t.v}</dt>
                      <dd className="mt-0.5 font-display text-2xl font-bold text-primary-700">{t.k}</dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
            </div>

            <Reveal direction="scale" delay={200}>
              <div className="relative">
                <IllustrationHero className="w-full h-auto" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      )}

      {/* STEPS */}
      <section className="container-page py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge-secondary"><Icon.Spark className="h-3.5 w-3.5" /> Parcours</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Trois étapes, zéro paperasse</h2>
            <p className="mt-4 text-lg text-ink-muted">Pensé pour aller vite, sans sacrifier la conformité.</p>
          </div>
        </Reveal>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 120}>
              <div className="card relative overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-elevated">
                <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${s.bg} opacity-70 blur-2xl`} />
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-ink-inverse shadow-soft">
                  <s.Icon className="h-6 w-6" />
                </span>
                <p className="mt-5 font-display text-sm font-bold tracking-wider text-primary-700">{s.n}</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-ink-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* FEATURE SHOWCASE — illustrations side */}
      <section className="bg-surface border-y border-surface-border">
        <div className="container-page py-24 space-y-24">
          <FeatureRow
            badge="Chat IA"
            title="Une conversation, pas un formulaire."
            body="L'assistant pose une question à la fois, comprend votre projet, et déduit la forme juridique adaptée. Vous gagnez du temps, et vous évitez les pièges classiques."
            cta={{ to: '/creer-mon-entreprise', label: 'Tester le chat' }}
            illustration={<IllustrationChat className="h-full w-full" />}
          />
          <FeatureRow
            reverse
            badge="Garantie zéro rejet"
            title="Contrôle juridique avant transmission."
            body="Nos juristes valident votre dossier avant dépôt au Guichet unique. Si l'INPI demande une correction, nous la réalisons gratuitement."
            cta={{ to: '/tarifs', label: 'Voir les tarifs' }}
            illustration={<IllustrationShield className="h-full w-full" />}
          />
          <FeatureRow
            badge="Espace gestion"
            title="Pilotez après la création."
            body="Tableau de bord, calculateurs URSSAF/TVA, facturation, modèles juridiques, mise en pause, fermeture. Tout au même endroit."
            cta={{ to: '/espace-createur', label: 'Voir le tableau de bord' }}
            illustration={<IllustrationGrowth className="h-full w-full" />}
          />
        </div>
      </section>

      {/* WHY US — feature grid */}
      <section className="container-page py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Pourquoi nous choisir</h2>
            <p className="mt-4 text-lg text-ink-muted">Six raisons concrètes de démarrer avec Swivo.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="card group h-full p-6 transition hover:-translate-y-1 hover:shadow-elevated">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-ink-inverse transition">
                  <f.Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-ink-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* POUR QUI ? — profils micro typiques */}
      <section className="bg-surface border-y border-surface-border">
        <div className="container-page py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="badge-primary"><Icon.Briefcase className="h-3.5 w-3.5" /> Pour qui ?</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">La micro, faite pour qui ?</h2>
              <p className="mt-3 text-lg text-ink-muted">Freelances, artisans, consultants, e-commerçants, créatifs — sous 188 700 € (vente) ou 77 700 € (service) annuel.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Freelances tech',     body: 'Dev, designer, growth, data — BNC libéral non réglementé.', icon: '💻' },
              { title: 'Artisans qualifiés',  body: 'Bâtiment, esthétique, coiffure, alimentation — CAP requis.', icon: '🔨' },
              { title: 'Commerçants en ligne', body: 'E-commerce, dropshipping, ventes B2C — régime BIC.',        icon: '🛍️' },
              { title: 'Consultants & coachs', body: 'Formation, RH, sport, bien-être — BNC ou BIC selon prestation.', icon: '🎯' },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 80} direction="up">
                <div className="card h-full p-6">
                  <span className="text-3xl">{p.icon}</span>
                  <h3 className="mt-3 font-display text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GESTION upsell — hidden when already subscribed (banner shown at top) */}
      {!gestionActive && (
        <section className="container-page py-24">
          <GestionUpsell />
        </section>
      )}

      {/* COMPARE TABLE */}
      <section className="container-page py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Pourquoi Swivo ?</h2>
            <p className="mt-4 text-lg text-ink-muted">Comparaison honnête, chiffres réels.</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-secondary-300 bg-secondary-50 px-4 py-1.5 text-sm font-medium text-secondary-800">
              🏦 Aucun compte bancaire imposé — gardez votre banque
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12 overflow-x-auto rounded-3xl border border-surface-border bg-surface shadow-soft">
            <table className="w-full min-w-[520px]">
              <thead className="bg-surface-muted text-left">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-ink-muted">Critère</th>
                  <th className="px-6 py-4 text-sm font-medium text-ink-muted">Autres services</th>
                  <th className="px-6 py-4 text-sm font-semibold text-primary-700">Swivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {COMPARE.map((c) => (
                  <tr key={c.k} className="transition hover:bg-surface-muted/60">
                    <td className="px-6 py-4 font-medium text-ink">{c.k}</td>
                    <td className="px-6 py-4 text-ink-muted">{c.them}</td>
                    <td className="px-6 py-4 font-bold text-ink">{c.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* REVIEWS CAROUSEL */}
      <section className="container-page py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge-secondary"><Icon.Sparkle className="h-3.5 w-3.5" /> Avis vérifiés</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Ils ont lancé leur boîte avec Swivo</h2>
            <p className="mt-4 text-lg text-ink-muted">Plus de 12&nbsp;000 entrepreneurs nous font confiance. Voici ce qu’ils en disent.</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <ReviewsCarousel />
        </Reveal>
      </section>

      {/* FOUNDERS STORIES */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge-primary"><Icon.Building className="h-3.5 w-3.5" /> Portraits</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Cinq parcours, une même décision</h2>
            <p className="mt-4 text-lg text-ink-muted">Ils ont sauté le pas. Voici qui ils sont et pourquoi ils ont créé leur entreprise.</p>
          </div>
        </Reveal>
        <FoundersBlock />
      </section>

      {/* PRICING TEASER */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-surface-border bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 text-ink-inverse">
            <div aria-hidden="true" className="absolute inset-0 bg-grid-pattern opacity-30" />
            <div aria-hidden="true" className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float-lg" />
            <div className="relative grid items-center gap-10 p-12 md:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl font-bold sm:text-5xl">Tarifs simples, sans surprise.</h2>
                <p className="mt-4 text-lg text-ink-inverse/85">
                  <strong>29,90 €</strong> pour créer · <strong>9,90 €/mois</strong> pour gérer.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/tarifs" className="btn bg-ink-inverse text-primary-700 hover:bg-white">Voir les tarifs</Link>
                  <Link to={cta.href} className="btn border border-ink-inverse/40 text-ink-inverse hover:bg-white/10">{cta.shortLabel}</Link>
                </div>
              </div>
              <ul className="grid gap-3">
                {['Dossier conforme garanti', 'Transmission Guichet unique sous 24h', 'Suivi temps réel + alertes', 'Support juridique humain', 'Données hébergées en France'].map((l) => (
                  <li key={l} className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary-400/20">
                      <Icon.Check className="h-4 w-4 text-secondary-200" />
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ TEASER */}
      <section className="container-page pb-28">
        <div className="grid gap-12 lg:grid-cols-3">
          <Reveal>
            <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Questions fréquentes</h2>
            <p className="mt-4 text-lg text-ink-muted">Toutes les réponses sur la création et la gestion d’entreprise.</p>
            <Link to="/faq" className="btn-outline mt-6">Voir toutes les FAQ</Link>
            <div className="mt-8">
              <IllustrationDossier className="h-44 w-full" />
            </div>
          </Reveal>
          <div className="lg:col-span-2 space-y-3">
            {(faq ?? []).slice(0, 4).map((f, i) => (
              <Reveal key={f.q} delay={i * 90} direction="right">
                <details className="card group p-5 open:shadow-elevated">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 font-display font-semibold text-ink">
                    {f.q}
                    <span className="ml-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-ink-muted">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function GestionUpsell() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[28px] border border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-accent-50 p-10 lg:p-14">
        <div aria-hidden="true" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-300/30 blur-3xl animate-float-lg" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary-200/50 blur-3xl animate-float" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="badge-primary"><Icon.Sparkle className="h-3.5 w-3.5" /> Après création</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Pilotez votre entreprise pour{' '}
              <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-[length:200%_100%] bg-clip-text text-transparent animate-bg-pan">9,90 €/mois</span>
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              La formule Gestion débloque tous vos outils du quotidien : facturation, modèles juridiques, calculateurs, mise en pause, fermeture assistée. Sans engagement.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tarifs" className="btn-primary px-7 py-3.5 text-base">Activer la Gestion <Icon.Arrow className="h-4 w-4" /></Link>
              <Link to="/espace-createur" className="btn-outline px-7 py-3.5 text-base">Voir le tableau de bord</Link>
            </div>
            <p className="mt-4 text-xs text-ink-muted">Sans engagement · Résiliable en 1 clic · Paiement Stripe</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { Ic: Icon.Doc,       t: 'Facturation & devis', d: 'Illimités, conformes' },
              { Ic: Icon.Calc,      t: 'Calculateurs',         d: 'URSSAF, TVA, IS' },
              { Ic: Icon.Stamp,     t: 'Modèles juridiques',   d: 'PV d’AG, lettres, attestations' },
              { Ic: Icon.Briefcase, t: 'Mise en pause',        d: 'Mise en sommeil assistée' },
              { Ic: Icon.Shield,    t: 'Fermeture',            d: 'Procédure complète guidée' },
              { Ic: Icon.Mail,      t: 'Support prioritaire',  d: 'Réponse sous 2h ouvrées' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 60}>
                <div className="flex items-start gap-3 rounded-2xl border border-surface-border bg-surface/80 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <f.Ic className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">{f.t}</p>
                    <p className="text-xs text-ink-muted">{f.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

function GestionActiveBanner({ user }: { user: { name: string; gestion?: { until: string | null } } }) {
  const cta = useResumeCta();
  const firstName = (user.name || '').split(' ')[0];
  const until = user.gestion?.until ? new Date(user.gestion.until) : null;
  const fmtDate = until ? until.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const SHORTCUTS = [
    { Ic: Icon.Doc,       t: 'Facturation',        to: '/outils/facturation' },
    { Ic: Icon.Calc,      t: 'Calculateurs',        to: '/outils/calculateurs' },
    { Ic: Icon.Stamp,     t: 'Modèles juridiques',  to: '/outils/modeles' },
    { Ic: Icon.Briefcase, t: 'Mes dossiers',        to: '/espace-createur' },
  ];

  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[28px] border border-secondary-300 bg-gradient-to-br from-secondary-50 via-surface to-primary-50 p-10 lg:p-14">
        <div aria-hidden="true" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary-300/40 blur-3xl animate-float-lg" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl animate-float" />
        <div className="relative grid items-start gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-800">
              <span className="inline-flex h-2 w-2 rounded-full bg-secondary-500 animate-pulse" />
              Formule Gestion active
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {getDayGreeting()} {firstName || 'à toi'} 👋 Bonne journée chez Swivo.
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              Tu profites de tous les outils de pilotage : facturation, modèles juridiques, calculateurs avancés, support prioritaire.
              {fmtDate && <> Prochaine échéance : <strong className="text-ink">{fmtDate}</strong>.</>}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SHORTCUTS.map((s) => (
                <Link key={s.t} to={s.to} className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/80 px-4 py-3 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft hover:border-primary-300">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-ink-inverse transition">
                    <s.Ic className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-semibold text-ink group-hover:text-primary-700">{s.t}</span>
                </Link>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/espace-createur" className="btn-primary">Ouvrir mon tableau de bord <Icon.Arrow className="h-4 w-4" /></Link>
              <Link to={cta.href} className="btn-outline">{cta.hasDraft ? 'Reprendre mon dossier' : 'Nouveau dossier'}</Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-surface-border bg-surface p-6 text-center shadow-soft">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700">
                <Icon.Check className="h-7 w-7" />
              </span>
              <p className="mt-3 font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">Abonnement</p>
              <p className="mt-1 font-display text-2xl font-bold text-secondary-700">Actif</p>
              <p className="mt-1 text-xs text-ink-muted">9,90 €/mois</p>
              <Link to="/espace-createur" className="mt-4 inline-block text-xs font-medium text-primary-700 hover:underline">Gérer mon abonnement →</Link>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note : ${n}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i < n ? 'fill-amber-400' : 'fill-surface-border'}`}>
          <path d="M10 1.5l2.7 5.5 6 .9-4.3 4.2 1 6L10 15.3 4.6 18.1l1-6L1.3 7.9l6-.9z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = REVIEWS.length;

  const scrollTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    if (!card) return;
    const gap = 16;
    const width = card.offsetWidth + gap;
    el.scrollTo({ left: i * width, behavior: 'smooth' });
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
      const card = el.querySelector<HTMLElement>('[data-card]');
      if (!card) return;
      const w = card.offsetWidth + 16;
      const i = Math.round(el.scrollLeft / w);
      if (i !== index) setIndex(i);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [index]);

  useEffect(() => {
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>('[data-card]');
      if (!card) return;
      const w = card.offsetWidth + 16;
      const i = Math.round(el.scrollLeft / w);
      const ni = (i + 1) % total;
      el.scrollTo({ left: ni * w, behavior: 'smooth' });
    }, 6000);
    return () => clearInterval(id);
  }, [total]);

  return (
    <div className="relative mt-12">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {REVIEWS.map((r) => (
          <article
            key={r.name}
            data-card
            className="card group relative flex w-[88%] shrink-0 snap-center flex-col gap-4 p-7 sm:w-[420px]"
          >
            <div className="flex items-center justify-between">
              <Stars n={r.rating} />
              <span className="text-xs text-ink-muted">{r.date}</span>
            </div>
            <p className="text-ink leading-relaxed">« {r.text} »</p>
            <div className="mt-auto flex items-center gap-3 border-t border-surface-border pt-4">
              <img
                src={r.avatar}
                alt=""
                loading="lazy"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-surface"
              />
              <div className="flex-1">
                <div className="font-semibold text-ink">{r.name}</div>
                <div className="text-xs text-ink-muted">{r.activite} · {r.city}</div>
              </div>
              <span className="badge-primary">Micro</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Avis précédent"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface text-ink shadow-soft transition hover:bg-surface-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="flex items-center gap-1.5">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setIndex(i); scrollTo(i); }}
              aria-label={`Aller à l’avis ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-primary-600' : 'w-1.5 bg-surface-border hover:bg-ink-muted/40'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Avis suivant"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface text-ink shadow-soft transition hover:bg-surface-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}

function FoundersBlock() {
  return (
    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {FOUNDERS.map((f, i) => (
        <Reveal key={f.name} delay={i * 80}>
          <article className="card group h-full overflow-hidden">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
              <img
                src={f.photo}
                alt={`Portrait de ${f.name}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-ink-inverse backdrop-blur">
                Micro · {f.activite}
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl font-bold text-ink">{f.name}</h3>
                <span className="text-xs text-ink-muted">{f.age} ans · {f.city}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-primary-700">{f.job}</p>
              <p className="mt-3 text-ink-muted">{f.why}</p>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

function FeatureRow({ badge, title, body, cta, illustration, reverse }: {
  badge: string;
  title: string;
  body: string;
  cta: { to: string; label: string };
  illustration: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <Reveal direction={reverse ? 'right' : 'left'}>
        <span className="badge-primary"><Icon.Sparkle className="h-3.5 w-3.5" /> {badge}</span>
        <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h3>
        <p className="mt-4 text-lg text-ink-muted">{body}</p>
        <Link to={cta.to} className="btn-primary mt-6">{cta.label} <Icon.Arrow className="h-4 w-4" /></Link>
      </Reveal>
      <Reveal direction={reverse ? 'left' : 'right'} delay={100}>
        <div className="relative">
          <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-primary-200/30 via-secondary-200/30 to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-surface-border shadow-soft">
            {illustration}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

