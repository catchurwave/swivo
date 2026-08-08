import { Seo } from '@/lib/seo';

function Page({ title, description, path, children }: { title: string; description: string; path: string; children: React.ReactNode }) {
  return (
    <>
      <Seo title={title} description={description} path={path} />
      <section className="container-page py-14">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{title}</h1>
          <div className="mt-2 text-xs text-ink-muted">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</div>
          <div className="mt-8 space-y-6 text-ink leading-relaxed">{children}</div>
        </article>
      </section>
    </>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold text-ink mt-6">{children}</h2>;
}

export function MentionsLegalesPage() {
  return (
    <Page title="Mentions légales" description="Mentions légales Swivo." path="/mentions-legales">
      <H2>Éditeur</H2>
      <p>Swivo SAS, capital social 1 000 €, RCS Paris XXX XXX XXX, siège : 1 avenue de l’Entrepreneuriat, 75001 Paris.</p>
      <H2>Hébergeur</H2>
      <p>Hébergement en France (UE). Coordonnées sur demande : contact@swivo.fr.</p>
      <H2>Service indépendant</H2>
      <p>Swivo est un service privé. Les formalités sont déposées sur le Guichet unique de l’INPI.</p>
    </Page>
  );
}

export function ConfidentialitePage() {
  return (
    <Page title="Politique de confidentialité" description="Politique RGPD." path="/politique-de-confidentialite">
      <H2>Responsable du traitement</H2>
      <p>Swivo SAS, contact@swivo.fr.</p>
      <H2>Données collectées</H2>
      <p>Compte (email, identité), informations du chat (forme, siège, activité), paiement (Stripe), journaux techniques.</p>
      <H2>Vos droits</H2>
      <p>Accès, rectification, suppression, opposition, portabilité, limitation. Réclamation possible auprès de la CNIL.</p>
    </Page>
  );
}

export function CgvPage() {
  return (
    <Page title="Conditions générales de vente" description="CGV Swivo." path="/cgv">
      <H2>1. Objet</H2>
      <p>Préparation et transmission de dossiers de formalités au Guichet unique INPI, et outils de gestion.</p>
      <H2>2. Prix</H2>
      <p>Création : 29,90 € TTC. Gestion : 9,90 € TTC/mois sans engagement.</p>
      <H2>3. Garantie 99 % de réussite</H2>
      <p>En cas de rejet après corrections, prestation de création remboursée.</p>
    </Page>
  );
}

export function CookiesPage() {
  return (
    <Page title="Politique cookies" description="Liste des cookies utilisés." path="/cookies">
      <p>Cookies essentiels par défaut. Mesure d’audience et marketing soumis à votre consentement explicite via le bandeau cookies.</p>
    </Page>
  );
}

export function NotFoundPage() {
  return (
    <Page title="Page introuvable" description="404" path="/404">
      <p>Cette page n’existe pas. <a className="link" href="/">Retour à l’accueil</a>.</p>
    </Page>
  );
}
