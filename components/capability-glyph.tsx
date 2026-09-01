/**
 * Small diagrams for the capability cards — one per capability, drawn from the
 * gateway's own vocabulary (weight bars, a token bucket, a hit/miss split).
 * Each carries one quiet looping animation; the classes are transform/opacity
 * only so the global reduced-motion reset stills them. Colours come from the
 * theme tokens so both themes hold.
 */
const patch = 'hsl(var(--patch))'
const line = 'hsl(var(--border))'
const dim = 'hsl(var(--muted-foreground))'

export type GlyphName = 'pools' | 'ratelimit' | 'cache' | 'live' | 'analytics' | 'auth'

export function CapabilityGlyph({ name }: { name: GlyphName }) {
  return (
    <svg viewBox="0 0 120 64" className="glyph h-16 w-[120px]" aria-hidden fill="none">
      {name === 'pools' && (
        <>
          <g className="g-bob">
            <rect x="2" y="10" width="82" height="8" rx="2" fill={patch} />
            <rect x="2" y="28" width="58" height="8" rx="2" fill={patch} opacity="0.7" />
            <rect x="2" y="46" width="40" height="8" rx="2" stroke={dim} strokeDasharray="3 3" />
          </g>
          <text x="92" y="17" fontSize="8" fill={dim}>×3</text>
          <text x="70" y="35" fontSize="8" fill={dim}>×2</text>
          <text x="50" y="53" fontSize="8" fill={dim}>down</text>
        </>
      )}
      {name === 'ratelimit' && (
        <>
          <path d="M40 8 L80 8 L74 44 L46 44 Z" stroke={line} />
          <circle cx="54" cy="20" r="3.5" fill={patch} />
          <circle cx="66" cy="20" r="3.5" fill={patch} />
          <circle cx="60" cy="30" r="3.5" fill={patch} />
          <circle className="g-drip" cx="60" cy="46" r="3" fill={patch} />
        </>
      )}
      {name === 'cache' && (
        <>
          <rect className="g-stretch" x="2" y="24" width="80" height="16" rx="3" fill={patch} />
          <rect x="86" y="24" width="32" height="16" rx="3" stroke={line} />
          <text x="10" y="36" fontSize="9" fill="hsl(var(--primary-foreground))">HIT</text>
          <text x="92" y="36" fontSize="8" fill={dim}>miss</text>
        </>
      )}
      {name === 'live' && (
        <>
          <rect x="2" y="20" width="34" height="24" rx="3" stroke={line} />
          <rect x="84" y="20" width="34" height="24" rx="3" stroke={line} />
          <path d="M36 32 L84 32" stroke={dim} />
          <circle className="g-travel" cx="38" cy="32" r="4" fill={patch} />
          <text x="6" y="54" fontSize="7" fill={dim}>control</text>
          <text x="90" y="54" fontSize="7" fill={dim}>gateway</text>
        </>
      )}
      {name === 'analytics' && (
        <>
          <path d="M2 54 L118 54" stroke={line} />
          <path
            className="g-draw"
            d="M2 44 L20 38 L34 42 L50 24 L66 30 L84 14 L104 20 L118 8"
            stroke={patch}
            strokeWidth="1.5"
          />
          <circle cx="118" cy="8" r="3" fill={patch} />
        </>
      )}
      {name === 'auth' && (
        <>
          <rect x="24" y="6" width="72" height="10" rx="5" stroke={line} />
          <rect x="24" y="20" width="72" height="10" rx="5" stroke={line} />
          <rect x="24" y="34" width="72" height="10" rx="5" stroke={line} />
          <rect x="24" y="48" width="72" height="10" rx="5" stroke={line} />
          <rect className="g-slot" x="24" y="6" width="72" height="10" rx="5" fill={patch} />
        </>
      )}
    </svg>
  )
}
