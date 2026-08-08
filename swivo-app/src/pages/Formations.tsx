import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { FORMATIONS, CATEGORIES, CATEGORY_LABEL, LEVEL_LABEL, type Formation, type FormationCategory } from '@/data/formations';
import { FormationVideo } from '@/components/FormationVideo';

export function FormationsPage() {
  const [filter, setFilter] = useState<FormationCategory | 'all'>('all');
  const filtered = useMemo(() => filter === 'all' ? FORMATIONS : FORMATIONS.filter((f) => f.category === filter), [filter]);

  return (
    <>
      <Seo title="Formations & guides micro-entreprise — Swivo" description="Mini-formations pratiques pour trouver vos clients, fixer vos prix, comprendre l'URSSAF, optimiser votre CA." path="/formations" />
      <section className="container-page py-10 lg:py-14">
        <div className="mb-8 max-w-2xl">
          <span className="badge-primary">🎓 Académie Swivo</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Formations & guides</h1>
          <p className="mt-2 text-ink-muted">Méthodes éprouvées pour démarrer, vendre, déclarer, optimiser et grandir en micro-entreprise.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={`badge ${filter === 'all' ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}>Toutes ({FORMATIONS.length})</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`badge ${filter === c ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}>
              {CATEGORY_LABEL[c]} ({FORMATIONS.filter((f) => f.category === c).length})
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <FormationCard key={f.slug} f={f} />
          ))}
        </div>

        <div className="mt-16 card border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-accent-50 p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Une question, un cas particulier ?</h2>
              <p className="mt-2 text-ink-muted">Posez votre question à notre équipe — réponse sous 2 h ouvrées avec la formule Gestion.</p>
            </div>
            <Link to="/tarifs" className="btn-primary">Activer la Gestion 9,90 €/mois</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FormationCard({ f }: { f: Formation }) {
  return (
    <Link to={`/formations/${f.slug}`} className="card group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <span className="text-4xl">{f.icon}</span>
        <div className="flex flex-col items-end gap-1">
          {(f.videoUrl || f.explainer) && <span className="badge bg-primary-100 text-primary-800">🎬 Vidéo</span>}
          <span className="badge bg-ink-muted/10 text-ink-muted">{f.duration}</span>
          {f.premium && <span className="badge bg-amber-100 text-amber-800">Premium</span>}
        </div>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-ink group-hover:text-primary-700">{f.title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{f.excerpt}</p>
      <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-ink-muted">
        <span className="badge bg-primary-50 text-primary-700">{CATEGORY_LABEL[f.category]}</span>
        <span className="badge bg-secondary-50 text-secondary-700">{LEVEL_LABEL[f.level]}</span>
      </div>
    </Link>
  );
}

/* ============================================================ */
/* SINGLE FORMATION PAGE                                          */
/* ============================================================ */

export function FormationDetailPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const f = useMemo(() => FORMATIONS.find((x) => x.slug === slug), [slug]);
  const [activeStep, setActiveStep] = useState(0);

  if (!f) {
    return (
      <section className="container-page py-16 text-center">
        <p className="text-ink-muted">Formation introuvable.</p>
        <Link to="/formations" className="btn-primary mt-4">Retour aux formations</Link>
      </section>
    );
  }

  function next() { if (f && activeStep < f.steps.length - 1) setActiveStep(activeStep + 1); }
  function prev() { if (activeStep > 0) setActiveStep(activeStep - 1); }

  const progress = ((activeStep + 1) / f.steps.length) * 100;
  const step = f.steps[activeStep]!;

  return (
    <>
      <Seo title={`${f.title} — Swivo`} description={f.excerpt} path={`/formations/${f.slug}`} />
      <section className="container-page py-10 lg:py-14">
        <button onClick={() => nav('/formations')} className="text-sm text-primary-700 hover:underline">← Toutes les formations</button>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-primary-50 text-primary-700">{CATEGORY_LABEL[f.category]}</span>
                  <span className="badge bg-secondary-50 text-secondary-700">{LEVEL_LABEL[f.level]}</span>
                  <span className="badge bg-ink-muted/10 text-ink-muted">⏱ {f.duration}</span>
                  {f.premium && <span className="badge bg-amber-100 text-amber-800">Premium</span>}
                </div>
                <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{f.icon} {f.title}</h1>
                <p className="mt-2 text-ink-muted">{f.excerpt}</p>
              </div>
            </div>

            {(f.videoUrl || f.explainer) && (
              <div className="mt-6">
                <FormationVideo videoUrl={f.videoUrl} poster={f.videoPoster} explainer={f.explainer} />
                {f.explainer && (
                  <p className="mt-2 text-xs text-ink-muted">▶️ Lance la vidéo pour la version vulgarisée en {f.explainer.totalDuration}. Le contenu détaillé suit ci-dessous.</p>
                )}
              </div>
            )}

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-border">
              <div className="h-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-muted">Étape {activeStep + 1} / {f.steps.length}</p>

            <article className="mt-8 card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">{step.title}</h2>
                {step.duration && <span className="badge bg-ink-muted/10 text-ink-muted">⏱ {step.duration}</span>}
              </div>
              <div className="prose prose-sm mt-4 max-w-none whitespace-pre-line text-ink">
                {step.body}
              </div>
            </article>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={prev} disabled={activeStep === 0} className="btn-ghost text-sm disabled:opacity-40">← Précédent</button>
              {activeStep < f.steps.length - 1 ? (
                <button onClick={next} className="btn-primary">Suivant →</button>
              ) : (
                <Link to="/formations" className="btn-primary">Voir d'autres formations</Link>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Sommaire</h3>
              <ol className="mt-3 space-y-2 text-sm">
                {f.steps.map((s, i) => (
                  <li key={i}>
                    <button onClick={() => setActiveStep(i)} className={`flex w-full items-start gap-2 rounded-md px-2 py-1 text-left transition ${i === activeStep ? 'bg-primary-50 text-primary-800 font-semibold' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'}`}>
                      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${i < activeStep ? 'bg-secondary-500 text-ink-inverse' : i === activeStep ? 'bg-primary-600 text-ink-inverse' : 'bg-surface-border text-ink-muted'}`}>
                        {i < activeStep ? '✓' : i + 1}
                      </span>
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Outils liés</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/pilotage" className="text-primary-700 hover:underline">→ Cockpit financier</Link></li>
                <li><Link to="/urssaf" className="text-primary-700 hover:underline">→ Assistant URSSAF</Link></li>
                <li><Link to="/outils/calculateurs" className="text-primary-700 hover:underline">→ Simulateurs</Link></li>
                <li><Link to="/outils/facturation" className="text-primary-700 hover:underline">→ Facturation</Link></li>
                <li><Link to="/outils/modeles" className="text-primary-700 hover:underline">→ Modèles juridiques</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
