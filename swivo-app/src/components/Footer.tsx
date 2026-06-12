import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const cols = [
  { title: 'Créer ma micro', links: [
    { to: '/creer-mon-entreprise', label: 'Démarrer ma déclaration' },
    { to: '/tarifs', label: 'Tarifs' },
    { to: '/faq', label: 'Questions fréquentes' },
  ]},
  { title: 'Piloter ma micro', links: [
    { to: '/espace-createur', label: 'Tableau de bord' },
    { to: '/pilotage', label: 'Cockpit financier' },
    { to: '/urssaf', label: 'Déclaration URSSAF' },
    { to: '/outils/calculateurs', label: 'Simulateurs' },
    { to: '/outils/facturation', label: 'Facturation & devis' },
    { to: '/outils/modeles', label: 'Modèles juridiques' },
    { to: '/gestion/pause', label: 'Mettre en pause' },
    { to: '/gestion/fermeture', label: 'Fermeture' },
  ]},
  { title: 'Ressources', links: [
    { to: '/formations', label: 'Formations & guides' },
    { to: '/outils/modeles', label: 'Modèles juridiques' },
    { to: '/blog', label: 'Blog micro-entreprise' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' },
  ]},
  { title: 'Légal', links: [
    { to: '/mentions-legales', label: 'Mentions légales' },
    { to: '/politique-de-confidentialite', label: 'Confidentialité' },
    { to: '/cgv', label: 'CGV' },
    { to: '/cookies', label: 'Cookies' },
  ]},
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-surface-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-ink-muted">
              Le copilote des micro-entrepreneurs français. Création, URSSAF, facturation, pilotage — tout en un. Service privé indépendant.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-ink-muted">
              <span className="inline-flex h-2 w-2 rounded-full bg-secondary-500 animate-pulse" />
              Connecté à l’INPI · Guichet unique
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-semibold text-ink">{c.title}</h4>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.to}><Link to={l.to} className="text-sm text-ink-muted hover:text-ink">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-surface-border pt-6 text-xs text-ink-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Swivo. Tous droits réservés.</span>
          <span>RGPD · Données hébergées en France · Paiement sécurisé Stripe</span>
        </div>
      </div>
    </footer>
  );
}
