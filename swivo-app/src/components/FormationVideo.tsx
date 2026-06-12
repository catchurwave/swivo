import { useEffect, useRef, useState } from 'react';
import type { ExplainerScript } from '@/data/formations';

/* ============================================================ */
/* WRAPPER : choisit entre <video> et explainer animé            */
/* ============================================================ */

export function FormationVideo({ videoUrl, poster, explainer }: { videoUrl?: string; poster?: string; explainer?: ExplainerScript }) {
  if (videoUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-black shadow-elevated">
        <video controls poster={poster} className="block aspect-video w-full" preload="metadata">
          <source src={videoUrl} type="video/mp4" />
          Votre navigateur ne supporte pas la vidéo HTML5.
        </video>
      </div>
    );
  }
  if (explainer) return <ExplainerPlayer script={explainer} />;
  return (
    <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-muted text-center text-sm text-ink-muted">
      🎬 Vidéo bientôt disponible
    </div>
  );
}

/* ============================================================ */
/* EXPLAINER : personnage + bullets interactifs + TTS            */
/* ============================================================ */

function ExplainerPlayer({ script }: { script: ExplainerScript }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 de la scène
  const [supportsTts, setSupportsTts] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [revealed, setRevealed] = useState<number>(0); // bullets révélés
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bulletTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supports = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setSupportsTts(supports);
    if (!supports) return;
    // Sur Chrome/Edge la liste des voix arrive en async via voiceschanged.
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      voicesRef.current = v;
      if (v.length > 0) setVoicesReady(true);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      stopAll();
    };
  }, []);

  function stopAll() {
    try { window.speechSynthesis?.cancel(); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
    if (bulletTimerRef.current) clearInterval(bulletTimerRef.current);
    setPlaying(false);
  }

  function playSlide(i: number) {
    const slide = script.slides[i];
    if (!slide) return;
    setRevealed(0);

    // Bullets s'affichent un par un
    if (slide.bullets?.length) {
      let r = 0;
      bulletTimerRef.current = setInterval(() => {
        r++;
        setRevealed(Math.min(r, slide.bullets!.length));
        if (r >= slide.bullets!.length) {
          if (bulletTimerRef.current) clearInterval(bulletTimerRef.current);
        }
      }, 700);
    }

    if (supportsTts && !muted) {
      window.speechSynthesis.cancel();
      // Bug Chrome : queue se met en pause après ~15s. Resume préventif.
      try { window.speechSynthesis.resume(); } catch {}
      const u = new SpeechSynthesisUtterance(slide.narration);
      u.lang = script.voice ?? 'fr-FR';
      u.rate = (script.rate ?? 1) * 0.97; // débit posé, pro
      u.pitch = 0.92;                     // voix plus grave (homme)
      u.volume = 1;
      // Sélection voix : voix HOMME française pro, en cascade de qualité.
      // Heuristique par prénom car Web Speech ne révèle pas le genre.
      const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
      const frVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('fr'));
      const isMaleFR = (v: SpeechSynthesisVoice) => /henri|thomas|paul|nicolas|s[ée]bastien|antoine|claude|jean|pierre|jacques|guillaume|alex(?!a)|jorge|male|homme/i.test(v.name);
      const isFemaleFR = (v: SpeechSynthesisVoice) => /am[ée]lie|aur[ée]lie|julie|marie|audrey|marlene|virginie|c[ée]cile|c[ée]line|sophie|chantal|female|femme|elsa|alice|val[ée]rie/i.test(v.name);

      // 1. Voix homme FR "Natural"/"Neural"/"Online" (Microsoft premium)
      // 2. Voix homme FR Google
      // 3. Voix homme FR locale (Apple Thomas, Microsoft Paul/Henri)
      // 4. Voix FR non-féminine (neutre)
      // 5. N'importe quelle voix FR
      const pick =
        frVoices.find((v) => isMaleFR(v) && /natural|neural|online|premium/i.test(v.name)) ??
        frVoices.find((v) => isMaleFR(v) && /google/i.test(v.name)) ??
        frVoices.find((v) => isMaleFR(v)) ??
        frVoices.find((v) => !isFemaleFR(v) && /natural|neural|online|premium/i.test(v.name)) ??
        frVoices.find((v) => !isFemaleFR(v)) ??
        frVoices[0];
      if (pick) u.voice = pick;
      u.onend = () => {
        if (i < script.slides.length - 1) {
          setIdx(i + 1);
          playSlide(i + 1);
        } else {
          setPlaying(false);
        }
      };
      u.onerror = () => { /* ignore : fallback timer prend le relais */ };
      window.speechSynthesis.speak(u);
      // Workaround Chrome : ping toutes les 8s pour empêcher l'arrêt auto.
      const keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 8000);
      // Cleanup au stop suivant via timerRef
    }

    // Progress bar
    const estimatedMs = Math.max(3500, slide.narration.length * 50);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / estimatedMs);
      setProgress(p);
      if (p >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!supportsTts || muted) {
          if (i < script.slides.length - 1) {
            setIdx(i + 1);
            setProgress(0);
            setTimeout(() => playSlide(i + 1), 50);
          } else setPlaying(false);
        }
      }
    }, 100);
  }

  function play() { setPlaying(true); playSlide(idx); }
  function pause() { stopAll(); }
  function restart() { stopAll(); setIdx(0); setProgress(0); setTimeout(() => { setPlaying(true); playSlide(0); }, 50); }
  function goTo(i: number) {
    stopAll();
    setIdx(i);
    setProgress(0);
    if (playing) setTimeout(() => playSlide(i), 50);
  }
  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (next) { try { window.speechSynthesis.cancel(); } catch {} }
      return next;
    });
  }

  const slide = script.slides[idx]!;
  const bg = slide.accent === 'secondary' ? 'from-secondary-50 via-surface to-primary-50' :
             slide.accent === 'accent'    ? 'from-accent-300/20 via-surface to-primary-50' :
                                            'from-primary-50 via-surface to-secondary-50';

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-elevated">
      {/* Scène */}
      <div className={`relative aspect-video w-full bg-gradient-to-br ${bg}`}>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-primary-300/25 blur-3xl animate-float-lg" />
          <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-secondary-300/25 blur-3xl animate-float" />
          <div className="absolute inset-0 bg-dot-pattern opacity-25" />
        </div>

        <div key={idx} className="relative grid h-full grid-cols-[auto_1fr] items-center gap-4 px-5 py-6 sm:gap-8 sm:px-10">
          {/* Personnage à gauche */}
          <Character speaking={playing} accent={slide.accent ?? 'primary'} />

          {/* Bulle + contenu à droite */}
          <div className="min-w-0">
            {/* Bulle dialogue */}
            <div className="relative inline-block max-w-full motion-safe:animate-tile-in">
              <div className="rounded-2xl rounded-bl-sm bg-surface px-4 py-2 text-base font-display font-bold text-ink shadow-soft ring-1 ring-surface-border sm:text-2xl">
                <span className="mr-2 align-middle text-2xl sm:text-4xl">{slide.emoji}</span>
                {slide.title}
              </div>
              {/* Queue de bulle */}
              <span aria-hidden className="absolute -left-1.5 bottom-0 h-4 w-4 -translate-y-1/2 -rotate-45 bg-surface" />
            </div>

            {/* Bullets interactifs révélés un par un */}
            {slide.bullets && slide.bullets.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {slide.bullets.map((b, i) => (
                  <li
                    key={b}
                    className={`rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-ink shadow-soft backdrop-blur transition-all duration-500 sm:text-sm ${i < revealed ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
                  >
                    ✓ {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Étiquette IA */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/55 px-2.5 py-1 text-[10px] font-semibold text-ink-inverse backdrop-blur">
          ✨ Explainer IA · {script.totalDuration}
        </div>
      </div>

      {/* Progress segments */}
      <div className="flex gap-1 bg-ink/5 px-3 py-2">
        {script.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="group h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border transition hover:bg-surface-border/70"
            aria-label={`Aller à la scène ${i + 1}`}
          >
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all"
              style={{ width: i < idx ? '100%' : i === idx ? `${progress * 100}%` : '0%' }}
            />
          </button>
        ))}
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-between gap-3 border-t border-surface-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          {!playing ? (
            <button onClick={play} className="btn-primary text-sm" aria-label="Lecture">▶ Lecture</button>
          ) : (
            <button onClick={pause} className="btn-outline text-sm" aria-label="Pause">⏸ Pause</button>
          )}
          <button onClick={restart} className="btn-ghost text-xs" aria-label="Recommencer" title="Recommencer">↺</button>
          <button onClick={toggleMute} className="btn-ghost text-xs" aria-label={muted ? 'Activer son' : 'Couper son'} title={muted ? 'Activer la voix' : 'Couper la voix'}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <button onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0} className="btn-ghost text-xs disabled:opacity-40" aria-label="Précédent">‹</button>
          <span className="px-1 tabular-nums">{idx + 1} / {script.slides.length}</span>
          <button onClick={() => goTo(Math.min(script.slides.length - 1, idx + 1))} disabled={idx === script.slides.length - 1} className="btn-ghost text-xs disabled:opacity-40" aria-label="Suivant">›</button>
        </div>
      </div>

      {!supportsTts && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Voix non disponible sur ce navigateur — les scènes défilent automatiquement.
        </div>
      )}
      {supportsTts && voicesReady && !voicesRef.current.some((v) => v.lang?.startsWith('fr')) && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Aucune voix française détectée sur votre système — l'anglais sera utilisé par défaut.
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* PERSONNAGE SVG (Léo, mascotte Swivo)                          */
/* ============================================================ */

function Character({ speaking, accent }: { speaking: boolean; accent: 'primary' | 'secondary' | 'accent' }) {
  const skin = '#fde2c8';
  const hair = '#1f2937';
  const shirt = accent === 'secondary' ? '#10b981' : accent === 'accent' ? '#7c3aed' : '#2563eb';
  const shirtDark = accent === 'secondary' ? '#047857' : accent === 'accent' ? '#5b21b6' : '#1d4ed8';

  return (
    <div className="relative shrink-0">
      {/* Ring décor */}
      <div aria-hidden className="absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-primary-200/40 to-secondary-200/40 blur-xl" />
      <svg viewBox="0 0 220 260" className={`relative h-28 w-auto sm:h-44 ${speaking ? 'animate-bounce-soft' : ''}`} style={{ filter: 'drop-shadow(0 6px 16px rgba(15,23,42,0.15))' }}>
        {/* Corps */}
        <ellipse cx="110" cy="210" rx="78" ry="44" fill={shirtDark} />
        <path d="M 32 200 Q 110 130 188 200 L 188 260 L 32 260 Z" fill={shirt} />
        {/* Col rond */}
        <ellipse cx="110" cy="170" rx="22" ry="10" fill={skin} />

        {/* Tête */}
        <ellipse cx="110" cy="115" rx="52" ry="58" fill={skin} />
        {/* Cheveux */}
        <path d="M 58 95 Q 60 50 110 48 Q 160 50 162 95 Q 158 80 130 78 Q 110 90 90 78 Q 62 80 58 95 Z" fill={hair} />
        {/* Oreilles */}
        <ellipse cx="58" cy="118" rx="6" ry="10" fill={skin} />
        <ellipse cx="162" cy="118" rx="6" ry="10" fill={skin} />

        {/* Sourcils */}
        <path d="M 78 100 Q 88 95 96 100" stroke={hair} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 124 100 Q 132 95 142 100" stroke={hair} strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Yeux — clignotent */}
        <g className={speaking ? 'animate-blink' : ''}>
          <ellipse cx="88" cy="115" rx="4" ry="5" fill={hair} />
          <ellipse cx="132" cy="115" rx="4" ry="5" fill={hair} />
          <circle cx="89" cy="113" r="1.2" fill="#ffffff" />
          <circle cx="133" cy="113" r="1.2" fill="#ffffff" />
        </g>

        {/* Joues */}
        <circle cx="76" cy="135" r="6" fill="#f9a8d4" opacity="0.55" />
        <circle cx="144" cy="135" r="6" fill="#f9a8d4" opacity="0.55" />

        {/* Bouche — anime quand parle */}
        <g transform="translate(110 145)">
          {speaking ? (
            <ellipse cx="0" cy="0" rx="11" ry="7" fill="#7a2424" className="animate-mouth">
              <animate attributeName="ry" values="2;7;3;6;2" dur="0.4s" repeatCount="indefinite" />
              <animate attributeName="rx" values="9;11;10;12;9" dur="0.5s" repeatCount="indefinite" />
            </ellipse>
          ) : (
            <path d="M -10 0 Q 0 6 10 0" stroke="#7a2424" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          )}
        </g>

      </svg>

      <style>{`
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%, 97%      { transform: scaleY(0.1); }
        }
        .animate-bounce-soft { animation: bounce-soft 2.4s ease-in-out infinite; }
        .animate-blink g    { transform-origin: center; }
        .animate-blink      { animation: blink 4s ease-in-out infinite; transform-box: fill-box; }
      `}</style>
    </div>
  );
}
