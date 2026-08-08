type Props = { className?: string; mark?: boolean };

/* Brand logo — two pills + dot connector + "swivo" wordmark (pink "sw", violet "ivo"). */
export function Logo({ className = 'h-8 w-auto', mark = false }: Props) {
  if (mark) {
    return (
      <svg viewBox="22 30 60 72" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Swivo" role="img">
        <rect x="28" y="36" width="38" height="16" rx="8" fill="#7c3aed" />
        <circle cx="47" cy="62" r="4" fill="#ec4899" />
        <rect x="35" y="76" width="38" height="16" rx="8" fill="#ec4899" />
        <circle cx="71" cy="38" r="3" fill="#ec4899" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="22 26 240 70" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Swivo" role="img">
      <rect x="28" y="36" width="38" height="16" rx="8" fill="#7c3aed" />
      <circle cx="47" cy="62" r="4" fill="#ec4899" />
      <rect x="35" y="76" width="38" height="16" rx="8" fill="#ec4899" />
      <circle cx="71" cy="38" r="3" fill="#ec4899" opacity="0.7" />
      <text x="84" y="80" fontFamily="Inter, Arial, sans-serif" fontSize="52" fontWeight="500" fill="#ec4899" letterSpacing="-2">
        sw<tspan fill="#7c3aed">ivo</tspan>
      </text>
    </svg>
  );
}
