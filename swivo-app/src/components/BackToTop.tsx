import { useEffect, useState } from 'react';

export function BackToTop({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  function up() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className={`fixed bottom-5 right-5 z-40 transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring " />
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring" style={{ animationDelay: '0.9s' }} />
      <button
        onClick={up}
        aria-label="Retour en haut"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-ink-inverse shadow-elevated transition hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
