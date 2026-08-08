import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { useResumeCta } from '@/lib/useResumeCta';
import { getDayGreeting } from '@/lib/greeting';
import { fetchMyDossiers, type DossierSummary } from '@/lib/dossiers';
import { startSubscribe, openBillingPortal, listDrafts, deleteDraft, startCheckout, type DraftSummary } from '@/lib/api';
import { caPeriode, periodeAnnee, periodeMois, getProfilFiscal, ensureDemoData, syncFromServer } from '@/lib/revenus';
import { DocumentsManager } from '@/components/DocumentsManager';
import { alertesPlafonds, calculerCotisations, formatEUR, formatPct, prochainesEcheancesURSSAF, CATEGORIE_LABEL } from '@/lib/urssaf';

type Tool = { name: string; desc: string; to: string; icon: string; gated?: boolean };

const TOOLS: Tool[] = [
  { name: 'Cockpit financier',    desc: 'CA, charges, bénéfices, alertes seuils', to: '/pilotage',            icon: '📊' },
  { name: 'Déclaration URSSAF',   desc: 'Simulateur + assistant',                  to: '/urssaf',              icon: '🧾' },
  { name: 'Simulateurs',          desc: 'Cotisations, TVA, revenu net',            to: '/outils/calculateurs', icon: '🧮' },
  { name: 'Formations',           desc: 'Trouver clients, fixer prix, optimiser', to: '/formations',          icon: '🎓' },
  { name: 'Modèles juridiques',   desc: 'CGV, lettres, mentions légales, RGPD',   to: '/outils/modeles',      icon: '📄', gated: true },
  { name: 'Facturation & devis',  desc: 'PDF conformes, clients, relances',        to: '/outils/facturation',  icon: '💸', gated: true },
  { name: 'Mettre en pause',      desc: 'Cessation temporaire d’activité',         to: '/gestion/pause',       icon: '⏸',  gated: true },
  { name: 'Fermer ma micro',      desc: 'Procédure de radiation assistée',         to: '/gestion/fermeture',   icon: '🛑', gated: true },
  { name: 'Support',              desc: 'Réponse sous 2 h ouvrées',                to: '/contact',             icon: '💬' },
];

const STATUS_COLOR = {
  pending: 'bg-primary-50 text-primary-700',
  awaiting_payment: 'bg-warning/10 text-warning',
  paid: 'bg-primary-100 text-primary-800',
  deposited: 'bg-secondary-50 text-secondary-700',
  completed: 'bg-secondary-100 text-secondary-800',
  rejected: 'bg-danger/10 text-danger',
} as const;

export function EspaceCreateurPage() {
  const { user, nonce } = useAuth();
  const cta = useResumeCta();
  const [payingId, setPayingId] = useState<number | null>(null);

  async function payDossier(id: number) {
    setPayingId(id);
    const r = await startCheckout(id, nonce);
    setPayingId(null);
    if (r.ok && r.data?.url) window.location.href = r.data.url;
    else alert(r.error ?? 'Paiement indisponible. Réessayez.');
  }
  const [dossiers, setDossiers] = useState<DossierSummary[]>([]);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sp] = useSearchParams();
  const paid = sp.get('paid') === '1';
  const finalized = sp.get('finalized');

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMyDossiers(), listDrafts(), syncFromServer()]).then(([d, dr]) => {
      setDossiers(d);
      setDrafts(dr ?? []);
      setLoading(false);
    });
  }, []);

  async function removeDraft(id: number) {
    const ok = await deleteDraft(id);
    if (ok) setDrafts((arr) => arr.filter((d) => d.id !== id));
  }

  // Pilotage data — chargé en local
  const profil = useMemo(() => { ensureDemoData(); return getProfilFiscal(); }, []);
  const caMensuel = useMemo(() => caPeriode(periodeMois()), []);
  const caAnnuel  = useMemo(() => caPeriode(periodeAnnee()), []);
  const cotis     = useMemo(() => calculerCotisations(caMensuel, profil.categorieDefaut, { versementLiberatoire: profil.versementLiberatoire }), [caMensuel, profil]);
  const alertes   = useMemo(() => alertesPlafonds(caAnnuel, profil.categorieDefaut), [caAnnuel, profil.categorieDefaut]);
  const prochaine = useMemo(() => prochainesEcheancesURSSAF(profil.regimeDeclaration, 1)[0], [profil.regimeDeclaration]);

  const active  = dossiers.filter((d) => !['completed', 'rejected'].includes(d.status)).length + drafts.length;
  const totalAll = dossiers.length + drafts.length;

  return (
    <>
      <Seo title="Espace créateur" description="Tableau de bord Swivo" path="/espace-createur" noindex />
      <section className="container-page py-10">
        {paid && (
          <div className="mb-6 rounded-xl border border-secondary-300 bg-secondary-50 p-4 text-sm text-secondary-800">
            ✅ Paiement confirmé. Notre équipe prend votre dossier en charge sous 24h ouvrées.
          </div>
        )}
        {finalized && (
          <div className="mb-6 rounded-xl border border-primary-300 bg-primary-50 p-4 text-sm text-primary-800">
            ✅ Dossier #{finalized} finalisé et transmis. À régler pour transmission INPI.
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-primary">Tableau de bord</span>
              {user?.gestion?.active && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-500 animate-pulse" />
                  Formule Gestion active
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
              {getDayGreeting()} {user?.name ? user.name.split(' ')[0] : ''} 👋
            </h1>
            <p className="mt-1 text-ink-muted">Vos dossiers et vos outils du quotidien.</p>
          </div>
          <Link to={cta.href} className="btn-primary">{cta.hasDraft ? '↻ Reprendre mon dossier' : '+ Nouveau dossier'}</Link>
        </div>

        {user?.gestion?.active && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary-200 bg-gradient-to-r from-secondary-50 via-surface to-primary-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700">✓</span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">Formule Gestion active</p>
                <p className="text-xs text-ink-muted">
                  9,90 €/mois · Tous les outils débloqués
                  {user.gestion.until && <> · Prochaine échéance <strong className="text-ink">{new Date(user.gestion.until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}
                </p>
              </div>
            </div>
            <BillingPortalButton />
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-ink-muted">Dossiers actifs</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{active}</p>
            <p className="mt-1 text-xs text-ink-muted">{totalAll ? `${totalAll} au total` : 'Aucun dossier'}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-ink-muted">CA du mois</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary-700">{formatEUR(caMensuel)}</p>
            <p className="mt-1 text-xs text-ink-muted">{formatEUR(caAnnuel)} cumulé {new Date().getFullYear()}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-ink-muted">URSSAF estimée (mois)</p>
            <p className="mt-1 font-display text-2xl font-bold text-amber-700">{formatEUR(cotis.totalCharges)}</p>
            <p className="mt-1 text-xs text-ink-muted">Taux effectif {formatPct(cotis.taux.effectif)}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-ink-muted">Prochaine échéance</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{prochaine ? new Date(prochaine.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</p>
            <p className="mt-1 text-xs text-ink-muted truncate">{prochaine?.label ?? 'Configurez votre régime'}</p>
          </div>
        </div>

        {alertes.length > 0 && (
          <div className="mt-4 space-y-2">
            {alertes.slice(0, 2).map((a) => (
              <div key={a.code} className={`rounded-xl border p-3 text-sm ${a.niveau === 'critical' ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
                <strong>{a.niveau === 'critical' ? '⛔' : '⚠️'} {a.message}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-ink-muted">
          Catégorie : <strong className="text-ink">{CATEGORIE_LABEL[profil.categorieDefaut]}</strong> · <Link to="/pilotage" className="link">Modifier le profil fiscal</Link>
        </div>

        <details className="mt-10 card p-5">
          <summary className="cursor-pointer font-display text-lg font-semibold text-ink">📎 Mes pièces justificatives</summary>
          <p className="mt-2 text-sm text-ink-muted">Téléversez les pièces nécessaires à votre déclaration INPI. Vous pouvez le faire à tout moment.</p>
          <div className="mt-4">
            <DocumentsManagerLite />
          </div>
        </details>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink">Mes dossiers</h2>
          {loading && <p className="mt-3 text-sm text-ink-muted">Chargement…</p>}

          {!loading && dossiers.length === 0 && drafts.length === 0 && (
            <div className="card mt-3 p-6 text-center">
              <p className="text-sm text-ink-muted">Aucun dossier pour le moment.</p>
              <Link to="/creer-mon-entreprise" className="btn-primary mt-4">Créer mon premier dossier</Link>
            </div>
          )}

          <div className="mt-3 space-y-3">
            {drafts.map((d) => (
              <div key={`draft-${d.id}`} className="card border-primary-200 bg-primary-50/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="badge bg-primary-100 text-primary-700">Brouillon</span>
                      <p className="text-xs text-ink-muted">#{d.id} · {d.forme?.toUpperCase() || '—'}</p>
                    </div>
                    <p className="mt-1 truncate font-display text-base font-semibold text-ink">{d.title.replace(/^\[Brouillon\]\s*/, '') || 'Sans titre'}</p>
                    <p className="mt-1 text-xs text-ink-muted">Dernière sauvegarde : {new Date(d.savedAt || d.updatedAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <span className="badge bg-ink-muted/10 text-ink-muted shrink-0">{d.score}% complété</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500" style={{ width: `${d.score}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/creer-mon-entreprise?draft=${d.id}`} className="btn-primary text-xs">Reprendre la saisie</Link>
                  <button onClick={() => removeDraft(d.id)} className="btn-ghost text-xs text-rose-600 hover:bg-rose-50">Supprimer</button>
                </div>
              </div>
            ))}

            {dossiers.map((d) => {
              const payable = d.status === 'pending' || d.status === 'awaiting_payment';
              return (
                <div key={d.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-ink-muted">{d.reference}</p>
                      <p className="font-display text-base font-semibold text-ink">{d.title}</p>
                    </div>
                    <span className={`badge ${STATUS_COLOR[d.status] ?? 'bg-ink-muted/10 text-ink-muted'}`}>{d.statusLabel}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500" style={{ width: `${d.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-ink-muted">{d.progress}%</span>
                  </div>
                  {payable && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <span className="text-sm text-amber-900">⏳ Paiement requis pour transmettre au Guichet unique.</span>
                      <button
                        onClick={() => payDossier(d.id)}
                        disabled={payingId === d.id}
                        className="btn-primary ml-auto text-xs disabled:opacity-60"
                      >
                        {payingId === d.id ? 'Redirection Stripe…' : 'Payer 29,90 €'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Outils de gestion</h2>
            {!user?.gestion?.active && <SubscribeButton />}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => {
              const locked = t.gated && !user?.gestion?.active;
              return (
                <Link key={t.name} to={t.to}
                  className={`group card relative flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-elevated ${locked ? 'opacity-70' : ''}`}>
                  <span className="text-2xl">{t.icon}</span>
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="font-display text-base font-semibold text-ink group-hover:text-primary-700">{t.name}</span>
                      {locked && <span className="badge bg-primary-50 text-primary-700">🔒 Gestion</span>}
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">{t.desc}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {!user?.gestion?.active && (
            <div className="mt-8 overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-accent-50 p-8">
              <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
                <div>
                  <span className="badge-primary">Formule Gestion · 9,90 €/mois</span>
                  <h3 className="mt-2 font-display text-2xl font-bold text-ink">Débloquez tous vos outils de pilotage</h3>
                  <p className="mt-2 text-ink-muted">Facturation, modèles juridiques, mise en pause, fermeture, calculateurs avancés, support prioritaire.</p>
                </div>
                <SubscribeButton large />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function SubscribeButton({ large = false }: { large?: boolean }) {
  const { nonce } = useAuth();
  const [busy, setBusy] = useState(false);
  const click = async () => {
    setBusy(true);
    const r = await startSubscribe(nonce);
    setBusy(false);
    if (r.ok && r.data?.url) window.location.href = r.data.url;
  };
  return (
    <button onClick={click} disabled={busy} className={`btn-primary ${large ? 'px-7 py-3.5 text-base' : ''}`}>
      {busy ? 'Redirection…' : 'Activer la Gestion 9,90 €/mois'}
    </button>
  );
}

function DocumentsManagerLite() {
  return <DocumentsManager dossier={{ activites: [], associes: [], dirigeants: [], beneficiairesEffectifs: [], options: {}, version: 1, statut: 'brouillon', scoreCompletude: 0, forme: 'micro' } as any} />;
}

function BillingPortalButton() {
  const { nonce } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const click = async () => {
    setBusy(true);
    setErr(null);
    const r = await openBillingPortal(nonce);
    setBusy(false);
    if (r.ok && r.data?.url) window.location.href = r.data.url;
    else setErr(r.error ?? 'Portail indisponible.');
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={click} disabled={busy} className="btn-outline text-xs">
        {busy ? 'Ouverture…' : 'Gérer mon abonnement'}
      </button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  );
}
