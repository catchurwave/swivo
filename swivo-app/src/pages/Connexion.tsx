import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { getAnonProfile } from '@/lib/anon-profile';
import { OAuthButtons } from '@/components/OAuthButtons';
import { useToast } from '@/components/Toast';
import { requestPasswordReset, applyPasswordReset } from '@/lib/api';

const SIDE_IMG = 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80';

export function ConnexionPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const anon = getAnonProfile();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { from?: string } };
  const [sp] = useSearchParams();
  const resetKey = sp.get('reset');
  const resetLogin = sp.get('login');

  if (user) return <Navigate to={state?.from ?? '/espace-createur'} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const r = await login(email, pass);
    setPending(false);
    if (!r.ok) setErr(r.error ?? 'Identifiants invalides.');
    else nav(state?.from ?? '/espace-createur', { replace: true });
  };

  return (
    <>
      <Seo title="Connexion — Swivo" description="Accédez à votre espace Swivo." path="/connexion" noindex />
      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-50 via-surface to-secondary-50">
        <div className="container-page py-10 lg:py-16">
          <div className="grid items-stretch overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-elevated lg:grid-cols-2">
            {/* COL VISUEL */}
            <div className="relative hidden min-h-[640px] overflow-hidden bg-ink lg:block">
              <img src={SIDE_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-primary-900/80 via-primary-700/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-10 text-ink-inverse">
                <div>
                  <span className="badge bg-white/15 text-ink-inverse backdrop-blur">Espace micro-entrepreneur</span>
                  <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    Pilotez votre micro<br/>en toute sérénité.
                  </h2>
                  <p className="mt-3 max-w-md text-white/85">
                    Tableau de bord, URSSAF, factures, alertes seuils — tout votre cockpit, accessible en un clic.
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✅ <span>Données hébergées en France</span></li>
                  <li className="flex items-center gap-2">🔒 <span>Chiffrement TLS · conformité RGPD</span></li>
                  <li className="flex items-center gap-2">⚡ <span>5 min pour démarrer · 0 € de frais légaux</span></li>
                </ul>
              </div>
            </div>

            {/* COL FORM */}
            <div className="p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-md">
                <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Connexion</h1>
                <p className="mt-1 text-sm text-ink-muted">Heureux de vous revoir 👋</p>

                {anon && anon.drafts.length > 0 && (
                  <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800">
                    ✨ <strong>{anon.drafts.length} brouillon{anon.drafts.length > 1 ? 's' : ''}</strong> en attente sur cet appareil. Connectez-vous pour {anon.drafts.length > 1 ? 'les' : 'le'} récupérer.
                  </div>
                )}

                {resetKey && resetLogin ? (
                  <ResetForm
                    login={resetLogin}
                    resetKey={resetKey}
                    onDone={() => {
                      toast.push({ kind: 'success', title: 'Mot de passe mis à jour', message: 'Connectez-vous avec votre nouveau mot de passe.', ttl: 5000 });
                      nav('/connexion', { replace: true });
                    }}
                    onError={(m) => toast.push({ kind: 'error', title: 'Erreur', message: m, ttl: 6000 })}
                  />
                ) : showForgot ? (
                  <ForgotForm
                    onClose={() => setShowForgot(false)}
                    onSent={(em) => {
                      toast.push({ kind: 'success', title: 'Email envoyé', message: `Si un compte existe pour ${em}, vous recevrez un lien de réinitialisation.`, ttl: 6000 });
                      setShowForgot(false);
                    }}
                    initialEmail={email}
                  />
                ) : (
                  <>
                    <div className="mt-6">
                      <OAuthButtons from={state?.from ?? '/espace-createur'} />
                    </div>

                    <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted">
                      <div className="h-px flex-1 bg-surface-border" /> ou avec email <div className="h-px flex-1 bg-surface-border" />
                    </div>

                    <form onSubmit={submit} className="space-y-3">
                      <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.fr" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="label" htmlFor="pass">Mot de passe</label>
                          <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary-700 hover:underline">Mot de passe oublié ?</button>
                        </div>
                        <input id="pass" type="password" autoComplete="current-password" required minLength={8} className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                      </div>
                      {err && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
                      <button className="btn-primary w-full" disabled={pending} type="submit">
                        {pending ? 'Connexion…' : 'Se connecter'}
                      </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-ink-muted">
                      Pas encore de compte ? <Link to="/inscription" className="link">Créer un compte</Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ResetForm({ login, resetKey, onDone, onError }: { login: string; resetKey: string; onDone: () => void; onError: (m: string) => void }) {
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pass.length < 8) { onError('Mot de passe trop court (min 8 caractères).'); return; }
    if (pass !== pass2) { onError('Les deux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    const r = await applyPasswordReset(login, resetKey, pass);
    setBusy(false);
    if (r.ok) onDone();
    else onError(r.error ?? 'Lien invalide ou expiré. Refaites une demande.');
  }

  return (
    <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50/40 p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Nouveau mot de passe</h2>
      <p className="mt-1 text-sm text-ink-muted">Compte : <strong className="text-ink">{login}</strong>. Choisissez un mot de passe d'au moins 8 caractères.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="label" htmlFor="np">Nouveau mot de passe</label>
          <input id="np" type="password" required minLength={8} className="input" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="np2">Confirmer</label>
          <input id="np2" type="password" required minLength={8} className="input" value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}</button>
      </form>
    </div>
  );
}

function ForgotForm({ initialEmail, onSent, onClose }: { initialEmail: string; onSent: (email: string) => void; onClose: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    await requestPasswordReset(email.trim());
    setBusy(false);
    onSent(email.trim());
  }

  return (
    <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50/40 p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Mot de passe oublié ?</h2>
      <p className="mt-1 text-sm text-ink-muted">Entrez votre email, nous vous envoyons un lien sécurisé pour réinitialiser votre mot de passe (valable 24 h).</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input type="email" required className="input" placeholder="vous@email.fr" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Envoi…' : 'Envoyer le lien'}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
        </div>
      </form>
    </div>
  );
}
