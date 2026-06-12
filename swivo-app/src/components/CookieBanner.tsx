import { useEffect, useState } from 'react';

const KEY = 'swivo.consent.v1';
type Consent = { essential: true; analytics: boolean; marketing: boolean; ts: number };

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch { setOpen(true); }
  }, []);

  const save = (c: Consent) => {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md">
      <div className="card p-5 shadow-elevated animate-slide-up">
        <h2 id="cookie-title" className="font-display text-base font-semibold text-ink">Vos préférences cookies</h2>
        <p className="mt-1 text-sm text-ink-muted">Cookies pour le fonctionnement du site et, avec votre accord, la mesure d’audience.</p>
        <fieldset className="mt-3 space-y-2 text-sm">
          <label className="flex items-center justify-between gap-3 rounded-md bg-surface-muted px-3 py-2">
            <span>Essentiels <span className="text-ink-muted">(obligatoires)</span></span>
            <input type="checkbox" checked disabled className="accent-primary-600" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-muted">
            <span>Mesure d’audience</span>
            <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))} className="accent-primary-600" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-muted">
            <span>Marketing</span>
            <input type="checkbox" checked={prefs.marketing} onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))} className="accent-primary-600" />
          </label>
        </fieldset>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary flex-1" onClick={() => save({ essential: true, analytics: true, marketing: true, ts: Date.now() })}>Tout accepter</button>
          <button className="btn-outline flex-1" onClick={() => save({ essential: true, analytics: false, marketing: false, ts: Date.now() })}>Tout refuser</button>
          <button className="btn-ghost w-full" onClick={() => save({ essential: true, analytics: prefs.analytics, marketing: prefs.marketing, ts: Date.now() })}>Enregistrer mes choix</button>
        </div>
      </div>
    </div>
  );
}
