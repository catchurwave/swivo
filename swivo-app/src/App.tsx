import { lazy, Suspense, type JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { TarifsPage } from './pages/Tarifs';
import { FaqPage } from './pages/Faq';
import { BlogIndexPage, BlogPostPage } from './pages/Blog';
import { ConnexionPage } from './pages/Connexion';
import { InscriptionPage } from './pages/Inscription';
import { MentionsLegalesPage, ConfidentialitePage, CgvPage, CookiesPage, NotFoundPage } from './pages/Legal';
import { useAuth } from './lib/auth';
import { RequireGestion } from './components/RequireGestion';

// Routes lourdes : code-split + lazy load
const CreerPage         = lazy(() => import('./pages/Creer').then((m) => ({ default: m.CreerPage })));
const EspaceCreateurPage = lazy(() => import('./pages/EspaceCreateur').then((m) => ({ default: m.EspaceCreateurPage })));
const CalculateursPage  = lazy(() => import('./pages/Calculateurs').then((m) => ({ default: m.CalculateursPage })));
const UrssafPage        = lazy(() => import('./pages/Urssaf').then((m) => ({ default: m.UrssafPage })));
const PilotagePage      = lazy(() => import('./pages/Pilotage').then((m) => ({ default: m.PilotagePage })));
const FormationsPage    = lazy(() => import('./pages/Formations').then((m) => ({ default: m.FormationsPage })));
const FormationDetailPage = lazy(() => import('./pages/Formations').then((m) => ({ default: m.FormationDetailPage })));
const FacturationPage   = lazy(() => import('./pages/Facturation').then((m) => ({ default: m.FacturationPage })));
const ModelesPage       = lazy(() => import('./pages/Modeles').then((m) => ({ default: m.ModelesPage })));
const GestionPage       = lazy(() => import('./pages/Gestion').then((m) => ({ default: m.GestionPage })));

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="container-page py-24 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" aria-label="Chargement" />
    </div>
  );
}

function L({ children }: { children: JSX.Element }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Routes pré-rendues (SEO) : import eager */}
        <Route index element={<HomePage />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/connexion" element={<ConnexionPage />} />
        <Route path="/inscription" element={<InscriptionPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/politique-de-confidentialite" element={<ConfidentialitePage />} />
        <Route path="/cgv" element={<CgvPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/formes-juridiques/:slug" element={<Navigate to="/" replace />} />

        {/* Routes lourdes : lazy */}
        <Route path="/creer-mon-entreprise" element={<L><CreerPage /></L>} />
        <Route path="/espace-createur"      element={<L><Protected><EspaceCreateurPage /></Protected></L>} />
        <Route path="/outils/calculateurs"  element={<L><CalculateursPage /></L>} />
        <Route path="/urssaf"               element={<L><UrssafPage /></L>} />
        <Route path="/pilotage"             element={<L><Protected><PilotagePage /></Protected></L>} />
        <Route path="/formations"           element={<L><FormationsPage /></L>} />
        <Route path="/formations/:slug"     element={<L><FormationDetailPage /></L>} />

        {/* Gestion premium : lazy + gated */}
        <Route path="/outils/facturation" element={<L><Protected><RequireGestion feature="Facturation & devis"><FacturationPage /></RequireGestion></Protected></L>} />
        <Route path="/outils/modeles"     element={<L><Protected><RequireGestion feature="Modèles juridiques"><ModelesPage /></RequireGestion></Protected></L>} />
        <Route path="/gestion/pause"      element={<L><Protected><RequireGestion feature="Mise en pause"><GestionPage kind="pause" /></RequireGestion></Protected></L>} />
        <Route path="/gestion/fermeture"  element={<L><Protected><RequireGestion feature="Fermeture d’entreprise"><GestionPage kind="fermeture" /></RequireGestion></Protected></L>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
