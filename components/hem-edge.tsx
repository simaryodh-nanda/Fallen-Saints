/** A slim shirt-hem border: a band of dark knit with a curved lower edge and two rows of stitching. It reads as a border,
 *  not a shadow — same stitch language as the hem on the story page. */
const CURVE = (y: number, d = 3) => `M0,${y} C250,${y + d} 750,${y + d} 1000,${y}`;
const MASK = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201000%2040%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%2C0%20H1000%20V30%20C750%2C36%20250%2C36%200%2C30%20Z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E")`;

export function HemEdge({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none h-[clamp(30px,3.6vw,52px)] ${className}`}>
      <div className="absolute inset-0 bg-[#171514] bg-[url(/story/hem-knit.png)] bg-[length:30px_30px]" style={{ maskImage: MASK, WebkitMaskImage: MASK, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />
      <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path d={CURVE(2, 0)} fill="none" stroke="rgba(236,230,218,.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={CURVE(19)} fill="none" stroke="rgba(214,207,195,.5)" strokeWidth="1.1" strokeDasharray="3.4 2.3" vectorEffect="non-scaling-stroke" />
        <path d={CURVE(24)} fill="none" stroke="rgba(214,207,195,.42)" strokeWidth="1.1" strokeDasharray="3.4 2.3" strokeDashoffset="1.4" vectorEffect="non-scaling-stroke" />
        <path d={CURVE(30, 6)} fill="none" stroke="rgba(0,0,0,.65)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
