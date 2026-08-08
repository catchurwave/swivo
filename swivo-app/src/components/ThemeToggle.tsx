import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'swivo.theme';

function read(): Theme {
  if (typeof document === 'undefined') return 'light';
  const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function apply(t: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = t === 'dark' ? 'dark' : '';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const initial = read();
    setTheme(initial);
    apply(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    apply(next);
    try { localStorage.setItem(KEY, next); } catch {}
  };

  return (
    <button onClick={toggle} aria-label={theme === 'dark' ? 'Activer mode clair' : 'Activer mode sombre'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted">
      {theme === 'dark'
        ? <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>
        : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>}
    </button>
  );
}
