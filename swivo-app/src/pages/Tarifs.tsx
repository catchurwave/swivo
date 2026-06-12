import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { api, startSubscribe, useApi } from '@/lib/api';
import { PRICING_SEED } from '@/data/seeds';
import { useAuth } from '@/lib/auth';
import { useResumeCta } from '@/lib/useResumeCta';

export function TarifsPage() {
  const { data } = useApi((s) => api.fetchPricing(s));
  const { user, nonce } = useAuth();
  const cta = useResumeCta();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const p = data ?? PRICING_SEED;

  const subscribe = async () => {
    if (!user) { nav('/connexion', { state: { from: '/tarifs' } }); return; }
    setBusy(true);
    const r = await startSubscribe(nonce);
    setBusy(false);
    if (r.ok && r.data?.url) window.location.href = r.data.url;
  };
  const plans = [
    { name: 'Création', ...p.creation, featured: true, kind: 'link' as const, cta: cta.label, to: cta.href, description: 'Préparation + transmission au Guichet unique INPI.' },
    { name: 'Gestion', ...p.gestion,  featured: false, kind: 'action' as const, cta: user?.gestion?.active ? 'Déjà actif' : 'Activer la gestion', description: 'Pilotez votre entreprise après création.' },
  ];

  return (
    <>
      <Seo title="Tarifs Swivo — 29,90 € / 9,90 €/mois" description="Tarifs simples et transparents. Création 29,90 €, gestion 9,90 €/mois sans engagement." path="/tarifs"
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'Product', name: 'Création Swivo',
          offers: [
            { '@type': 'Offer', name: 'Création', price: '29.90', priceCurrency: 'EUR' },
            { '@type': 'Offer', name: 'Gestion', price: '9.90', priceCurrency: 'EUR' },
          ],
        }}
      />
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge-secondary">Sans surprise</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Deux formules, zéro frais caché.</h1>
          <p className="mt-3 text-ink-muted">Vous payez ce que vous voyez. Frais légaux reversés à l’INPI.</p>
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-secondary-300 bg-secondary-50/70 px-5 py-3 text-sm text-secondary-900">
            <span className="text-lg">🏦</span>
            <span><strong>Aucun compte bancaire imposé.</strong> Contrairement à Shine, Qonto, Hello Bank Pro, vous gardez votre banque actuelle.</span>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {plans.map((pl) => (
            <div key={pl.name} className={`relative card p-8 transition ${pl.featured ? 'border-primary-300 shadow-elevated ring-1 ring-primary-200' : ''}`}>
              {pl.featured && <span className="absolute -top-3 left-8 badge-primary">Le plus choisi</span>}
              <h2 className="font-display text-xl font-semibold text-ink">{pl.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold tracking-tight text-ink">{pl.price}</span>
                <span className="text-ink-muted">{pl.suffix}</span>
              </div>
              <p className="mt-3 text-sm text-ink-muted">{pl.description}</p>
              {pl.kind === 'link' ? (
                <Link to={pl.to!} className={`mt-6 inline-flex w-full justify-center ${pl.featured ? 'btn-primary' : 'btn-outline'}`}>{pl.cta}</Link>
              ) : (
                <button onClick={subscribe} disabled={busy || user?.gestion?.active} className={`mt-6 inline-flex w-full justify-center ${pl.featured ? 'btn-primary' : 'btn-outline'} disabled:opacity-60`}>
                  {busy ? 'Redirection Stripe…' : pl.cta}
                </button>
              )}
              <ul className="mt-6 space-y-2 text-sm">
                {pl.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-secondary-600" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l4 4 10-10"/></svg>
                    <span className="text-ink">{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-md bg-surface-muted px-3 py-2 text-xs text-ink-muted">{pl.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Frais légaux INPI</h2>
            <p className="mt-2 text-sm text-ink-muted">Reversés à l’État. Affichés <strong>avant</strong> paiement.</p>
          </div>
          <ul className="card divide-y divide-surface-border lg:col-span-2">
            {p.inpiFees.map((f) => (
              <li key={f.k} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-ink">{f.k}</span>
                <span className="font-display text-sm font-semibold text-ink">{f.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
