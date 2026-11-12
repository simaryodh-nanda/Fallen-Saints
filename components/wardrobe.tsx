/* A walnut armoire drawn in CSS. The interior paints behind the footer's content (parent must be `isolate`),
   the frame and two 3D doors paint in front. Open/close is driven by `data-open` on the root, set by the footer's frame loop. */

// Walnut veneer grain from stretched fractal noise, mapped to a brown range (sRGB so the values mean what they say).
const grain = (seed: number, lift = 0) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='900'><filter id='g' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.065 0.0022' numOctaves='5' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0.34 0 0 0 ${(0.05 + lift).toFixed(3)}  0.21 0 0 0 ${(0.028 + lift * 0.7).toFixed(3)}  0.12 0 0 0 ${(0.014 + lift * 0.45).toFixed(3)}  0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`,
  )}")`;

const VENEER = grain(7);
const VENEER_IN = grain(3, -0.025);
const BRASS = "linear-gradient(90deg,#4a3312 0%,#9c7536 22%,#f3dca0 46%,#c39a52 60%,#5e421b 100%)";
const BRASS_H = "linear-gradient(180deg,#4a3312 0%,#9c7536 22%,#f3dca0 46%,#c39a52 60%,#5e421b 100%)";
const GOLD_TEXT = "linear-gradient(180deg,#f6e2ad 0%,#c9a25a 55%,#8d6a2e 100%)";
const T = 22; // door thickness, px
const SZ = "420px 900px";

function Door({ side }: { side: "l" | "r" }) {
  const L = side === "l";
  return (
    <div
      className={`relative h-full flex-1 transform-3d transition-transform duration-[1600ms] ease-[cubic-bezier(.55,0,.15,1)] will-change-transform motion-reduce:transition-none ${L ? "origin-left group-data-[open=true]:[transform:rotateY(-118deg)]" : "origin-right group-data-[open=true]:[transform:rotateY(118deg)] [transition-delay:90ms]"}`}
    >
      {/* front: book-matched veneer (the right door is the mirror of the left) */}
      <div className="absolute inset-0 overflow-hidden backface-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: VENEER, backgroundSize: SZ, transform: L ? undefined : "scaleX(-1)" }} />
        {/* lacquer: soft key light from above, a long diagonal sheen, floor falloff */}
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,214,160,.10),transparent_30%,transparent_72%,rgba(0,0,0,.42))]" />
        <span className={`absolute inset-0 ${L ? "bg-[linear-gradient(115deg,transparent_30%,rgba(255,236,205,.07)_42%,rgba(255,236,205,.02)_50%,transparent_58%)]" : "bg-[linear-gradient(245deg,transparent_30%,rgba(255,236,205,.07)_42%,rgba(255,236,205,.02)_50%,transparent_58%)]"}`} />
        {/* brass inlay frame */}
        <span className="absolute inset-[clamp(18px,4.5%,44px)] border border-[#c9a25a]/55 shadow-[0_0_0_1px_rgba(0,0,0,.35),inset_0_0_0_1px_rgba(0,0,0,.3)]" />
        {/* gilded name, centred high on each door */}
        <span className="label absolute inset-x-0 top-[13%] text-center text-[clamp(10px,1vw,14px)] tracking-[.55em]" style={{ backgroundImage: GOLD_TEXT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 1px 0 rgba(0,0,0,.6))" }}>
          {L ? "Beyond" : "Angels"}
        </span>
        {/* long brass pull on the meeting edge, standing off the door */}
        <span className={`absolute top-1/2 h-[38%] w-2 -translate-y-1/2 ${L ? "right-[clamp(16px,3%,30px)]" : "left-[clamp(16px,3%,30px)]"}`}>
          {["top-[6%]", "bottom-[6%]"].map((p) => <span key={p} className={`absolute ${p} h-2 w-2.5 rounded-xs bg-[#2b1d0a] ${L ? "-left-1.5" : "-right-1.5"}`} />)}
          <span className="absolute inset-0 rounded-full shadow-[6px_8px_10px_rgba(0,0,0,.65)]" style={{ background: BRASS }} />
        </span>
        {/* key escutcheon on the right door */}
        {!L && (
          <span className="absolute left-[clamp(36px,6%,64px)] top-[58%] h-9 w-5 rounded-[10px] shadow-[2px_3px_5px_rgba(0,0,0,.6)]" style={{ background: BRASS_H }}>
            <span className="absolute left-1/2 top-2.5 size-[5px] -translate-x-1/2 rounded-full bg-[#1a1006]" />
            <span className="absolute left-1/2 top-[15px] h-2.5 w-[2px] -translate-x-1/2 bg-[#1a1006]" />
          </span>
        )}
        {/* hinges */}
        {["8%", "50%", "90%"].map((top) => (
          <span key={top} className={`absolute h-[clamp(22px,4%,40px)] w-[5px] -translate-y-1/2 ${L ? "left-0" : "right-0"}`} style={{ top, background: BRASS_H }} />
        ))}
        <span className={`absolute inset-y-0 w-px bg-black/85 ${L ? "right-0" : "left-0"}`} />
        {/* shade deepens as the door turns away from the light */}
        <span className="absolute inset-0 bg-black opacity-0 transition-opacity duration-[1600ms] group-data-[open=true]:opacity-60" />
      </div>
      {/* inside face — carcass veneer with a brass rail */}
      <div className="absolute inset-0 overflow-hidden backface-hidden shadow-[inset_0_0_60px_rgba(0,0,0,.7)]" style={{ transform: `translateZ(-${T}px) rotateY(180deg)`, backgroundImage: VENEER_IN, backgroundSize: SZ }}>
        <span className="absolute inset-x-[10%] top-[22%] h-1 rounded-full" style={{ background: BRASS_H }} />
      </div>
      {/* free edge — the door's thickness */}
      <div className={`absolute inset-y-0 ${L ? "right-0 origin-right" : "left-0 origin-left"}`} style={{ width: T, transform: `rotateY(${L ? -90 : 90}deg)`, background: "linear-gradient(90deg,#1c120a,#5a3b24 45%,#3a2617 60%,#170e07)" }} />
    </div>
  );
}

/** Fills its (isolated, positioned) parent. */
export function Wardrobe() {
  return (
    <div data-k="ftDoors" data-open="false" aria-hidden className="group pointer-events-none absolute inset-x-[clamp(6px,1.2vw,18px)] bottom-1.5 top-6">
      {/* interior: the footer's back wall — behind all footer content */}
      <div className="absolute inset-x-[18px] bottom-4 top-0 -z-1 shadow-[inset_0_70px_80px_rgba(0,0,0,.85),inset_50px_0_60px_rgba(0,0,0,.75),inset_-50px_0_60px_rgba(0,0,0,.75),inset_0_-40px_50px_rgba(0,0,0,.7)]" style={{ backgroundImage: VENEER_IN, backgroundSize: SZ }}>
        <span className="absolute inset-0 bg-black/72" />
        {/* LED strip under the top, and the warm wash it throws once the doors open */}
        <span className="absolute inset-x-[4%] top-2.5 h-[3px] rounded-full bg-[#ffe2b0] opacity-0 shadow-[0_0_18px_4px_rgba(255,200,130,.55)] transition-opacity delay-500 duration-700 group-data-[open=true]:opacity-90" />
        <span className="absolute inset-0 bg-[radial-gradient(75%_38%_at_50%_0%,rgba(255,196,120,.22),rgba(255,170,90,.05)_55%,transparent_75%)] opacity-0 transition-opacity delay-500 duration-[1800ms] group-data-[open=true]:opacity-100" />
      </div>

      {/* frame + doors, in front of everything */}
      <div className="absolute inset-0 z-50">
        {/* crown: cornice with a stepped profile and a brass bead */}
        <span className="absolute -inset-x-3 -top-5 z-2 h-[22px] shadow-[0_8px_14px_rgba(0,0,0,.6)]" style={{ backgroundImage: `linear-gradient(180deg,rgba(255,214,160,.2) 0,rgba(255,214,160,.05) 18%,rgba(0,0,0,.4) 20%,rgba(0,0,0,0) 34%,rgba(255,214,160,.1) 58%,rgba(0,0,0,.6) 100%),${VENEER}`, backgroundSize: `auto,${SZ}` }}>
          <span className="absolute inset-x-3 bottom-0 h-[2px]" style={{ background: "linear-gradient(90deg,#6e4f22,#e6c37b 50%,#6e4f22)" }} />
        </span>
        {/* side stiles */}
        {["left-0", "right-0"].map((s) => (
          <span key={s} className={`absolute ${s} inset-y-0 z-2 w-[18px] shadow-[inset_2px_0_0_rgba(255,214,160,.1),inset_-2px_0_0_rgba(0,0,0,.5)]`} style={{ backgroundImage: VENEER, backgroundSize: SZ }} />
        ))}
        {/* plinth */}
        <span className="absolute -inset-x-1.5 bottom-0 z-2 h-4 shadow-[inset_0_2px_0_rgba(255,214,160,.12)]" style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(0,0,0,.55)),${VENEER}`, backgroundSize: `auto,${SZ}` }} />
        <div className="absolute inset-x-[18px] bottom-4 top-0 flex perspective-[3000px]">
          <Door side="l" />
          <Door side="r" />
        </div>
      </div>
    </div>
  );
}
