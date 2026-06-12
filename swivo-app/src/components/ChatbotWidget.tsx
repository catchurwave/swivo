import { useState } from 'react';
import { getDayGreeting } from '@/lib/greeting';

type Msg = { from: 'bot' | 'user'; text: string };

const SUGGESTIONS = ['Quelle forme juridique ?', 'Combien coûte la création ?', 'Documents SARL ?', 'Délai d’immatriculation ?'];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const greeting = getDayGreeting();
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: `${greeting} 👋 Quelle question puis-je résoudre ?` }]);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: 'user', text }]);
    setInput('');
    setTimeout(() => setMsgs((m) => [...m, { from: 'bot', text: 'Bonne question. Lancez votre dossier — notre chat de création vous guide précisément, gratuitement, en 5 minutes.' }]), 500);
  };

  return (
    <>
      <div className="fixed bottom-5 left-5 z-40">
        {!open && (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring" />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring" style={{ animationDelay: '0.9s' }} />
          </>
        )}
        <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Fermer' : 'Ouvrir le chat'}
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-ink-inverse shadow-elevated hover:bg-primary-700 transition">
          {open
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M6 6l12 12M6 18L18 6"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>}
        </button>
      </div>
      {open && (
        <div role="dialog" aria-label="Chat" className="fixed bottom-24 left-5 z-40 w-[min(360px,calc(100vw-2.5rem))] animate-slide-up">
          <div className="card overflow-hidden shadow-elevated">
            <div className="flex items-center gap-2 border-b border-surface-border bg-surface-muted px-4 py-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-secondary-500" />
              <span className="text-sm font-semibold text-ink">Assistant Swivo</span>
              <span className="ml-auto text-xs text-ink-muted">en ligne</span>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div key={i} className={m.from === 'bot' ? 'flex' : 'flex justify-end'}>
                  <p className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.from === 'bot' ? 'bg-surface-muted text-ink rounded-tl-sm' : 'bg-primary-600 text-ink-inverse rounded-tr-sm'
                  }`}>{m.text}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-border p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="badge bg-primary-50 text-primary-700 hover:bg-primary-100">{s}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question…" className="input" />
                <button className="btn-primary" type="submit" aria-label="Envoyer">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l14-7-7 14-2-5-5-2z"/></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
