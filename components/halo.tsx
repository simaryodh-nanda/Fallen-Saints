import { useId } from "react";

/* The halo: a ring of real cotton jersey (texture is a photographed swatch of the bone tee, /halo/cotton.jpg).
   It is drawn as a torus in perspective — the near side thicker than the far side — with matte, top-left light:
   the outer edge and the inner wall fall into shade, a soft crown keeps it round, and a sewn join breaks the loop.
   No outlines, no fur: realism comes from the cloth itself. The only motion is a slow sway on the whole element. */
const CX = 150;
const OUT = { cx: CX, cy: 60, rx: 112, ry: 36 }; // outer edge
const INN = { cx: CX, cy: 55, rx: 92, ry: 21 }; //  inner edge (raised: we look down onto the ring)
const ell = (e: typeof OUT) => `M${e.cx - e.rx},${e.cy}a${e.rx},${e.ry} 0 1,0 ${e.rx * 2},0a${e.rx},${e.ry} 0 1,0 ${-e.rx * 2},0Z`;
const BAND = `${ell(OUT)}${ell(INN)}`;

/** Halo tint per background: golden over light sections, maroon over dark ones. Pass `tone`, or leave it unset and let a
 *  parent set --halo-tint / --halo-glow (the cursor and the hero switch them live). */
export const HALO_TONES = {
  gold: { "--halo-tint": "#c99a3c", "--halo-glow": "#ffe2a0" },
  maroon: { "--halo-tint": "#7d1d2a", "--halo-glow": "#b23a4a" },
} as const;

export function Halo({ className = "", tone }: { className?: string; tone?: keyof typeof HALO_TONES }) {
  const id = useId().replace(/:/g, "");
  const u = (k: string) => `url(#${id}${k})`;
  return (
    <svg viewBox="0 0 300 120" aria-hidden style={tone ? (HALO_TONES[tone] as React.CSSProperties) : undefined} className={`animate-halo-bob overflow-visible will-change-transform motion-reduce:animate-none ${className}`}>
      <defs>
        {/* soft, very slightly irregular cloth edge */}
        <filter id={`${id}edge`} x="-10%" y="-40%" width="120%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation=".45" />
        </filter>
        <filter id={`${id}b3`} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`${id}b2`} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id={`${id}sh`} x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="4.5" /></filter>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="120">
          <path d={BAND} fill="#fff" fillRule="evenodd" filter={u("edge")} />
        </mask>
        {/* light from above: the top of the band catches it, the near underside turns away */}
        <linearGradient id={`${id}lit`} gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="0" y2="96">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".85" stopColor="#5a4426" stopOpacity=".06" />
          <stop offset="1" stopColor="#5a4426" stopOpacity=".2" />
        </linearGradient>
        {/* the inner wall of the far side sits in shade */}
        <linearGradient id={`${id}wall`} gradientUnits="userSpaceOnUse" x1="0" y1="34" x2="0" y2="76">
          <stop offset="0" stopColor="#6b5432" stopOpacity=".38" />
          <stop offset="1" stopColor="#6b5432" stopOpacity=".1" />
        </linearGradient>
      </defs>

      {/* faint glow in the halo's own colour */}
      <path d={BAND} fillRule="evenodd" fill="var(--halo-glow, #ffe2a0)" fillOpacity=".55" filter={u("sh")} className="transition-[fill] duration-500" />
      {/* soft contact shadow */}
      <path d={BAND} fillRule="evenodd" fill="#140e06" fillOpacity=".14" transform="translate(2 9)" filter={u("sh")} />

      <g mask={u("m")} style={{ isolation: "isolate" }}>
        <rect x="0" y="0" width="300" height="120" fill="#f7f1e4" />
        <image href="/halo/cotton.jpg" opacity=".92" x="18" y="14" width="264" height="94" preserveAspectRatio="xMidYMid slice" />
        {/* dye the cotton: multiply keeps the knit grain and folds, only the colour changes */}
        <rect x="0" y="0" width="300" height="120" fill="var(--halo-tint, #c99a3c)" opacity=".9" style={{ mixBlendMode: "multiply" }} className="transition-[fill] duration-500" />
        <rect x="0" y="0" width="300" height="120" fill={u("lit")} />
        {/* edges falling away from the light give the tube its roundness */}
        <path d={ell(OUT)} fill="none" stroke="#6b5432" strokeOpacity=".22" strokeWidth="8" filter={u("b3")} />
        <path d={ell(INN)} fill="none" stroke={u("wall")} strokeWidth="10" filter={u("b3")} />
        {/* soft matte crown along the middle of the band */}
        <ellipse cx={CX} cy="58.5" rx="102" ry="28.5" fill="none" stroke="#fffdf6" strokeOpacity=".38" strokeWidth="6" filter={u("b2")} />
        {/* the sewn join, front right: a seam with a little pucker either side */}
        <g transform="translate(236 78) rotate(-38)">
          <path d="M0 -9 Q1.2 0 0 9" fill="none" stroke="#3a2e1c" strokeOpacity=".55" strokeWidth="1.1" />
          <path d="M1.4 -9 Q2.6 0 1.4 9" fill="none" stroke="#fffaf0" strokeOpacity=".5" strokeWidth=".8" />
          <path d="M-3.5 -7 Q-2.6 0 -3.5 7M5 -7 Q5.8 0 5 7" fill="none" stroke="#3a2e1c" strokeOpacity=".18" strokeWidth="1.6" filter={u("b2")} />
        </g>
      </g>
    </svg>
  );
}
