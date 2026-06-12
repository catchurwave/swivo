import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

/*
  Isometric-flavor brand illustrations: violet primary + cyan + pink accent.
  All shapes use CSS variables so re-tinting the palette retints the art.
*/

const grads = (
  <defs>
    <linearGradient id="g-primary" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stopColor="rgb(var(--color-primary-500))" />
      <stop offset="100%" stopColor="rgb(var(--color-primary-700))" />
    </linearGradient>
    <linearGradient id="g-accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stopColor="rgb(var(--color-accent-400))" />
      <stop offset="100%" stopColor="rgb(var(--color-accent-600))" />
    </linearGradient>
    <linearGradient id="g-cyan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stopColor="rgb(var(--color-secondary-200))" />
      <stop offset="100%" stopColor="rgb(var(--color-secondary-500))" />
    </linearGradient>
    <linearGradient id="g-soft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="rgb(var(--color-primary-50))" />
      <stop offset="100%" stopColor="rgb(var(--color-secondary-100))" />
    </linearGradient>
  </defs>
);

/* HERO scene — large isometric: laptop screen with form, floating cards, character. */
export function IllustrationHero(props: Props) {
  return (
    <svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {grads}
      {/* soft floor blob */}
      <ellipse cx="290" cy="380" rx="220" ry="20" fill="rgb(var(--color-primary-200) / 0.5)" />
      {/* big purple back panel */}
      <g transform="translate(150 40)">
        <path d="M0 30 Q0 0 30 0 L300 0 Q330 0 330 30 L330 220 Q330 250 300 250 L30 250 Q0 250 0 220 Z" fill="url(#g-primary)" />
        {/* screen header */}
        <rect x="20" y="20" width="290" height="34" rx="10" fill="white" opacity="0.18" />
        <circle cx="36" cy="37" r="5" fill="rgb(var(--color-accent-400))" />
        <circle cx="52" cy="37" r="5" fill="rgb(var(--color-secondary-300))" />
        <circle cx="68" cy="37" r="5" fill="white" opacity="0.6" />
        {/* form lines */}
        <rect x="20" y="74"  width="170" height="14" rx="7" fill="white" opacity="0.9" />
        <rect x="20" y="98"  width="220" height="10" rx="5" fill="white" opacity="0.55" />
        <rect x="20" y="118" width="200" height="10" rx="5" fill="white" opacity="0.55" />
        <rect x="20" y="138" width="160" height="10" rx="5" fill="white" opacity="0.55" />
        {/* CTA pill */}
        <rect x="20" y="174" width="120" height="32" rx="16" fill="url(#g-accent)" />
        <text x="80" y="195" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="Inter, sans-serif">Démarrer</text>
        {/* mini chart */}
        <g transform="translate(200 168)">
          <rect width="110" height="60" rx="10" fill="white" opacity="0.15" />
          <polyline points="10,48 28,32 50,38 72,18 96,28" fill="none" stroke="rgb(var(--color-secondary-200))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {[10, 28, 50, 72, 96].map((x, i) => (
            <circle key={i} cx={x} cy={[48, 32, 38, 18, 28][i]} r="2.6" fill="rgb(var(--color-secondary-200))" />
          ))}
        </g>
      </g>

      {/* Floating card top-left — document check */}
      <g transform="translate(40 100)" className="animate-float">
        <rect width="120" height="78" rx="14" fill="white" stroke="rgb(var(--color-surface-border))" />
        <rect x="14" y="14" width="50" height="50" rx="10" fill="url(#g-cyan)" />
        <path d="M22 38 l8 8 l16 -18" stroke="white" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="74" y="18" width="36" height="7" rx="3.5" fill="rgb(var(--color-ink) / 0.7)" />
        <rect x="74" y="32" width="30" height="6" rx="3" fill="rgb(var(--color-ink-muted) / 0.4)" />
        <rect x="74" y="44" width="24" height="6" rx="3" fill="rgb(var(--color-ink-muted) / 0.4)" />
      </g>

      {/* Floating card bottom-right — sparkle/IA */}
      <g transform="translate(370 280)" className="animate-float-lg">
        <rect width="140" height="80" rx="16" fill="white" stroke="rgb(var(--color-surface-border))" />
        <circle cx="32" cy="40" r="22" fill="url(#g-accent)" />
        <path d="M32 28 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" fill="white" />
        <rect x="64" y="22" width="60" height="8" rx="4" fill="rgb(var(--color-ink) / 0.75)" />
        <rect x="64" y="38" width="50" height="6" rx="3" fill="rgb(var(--color-ink-muted) / 0.4)" />
        <rect x="64" y="50" width="40" height="6" rx="3" fill="rgb(var(--color-ink-muted) / 0.4)" />
      </g>

      {/* Character — abstract person with a doc */}
      <g transform="translate(60 230)">
        {/* head */}
        <circle cx="40" cy="32" r="18" fill="rgb(var(--color-accent-400))" />
        {/* body */}
        <path d="M14 100 q0 -40 26 -42 q26 2 26 42 z" fill="url(#g-primary)" />
        {/* arm holding doc */}
        <rect x="60" y="52" width="14" height="42" rx="7" fill="url(#g-primary)" transform="rotate(-18 67 73)" />
        {/* doc */}
        <g transform="translate(80 36) rotate(-12)">
          <rect width="46" height="60" rx="6" fill="white" stroke="rgb(var(--color-surface-border))" />
          <rect x="6" y="8" width="34" height="5" rx="2.5" fill="rgb(var(--color-primary-600))" />
          <rect x="6" y="18" width="28" height="3.5" rx="1.7" fill="rgb(var(--color-ink-muted) / 0.4)" />
          <rect x="6" y="26" width="32" height="3.5" rx="1.7" fill="rgb(var(--color-ink-muted) / 0.4)" />
          <rect x="6" y="34" width="20" height="3.5" rx="1.7" fill="rgb(var(--color-ink-muted) / 0.4)" />
          <rect x="6" y="46" width="34" height="9" rx="4.5" fill="rgb(var(--color-accent-500))" />
        </g>
        {/* leg/stool */}
        <rect x="34" y="100" width="12" height="22" rx="3" fill="rgb(var(--color-primary-800))" />
        <rect x="20" y="118" width="40" height="6" rx="3" fill="rgb(var(--color-primary-900))" />
      </g>

      {/* tiny floating shapes */}
      <circle cx="470" cy="80"  r="10" fill="rgb(var(--color-accent-400))" opacity="0.7" />
      <circle cx="500" cy="150" r="6"  fill="rgb(var(--color-secondary-400))" />
      <rect   x="20"  y="60"   width="14" height="14" rx="3" fill="rgb(var(--color-accent-300))" transform="rotate(15 27 67)" />
    </svg>
  );
}

/* Chat scene — kept for FeatureRow */
export function IllustrationChat(props: Props) {
  return (
    <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {grads}
      <rect width="360" height="240" rx="20" fill="url(#g-soft)" />
      {/* phone frame */}
      <g transform="translate(100 24)">
        <rect width="160" height="200" rx="22" fill="white" stroke="rgb(var(--color-surface-border))" />
        <rect x="10" y="10" width="140" height="22" rx="11" fill="url(#g-primary)" />
        <circle cx="20" cy="21" r="5" fill="white" opacity="0.5" />
        <rect x="32" y="17" width="80" height="8" rx="4" fill="white" opacity="0.8" />
        {/* bubbles */}
        <rect x="14" y="46"  width="90" height="22" rx="11" fill="rgb(var(--color-primary-50))" />
        <rect x="22" y="52"  width="70" height="4"  rx="2"  fill="rgb(var(--color-primary-700))" />
        <rect x="22" y="60"  width="50" height="4"  rx="2"  fill="rgb(var(--color-primary-500))" opacity="0.7" />

        <rect x="56" y="74"  width="90" height="22" rx="11" fill="url(#g-primary)" />
        <rect x="62" y="80"  width="60" height="4"  rx="2"  fill="white" />
        <rect x="62" y="88"  width="40" height="4"  rx="2"  fill="white" opacity="0.6" />

        <rect x="14" y="104" width="120" height="44" rx="14" fill="rgb(var(--color-secondary-50))" />
        <rect x="22" y="112" width="100" height="5"  rx="2.5" fill="rgb(var(--color-secondary-700))" />
        <rect x="22" y="124" width="80"  height="4"  rx="2"   fill="rgb(var(--color-secondary-500))" opacity="0.7" />
        <rect x="22" y="134" width="60"  height="4"  rx="2"   fill="rgb(var(--color-secondary-500))" opacity="0.5" />

        <rect x="22" y="170" width="116" height="20" rx="10" fill="url(#g-accent)" />
        <text x="80" y="184" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="Inter, sans-serif">Démarrer</text>
      </g>
      {/* floating sparkle */}
      <g transform="translate(270 38)" className="animate-float">
        <circle r="22" fill="url(#g-accent)" />
        <path d="M0 -10 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="white" />
      </g>
      <circle cx="60" cy="50"  r="14" fill="rgb(var(--color-secondary-300))" opacity="0.7" className="animate-float-lg" />
      <circle cx="40" cy="190" r="10" fill="rgb(var(--color-accent-400))" opacity="0.6" />
    </svg>
  );
}

/* Dossier scene */
export function IllustrationDossier(props: Props) {
  return (
    <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {grads}
      <rect width="360" height="240" rx="20" fill="url(#g-soft)" />
      <g transform="translate(60 36)">
        <rect width="180" height="170" rx="14" fill="white" stroke="rgb(var(--color-surface-border))" />
        <rect x="20" y="22" width="130" height="10" rx="5" fill="url(#g-primary)" />
        <rect x="20" y="42" width="100" height="6"  rx="3" fill="rgb(var(--color-ink-muted) / 0.3)" />
        <rect x="20" y="56" width="120" height="6"  rx="3" fill="rgb(var(--color-ink-muted) / 0.3)" />
        <rect x="20" y="78" width="70"  height="26" rx="8" fill="rgb(var(--color-secondary-100))" />
        <text x="55" y="96" textAnchor="middle" fontSize="11" fill="rgb(var(--color-secondary-700))" fontFamily="Inter, sans-serif" fontWeight="700">SASU</text>
        <rect x="20" y="118" width="140" height="6" rx="3" fill="rgb(var(--color-ink-muted) / 0.3)" />
        <rect x="20" y="132" width="110" height="6" rx="3" fill="rgb(var(--color-ink-muted) / 0.3)" />
      </g>
      <g transform="translate(240 72)" className="animate-float-lg">
        <circle r="48" fill="url(#g-accent)" />
        <path d="M-20 0 l12 12 l28 -28" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="240" y="170" width="60" height="18" rx="9" fill="rgb(var(--color-secondary-300))" opacity="0.7" />
    </svg>
  );
}

/* Growth scene */
export function IllustrationGrowth(props: Props) {
  return (
    <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {grads}
      <rect width="360" height="240" rx="20" fill="url(#g-soft)" />
      <g transform="translate(40 40)">
        <rect width="280" height="160" rx="14" fill="white" stroke="rgb(var(--color-surface-border))" />
        <polyline points="20,130 60,100 100,110 140,60 180,80 220,30 260,40" fill="none" stroke="url(#g-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="20,130 60,100 100,110 140,60 180,80 220,30 260,40 260,140 20,140" fill="rgb(var(--color-primary-500) / 0.12)" stroke="none" />
        {[20, 60, 100, 140, 180, 220, 260].map((x, i) => (
          <circle key={i} cx={x} cy={[130, 100, 110, 60, 80, 30, 40][i]} r="5" fill="white" stroke="rgb(var(--color-primary-600))" strokeWidth="2.5" />
        ))}
        <rect x="20" y="140" width="240" height="2" fill="rgb(var(--color-ink-muted) / 0.3)" />
      </g>
      <g transform="translate(290 30)" className="animate-float">
        <circle r="20" fill="url(#g-accent)" />
        <path d="M-8 4 l5 5 l11 -12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* Shield / conformance */
export function IllustrationShield(props: Props) {
  return (
    <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {grads}
      <rect width="360" height="240" rx="20" fill="url(#g-soft)" />
      <g transform="translate(132 28)">
        <path d="M48 0 L96 18 V70 C96 110 76 140 48 158 C20 140 0 110 0 70 V18 Z" fill="url(#g-primary)" />
        <path d="M48 12 L86 26 V72 C86 104 70 130 48 144 C26 130 10 104 10 72 V26 Z" fill="rgb(var(--color-primary-700))" />
        <path d="M28 80 L44 96 L70 64" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="70"  cy="60"  r="14" fill="rgb(var(--color-accent-400))" opacity="0.8" className="animate-float" />
      <circle cx="290" cy="180" r="20" fill="rgb(var(--color-secondary-300))" opacity="0.7" className="animate-float-lg" />
    </svg>
  );
}
