import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type Dossier,
  type Field,
  type Question,
  type Associe,
  type Dirigeant,
  type Beneficiaire,
  type Adresse,
  FORMES,
  QUESTIONS,
  nextQuestion,
  previousQuestion,
  totalQuestions,
  questionIndex,
  newDossier,
  computeProfil,
  recommander,
  documentsRequis,
  validate,
  searchActivites,
  MANDAT_TEXTE,
  mandatTexteRendu,
  buildMandat,
  currentValue,
  lastStepId,
  withLastStep,
} from '@/lib/formalites';
import { Icon } from '@/components/Icons';
import { saveDraft, finalizeDraft, startCheckout } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { upsertAnonDraft, setAnonIdentite } from '@/lib/anon-profile';
import { useToast } from '@/components/Toast';
import { DocumentsManager } from '@/components/DocumentsManager';
import { parseNir } from '@/lib/nir';

const LOCAL_KEY = 'swivo.formalites.dossier.v2';
const LOCAL_DRAFT_KEY = 'swivo.formalites.draft.ref.v1';

type DraftRef = { id: number; token: string | null };
type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export function FormalitesWizard({ initialDraft, onComplete }: { initialDraft?: { id: number; token: string | null; payload: Dossier }; onComplete?: (d: Dossier) => void }) {
  const nav = useNavigate();
  const { nonce, user } = useAuth();
  const toast = useToast();

  const [dossier, setDossier] = useState<Dossier>(() => {
    if (initialDraft?.payload) return initialDraft.payload;
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...newDossier(), mandat: buildMandat() };
  });
  const [currentId, setCurrentId] = useState<string>(() => {
    // Resume strategy: prefer the explicit last-step marker if still applicable,
    // otherwise the first unanswered applicable question.
    const saved = lastStepId(dossier);
    if (saved) {
      const q = QUESTIONS.find((qq) => qq.id === saved);
      const p = computeProfil(dossier);
      if (q && q.applicable(dossier, p)) return saved;
    }
    return nextQuestion(dossier)?.id ?? QUESTIONS[0]!.id;
  });

  const [draftRef, setDraftRef] = useState<DraftRef | null>(() => {
    if (initialDraft) return { id: initialDraft.id, token: initialDraft.token };
    try {
      const stored = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(dossier)); } catch {}
  }, [dossier]);

  // Remonte en haut de la question à chaque navigation — sinon sur mobile le
  // titre + champ sont sous le pli et l'utilisateur ne voit que les boutons.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
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
    } catch {}
  }, [draftRef]);

  // Debounced backend save
  useEffect(() => {
    const serialized = JSON.stringify(dossier);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      const report = validate(dossier);
      const payload = { ...dossier, scoreCompletude: report.scoreCompletude };
      const r = await saveDraft(payload, { id: draftRef?.id, token: draftRef?.token, nonce });
      if (r.ok && r.data) {
        const ref = { id: r.data.id, token: r.data.token ?? draftRef?.token ?? null };
        setDraftRef(ref);
        setSavedAt(r.data.savedAt);
        setSaveState('saved');
        // Anonymous user: persist draft ref to anon profile + capture identity if available
        if (!user && ref.token) {
          upsertAnonDraft({ id: ref.id, token: ref.token, forme: dossier.forme, score: report.scoreCompletude, savedAt: r.data.savedAt });
          const persoDir = dossier.dirigeants?.[0]?.personne ?? dossier.associes?.[0]?.personne;
          if (persoDir && (persoDir.prenom || persoDir.email)) {
            setAnonIdentite({ prenom: persoDir.prenom, nom: persoDir.nom, email: persoDir.email, telephone: persoDir.telephone });
          }
        }
      } else {
        setSaveState('offline');
        toast.push({ kind: 'warning', title: 'Sauvegarde hors-ligne', message: 'Le serveur est injoignable. Vos données restent en local jusqu’à reconnexion.', ttl: 4000 });
      }
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [dossier, draftRef, nonce, user]);

  const current = QUESTIONS.find((q) => q.id === currentId) ?? QUESTIONS[0]!;
  const idx = questionIndex(dossier, currentId);
  const total = totalQuestions(dossier);
  const progress = Math.round(((idx + 1) / total) * 100);
  const report = useMemo(() => validate(dossier), [dossier]);
  const docs = useMemo(() => documentsRequis(dossier), [dossier]);
  const recos = useMemo(() => recommander(computeProfil(dossier)), [dossier]);

  function submit(value: any) {
    // Per-step validation
    const errors = current.validateStep?.(value, dossier) ?? [];
    if (errors.length) {
      toast.push({
        kind: 'error',
        title: `Erreur — ${current.title}`,
        message: errors.join('\n'),
        ttl: 6000,
      });
      return;
    }
    const updated = current.apply(value, dossier);

    // Final recap : also run global validation to surface any inconsistency
    if (current.id === 'final_recap') {
      const report = validate(updated);
      if (!report.pretATransmettre) {
        toast.push({
          kind: 'error',
          title: 'Dossier incomplet',
          message: report.issues.filter((i) => i.level === 'error').slice(0, 5).map((i) => '• ' + i.message).join('\n') || 'Erreurs détectées.',
          ttl: 8000,
        });
        return;
      }
    }

    const nxt = nextQuestion(updated, currentId);
    const nextId = nxt?.id ?? currentId;
    setDossier(withLastStep(updated, nextId));
    if (nxt) setCurrentId(nxt.id);
    else onComplete?.(updated);
  }

  function back() {
    const prev = previousQuestion(dossier, currentId);
    if (prev) {
      setDossier((d) => withLastStep(d, prev.id));
      setCurrentId(prev.id);
    }
  }

  async function pauseAndExit() {
    // Force-save current state synchronously then navigate to dashboard.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    const report = validate(dossier);
    const payload = { ...dossier, scoreCompletude: report.scoreCompletude };
    const r = await saveDraft(payload, { id: draftRef?.id, token: draftRef?.token, nonce });
    if (r.ok && r.data) {
      setDraftRef({ id: r.data.id, token: r.data.token ?? draftRef?.token ?? null });
      setSavedAt(r.data.savedAt);
      setSaveState('saved');
    }
    nav('/espace-createur');
  }

  async function finalize(opts?: { pay?: boolean }) {
    if (!draftRef) return;
    // Anonymous: backend auto-creates account from payload email + logs cookie.
    // No detour through /inscription — finalize endpoint handles it.
    const r = await finalizeDraft(draftRef.id, draftRef.token, nonce);
    if (!r.ok) return;
    const newId = r.data?.id ?? draftRef.id;
    try { localStorage.removeItem(LOCAL_DRAFT_KEY); localStorage.removeItem(LOCAL_KEY); } catch {}
    onComplete?.(dossier);

    if (opts?.pay) {
      const co = await startCheckout(newId, nonce);
      if (co.ok && co.data?.url) { window.location.href = co.data.url; return; }
      // Fallback: redirect to espace with a flag, user can pay from card.
      nav('/espace-createur?finalized=' + newId + '&pay=1');
      return;
    }
    nav('/espace-createur?finalized=' + newId);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div ref={cardRef} className="card overflow-hidden scroll-mt-24">
        <header className="border-b border-surface-border bg-surface-muted px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">{idx + 1}/{total} · {current.category}</p>
              <h2 className="font-display text-base font-semibold leading-snug text-ink sm:text-lg" title={current.title}>{current.title}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <SaveBadge state={saveState} savedAt={savedAt} />
              <span className="badge-secondary whitespace-nowrap">{progress}%</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {current.help && <p className="mt-2 text-xs text-ink-muted sm:text-sm">{current.help}</p>}
        </header>

        <div className="p-5" key={current.id}>
          <FieldRenderer field={current.field} dossier={dossier} question={current} onSubmit={submit} onFinalize={finalize} recos={recos} docs={docs} report={report} initial={currentValue(dossier, current.id)} />
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-surface-border bg-surface px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          <button
            className="btn-ghost col-span-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
            onClick={back}
            disabled={idx <= 0}
          >
            ← <span className="sm:inline">&nbsp;Précédent</span>
          </button>
          <div className="col-span-1 flex items-center justify-end gap-1.5 sm:gap-2">
            <button
              onClick={pauseAndExit}
              className="btn-outline inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-xs"
              title="Reprendre plus tard"
            >
              ⏸ <span className="hidden sm:inline">&nbsp;Reprendre plus tard</span><span className="sm:hidden">&nbsp;Plus tard</span>
            </button>
            {report.pretATransmettre && draftRef && (
              <button
                onClick={() => void finalize({ pay: true })}
                className="btn-secondary inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-xs"
                title="Finaliser et payer maintenant"
              >
                <span className="hidden sm:inline">Finaliser &amp; transmettre</span><span className="sm:hidden">Finaliser</span>
              </button>
            )}
          </div>
        </footer>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">Conformité INPI</h3>
            <span className={`badge ${report.scoreConformite >= 90 ? 'bg-secondary-100 text-secondary-800' : report.scoreConformite >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{report.scoreConformite}%</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {report.pretATransmettre ? '✅ Dossier prêt à transmettre' : `${report.issues.filter((i) => i.level === 'error').length} erreur(s), ${report.issues.filter((i) => i.level === 'warn').length} avertissement(s)`}
          </p>
          {!report.pretATransmettre && (
            <ul className="mt-3 space-y-1.5 text-xs">
              {report.issues.slice(0, 5).map((i) => (
                <li key={i.code} className={i.level === 'error' ? 'text-rose-700' : 'text-amber-700'}>• {i.message}</li>
              ))}
              {report.issues.length > 5 && <li className="text-ink-muted">+ {report.issues.length - 5} autres</li>}
            </ul>
          )}
        </div>

        {dossier.forme && (
          <div className="card p-5">
            <span className="badge-primary">Forme</span>
            <h3 className="mt-2 font-display text-lg font-semibold text-ink">{FORMES[dossier.forme].label}</h3>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-ink-muted">
              {FORMES[dossier.forme].particularites.slice(0, 3).map((p) => <li key={p}>{p}</li>)}
            </ul>
            {recos.length > 1 && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-primary-700">Autres formes éligibles</summary>
                <ul className="mt-2 space-y-1">
                  {recos.filter((r) => r.forme !== dossier.forme && r.eligible).slice(0, 3).map((r) => (
                    <li key={r.forme} className="flex items-center justify-between">
                      <span className="text-ink">{FORMES[r.forme].shortLabel}</span>
                      <span className="text-ink-muted">{r.score}%</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-ink">Pièces requises ({docs.filter((d) => d.obligatoire).length})</h3>
          <ul className="mt-2 space-y-1 text-xs text-ink-muted">
            {docs.slice(0, 6).map((d) => (
              <li key={d.code} className="flex items-start gap-2">
                <span className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${d.obligatoire ? 'bg-rose-500' : 'bg-ink-muted/40'}`} />
                <span className={d.obligatoire ? 'text-ink' : ''}>{d.titre}</span>
              </li>
            ))}
            {docs.length > 6 && <li className="text-primary-700">+ {docs.length - 6} autres</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================ */
/* FIELD RENDERER                                                */
/* ============================================================ */

function FieldRenderer({
  field, dossier, question, onSubmit, onFinalize, recos, docs, report, initial,
}: {
  field: Field;
  dossier: Dossier;
  question: Question;
  onSubmit: (v: any) => void;
  onFinalize: (opts?: { pay?: boolean }) => void | Promise<void>;
  recos: ReturnType<typeof recommander>;
  docs: ReturnType<typeof documentsRequis>;
  report: ReturnType<typeof validate>;
  initial?: any;
}) {
  switch (field.kind) {
    case 'choice':
      return <ChoiceField field={field} onSubmit={onSubmit} initial={typeof initial === 'string' ? initial : undefined} />;

    case 'text':
    case 'email':
    case 'tel': {
      const placeholder = 'placeholder' in field ? (field as any).placeholder : undefined;
      const multi = 'multiline' in field && (field as any).multiline;
      return <TextField multiline={!!multi} placeholder={placeholder} type={field.kind === 'email' ? 'email' : field.kind === 'tel' ? 'tel' : 'text'} onSubmit={onSubmit} initial={initial ?? ''} />;
    }

    case 'number':
      return <NumberField placeholder="0" suffix={field.suffix} min={field.min} max={field.max} onSubmit={(v) => onSubmit(v)} initial={initial} />;

    case 'date':
      return <DateField onSubmit={onSubmit} initial={typeof initial === 'string' ? initial : ''} />;

    case 'address':
      return <AddressField initial={initial ?? dossier.etablissementPrincipal?.adresse} onSubmit={onSubmit} />;

    case 'activity-search':
      return <ActivitySearch onSubmit={onSubmit} initial={typeof initial === 'string' ? initial : ''} />;

    case 'persons':
      return <PersonsEditor subject={field.subject} dossier={dossier} onSubmit={onSubmit} />;

    case 'capital-table':
      return <CapitalTable dossier={dossier} onSubmit={onSubmit} />;

    case 'documents-checklist':
      return <DocsChecklist docs={docs} onContinue={() => onSubmit(true)} />;

    case 'documents-upload':
      return <DocsUploadStep dossier={dossier} onContinue={() => onSubmit(true)} />;

    case 'nir':
      return <NirStep onSubmit={onSubmit} onSkip={() => onSubmit('')} />;

    case 'id-scan':
      return <IdScanStep onSubmit={onSubmit} onSkip={() => onSubmit(null)} />;

    case 'mandat-accept':
      return <MandatAccept dossier={dossier} onSubmit={onSubmit} />;

    case 'recap':
      return <Recap dossier={dossier} report={report} recos={recos} question={question} onSubmit={onSubmit} onFinalize={onFinalize} />;
  }
}

/* ============================================================ */
/* SUB-FIELDS                                                    */
/* ============================================================ */

function ChoiceField({ field, onSubmit, initial }: { field: Extract<Field, { kind: 'choice' }>; onSubmit: (v: string) => void; initial?: string }) {
  const { options, columns = 2, visual = 'compact' } = field;
  const cols = columns === 4 ? 'sm:grid-cols-4' : columns === 3 ? 'sm:grid-cols-3' : columns === 1 ? '' : 'sm:grid-cols-2';
  const baseDelay = 70;

  if (visual === 'tiles') {
    return (
      <div className={`grid gap-3 ${cols}`}>
        {options.map((o, i) => {
          const onlyIcon = o.iconOnly && o.icon;
          const selected = initial === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onSubmit(o.value)}
              className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border bg-surface px-4 py-6 text-center opacity-0 transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-soft motion-safe:animate-tile-in ${selected ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/20' : 'border-surface-border'}`}
              style={{ animationDelay: `${i * baseDelay}ms`, animationFillMode: 'forwards' }}
            >
              {o.icon && (
                <span aria-hidden className={`block ${onlyIcon ? 'text-5xl' : 'text-3xl'} transition-transform group-hover:scale-110`}>{o.icon}</span>
              )}
              {!onlyIcon && (
                <>
                  <span className="block text-sm font-semibold text-ink">{o.label}</span>
                  {o.hint && <span className="block text-xs text-ink-muted">{o.hint}</span>}
                </>
              )}
              {onlyIcon && (
                <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">{o.label}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((o, i) => {
        const selected = initial === o.value;
        return (
        <button
          key={o.value}
          onClick={() => onSubmit(o.value)}
          className={`group flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-left opacity-0 transition hover:border-primary-500 hover:bg-primary-50/40 motion-safe:animate-tile-in ${selected ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/20' : 'border-surface-border'}`}
          style={{ animationDelay: `${i * baseDelay}ms`, animationFillMode: 'forwards' }}
        >
          {o.icon ? (
            <span aria-hidden className="text-xl">{o.icon}</span>
          ) : (
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-surface-border group-hover:border-primary-600 group-hover:bg-primary-600 group-hover:text-ink-inverse">
              <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l4 4 10-10" /></svg>
            </span>
          )}
          <span>
            <span className="block text-sm font-semibold text-ink">{o.label}</span>
            {o.hint && <span className="block text-xs text-ink-muted">{o.hint}</span>}
          </span>
        </button>
        );
      })}
    </div>
  );
}

function TextField({ placeholder, multiline, type = 'text', onSubmit, initial = '' }: { placeholder?: string; multiline?: boolean; type?: string; onSubmit: (v: string) => void; initial?: string }) {
  const [v, setV] = useState(initial);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!v.trim()) return; onSubmit(v.trim()); };
  return (
    <form onSubmit={submit} className="space-y-3">
      {multiline ? (
        <textarea className="input min-h-[100px]" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      ) : (
        <input type={type} className="input" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      )}
      <button className="btn-primary" type="submit">Continuer <Icon.Arrow className="h-4 w-4" /></button>
    </form>
  );
}

function NumberField({ placeholder, suffix, min, max, onSubmit, initial }: { placeholder?: string; suffix?: string; min?: number; max?: number; onSubmit: (v: number) => void; initial?: number | string }) {
  const [v, setV] = useState<string>(initial != null ? String(initial) : '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); const n = parseFloat(v.replace(',', '.')); if (Number.isNaN(n)) return; onSubmit(n); }} className="space-y-3">
      <div className="flex gap-2">
        <input type="number" className="input" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} min={min} max={max} step="any" autoFocus />
        {suffix && <span className="self-center text-sm text-ink-muted">{suffix}</span>}
      </div>
      <button className="btn-primary" type="submit">Continuer</button>
    </form>
  );
}

function DateField({ onSubmit, initial = '' }: { onSubmit: (v: string) => void; initial?: string }) {
  const [v, setV] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!v) return; onSubmit(v); }} className="space-y-3">
      <div>
        <label htmlFor="swivo-date" className="label">📅 Date de naissance</label>
        <input
          id="swivo-date"
          type="date"
          className="input max-w-[220px]"
          value={v}
          onChange={(e) => setV(e.target.value)}
          autoFocus
          min="1900-01-01"
          max={new Date().toISOString().slice(0, 10)}
          aria-label="Date de naissance"
        />
        <p className="mt-1 text-xs text-ink-muted">Format JJ/MM/AAAA — utilisé pour la vérification d'identité Guichet unique.</p>
      </div>
      <button className="btn-primary" type="submit" disabled={!v}>Continuer</button>
    </form>
  );
}

function AddressField({ initial, onSubmit }: { initial?: Adresse; onSubmit: (v: Adresse) => void }) {
  const [a, setA] = useState<Adresse>(initial ?? { pays: 'FRA' });
  const [query, setQuery] = useState<string>(initial?.voie ? [initial.voie, initial.codePostal, initial.commune].filter(Boolean).join(' ') : '');
  const [sugg, setSugg] = useState<import('@/lib/ban').BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) { setSugg([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      const { searchAddress } = await import('@/lib/ban');
      const r = await searchAddress(query, { signal: ctrl.signal, limit: 6 });
      setSugg(r);
      setLoading(false);
      setOpen(r.length > 0);
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [query]);

  function applySuggestion(s: import('@/lib/ban').BanFeature) {
    const next: Adresse = { ...a, voie: s.voie, codePostal: s.codePostal, commune: s.commune, pays: 'FRA' };
    setA(next);
    setQuery(s.label);
    setOpen(false);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(a); }} className="space-y-3">
      <div className="relative">
        <input
          className="input"
          placeholder="Tapez votre adresse (ex : 12 rue de la République Paris)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => sugg.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoFocus
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">…</span>}
        {open && sugg.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-surface-border bg-surface shadow-elevated">
            {sugg.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-primary-50"
                >
                  <span aria-hidden className="mt-0.5 text-primary-600">📍</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{s.label}</span>
                    <span className="block truncate text-xs text-ink-muted">{s.context}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer">Modifier manuellement</summary>
        <div className="mt-3 space-y-2">
          <input className="input" placeholder="N° + voie" value={a.voie ?? ''} onChange={(e) => setA({ ...a, voie: e.target.value })} />
          <input className="input" placeholder="Complément (bât., étage)" value={a.complement ?? ''} onChange={(e) => setA({ ...a, complement: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
            <input className="input" placeholder="75001" inputMode="numeric" maxLength={5} value={a.codePostal ?? ''} onChange={(e) => setA({ ...a, codePostal: e.target.value })} />
            <input className="input" placeholder="Commune" value={a.commune ?? ''} onChange={(e) => setA({ ...a, commune: e.target.value })} />
          </div>
        </div>
      </details>

      {(a.voie || a.codePostal || a.commune) && (
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm text-secondary-900">
          ✅ <strong>{a.voie}</strong>{a.complement ? `, ${a.complement}` : ''}{a.codePostal || a.commune ? `, ${a.codePostal ?? ''} ${a.commune ?? ''}` : ''}
        </div>
      )}

      <button className="btn-primary" type="submit" disabled={!a.voie || !a.codePostal || !a.commune}>Continuer</button>
    </form>
  );
}

function ActivitySearch({ onSubmit, initial = '' }: { onSubmit: (v: string) => void; initial?: string }) {
  const [q, setQ] = useState(initial);
  const sugg = useMemo(() => searchActivites(q), [q]);
  return (
    <div className="space-y-3">
      <input className="input" placeholder="Tapez votre activité (ex : coiffure, dev web, restaurant)" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {q && (
        <button onClick={() => onSubmit(q)} className="btn-outline text-xs">Garder « {q.slice(0, 50)} »</button>
      )}
      {sugg.length > 0 && (
        <ul className="space-y-1.5">
          {sugg.map((s) => (
            <li key={s.ape}>
              <button onClick={() => onSubmit(s.libelle)} className="flex w-full items-start justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 text-left hover:border-primary-500">
                <span>
                  <span className="block text-sm text-ink">{s.libelle}</span>
                  <span className="block text-xs text-ink-muted">{s.categorie}</span>
                </span>
                <span className="font-mono text-xs text-primary-700">{s.ape}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PersonsEditor({ subject, dossier, onSubmit }: { subject: 'associes' | 'dirigeants' | 'beneficiaires'; dossier: Dossier; onSubmit: (v: any) => void }) {
  const initial =
    subject === 'associes' ? (dossier.associes ?? []) :
    subject === 'dirigeants' ? (dossier.dirigeants ?? []) :
    (dossier.beneficiairesEffectifs ?? []);

  const [items, setItems] = useState<any[]>(initial.length ? initial : [emptyItem(subject, dossier)]);

  function update(i: number, patch: any) {
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  }
  function updatePersonne(i: number, patch: any) {
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, personne: { ...(it.personne ?? {}), ...patch } } : it)));
  }
  function add() { setItems((arr) => [...arr, emptyItem(subject, dossier)]); }
  function remove(i: number) { setItems((arr) => arr.filter((_, j) => j !== i)); }

  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-surface-border bg-surface-muted/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm">{titreSubject(subject)} #{i + 1}</strong>
            {items.length > 1 && <button onClick={() => remove(i)} className="text-xs text-rose-600">Retirer</button>}
          </div>
          {subject === 'dirigeants' && (
            <select className="input mb-3" value={it.fonction ?? ''} onChange={(e) => update(i, { fonction: e.target.value })}>
              <option value="">— Fonction —</option>
              <option value="president">Président</option>
              <option value="directeur_general">Directeur général</option>
              <option value="gerant">Gérant</option>
              <option value="gerant_majoritaire">Gérant majoritaire</option>
              <option value="gerant_minoritaire">Gérant minoritaire</option>
              <option value="cogerant">Co-gérant</option>
            </select>
          )}
          {subject === 'beneficiaires' && (
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <select className="input" value={it.qualite ?? ''} onChange={(e) => update(i, { qualite: e.target.value })}>
                <option value="">Qualité contrôle</option>
                <option value="detention_capital">Détention &gt; 25% capital</option>
                <option value="detention_droits_vote">Détention &gt; 25% vote</option>
                <option value="controle_autre">Autre contrôle</option>
                <option value="dirigeant_defaut">Dirigeant (à défaut)</option>
              </select>
              <input className="input" placeholder="% capital" inputMode="decimal" value={it.pctCapital ?? ''} onChange={(e) => update(i, { pctCapital: parseFloat(e.target.value) || 0 })} />
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-[100px_1fr_1fr]">
            <select className="input" value={it.personne?.civilite ?? ''} onChange={(e) => updatePersonne(i, { civilite: e.target.value })}>
              <option value="">Civilité</option>
              <option value="M">M.</option>
              <option value="Mme">Mme</option>
            </select>
            <input className="input" placeholder="Prénom" value={it.personne?.prenom ?? ''} onChange={(e) => updatePersonne(i, { prenom: e.target.value })} />
            <input className="input" placeholder="Nom" value={it.personne?.nom ?? ''} onChange={(e) => updatePersonne(i, { nom: e.target.value })} />
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-ink-muted">📅 Date de naissance</label>
              <input type="date" className="input max-w-[220px]" value={it.personne?.dateNaissance ?? ''} onChange={(e) => updatePersonne(i, { dateNaissance: e.target.value })} aria-label="Date de naissance" min="1900-01-01" max={new Date().toISOString().slice(0,10)} />
            </div>
            <input className="input" placeholder="Lieu de naissance" value={it.personne?.lieuNaissance ?? ''} onChange={(e) => updatePersonne(i, { lieuNaissance: e.target.value })} />
            <input className="input" placeholder="Nationalité (FRA)" maxLength={3} value={it.personne?.nationalite ?? 'FRA'} onChange={(e) => updatePersonne(i, { nationalite: e.target.value.toUpperCase() })} />
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Email" type="email" value={it.personne?.email ?? ''} onChange={(e) => updatePersonne(i, { email: e.target.value })} />
            <input className="input" placeholder="Téléphone" type="tel" value={it.personne?.telephone ?? ''} onChange={(e) => updatePersonne(i, { telephone: e.target.value })} />
          </div>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-primary-700">Adresse de domicile</summary>
            <div className="mt-2 space-y-2">
              <input className="input" placeholder="Voie" value={it.personne?.domicile?.voie ?? ''} onChange={(e) => updatePersonne(i, { domicile: { ...(it.personne?.domicile ?? {}), voie: e.target.value } })} />
              <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
                <input className="input" placeholder="CP" maxLength={5} value={it.personne?.domicile?.codePostal ?? ''} onChange={(e) => updatePersonne(i, { domicile: { ...(it.personne?.domicile ?? {}), codePostal: e.target.value } })} />
                <input className="input" placeholder="Commune" value={it.personne?.domicile?.commune ?? ''} onChange={(e) => updatePersonne(i, { domicile: { ...(it.personne?.domicile ?? {}), commune: e.target.value } })} />
              </div>
            </div>
          </details>
        </div>
      ))}
      <div className="flex gap-3">
        <button onClick={add} className="btn-outline">+ Ajouter</button>
        <button onClick={() => onSubmit(items)} className="btn-primary">Valider</button>
      </div>
    </div>
  );
}

function CapitalTable({ dossier, onSubmit }: { dossier: Dossier; onSubmit: (v: Associe[]) => void }) {
  const [rows, setRows] = useState<Associe[]>(dossier.associes.length ? dossier.associes : [{ type: 'personne_physique', apport: { numeraire: 0 } }]);
  const total = rows.reduce((s, a) => s + (a.apport.numeraire ?? 0) + (a.apport.nature ?? []).reduce((x, n) => x + n.valeur, 0), 0);

  function update(i: number, patch: any) {
    setRows((arr) => arr.map((it, j) => {
      if (j !== i) return it;
      const updated = { ...it, ...patch };
      if (patch.apport) updated.apport = { ...it.apport, ...patch.apport };
      return updated;
    }));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">Détaillez l’apport de chaque associé. Le total constitue le capital social.</p>
      <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="text-xs uppercase text-ink-muted">
          <tr>
            <th className="text-left">Associé</th>
            <th className="text-right">Numéraire</th>
            <th className="text-right">Libéré</th>
            <th className="text-right">Nature</th>
            <th className="text-right">Parts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {rows.map((a, i) => (
            <tr key={i}>
              <td className="py-2">{a.personne?.prenom ? `${a.personne.prenom} ${a.personne.nom ?? ''}` : `Associé #${i + 1}`}</td>
              <td><input className="input text-right" type="number" min={0} value={a.apport.numeraire ?? 0} onChange={(e) => update(i, { apport: { numeraire: parseFloat(e.target.value) || 0 } })} /></td>
              <td><input className="input text-right" type="number" min={0} value={a.apport.numeraireLibere ?? 0} onChange={(e) => update(i, { apport: { numeraireLibere: parseFloat(e.target.value) || 0 } })} /></td>
              <td><input className="input text-right" type="number" min={0} value={(a.apport.nature ?? []).reduce((s, n) => s + n.valeur, 0)} onChange={(e) => update(i, { apport: { nature: [{ description: 'Apport en nature', valeur: parseFloat(e.target.value) || 0 }] } })} /></td>
              <td><input className="input text-right" type="number" min={0} value={a.partsSociales ?? 0} onChange={(e) => update(i, { partsSociales: parseInt(e.target.value, 10) || 0 })} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-surface-border font-semibold">
          <tr>
            <td className="py-2">Total capital</td>
            <td colSpan={4} className="text-right">{total.toLocaleString('fr-FR')} €</td>
          </tr>
        </tfoot>
      </table>
      </div>
      <button onClick={() => onSubmit(rows)} className="btn-primary">Valider la répartition</button>
    </div>
  );
}

function DocsChecklist({ docs, onContinue }: { docs: ReturnType<typeof documentsRequis>; onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">Voici les pièces justificatives à téléverser pour votre formalité. Vous pourrez les déposer après paiement, dans votre espace.</p>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.code} className={`rounded-lg border p-3 ${d.obligatoire ? 'border-rose-200 bg-rose-50/50' : 'border-surface-border bg-surface-muted/30'}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${d.obligatoire ? 'bg-rose-500' : 'bg-ink-muted/40'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm">{d.titre}</strong>
                  <span className="badge bg-primary-50 text-primary-700">{d.format}</span>
                  {d.obligatoire ? <span className="badge bg-rose-100 text-rose-700">Obligatoire</span> : <span className="badge bg-ink-muted/10 text-ink-muted">Facultatif</span>}
                </div>
                <p className="mt-1 text-xs text-ink-muted">{d.description}</p>
                {d.contexte.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-muted/80">
                    {d.contexte.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={onContinue} className="btn-primary">J’ai noté la liste — Continuer</button>
    </div>
  );
}

function MandatAccept({ dossier, onSubmit }: { dossier: Dossier; onSubmit: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(!!dossier.mandat?.accepte);
  return (
    <div className="space-y-4">
      <div
        className="max-h-72 overflow-y-auto rounded-xl border border-surface-border bg-surface-muted/30 p-4 font-mono text-xs leading-relaxed text-ink"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setScrolled(true);
        }}
      >
        <pre className="whitespace-pre-wrap font-sans">{dossier.mandat?.accepte ? mandatTexteRendu(dossier) : MANDAT_TEXTE}</pre>
      </div>
      {!scrolled && <p className="text-xs text-ink-muted">↓ Faites défiler jusqu’en bas pour activer l’acceptation.</p>}
      <label className={`flex items-start gap-3 rounded-lg border p-3 ${checked ? 'border-secondary-300 bg-secondary-50' : 'border-surface-border bg-surface'} ${!scrolled ? 'opacity-50' : ''}`}>
        <input type="checkbox" disabled={!scrolled} checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 h-4 w-4" />
        <span className="text-sm">
          J’accepte le mandat de dépôt INPI (version {dossier.mandat?.versionTexte}) et confirme que les informations fournies sont exactes.
        </span>
      </label>
      <button onClick={() => onSubmit(checked)} disabled={!checked} className="btn-primary disabled:opacity-50">
        Signer électroniquement
      </button>
    </div>
  );
}

function Recap({ dossier, report, recos, question, onSubmit, onFinalize }: { dossier: Dossier; report: ReturnType<typeof validate>; recos: ReturnType<typeof recommander>; question: Question; onSubmit: (v: any) => void; onFinalize?: (opts?: { pay?: boolean }) => void | Promise<void> }) {
  if (question.id === 'micro_intro') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-secondary-50 p-6">
          <span className="badge-primary">🌱 Micro-entreprise</span>
          <h3 className="mt-3 font-display text-2xl font-bold text-ink">Le statut le plus simple pour démarrer</h3>
          <ul className="mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2">
            <li>✅ <strong>0 €</strong> de frais légaux INPI</li>
            <li>✅ Comptabilité <strong>ultra-simplifiée</strong></li>
            <li>✅ Cotisations URSSAF <strong>au CA réel</strong></li>
            <li>✅ Franchise <strong>TVA</strong> jusqu’aux seuils</li>
            <li>✅ Patrimoine perso <strong>protégé</strong> (RP insaisissable)</li>
            <li>✅ Pas de capital, pas de statuts</li>
          </ul>
          <p className="mt-4 text-sm text-ink-muted">Plafonds CA 2026 : 188 700 € (vente) / 77 700 € (service).</p>
        </div>
        <button onClick={() => onSubmit(true)} className="btn-primary w-full sm:w-auto">Démarrer ma déclaration →</button>
      </div>
    );
  }
  if (question.id === 'recommend') {
    const top = recos[0];
    if (!top) return null;
    const alts = recos.filter((r) => r.eligible && r.forme !== top.forme).slice(0, 5);
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-5">
          <span className="badge-secondary">Recommandation</span>
          <h3 className="mt-2 font-display text-2xl font-bold text-ink">{FORMES[top.forme].label}</h3>
          <p className="mt-1 text-sm text-ink-muted">Score d’adéquation : <strong>{top.score}/100</strong></p>
          <ul className="mt-3 space-y-1 text-sm">
            {top.pour.map((p) => <li key={p}>✅ {p}</li>)}
          </ul>
          <button onClick={() => onSubmit(true)} className="btn-primary mt-5 w-full sm:w-auto">Continuer avec {FORMES[top.forme].shortLabel} →</button>
        </div>

        {alts.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-ink-muted">Ou choisir une autre forme éligible :</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {alts.map((alt, i) => (
                <button
                  key={alt.forme}
                  onClick={() => onSubmit(alt.forme)}
                  className="group flex w-full min-w-0 items-start justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4 text-left opacity-0 transition hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50/40 hover:shadow-soft motion-safe:animate-tile-in"
                  style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'forwards' }}
                  title={FORMES[alt.forme].label}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-ink">{FORMES[alt.forme].shortLabel}</span>
                    <span className="truncate text-xs text-ink-muted">{alt.pour[0] ?? FORMES[alt.forme].particularites[0]}</span>
                  </span>
                  <span className="badge shrink-0 whitespace-nowrap bg-ink-muted/10 text-ink-muted">{alt.score}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  if (question.id === 'act_ape_confirm') {
    return (
      <div className="space-y-3">
        <p className="text-sm">Code APE indicatif : <strong className="font-mono text-primary-700">{dossier.activites[0]?.ape ?? '—'}</strong></p>
        <p className="text-xs text-ink-muted">Catégorie : {dossier.activites[0]?.categorie}</p>
        <button onClick={() => onSubmit(true)} className="btn-primary">Continuer</button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-border bg-surface-muted/30 p-5">
        <h3 className="font-display text-lg font-semibold text-ink">Dossier {report.pretATransmettre ? '✅ prêt' : '⚠️ incomplet'}</h3>
        <p className="mt-1 text-sm text-ink-muted">Complétude : {report.scoreCompletude}% · Conformité : {report.scoreConformite}%</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <Row k="Forme" v={dossier.forme ? FORMES[dossier.forme].label : '—'} />
          <Row k="Dénomination" v={dossier.denomination} />
          <Row k="Activité" v={dossier.activites?.[0]?.description?.slice(0, 60)} />
          <Row k="Siège" v={dossier.etablissementPrincipal?.adresse?.commune} />
          <Row k="Capital" v={dossier.capital?.montantTotal ? `${dossier.capital.montantTotal} €` : '—'} />
          <Row k="Associés" v={String(dossier.associes?.length ?? 0)} />
          <Row k="Dirigeants" v={String(dossier.dirigeants?.length ?? 0)} />
          <Row k="Mandat" v={dossier.mandat?.accepte ? `Signé ${dossier.mandat.dateAcceptation?.slice(0, 10)}` : 'À signer'} />
        </dl>
      </div>
      {question.id === 'final_recap' && onFinalize ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
            <p className="font-display text-base font-semibold text-ink">Finaliser et transmettre votre dossier</p>
            <p className="mt-1 text-sm text-ink-muted">29,90 € TTC — paiement Stripe sécurisé. Frais INPI inclus pour micro-entreprise (0 €). Vous gardez votre banque actuelle.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => void onFinalize({ pay: true })} disabled={!report.pretATransmettre} className="btn-primary flex-1 disabled:opacity-50">
              💳 Payer 29,90 € et transmettre
            </button>
            <button onClick={() => void onFinalize({ pay: false })} disabled={!report.pretATransmettre} className="btn-outline flex-1 disabled:opacity-50">
              ⏰ Payer plus tard
            </button>
          </div>
          {!report.pretATransmettre && (
            <p className="text-xs text-rose-600">Complétez les erreurs du dossier avant de finaliser ({report.issues.filter((i) => i.level === 'error').length}).</p>
          )}
        </div>
      ) : (
        <button onClick={() => onSubmit(true)} className="btn-primary">Transmettre au Guichet unique INPI</button>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-surface-border/40 pb-1">
      <dt className="text-xs uppercase tracking-wider text-ink-muted">{k}</dt>
      <dd className={`text-right text-sm ${v ? 'text-ink' : 'text-ink-muted/50'}`}>{v || '—'}</dd>
    </div>
  );
}

/* ============================================================ */
/* HELPERS                                                       */
/* ============================================================ */

function DocsUploadStep({ dossier, onContinue }: { dossier: Dossier; onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <DocumentsManager dossier={dossier} />
      <button onClick={onContinue} className="btn-primary">Continuer</button>
    </div>
  );
}

function NirStep({ onSubmit, onSkip }: { onSubmit: (v: string) => void; onSkip: () => void }) {
  const [v, setV] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseNir> | null>(null);

  function check(value: string) {
    setV(value);
    if (value.replace(/\s/g, '').length >= 15) {
      setParsed(parseNir(value));
    } else setParsed(null);
  }

  return (
    <div className="space-y-3">
      <input
        className="input font-mono tracking-wider"
        placeholder="1 95 02 75 114 042 87"
        value={v}
        onChange={(e) => check(e.target.value)}
        inputMode="numeric"
        maxLength={21}
        autoFocus
      />
      {parsed && (
        <div className={`rounded-lg border p-3 text-sm ${parsed.valid ? 'border-secondary-300 bg-secondary-50 text-secondary-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
          {parsed.valid ? (
            <>
              ✅ Numéro valide. Pré-rempli : {parsed.sexe === 'M' ? 'Homme' : 'Femme'}
              {parsed.anneeNaissance && parsed.moisNaissance && ` · Né(e) en ${String(parsed.moisNaissance).padStart(2, '0')}/${parsed.anneeNaissance}`}
              {parsed.departementCode && ` · Dépt ${parsed.departementCode}`}
            </>
          ) : '⚠️ Numéro invalide. Vérifiez la saisie.'}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onSubmit(v.trim())} disabled={!parsed?.valid} className="btn-primary disabled:opacity-50">Valider et pré-remplir</button>
        <button onClick={onSkip} className="btn-ghost text-sm">Passer cette étape</button>
      </div>
    </div>
  );
}

function IdScanStep({ onSubmit, onSkip }: { onSubmit: (v: any) => void; onSkip: () => void }) {
  const [busyRecto, setBusyRecto] = useState(false);
  const [busyVerso, setBusyVerso] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recto, setRecto] = useState<any | null>(null);
  const [verso, setVerso] = useState<any | null>(null);
  const [merged, setMerged] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const rectoRef = useRef<HTMLInputElement>(null);
  const versoRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File, side: 'recto' | 'verso') {
    if (side === 'recto') setBusyRecto(true); else setBusyVerso(true);
    setError(null); setWarn(null); setProgress(0);
    try {
      const { scanIdCard, mergeIdScans } = await import('@/lib/ocr');
      const r = await scanIdCard(file, { side, onProgress: (p) => setProgress(p) });
      if (side === 'recto') setRecto(r); else setVerso(r);
      const next = side === 'recto'
        ? mergeIdScans([r, verso])
        : mergeIdScans([recto, r]);
      setMerged(next);
      if (side === 'verso' && r.type === 'unknown') {
        setWarn('Zone MRZ non détectée sur le verso. Réessayez avec un cadrage serré sur la bande MRZ (2 lignes de caractères en bas), bonne lumière, sans reflet.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur OCR');
    } finally {
      if (side === 'recto') setBusyRecto(false); else setBusyVerso(false);
    }
  }

  const tile = (side: 'recto' | 'verso', label: string, hint: string, busy: boolean, data: any) => {
    const ref = side === 'recto' ? rectoRef : versoRef;
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => ref.current?.click()}
          disabled={busy}
          className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 transition disabled:opacity-60 ${data ? 'border-secondary-400 bg-secondary-50/40' : 'border-primary-300 bg-primary-50/30 hover:border-primary-500 hover:bg-primary-50/60'}`}
        >
          <span className="text-4xl">{data ? '✅' : '📷'}</span>
          <span className="font-display text-sm font-semibold text-ink">{label}</span>
          <span className="text-[11px] text-ink-muted">{hint}</span>
          {data && <span className="text-[11px] text-secondary-700">Re-téléverser</span>}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <input ref={rectoRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, 'recto'); e.target.value = ''; }} />
      <input ref={versoRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, 'verso'); e.target.value = ''; }} />
      <div className="grid gap-3 sm:grid-cols-2">
        {tile('recto', 'Recto', 'Photo + libellés (nom, prénoms, lieu de naissance)', busyRecto, recto)}
        {tile('verso', 'Verso (MRZ)', 'Bande de 2 lignes ICAO en bas de la carte', busyVerso, verso)}
      </div>
      <p className="text-xs text-ink-muted">Passeport : photographiez la page principale uniquement (côté verso suffit). Conseil : posez à plat sur surface sombre, lumière douce, sans reflet, MRZ entièrement visible.</p>

      {(busyRecto || busyVerso) && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
          📖 Lecture OCR… {Math.round(progress * 100)} %
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-border">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      {warn && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">⚠️ {warn}</p>}
      {error && <p className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">⚠️ {error}</p>}

      {merged && merged.type !== 'unknown' && (
        <div className="rounded-lg border border-secondary-300 bg-secondary-50 p-4 text-sm">
          <p className="font-semibold text-secondary-900">✨ Données fusionnées ({merged.type === 'cni' ? 'CNI MRZ' : merged.type === 'passport' ? 'Passeport' : 'CNI recto'})</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-secondary-900">
            <li>Civilité : <strong>{merged.civilite ?? '—'}</strong></li>
            <li>Sexe : <strong>{merged.sexe ?? '—'}</strong></li>
            <li>Prénom : <strong>{merged.prenom ?? '—'}</strong></li>
            <li>Tous prénoms : <strong>{merged.prenomsTous?.join(' ') ?? '—'}</strong></li>
            <li>Nom : <strong>{merged.nom ?? '—'}</strong></li>
            {merged.nomUsage && <li>Nom d'usage : <strong>{merged.nomUsage}</strong></li>}
            <li>Date de naissance : <strong>{merged.dateNaissance ?? '—'}</strong></li>
            <li>Lieu de naissance : <strong>{merged.lieuNaissance ?? '—'}</strong></li>
            <li>Nationalité : <strong>{merged.nationalite ?? '—'}</strong></li>
            <li>N° document : <strong>{merged.numeroDocument ?? '—'}</strong></li>
            {merged.dateExpiration && <li>Expiration : <strong>{merged.dateExpiration}</strong></li>}
            {merged.confiance !== undefined && <li className="col-span-2 text-xs text-secondary-700">Confiance OCR : {Math.round(merged.confiance * 100)} %</li>}
          </ul>
          <div className="mt-3 flex gap-2">
            <button onClick={() => onSubmit(merged)} className="btn-primary text-sm">Pré-remplir les champs</button>
            <button onClick={() => { setRecto(null); setVerso(null); setMerged(null); setError(null); setWarn(null); }} className="btn-ghost text-sm">Tout réessayer</button>
          </div>
        </div>
      )}

      <button onClick={onSkip} className="btn-ghost text-sm">Saisir manuellement plus tard</button>
    </div>
  );
}

function SaveBadge({ state, savedAt }: { state: SaveState; savedAt: string | null }) {
  const labelFull =
    state === 'saving' ? 'Sauvegarde…' :
    state === 'saved'  ? `✓ Sauvegardé${savedAt ? ' ' + relative(savedAt) : ''}` :
    state === 'offline' ? '⚠ Hors-ligne (local seulement)' :
    state === 'error'   ? '⚠ Erreur sauvegarde' :
    'Sauvegarde auto';
  const labelShort =
    state === 'saving' ? '…' :
    state === 'saved'  ? '✓' :
    state === 'offline' ? '⚠' :
    state === 'error'   ? '⚠' : '⏺';
  const cls =
    state === 'saving' ? 'bg-primary-50 text-primary-700' :
    state === 'saved'  ? 'bg-secondary-50 text-secondary-700' :
    state === 'offline' ? 'bg-amber-100 text-amber-800' :
    state === 'error'   ? 'bg-rose-100 text-rose-700' :
    'bg-ink-muted/10 text-ink-muted';
  return (
    <span className={`badge whitespace-nowrap ${cls}`} title={labelFull}>
      <span className="sm:hidden">{labelShort}</span>
      <span className="hidden sm:inline">{labelFull}</span>
    </span>
  );
}

function relative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  if (diff < 60_000) return 'à l’instant';
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  return `il y a ${h} h`;
}

function titreSubject(s: 'associes' | 'dirigeants' | 'beneficiaires') {
  return s === 'associes' ? 'Associé' : s === 'dirigeants' ? 'Dirigeant' : 'Bénéficiaire effectif';
}

function emptyItem(subject: 'associes' | 'dirigeants' | 'beneficiaires', _dossier: Dossier): any {
  if (subject === 'associes') return { type: 'personne_physique', personne: { nationalite: 'FRA' }, apport: { numeraire: 0 } } as Associe;
  if (subject === 'dirigeants') {
    // Micro-only : l'entrepreneur lui-même.
    return { type: 'personne_physique', fonction: 'gerant', personne: { nationalite: 'FRA' } } as Dirigeant;
  }
  return { qualite: 'detention_capital', personne: { nationalite: 'FRA' }, pctCapital: 0 } as Beneficiaire;
}
