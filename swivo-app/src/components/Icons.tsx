import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (p: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const Icon = {
  Chat:    (p: IconProps) => <svg {...base(p)}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/><circle cx="9"  cy="12" r=".7" fill="currentColor"/><circle cx="12" cy="12" r=".7" fill="currentColor"/><circle cx="15" cy="12" r=".7" fill="currentColor"/></svg>,
  Doc:     (p: IconProps) => <svg {...base(p)}><path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>,
  Send:    (p: IconProps) => <svg {...base(p)}><path d="M5 12l14-7-7 14-2-5-5-2z"/></svg>,
  Check:   (p: IconProps) => <svg {...base(p)}><path d="M5 12l4 4 10-10"/></svg>,
  Shield:  (p: IconProps) => <svg {...base(p)}><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>,
  Clock:   (p: IconProps) => <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  Spark:   (p: IconProps) => <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  Building:(p: IconProps) => <svg {...base(p)}><rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2M10 21v-3h4v3"/></svg>,
  Calc:    (p: IconProps) => <svg {...base(p)}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M11 11h2M14 11h2M8 15h2M11 15h2M14 15h2M8 19h8"/></svg>,
  Lock:    (p: IconProps) => <svg {...base(p)}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>,
  Sparkle: (p: IconProps) => <svg {...base(p)}><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M19 16l.7 1.7L21 18l-1.3.3L19 20l-.7-1.7L17 18l1.3-.3z"/></svg>,
  Stamp:   (p: IconProps) => <svg {...base(p)}><path d="M5 21h14M7 18h10v3H7zM12 4a3 3 0 0 1 3 3c0 1.7-1 3-1 4v2h-4v-2c0-1-1-2.3-1-4a3 3 0 0 1 3-3z"/></svg>,
  Arrow:   (p: IconProps) => <svg {...base(p)}><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  Briefcase:(p:IconProps) => <svg {...base(p)}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></svg>,
  Bolt:    (p: IconProps) => <svg {...base(p)}><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>,
  Globe:   (p: IconProps) => <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></svg>,
  Mail:    (p: IconProps) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
};
