import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { getAnonProfile } from '@/lib/anon-profile';
import { finalizeDraft } from '@/lib/api';
import { OAuthButtons } from '@/components/OAuthButtons';
import { useAntibot } from '@/lib/antibot';

const SIDE_IMG = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80';

export function InscriptionPage() {
  const { user, register, nonce } = useAuth();
  const anon = getAnonProfile();
  const [name, setName] = useState(anon?.identite?.prenom ? `${anon.identite.prenom} ${anon.identite.nom ?? ''}`.trim() : '');
  const [email, setEmail] = useState(anon?.identite?.email ?? '');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const antibot = useAntibot();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const claimFinalize = sp.get('finalize') === '1';
  const claimId = sp.get('claim');
  const fromPath = sp.get('from') ?? '/espace-createur';

  if (user) return <Navigate to="/espace-createur" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const r = await register(email, pass, name, antibot.payload());
    setPending(false);
    if (!r.ok) { setErr(r.error ?? 'Inscription impossible.'); return; }
    if (claimFinalize && claimId) {
      const fr = await finalizeDraft(parseInt(claimId, 10), null, nonce);
      if (fr.ok) nav(`/espace-createur?finalized=${fr.data?.id}`, { replace: true });
      else nav(fromPath, { replace: true });
    } else {
      nav('/espace-createur', { replace: true });
    }
  };

  return (
    <>
      <Seo title="Créer mon compte — Swivo" description="Rejoignez Swivo. Tout pour piloter votre micro-entreprise." path="/inscription" noindex />
      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-secondary-50 via-surface to-primary-50">
        <div className="container-page py-10 lg:py-16">
          <div className="grid items-stretch overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-elevated lg:grid-cols-2">
            {/* COL VISUEL */}
            <div className="relative hidden min-h-[680px] overflow-hidden bg-ink lg:block">
              <img src={SIDE_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-secondary-900/80 via-primary-700/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-10 text-ink-inverse">
                <div>
                  <span className="badge bg-white/15 text-ink-inverse backdrop-blur">Inscription gratuite</span>
                  <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    Rejoignez Swivo.<br/>5 minutes pour démarrer.
                  </h2>
                  <p className="mt-3 max-w-md text-white/85">
                    Création gratuite, accompagnement à 29,90 €, simulateurs URSSAF, facturation incluse.
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">🎯 <span>Déclaration accompagnée pas-à-pas</span></li>
                  <li className="flex items-center gap-2">📊 <span>Cockpit financier inclus</span></li>
                  <li className="flex items-center gap-2">✉️ <span>Rappels échéances URSSAF + TVA</span></li>
                  <li className="flex items-center gap-2">🛡️ <span>Données en France · RGPD</span></li>
                </ul>
              </div>
            </div>

            {/* COL FORM */}
            <div className="p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-md">
                <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Créer mon compte</h1>
                <p className="mt-1 text-sm text-ink-muted">Pour piloter votre micro et accéder à tous les outils.</p>

                {anon && anon.drafts.length > 0 && (
                  <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800">
                    ✨ <strong>{anon.drafts.length} brouillon{anon.drafts.length > 1 ? 's' : ''}</strong> en attente. Il{anon.drafts.length > 1 ? 's seront' : ' sera'} automatiquement rattaché{anon.drafts.length > 1 ? 's' : ''} à votre compte.
                  </div>
                )}

                <div className="mt-6">
                  <OAuthButtons from={fromPath} />
                </div>

                <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted">
                  <div className="h-px flex-1 bg-surface-border" /> ou avec email <div className="h-px flex-1 bg-surface-border" />
                </div>

                <form onSubmit={submit} className="space-y-3">
                  <antibot.HoneypotField />
                  <div>
                    <label className="label" htmlFor="name">Nom complet</label>
                    <input id="name" autoComplete="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Camille Dupont" />
                  </div>
                  <div>
                    <label className="label" htmlFor="email">Email</label>
                    <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.fr" />
                  </div>
                  <div>
                    <label className="label" htmlFor="pass">Mot de passe (8 caractères min.)</label>
                    <input id="pass" type="password" autoComplete="new-password" required minLength={8} className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                  </div>
                  <p className="text-xs text-ink-muted">
                    En créant un compte, vous acceptez nos <Link to="/cgv" className="link">CGV</Link> et notre <Link to="/politique-de-confidentialite" className="link">politique de confidentialité</Link>.
                  </p>
                  {err && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
                  <antibot.TurnstileWidget />
                  <button className="btn-primary w-full" disabled={pending || !antibot.ready} type="submit">
                    {pending ? 'Création…' : antibot.hasChallenge && !antibot.ready ? 'Vérification anti-bot…' : 'Créer mon compte'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-ink-muted">
                  Déjà inscrit ? <Link to="/connexion" className="link">Se connecter</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
