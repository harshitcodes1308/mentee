// ─── HackShastra Logo SVG Component ──────────────────────────────────────────
// Inline SVG so it renders immediately without a network request.
// The design: flaming sun/mandala with trident at center, in crimson.

interface LogoProps {
  /** icon-only width. Set showText=true for full lockup */
  size?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function HackShastraLogo({ size = 36, showText = true, className = '', style }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ lineHeight: 1, ...style }}>
      {/* Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer flame ring */}
        <circle cx="50" cy="50" r="44" stroke="#8B0000" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* Flame petals — 8 of them */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 34 * Math.sin(rad);
          const y = 50 - 34 * Math.cos(rad);
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="6"
              ry="11"
              transform={`rotate(${angle}, ${x}, ${y})`}
              fill="url(#flameGrad)"
              opacity="0.85"
            />
          );
        })}
        {/* Inner circle */}
        <circle cx="50" cy="50" r="22" fill="#0D0D0D" stroke="#8B0000" strokeWidth="1.5" />
        {/* Trishul (trident) */}
        {/* Center shaft */}
        <rect x="48.5" y="44" width="3" height="18" rx="1.5" fill="#C41111" />
        {/* Left prong */}
        <path d="M42 44 Q42 39 45 37 L45 47 Q43 46 42 44Z" fill="#C41111" />
        {/* Right prong */}
        <path d="M58 44 Q58 39 55 37 L55 47 Q57 46 58 44Z" fill="#C41111" />
        {/* Center top */}
        <path d="M50 44 L48 38 L50 35 L52 38 L50 44Z" fill="#C41111" />
        {/* Cross bar */}
        <rect x="43" y="47" width="14" height="2.5" rx="1.25" fill="#C41111" />

        <defs>
          <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C41111" />
            <stop offset="100%" stopColor="#5C0000" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark */}
      {showText && (
        <span
          style={{
            fontFamily: "'League Spartan', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.58,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #C41111 0%, #8B0000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          HackShastra
        </span>
      )}
    </div>
  );
}
