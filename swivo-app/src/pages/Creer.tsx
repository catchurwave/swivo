import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { STEPS, type Dossier, type Step, recommend } from '@/lib/chat-flow';
import { FORMES_SEED } from '@/data/seeds';
import { chatTurn, startCheckout, submitDossier, fetchDraft, type ChatMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FormalitesWizard } from '@/components/FormalitesWizard';
import { useToast } from '@/components/Toast';

type ChatMsg =
  | { from: 'bot'; text: string; stepId?: string }
  | { from: 'user'; text: string };

const LOCAL_KEY = 'swivo.dossier.v1';
const TOTAL = Object.keys(STEPS).length;

export function CreerPage() {
  const { user, nonce } = useAuth();
  const nav = useNavigate();

  const [dossier, setDossier] = useState<Dossier>(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch { return {}; }
  });
  const [currentId, setCurrentId] = useState<string | null>('start');
  const [history, setHistory] = useState<ChatMsg[]>([{ from: 'bot', text: STEPS.start.question({}), stepId: 'start' }]);
  const [sp] = useSearchParams();
  const draftId = sp.get('draft');
  const draftToken = sp.get('token');
  const [mode, setMode] = useState<'guide' | 'expert' | 'ia'>('expert');
  const [draftLoaded, setDraftLoaded] = useState<{ id: number; token: string | null; payload: any } | null>(null);
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

  const aiMode = mode === 'ia';
  const setAiMode = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(aiMode) : v;
    setMode(next ? 'ia' : 'guide');
  };
  const toast = useToast();
  const [aiPending, setAiPending] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [savedDossierId, setSavedDossierId] = useState<number | null>(null);
  const [payState, setPayState] = useState<'idle' | 'redirecting' | 'error'>('idle');

  useEffect(() => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(dossier)); } catch {}
  }, [dossier]);

  const step: Step | null = !aiMode && currentId ? STEPS[currentId] : null;

  const progress = useMemo(() => {
    const done = history.filter((m) => m.from === 'user').length;
    return Math.min(100, Math.round((done / (TOTAL - 1)) * 100));
  }, [history]);

  const submitScripted = (rawValue: string, label?: string) => {
    if (!step) return;
    const value = rawValue;
    const errs = 'validate' in step && step.validate ? step.validate(value, dossier) : [];
    if (errs.length) {
      toast.push({ kind: 'error', title: `Erreur — ${step.kind === 'text' ? 'champ requis' : 'choix'}`, message: errs.join('\n'), ttl: 5000 });
      return;
    }
    const userText = label ?? value;
    const next = 'apply' in step ? step.apply(value, dossier) : dossier;
    setDossier(next);

    const nextId = 'next' in step ? (step.next as (a: string, d: Dossier) => string | null)(value, next) : null;
    const newMsgs: ChatMsg[] = [...history, { from: 'user', text: userText }];
    if (nextId) {
      const ns = STEPS[nextId];
      newMsgs.push({ from: 'bot', text: ns.question(next), stepId: nextId });
      if (ns.kind === 'recap') newMsgs.push({ from: 'bot', text: ns.summary(next), stepId: nextId });
    }
    setHistory(newMsgs);
    setCurrentId(nextId);
  };

  const sendAi = async (text: string) => {
    if (!text.trim() || aiPending) return;
    const userMsg: ChatMsg = { from: 'user', text };
    setHistory((h) => [...h, userMsg]);
    setAiPending(true);

    const transcript: ChatMessage[] = [...history, userMsg].map((m) => ({
      role: m.from === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

    const r = await chatTurn(transcript, dossier, nonce);
    setAiPending(false);
    if (!r.ok || !r.data) {
      setHistory((h) => [...h, { from: 'bot', text: '⚠️ Assistant indisponible — vérifiez la clé Anthropic dans WP, ou repassez en mode guidé.' }]);
      return;
    }
    const merged = { ...dossier, ...(r.data.extract as Partial<Dossier>) };
    setDossier(merged);
    setHistory((h) => [...h, { from: 'bot', text: r.data!.reply }]);
  };

  const persistAndPay = async () => {
    setSubmitState('sending');
    const saved = await submitDossier({ ...dossier, forme: recommend(dossier) }, nonce);
    if (!saved) {
      setSubmitState('error');
      return;
    }
    setSavedDossierId(saved.id);
    setSubmitState('sent');

    if (!user) {
      nav('/inscription', { state: { from: '/creer-mon-entreprise' } });
      return;
    }
    setPayState('redirecting');
    const ck = await startCheckout(saved.id, nonce);
    if (!ck.ok || !ck.data?.url) { setPayState('error'); return; }
    window.location.href = ck.data.url;
  };

  const recoForme = FORMES_SEED.find((f) => f.slug === recommend(dossier));
  const flowDone = !aiMode && !step;

  return (
    <>
      <Seo title="Créer mon entreprise — Chat assistant" description="Répondez à quelques questions, nous générons votre dossier prêt à transmettre." path="/creer-mon-entreprise" />
      <section className="container-page py-4 lg:py-10">
        <div className="mb-4 grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:gap-2">
          <button onClick={() => setMode('expert')} className={`badge justify-center whitespace-nowrap py-1.5 text-[11px] sm:text-xs ${mode === 'expert' ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}><span className="sm:hidden">⚙ Expert</span><span className="hidden sm:inline">⚙ Mode expert (formalités complètes INPI)</span></button>
          <button onClick={() => setMode('ia')}     className={`badge justify-center whitespace-nowrap py-1.5 text-[11px] sm:text-xs ${mode === 'ia'     ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}>✨ IA<span className="hidden sm:inline"> libre</span></button>
          <button onClick={() => setMode('guide')}  className={`badge justify-center whitespace-nowrap py-1.5 text-[11px] sm:text-xs ${mode === 'guide'  ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}>Guidé</button>
        </div>
        {mode === 'expert' ? (
          draftLoading ? <p className="text-sm text-ink-muted">Chargement du brouillon…</p> : <FormalitesWizard initialDraft={draftLoaded ?? undefined} />
        ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card overflow-hidden">
            <div className="border-b border-surface-border bg-surface-muted px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-lg font-semibold text-ink">Assistant de création</h1>
                  <p className="text-xs text-ink-muted">{aiMode ? 'Mode IA (Claude) — conversation libre.' : 'Mode guidé — questions ciblées.'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAiMode((v) => !v)} className="badge bg-primary-50 text-primary-700 hover:bg-primary-100">
                    {aiMode ? '↩ Mode guidé' : '✨ Mode IA'}
                  </button>
                  <span className="badge-secondary">{progress}%</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-3 p-5 max-h-[60vh] overflow-y-auto">
              {history.map((m, i) => (
                <div key={i} className={m.from === 'bot' ? 'flex animate-fade-in' : 'flex justify-end animate-fade-in'}>
                  <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === 'bot' ? 'bg-surface-muted text-ink rounded-tl-sm' : 'bg-primary-600 text-ink-inverse rounded-tr-sm'
                  }`}>{m.text}</p>
                </div>
              ))}
              {aiPending && (
                <div className="flex">
                  <p className="rounded-2xl bg-surface-muted px-3.5 py-2 text-xs text-ink-muted">assistant écrit…</p>
                </div>
              )}
              {flowDone && submitState !== 'sent' && (
                <div className="mt-4 rounded-xl border border-secondary-200 bg-secondary-50 p-4 text-sm text-secondary-800">
                  <strong>Dossier prêt.</strong> {user ? 'Lancez le paiement pour transmettre.' : 'Créez votre compte pour valider et payer.'}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={persistAndPay} disabled={submitState === 'sending' || payState === 'redirecting'} className="btn-secondary">
                      {submitState === 'sending' ? 'Enregistrement…' : payState === 'redirecting' ? 'Redirection Stripe…' : (user ? 'Payer 29,90 €' : 'Créer mon compte')}
                    </button>
                    {payState === 'error' && <p className="text-xs text-danger">Stripe indisponible — réessayez.</p>}
                  </div>
                  {submitState === 'error' && <p className="mt-2 text-xs text-danger">API WordPress indisponible.</p>}
                </div>
              )}
              {submitState === 'sent' && savedDossierId && payState === 'idle' && !user && (
                <div className="mt-4 rounded-xl border border-secondary-300 bg-secondary-50 p-4 text-sm text-secondary-800">
                  ✅ Dossier #{savedDossierId} enregistré. Créez un compte pour payer.
                </div>
              )}
            </div>

            <div className="border-t border-surface-border bg-surface p-4">
              {step?.kind === 'choice' && (
                <div key={step.id} className={`grid gap-3 ${step.options.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {step.options.map((o, i) => (
                    <button
                      key={o.value}
                      onClick={() => submitScripted(o.value, o.label)}
                      className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface px-4 py-5 text-center opacity-0 transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-soft motion-safe:animate-tile-in"
                      style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'forwards' }}
                    >
                      {o.icon && (
                        <span aria-hidden className="text-3xl transition-transform group-hover:scale-110">{o.icon}</span>
                      )}
                      <span className="block text-sm font-semibold text-ink">{o.label}</span>
                      {o.hint && <span className="block text-xs text-ink-muted">{o.hint}</span>}
                    </button>
                  ))}
                </div>
              )}
              {step?.kind === 'text' && <TextInput key={step.id} placeholder={step.placeholder} onSubmit={(v) => submitScripted(v)} />}
              {step?.kind === 'recap' && <button onClick={() => submitScripted('ok', 'Continuer')} className="btn-primary w-full">Continuer</button>}
              {aiMode && <AiInput onSubmit={sendAi} disabled={aiPending} />}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display text-sm font-semibold text-ink">Récapitulatif</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row k="Projet" v={dossier.projet} />
                <Row k="Associés" v={dossier.associes} />
                <Row k="Levée" v={dossier.capitalLevee} />
                <Row k="CA prévu" v={dossier.ca} />
                <Row k="Dirigeant" v={dossier.identite?.prenom ? `${dossier.identite.prenom} ${dossier.identite.nom ?? ''}` : undefined} />
                <Row k="Email" v={dossier.identite?.email} />
                <Row k="Siège" v={dossier.siege?.adresse} />
                <Row k="Activité" v={dossier.activite} />
              </dl>
            </div>
            {recoForme && (
              <div className="card p-5">
                <span className="badge-primary">Recommandation</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">{recoForme.label}</h3>
                <p className="mt-1 text-sm text-ink-muted">{recoForme.tagline}</p>
              </div>
            )}
            <p className="px-1 text-xs text-ink-muted">🔒 Données stockées localement avant compte. RGPD.</p>
          </aside>
        </div>
        )}
      </section>
    </>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-surface-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-wider text-ink-muted">{k}</dt>
      <dd className={`text-right text-sm ${v ? 'text-ink' : 'text-ink-muted/50'}`}>{v || '—'}</dd>
    </div>
  );
}

function TextInput({ placeholder, onSubmit }: { placeholder?: string; onSubmit: (v: string) => void }) {
  const [v, setV] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!v.trim()) return; onSubmit(v); setV(''); }} className="flex gap-2">
      <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} autoFocus />
      <button className="btn-primary" type="submit">Valider</button>
    </form>
  );
}

function AiInput({ onSubmit, disabled }: { onSubmit: (v: string) => void; disabled: boolean }) {
  const [v, setV] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!v.trim()) return; onSubmit(v); setV(''); }} className="flex gap-2">
      <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder="Discutez librement avec l’assistant…" autoFocus disabled={disabled} />
      <button className="btn-primary" type="submit" disabled={disabled}>Envoyer</button>
    </form>
  );
}
