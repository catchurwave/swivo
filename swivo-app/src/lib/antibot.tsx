/*
  Anti-bot helper injected dans tous les POST publics (register, forgot, dossier,
  draft anonyme). Trois champs :
    - website        : honeypot (toujours vide ; un bot qui parse le DOM le remplit)
    - formStartedAt  : timestamp ms du montage du formulaire — le backend rejette si < 2.5 s
    - turnstileToken : token Cloudflare Turnstile si la site key est configurée

  Usage :
    const ab = useAntibot();
    const body = { ...formData, ...ab.payload() };
    ab.hiddenInput()  // à rendre dans le JSX (honeypot caché)
*/

import { useEffect, useRef, useState } from 'react';
import { apiBase } from './config';

let siteKeyCache: string | null | undefined;

async function fetchSiteKey(): Promise<string | null> {
  if (siteKeyCache !== undefined) return siteKeyCache ?? null;
  try {
    const r = await fetch(`${apiBase()}/swivo/v1/security/turnstile`, { credentials: 'include' });
    const j = await r.json();
    siteKeyCache = (j?.siteKey || '').toString() || null;
  } catch {
    siteKeyCache = null;
  }
  return siteKeyCache ?? null;
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).turnstile) return resolve();
    if (document.getElementById('cf-turnstile-js')) {
      const tick = setInterval(() => {
        if ((window as any).turnstile) { clearInterval(tick); resolve(); }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.id = 'cf-turnstile-js';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export function useAntibot() {
  const startedRef = useRef<number>(typeof window !== 'undefined' ? Date.now() : 0);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const widgetEl = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSiteKey().then((k) => { if (!cancelled) setSiteKey(k); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') return;
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled) return;
      const ts = (window as any).turnstile;
      if (!ts || !widgetEl.current) return;
      widgetId.current = ts.render(widgetEl.current, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        size: 'flexible',
        callback: (t: string) => setToken(t),
        'error-callback': () => setToken(''),
        'expired-callback': () => setToken(''),
      });
    });
    return () => {
      cancelled = true;
      const ts = (window as any).turnstile;
      if (ts && widgetId.current != null) ts.remove(widgetId.current);
    };
  }, [siteKey]);

  return {
    payload(): { website: string; formStartedAt: number; turnstileToken?: string } {
      const base = { website: '', formStartedAt: startedRef.current };
      return token ? { ...base, turnstileToken: token } : base;
    },
    HoneypotField() {
      // Honeypot field — caché par CSS + aria-hidden ; bots remplissent souvent.
      return (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="ab-website">Ne pas remplir</label>
          <input id="ab-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      );
    },
    TurnstileWidget() {
      if (!siteKey) return null;
      return <div ref={widgetEl} className="my-3" />;
    },
    hasChallenge: !!siteKey,
    ready: !siteKey || !!token,
  };
}
