import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { ChatbotWidget } from './ChatbotWidget';
import { AnonResumeBanner } from './AnonResumeBanner';
import { BackToTop } from './BackToTop';

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col">
      <AnonResumeBanner />
      <Header />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <CookieBanner />
      <ChatbotWidget />
      <BackToTop />
    </div>
  );
}
