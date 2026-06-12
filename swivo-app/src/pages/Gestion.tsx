import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { apiBase } from '@/lib/config';

type Kind = 'pause' | 'fermeture';
const COPY = {
  pause: {
    title: 'Mettre mon entreprise en pause',
    description: 'Mise en sommeil (sociétés) ou cessation temporaire d’activité (micro-entreprise). Procédure assistée, transmission au Guichet unique sous 24h.',
    cta: 'Demander la mise en pause',
    body1: 'Vous suspendez votre activité sans dissoudre la structure. Durée maximale : 2 ans (sociétés), 12 mois renouvelable (micro).',
    body2: 'Pendant la pause : pas de CA, pas de cotisations URSSAF sur le CA, comptes annuels à déposer (sociétés).',
  },
  fermeture: {
    title: 'Fermer mon entreprise',
    description: 'Procédure complète : dissolution + liquidation + radiation. Notre équipe prépare et dépose les formalités.',
    cta: 'Demander la fermeture',
    body1: 'Étape 1 : décision de dissolution (AGE ou auto-entrepreneur). Étape 2 : liquidation (clôture comptable). Étape 3 : radiation au Guichet unique.',
    body2: 'Délai total : 1 à 3 mois selon la structure. Frais légaux INPI affichés avant transmission.',
  },
};

export function GestionPage({ kind }: { kind: Kind }) {
  const { user } = useAuth();
  const c = COPY[kind];
  const [siret, setSiret] = useState('');
  const [denomination, setDenomination] = useState('');
  const [motif, setMotif] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/swivo/v1/dossier/${kind}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siret, denomination, motif }),
      });
      if (!res.ok) throw new Error('Envoi impossible.');
      setState('sent');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  return (
    <>
      <Seo title={c.title} description={c.description} path={`/gestion/${kind}`} noindex />
      <section className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <span className="badge-primary">{kind === 'pause' ? 'Mise en pause' : 'Fermeture'}</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{c.title}</h1>
            <p className="mt-3 text-lg text-ink-muted">{c.description}</p>

            <div className="mt-8 card p-6">
              {state === 'sent' ? (
                <div className="text-center">
                  <p className="text-3xl">✅</p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-ink">Demande enregistrée</h2>
                  <p className="mt-2 text-sm text-ink-muted">Notre équipe vous contacte sous 24h ouvrées pour finaliser.</p>
                  <Link to="/espace-createur" className="btn-primary mt-5">Retour au tableau de bord</Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="label">SIRET</label>
                    <input className="input" required pattern="\d{14}" placeholder="14 chiffres" value={siret} onChange={(e) => setSiret(e.target.value.replace(/\s/g, ''))} />
                  </div>
                  <div>
                    <label className="label">Dénomination sociale</label>
                    <input className="input" required value={denomination} onChange={(e) => setDenomination(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Motif {kind === 'pause' ? '(facultatif)' : '(facultatif)'}</label>
                    <textarea className="input min-h-[100px]" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Quelques mots pour contexte" />
                  </div>
                  {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
                  <button type="submit" disabled={state === 'sending'} className="btn-primary w-full">
                    {state === 'sending' ? 'Envoi…' : c.cta}
                  </button>
                  {!user && <p className="text-center text-xs text-ink-muted">Connexion requise. <Link to="/connexion" className="link">Se connecter</Link></p>}
                </form>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold text-ink">Ce qu’il faut savoir</h3>
              <p className="mt-2 text-sm text-ink-muted">{c.body1}</p>
              <p className="mt-2 text-sm text-ink-muted">{c.body2}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold text-ink">Inclus dans Gestion</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                <li>· Préparation des actes</li>
                <li>· Dépôt au Guichet unique</li>
                <li>· Suivi temps réel</li>
                <li>· Support juridique</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
