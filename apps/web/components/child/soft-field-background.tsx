"use client";

/**
 * Soft meadow / field backdrop with mist, grass, and tiny flowers.
 * Pure SVG — no external assets.
 */
export function SoftFieldBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="sfb-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="sfb-sun" cx="50%" cy="10%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="35%" stopColor="#FFFBF5" stopOpacity="0.70" />
          <stop offset="100%" stopColor="#FFF7ED" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sfb-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFF0D6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#A7E3B6" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#sfb-sun)" />

      {/* Mist band */}
      <path
        d="M0 160c110-40 210-30 320 10 120 46 240 40 380-2 140-42 280-46 500 10v110H0V160z"
        fill="url(#sfb-mist)"
        opacity="0.6"
      />

      {/* Grass */}
      <path
        d="M0 520c220-60 360-40 520 10 170 54 320 50 680-20v310H0V520z"
        fill="url(#sfb-grass)"
      />

      {/* Flowers */}
      {Array.from({ length: 36 }).map((_, i) => {
        const x = (i * 33) % 1200;
        const y = 560 + ((i * 41) % 180);
        const s = 0.8 + (i % 5) * 0.12;
        const c =
          i % 3 === 0 ? "#F59E0B" : i % 3 === 1 ? "#FB7185" : "#FBBF24";
        return (
          <g
            key={i}
            transform={`translate(${x} ${y}) scale(${s})`}
            opacity="0.22"
          >
            <circle cx="0" cy="0" r="4" fill={c} />
            <circle cx="10" cy="6" r="3" fill={c} />
            <circle cx="-10" cy="7" r="3" fill={c} />
            <circle cx="0" cy="12" r="2" fill="#22C55E" />
          </g>
        );
      })}
    </svg>
  );
}
