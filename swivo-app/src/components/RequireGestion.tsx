import { Link, useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { startSubscribe } from '@/lib/api';
import { Icon } from '@/components/Icons';

/*
  Gate paid "Gestion" features. If the current user has no active gestion
  subscription, the wrapped page is replaced by a friendly paywall card
  with a one-click checkout link.
*/

const GESTION_FEATURES = [
  'Facturation & devis illimités',
  'Calculateurs URSSAF / TVA / IS',
  'Modèles juridiques (PV, AG, lettres)',
  'Mise en pause assistée',
  'Fermeture d’entreprise complète',
  'Support juridique prioritaire',
];

export function RequireGestion({ children, feature }: { children: ReactNode; feature?: string }) {
  const { user, loading, nonce } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!user) {
    nav('/connexion', { state: { from: location.pathname } });
    return null;
  }
  if (user.gestion?.active) return <>{children}</>;

  const subscribe = async () => {
    setBusy(true);
    const r = await startSubscribe(nonce);
    setBusy(false);
    if (r.ok && r.data?.url) window.location.href = r.data.url;
  };

  return (
    <section className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        <div className="card relative overflow-hidden p-10 text-center shadow-elevated">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-300/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary-300/40 blur-3xl" />
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-ink-inverse shadow-soft">
              <Icon.Lock className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {feature ? `${feature} — réservé à la formule Gestion` : 'Formule Gestion requise'}
            </h1>
            <p className="mt-3 text-ink-muted">
              Activez la formule <strong>Gestion</strong> pour débloquer tous les outils de pilotage de votre entreprise.
              <span className="block mt-1">Sans engagement, résiliable en 1 clic.</span>
            </p>
            <div className="mt-6 inline-flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold text-primary-700">9,90 €</span>
              <span className="text-ink-muted">/ mois</span>
            </div>
            <ul className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm">
              {GESTION_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Icon.Check className="mt-0.5 h-5 w-5 shrink-0 text-secondary-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={subscribe} disabled={busy} className="btn-primary px-7 py-3 text-base">
                {busy ? 'Redirection…' : 'Activer la Gestion (9,90 €/mois)'} <Icon.Arrow className="h-4 w-4" />
              </button>
              <Link to="/espace-createur" className="btn-outline">Retour au tableau de bord</Link>
            </div>
            <p className="mt-5 text-xs text-ink-muted">Paiement sécurisé Stripe · Données hébergées en France</p>
          </div>
        </div>
      </div>
    </section>
  );
}
