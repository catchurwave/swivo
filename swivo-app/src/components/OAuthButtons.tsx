import { apiBase } from '@/lib/config';

/**
 * Boutons connexion tierce — Google + FranceConnect.
 * Démarre le flow OIDC via le backend WP. Le retour redirige vers `from`.
 */
export function OAuthButtons({ from }: { from?: string }) {
  const base = `${apiBase()}/swivo/v1/auth`;
  const ret = encodeURIComponent(from ?? '/espace-createur');

  return (
    <div className="space-y-2">
      <a
        href={`${base}/france-connect/start?return=${ret}`}
        className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-[#000091] bg-white px-4 py-3 text-sm font-semibold text-[#000091] transition hover:bg-[#000091] hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2 L4 7 v6 c0 5 3.5 8.7 8 9 4.5-.3 8-4 8-9 V7 Z" /></svg>
        S'identifier avec <strong>FranceConnect</strong>
      </a>

      <a
        href={`${base}/google/start?return=${ret}`}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary-500 hover:bg-primary-50/30"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
        </svg>
        Continuer avec <strong>Google</strong>
      </a>

      <p className="px-2 text-center text-xs text-ink-muted">
        FranceConnect : identité vérifiée, données pré-remplies (état civil, adresse).
        <br />Google : connexion rapide email + nom.
      </p>
    </div>
  );
}
