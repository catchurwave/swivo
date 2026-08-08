import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useResumeCta } from '@/lib/useResumeCta';

const NAV = [
  { to: '/creer-mon-entreprise', label: 'Créer ma micro' },
  { to: '/pilotage', label: 'Pilotage' },
  { to: '/urssaf', label: 'URSSAF' },
  { to: '/formations', label: 'Formations' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/faq', label: 'FAQ' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { user, logout } = useAuth();
  const cta = useResumeCta();
  const nav = useNavigate();

  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onLogout = async () => {
    await logout();
    nav('/', { replace: true });
  };

  return (
    <>
      {/* Spacer pour conserver la hauteur quand le header passe en fixed */}
      {pinned && <div aria-hidden className="h-16" />}
      <header
        className={
          `z-40 border-b transition-all duration-300 ` +
          (pinned
            ? 'fixed top-0 left-0 right-0 border-surface-border bg-surface/90 backdrop-blur shadow-soft animate-slide-down supports-[backdrop-filter]:bg-surface/75'
            : 'relative border-surface-border/50 bg-transparent')
        }
      >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Accueil Swivo"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'text-primary-700 bg-primary-50' : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                }`
              }>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/espace-createur" className="btn-ghost ml-1 inline-flex items-center gap-2">
                <span>{user.name || user.email}</span>
                {user.gestion?.active && (
                  <span title="Formule Gestion active"
                    className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary-500 animate-pulse" />
                    Gestion
                  </span>
                )}
              </Link>
              <button onClick={onLogout} className="btn-outline">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn-ghost">Connexion</Link>
              <Link to={cta.href} className="btn-primary">{cta.shortLabel}</Link>
            </>
          )}
        </div>
        <div className="md:hidden flex items-center gap-1">
          <PulseIconLink to={cta.href} label={cta.label} tone="primary">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
          </PulseIconLink>
          <PulseIconLink to={user ? '/espace-createur' : '/connexion'} label={user ? 'Mon espace' : 'Se connecter'} tone="secondary">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
          </PulseIconLink>
          <button aria-label="Menu" aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface-muted"
            onClick={() => setOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-surface-border bg-surface">
          <div className="container-page py-3 grid gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted">{n.label}</Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <button onClick={() => { setOpen(false); void onLogout(); }} className="btn-outline flex-1">Déconnexion</button>
              ) : (
                <>
                  <Link to="/connexion" onClick={() => setOpen(false)} className="btn-outline flex-1">Connexion</Link>
                  <Link to={cta.href} onClick={() => setOpen(false)} className="btn-primary flex-1">{cta.shortLabel}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}

function PulseIconLink({ to, label, tone, children }: { to: string; label: string; tone: 'primary' | 'secondary'; children: React.ReactNode }) {
  const bg     = tone === 'primary' ? 'bg-primary-600 text-ink-inverse'   : 'bg-secondary-500 text-ink-inverse';
  const ring   = tone === 'primary' ? 'border-primary-500'                : 'border-secondary-500';
  const delay  = tone === 'primary' ? '0s'                                : '1s';
  return (
    <Link to={to} aria-label={label} title={label} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full">
      {/* 2 anneaux qui s'évaporent en cascade */}
      <span aria-hidden className={`pointer-events-none absolute inset-0 rounded-full border-2 ${ring} animate-pulse-ring`} style={{ animationDelay: delay }} />
      <span aria-hidden className={`pointer-events-none absolute inset-0 rounded-full border-2 ${ring} animate-pulse-ring`} style={{ animationDelay: `calc(${delay} + 0.9s)` }} />
      <span className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full shadow-soft transition hover:scale-105 ${bg}`}>
        {children}
      </span>
    </Link>
  );
}
