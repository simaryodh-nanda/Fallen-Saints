"use client";

/* "Our story": a camera travels down the Bad Influence shirt as you scroll — collar, stitch trace, chest mark, knit lens,
   hem. Imperative frame loop (refs + per-frame DOM writes) ported from the reference; copy is draft where the founder
   hasn't supplied it, and is flagged as such on the page. */
/* eslint-disable react-hooks/refs */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GSM, inr, PIECES } from "@/lib/pieces";
import { cl, frame, isFine, reduced } from "@/lib/motion";
import { Halo } from "../halo";

// camera keyframes per chapter: centre on the shirt (cx,cy in the 760×1198 shirt space), where it sits on screen (fx,fy), zoom k
const KD = [
  { cx: 400, cy: 330, fx: 0.5, fy: 0.5, k: 1.22 }, { cx: 560, cy: 280, fx: 0.66, fy: 0.46, k: 1.9 }, { cx: 400, cy: 450, fx: 0.5, fy: 0.52, k: 1.5 },
  { cx: 520, cy: 490, fx: 0.64, fy: 0.5, k: 3.3 }, { cx: 330, cy: 820, fx: 0.34, fy: 0.5, k: 2.3 }, { cx: 400, cy: 1110, fx: 0.4, fy: 0.56, k: 1.7 }, { cx: 382, cy: 600, fx: 0.66, fy: 0.5, k: 0.86 },
];
const KM = [
  { cx: 400, cy: 360, fx: 0.5, fy: 0.4, k: 1.0 }, { cx: 560, cy: 280, fx: 0.5, fy: 0.26, k: 1.5 }, { cx: 400, cy: 450, fx: 0.5, fy: 0.5, k: 1.15 },
  { cx: 520, cy: 490, fx: 0.5, fy: 0.26, k: 2.6 }, { cx: 330, cy: 820, fx: 0.5, fy: 0.26, k: 1.8 }, { cx: 400, cy: 1110, fx: 0.5, fy: 0.3, k: 1.3 }, { cx: 382, cy: 600, fx: 0.5, fy: 0.32, k: 0.5 },
];
// the stitch line that is "sewn" down the shirt, one segment per chapter
const SEGS = [
  "M400,262 C450,260 496,242 521,208 L690,262",
  "M690,262 C668,318 600,356 470,370 C380,380 300,392 236,420",
  "M236,420 C320,420 430,428 520,442 A48,48 0 1 1 478.4,466",
  "M478.4,466 C430,560 300,640 318,780 C334,900 420,980 384,1062",
  "M384,1062 C366,1116 300,1138 250,1141 Q420,1149 580,1141",
];
const CH = ["The collar", "The contrast", "The mark", "The feel", "The hem"];
const ss = (t: number) => t * t * (3 - 2 * t);
const io3 = (t: number) => 1 - Math.pow(1 - t, 3);
const plat = (p: number, e: number) => cl(Math.min(p, 1 - p) / e);
const EASE = "cubic-bezier(.2,.8,.1,1)";

/** Reveal-on-enter helpers: elements start hidden and are toggled by the frame loop via [data-rv]. */
const rise = (y: number, dur = ".9s", delay = "0s", op = ".7s"): React.CSSProperties => ({ opacity: 0, transform: `translateY(${y}px)`, transition: `opacity ${op} ${delay}, transform ${dur} ${EASE} ${delay}` });
function Line({ children, delay = ".08s", dur = "1s", className = "" }: { children: React.ReactNode; delay?: string; dur?: string; className?: string }) {
  return (
    <span className="block overflow-hidden">
      <span data-rv="" className={`block ${className}`} style={{ opacity: 0, transform: "translateY(105%)", transition: `transform ${dur} ${EASE} ${delay}, opacity .4s ${delay}` }}>{children}</span>
    </span>
  );
}
const Eyebrow = ({ children }: { children: React.ReactNode }) => <span data-rv="" className="label text-[#9A9389]" style={rise(12, ".8s", "0s", ".6s")}>{children}</span>;
const Draft = ({ children }: { children: React.ReactNode }) => <span className="label self-start border border-dashed border-[#8A8278] px-2 py-1 text-[10px] text-stone">{children}</span>;
const H2 = "display m-0 text-[clamp(52px,7.2vw,132px)] leading-[.84]";
const BLEND = "relative z-0 isolate text-bone mix-blend-difference";

export function Story() {
  const root = useRef<HTMLDivElement>(null);
  const [mob, setMob] = useState(false);
  const [mid, setMid] = useState(false);
  const [lensOn, setLensOn] = useState(false);
  const lensRef = useRef(false);
  lensRef.current = lensOn;
  const price = inr(PIECES[0].price);

  useEffect(() => {
    const on = () => { setMob(innerWidth < 760); setMid(innerWidth < 980); };
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);

  useEffect(() => {
    const el = root.current!;
    const rm = reduced(), fine = isFine();
    const q = (k: string) => el.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
    const railnav = q("railnav"), cam = q("cam"), blur = q("blurL"), spot = q("spot"), shade = q("shade"), sweep = q("sweep"), head = q("head"), lens = q("lens"), veil = q("veil"), cue = q("cue"), hem = q("hem"), hemG = q("hemG");
    const rail = [...el.querySelectorAll<HTMLElement>("[data-rail]")], mini = [...el.querySelectorAll<HTMLElement>("[data-mini]")], ph = [...el.querySelectorAll<HTMLElement>("[data-ph]")];
    const on = new Map<Element, boolean>();
    let secs: HTMLElement[] = [], A: number[] = [], segs: { p: SVGPathElement; L: number }[] = [], cur = -1;
    const pp = { x: 0, y: 0, tx: 0, ty: 0 };
    const ln = { x: innerWidth * 0.3, y: innerHeight * 0.5, tx: innerWidth * 0.3, ty: innerHeight * 0.5, last: -1e9, inside: false };
    const t0 = performance.now();
    let sy = scrollY;

    const layout = () => {
      const H = innerHeight;
      secs = [...el.querySelectorAll<HTMLElement>("[data-sec]")];
      A = secs.map((s, i) => { const r = s.getBoundingClientRect(), top = r.top + scrollY; return i === 0 ? 0 : i === secs.length - 1 ? top + r.height - H : top + (r.height - H) / 2; });
      segs = [...el.querySelectorAll<SVGPathElement>("[data-seg]")].map((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = `${L.toFixed(1)} ${(L + 20).toFixed(1)}`; return { p, L }; });
      on.clear(); cur = -1;
    };
    const setRv = (n: HTMLElement, show: boolean) => {
      if (n.dataset.off === undefined) n.dataset.off = n.style.transform;
      if (rm) n.style.transition = "none";
      n.style.opacity = show ? "1" : "0";
      n.style.transform = show ? "none" : n.dataset.off!;
    };
    const onPM = (e: PointerEvent) => { pp.tx = e.clientX / innerWidth - 0.5; pp.ty = e.clientY / innerHeight - 0.5; };
    const onLens = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; ln.tx = e.clientX; ln.ty = e.clientY; ln.last = performance.now(); ln.inside = true; };
    const onLeave = () => { ln.inside = false; };
    const sec4 = el.querySelector<HTMLElement>('[data-sec="4"]');
    addEventListener("pointermove", onPM, { passive: true }); addEventListener("resize", layout);
    sec4?.addEventListener("pointermove", onLens); sec4?.addEventListener("pointerleave", onLeave);
    layout();
    document.fonts?.ready.then(layout);
    const lt = setTimeout(layout, 700);

    const stop = frame((_, now) => {
      if (!A.length) return;
      const W = innerWidth, H = innerHeight, m = W < 760, K = m ? KM : KD;
      const real = scrollY;
      sy += (real - sy) * (rm ? 1 : 0.14);
      if (Math.abs(real - sy) < 0.3) sy = real;
      const y = sy, off = real - y;
      const ik = rm ? 1 : io3(cl((now - t0) / 1700));
      let i = 0; while (i < A.length - 2 && y >= A[i + 1]) i++;
      const t = ss(cl((cl((y - A[i]) / Math.max(1, A[i + 1] - A[i])) - 0.12) / 0.76));
      const a = K[i], b = K[i + 1], sc = (k: { k: number }) => (k.k * H) / 1198;
      const S = Math.exp(Math.log(sc(a)) + (Math.log(sc(b)) - Math.log(sc(a))) * t) * (1 + 0.07 * (1 - ik));
      const cx = a.cx + (b.cx - a.cx) * t, cy = a.cy + (b.cy - a.cy) * t, fx = a.fx + (b.fx - a.fx) * t, fy = a.fy + (b.fy - a.fy) * t;
      const P = secs.map((s) => { const r = s.getBoundingClientRect(), top = r.top + off; return { p: cl((H * 0.5 - top) / r.height), rt: r.top, rb: r.bottom }; });
      pp.x += (pp.tx - pp.x) * 0.08; pp.y += (pp.ty - pp.y) * 0.08;
      const pw = fine && !rm && !m ? plat(P[3].p, 0.2) + 0.5 * plat(P[4].p, 0.2) : 0;
      const tx = fx * W - cx * S - pp.x * 16 * pw, ty = fy * H - cy * S - pp.y * 12 * pw;
      cam.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${S.toFixed(4)})`;

      let hk = -1, ht = 0;
      segs.forEach((g, k) => { const tt = cl((P[k + 1].p - 0.06) / 0.56); g.p.style.strokeDashoffset = (g.L * (1 - tt)).toFixed(1); if (tt > 0) { hk = k; ht = tt; } });
      const pt = hk >= 0 ? segs[hk].p.getPointAtLength(ht * segs[hk].L) : { x: 400, y: 262 };
      const hx = tx + pt.x * S, hy = ty + pt.y * S;
      const prodK = cl((P[6].p - 0.08) / 0.36);
      head.style.transform = `translate3d(${hx.toFixed(1)}px,${hy.toFixed(1)}px,0)`;
      head.style.opacity = (cl((ik - 0.6) / 0.4) * (1 - prodK)).toFixed(3);
      spot.style.transform = `translate3d(${(pt.x - 280).toFixed(1)}px,${(pt.y - 280).toFixed(1)}px,0)`;
      spot.style.opacity = ((0.4 + 0.6 * plat(P[2].p, 0.25)) * (1 - prodK) * ik).toFixed(3);
      shade.style.opacity = plat(P[2].p, 0.25).toFixed(3);
      blur.style.opacity = (plat(P[3].p, 0.22) * 0.9).toFixed(3);
      sweep.style.opacity = (rm ? 0 : plat(P[4].p, 0.2)).toFixed(3);
      sweep.style.backgroundPosition = `${(100 - 100 * P[4].p).toFixed(1)}% 0`;
      veil.style.opacity = (1 - ik).toFixed(3); veil.style.visibility = ik >= 1 ? "hidden" : "visible";
      if (cue && y < H) cue.style.transform = `translateY(${(rm ? 26 : ((now / 1800) % 1) * 51).toFixed(1)}px)`;

      secs.forEach((s, k) => {
        const pr = P[k]; let show = pr.rt < H * 0.7 && pr.rb > H * 0.3;
        if (k === 0) show = ik > 0.2 && pr.rb > H * 0.5;
        if (on.get(s) !== show) { on.set(s, show); s.querySelectorAll<HTMLElement>("[data-rv]").forEach((n) => setRv(n, show)); }
      });
      const p2 = P[2].p;
      ph.forEach((n) => {
        const k = +n.dataset.ph!, show = !!on.get(secs[2]) && p2 > (k === 1 ? 0.26 : 0.46);
        if (n.dataset.on !== String(show)) { n.dataset.on = String(show); if (rm) n.style.transition = "none"; n.style.opacity = show ? "1" : "0"; n.style.transform = show ? "none" : "translateY(16px)"; }
      });
      let c = -1; P.forEach((pr, k) => { if (k >= 1 && pr.rt <= H * 0.5 && pr.rb > H * 0.5) c = Math.min(k, 5) - 1; }); if (P[6].rt <= H * 0.5) c = 4;
      if (c !== cur) {
        cur = c;
        rail.forEach((r, k) => {
          const act = k === c; r.style.color = act ? "#ECE6DA" : "#8A8278";
          if (act) r.setAttribute("aria-current", "step"); else r.removeAttribute("aria-current");
          const l = r.querySelector<HTMLElement>("[data-raill]"), tk = r.querySelector<HTMLElement>("[data-railt]");
          if (l) { l.style.opacity = act ? "1" : "0"; l.style.transform = act ? "none" : "translateX(6px)"; }
          if (tk) { tk.style.width = act ? "28px" : "14px"; tk.style.background = act ? "#ECE6DA" : "#8A8278"; }
        });
        mini.forEach((n, k) => (n.style.opacity = k === c ? "1" : "0"));
      }
      const show = (lensRef.current && m) || (ln.inside && fine && !rm && !m && now - ln.last < 1400);
      if (m && lensRef.current) { ln.tx = W * 0.5; ln.ty = H * 0.24; }
      ln.x += (ln.tx - ln.x) * (rm ? 1 : 0.16); ln.y += (ln.ty - ln.y) * (rm ? 1 : 0.16);
      lens.style.opacity = show ? "1" : "0";
      lens.style.transform = `translate3d(${(ln.x - 110).toFixed(1)}px,${(ln.y - 110).toFixed(1)}px,0)`;
      lens.style.backgroundPosition = `${(-ln.x * 0.35).toFixed(1)}px ${(-ln.y * 0.35).toFixed(1)}px`;
      const r = hem.getBoundingClientRect();
      railnav.style.opacity = r.top < H * 0.55 ? "0" : "1";
      if (r.top < H + 60 && r.bottom > -60) {
        const p = cl((H - r.top) / (r.height + H * 0.3)), e = p - 1, s = 1.5, bk = 1 + (s + 1) * e * e * e + s * e * e, k = rm ? 1 : bk;
        hemG.style.transform = `translate3d(0,${((1 - k) * 18).toFixed(2)}%,0) skewX(${((1 - k) * 0.8).toFixed(3)}deg)`;
      }
    });
    (el as HTMLElement & { _layout?: () => void })._layout = layout;
    return () => { stop(); clearTimeout(lt); removeEventListener("pointermove", onPM); removeEventListener("resize", layout); sec4?.removeEventListener("pointermove", onLens); sec4?.removeEventListener("pointerleave", onLeave); };
  }, []);

  // sticky offsets depend on the breakpoint, so re-measure the section anchors when it changes
  useEffect(() => { const t = setTimeout(() => (root.current as (HTMLElement & { _layout?: () => void }) | null)?._layout?.(), 50); return () => clearTimeout(t); }, [mob, mid]);

  const goTo = (i: number) => {
    const el = root.current!;
    const secs = [...el.querySelectorAll<HTMLElement>("[data-sec]")], H = innerHeight;
    const r = secs[i].getBoundingClientRect(), top = r.top + scrollY;
    const y = i === secs.length - 1 ? top + r.height - H : top + (r.height - H) / 2;
    window.scrollTo({ top: y + 2, behavior: reduced() ? "auto" : "smooth" });
  };
  const tTop = mob ? "50svh" : "28svh";

  return (
    <div ref={root} data-hdr-blend="" className="relative bg-bone">
      <nav data-k="railnav" aria-label="Story chapters" className={`fixed right-[clamp(12px,1.6vw,24px)] top-1/2 z-200 -translate-y-1/2 flex-col gap-0.5 mix-blend-difference ${mob ? "hidden" : "flex"}`}>
        {CH.map((k, i) => (
          <button key={k} data-rail={i} onClick={() => goTo(i + 1)} aria-label={`Chapter 0${i + 1}, ${k}`} className="label relative flex min-h-11 cursor-pointer items-center justify-end gap-2.5 self-end border-0 bg-transparent p-0 text-[11px] text-[#8A8278] transition-colors duration-400">
            <span data-raill="" className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -mt-[7px] whitespace-nowrap opacity-0 transition-[opacity,transform] duration-400" style={{ transform: "translateX(6px)" }}>{k}</span>
            <span>0{i + 1}</span>
            <span data-railt="" className="block h-px w-3.5 bg-[#8A8278] transition-[width,background] duration-400" />
          </button>
        ))}
      </nav>
      <div aria-hidden className={`label fixed left-gut top-[62px] z-200 text-[11px] text-[#9A9389] mix-blend-difference ${mob ? "block" : "hidden"}`}>
        <span className="grid">{CH.map((k, i) => <span key={k} data-mini={i} className="col-start-1 row-start-1 opacity-0 transition-opacity duration-400">0{i + 1} / 05 — {k}</span>)}</span>
      </div>

      <main aria-label="The Beyond Angels story" className="relative">
        {/* the shirt: one fixed stage, moved by the camera as chapters scroll past */}
        <div aria-hidden className="sticky top-0 -mb-[100svh] z-0 h-svh overflow-hidden bg-bone">
          <div data-k="cam" className="absolute left-0 top-0 h-[1198px] w-[760px] origin-top-left will-change-transform">
            <Image unoptimized src="/story/story-shadow.png" alt="" width={880} height={1318} className="absolute -left-[60px] -top-[42px] h-[1318px] w-[880px] max-w-none" />
            <Image unoptimized priority src="/story/story-shirt.png" alt="" width={760} height={1198} className="absolute inset-0 size-full max-w-none" />
            <Image unoptimized data-k="blurL" src="/story/story-shirt-blur.png" alt="" width={760} height={1198} className="absolute inset-0 size-full max-w-none opacity-0"
              style={{ maskImage: "radial-gradient(circle 120px at 520px 490px,rgba(0,0,0,0) 45%,#000 100%)", WebkitMaskImage: "radial-gradient(circle 120px at 520px 490px,rgba(0,0,0,0) 45%,#000 100%)" }} />
            <div className="absolute inset-0 overflow-hidden" style={{ maskImage: "url(/story/mask-front.png)", WebkitMaskImage: "url(/story/mask-front.png)", maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" }}>
              <div data-k="spot" className="absolute left-0 top-0 size-[560px] rounded-full opacity-0 will-change-transform" style={{ background: "radial-gradient(circle,rgba(255,240,218,.16) 0%,rgba(255,240,218,.05) 34%,rgba(255,240,218,0) 66%)" }} />
              <div data-k="shade" className="absolute inset-0 opacity-0" style={{ background: "linear-gradient(90deg,rgba(255,242,224,.14) 0%,rgba(255,242,224,0) 42%,rgba(0,0,0,0) 56%,rgba(0,0,0,.5) 100%)" }} />
              <div data-k="sweep" className="absolute inset-0 bg-no-repeat opacity-0" style={{ background: "linear-gradient(104deg,rgba(255,248,236,0) 40%,rgba(255,248,236,.11) 50%,rgba(255,248,236,0) 60%) 0 0 / 300% 100% no-repeat" }} />
            </div>
            <svg viewBox="0 0 760 1198" width="760" height="1198" className="absolute inset-0 overflow-visible">
              {SEGS.map((d, i) => <path key={i} data-seg={i} d={d} fill="none" stroke="#E4D9C2" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeDasharray="4000 4000" strokeDashoffset="4000" />)}
            </svg>
          </div>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 95% at 50% 44%,rgba(221,213,198,0) 52%,rgba(201,192,176,.6) 100%)" }} />
          <div data-k="head" className="absolute left-0 top-0 size-0 opacity-0 will-change-transform">
            <span className="absolute -left-[3.5px] -top-[3.5px] size-[7px] rounded-full bg-bone shadow-[0_0_0_1px_rgba(15,14,13,.35)]" />
            <span className="absolute -left-3 -top-3 size-6 rounded-full border border-bone/60" />
          </div>
          <div data-k="lens" className="absolute left-0 top-0 size-[220px] overflow-hidden rounded-full border border-bone/35 opacity-0 shadow-[0_24px_50px_rgba(0,0,0,.6),inset_0_0_40px_rgba(0,0,0,.7)] transition-opacity duration-350 will-change-transform" style={{ backgroundImage: "url(/story/story-knit.png)", backgroundSize: "72px 60px" }}>
            <span className="label absolute inset-x-0 bottom-[22px] text-center text-[10px] text-ash">Knit, up close — illustrative</span>
          </div>
          <div data-k="veil" className="absolute inset-0 bg-bone" />
        </div>

        {/* 00 — entry */}
        <section data-sec="0" className="relative h-svh min-h-[560px]" aria-label="Beyond Angels — The story">
          <span data-rv="" className="label absolute left-gut top-[clamp(84px,12vh,120px)] text-[#9A9389] mix-blend-difference" style={rise(12, ".9s", "0s", ".8s")}>Beyond Angels / The story</span>
          <div className="absolute inset-x-gut bottom-[clamp(28px,7vh,72px)] flex flex-wrap items-end justify-between gap-x-10 gap-y-6 text-bone mix-blend-difference">
            <div className="flex min-w-0 flex-col gap-[clamp(14px,2vh,22px)]">
              <h1 className="display m-0 text-[clamp(64px,11vw,200px)] leading-[.84]">
                <Line delay=".1s" dur="1.1s">Not made</Line>
                <Line delay=".22s" dur="1.1s">to fit in.</Line>
              </h1>
              <p data-rv="" className="serif m-0 max-w-[440px] text-[clamp(20px,1.8vw,28px)] italic leading-[1.2] text-pretty" style={rise(14, "1s", ".5s", ".8s")}>A story about the space between good intentions and bad influence.</p>
            </div>
            <div data-rv="" className="label flex items-center gap-3.5 text-[11px] text-[#9A9389]" style={rise(10, "1s", "1.1s", ".8s")}>
              <span className="relative block h-14 w-px bg-bone/20"><span data-k="cue" className="absolute -left-0.5 top-0 size-[5px] rounded-full bg-bone" /></span>
              <span>Scroll — down the shirt</span>
            </div>
          </div>
        </section>

        {/* 01 — the beginning */}
        <section data-sec="1" aria-labelledby="ch1" className="relative h-[170svh] px-gut">
          <div className={`${BLEND} sticky flex max-w-[560px] flex-col gap-5`} style={{ top: tTop }}>
            <Eyebrow>01 / The beginning</Eyebrow>
            <h2 id="ch1" className={H2}><Line>Everything starts</Line><Line delay=".18s">with a choice.</Line></h2>
            <div data-rv="" className="flex max-w-[440px] flex-col gap-2.5" style={rise(16, ".9s", ".35s")}>
              <Draft>Draft — founder copy needed</Draft>
              <p className="m-0 text-[17px] leading-[1.55] text-ash text-pretty">[Origin — why Beyond Angels exists, in two or three sentences, in the founder’s own words. Nothing here has been invented; replace this with the real account.]</p>
            </div>
          </div>
        </section>

        {/* 02 — the contrast */}
        <section data-sec="2" aria-labelledby="ch2" className="relative h-[180svh] px-gut">
          <div className="sticky top-[clamp(84px,13svh,130px)] flex flex-col justify-between gap-6" style={{ height: mob ? "74svh" : "76svh" }}>
            <div className={`${BLEND} flex flex-col gap-4 ${mob ? "items-start text-left" : "items-center text-center"}`}>
              <Eyebrow>02 / The contrast</Eyebrow>
              <h2 id="ch2" className={`m-0 flex flex-col ${mob ? "items-start" : "items-center"}`}>
                <Line className="display text-[clamp(52px,7.6vw,140px)] leading-[.86]">Good intentions.</Line>
                <span className="block overflow-hidden pb-[.08em]"><span data-rv="" className="serif block text-[clamp(50px,7vw,128px)] italic leading-none tracking-[-.02em]" style={{ opacity: 0, transform: "translateY(105%)", transition: `transform 1.1s ${EASE} .3s, opacity .4s .3s` }}>Bad influence.</span></span>
              </h2>
            </div>
            <div className={`grid items-end gap-x-10 gap-y-5 ${mob ? "grid-cols-1" : "grid-cols-2"}`}>
              <div data-ph="1" className={`${BLEND} flex max-w-[340px] flex-col gap-2`} style={rise(16, ".9s", "0s", ".7s")}>
                <span className="label text-[11px] text-stone">Saint</span>
                <span className="text-[clamp(24px,2.2vw,34px)] font-bold uppercase leading-none font-stretch-[72%]">Looks well-behaved from across the room.</span>
              </div>
              <div data-ph="2" className={`${BLEND} flex max-w-[340px] flex-col gap-2 ${mob ? "justify-self-start text-left" : "justify-self-end text-right"}`} style={rise(16, ".9s", "0s", ".7s")}>
                <span className="label text-[11px] text-stone">Sinner</span>
                <span className="serif text-[clamp(28px,2.6vw,40px)] italic leading-none">Up close, it isn’t.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — the mark */}
        <section data-sec="3" aria-labelledby="ch3" className="relative h-[170svh] px-gut">
          <div className={`${BLEND} sticky flex max-w-[520px] flex-col gap-5`} style={{ top: tTop }}>
            <Eyebrow>03 / The mark</Eyebrow>
            <h2 id="ch3" className={H2}><Line>The details</Line><Line delay=".18s">say enough.</Line></h2>
            <div data-rv="" className="flex max-w-[420px] flex-col gap-3" style={rise(16, ".9s", ".35s")}>
              <p className="m-0 text-[17px] leading-[1.55] text-ash text-pretty">On Bad Influence, the mark is embroidered on the left chest — small enough to miss from across the room.</p>
              <Draft>Draft — meaning of the mark needed</Draft>
              <p className="m-0 text-[15px] leading-[1.55] text-stone text-pretty">[What the mark stands for — only the meaning the brand has actually established.]</p>
            </div>
          </div>
        </section>

        {/* 04 — the feel (hover the shirt for the knit lens) */}
        <section data-sec="4" aria-labelledby="ch4" className="relative h-[170svh] px-gut">
          <div className={`${BLEND} sticky flex max-w-[460px] flex-col gap-5`} style={{ top: mob ? "50svh" : "clamp(84px,18svh,28svh)", marginLeft: mob ? 0 : "auto", marginRight: mob ? 0 : "clamp(160px,14vw,220px)" }}>
            <Eyebrow>04 / The feel</Eyebrow>
            <h2 id="ch4" className="display m-0 text-[clamp(46px,min(6.2vw,10svh),112px)] leading-[.84]"><Line>Feel it before</Line><Line delay=".18s">you explain it.</Line></h2>
            <dl data-rv="" className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-t border-bone/20" style={rise(16, ".9s", ".35s")}>
              {[["Piece", "Bad Influence — T-shirt"], ["Colour", "Black"], ["Mark", "Embroidered, left chest"], ["Sizes", "S — XXL"], ["Fabric weight", `${GSM} GSM`], ["Fit", "Oversized — size down for a regular fit"]].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="label border-b border-bone/20 py-3 text-[11px] text-stone">{k}</dt>
                  <dd className="m-0 border-b border-bone/20 py-3 text-[15px] text-bone">{v}</dd>
                </div>
              ))}
            </dl>
            {mob && <button onClick={() => setLensOn((v) => !v)} aria-pressed={lensOn} className="label h-11 cursor-pointer self-start border border-bone/45 bg-transparent px-4 text-bone">{lensOn ? "Hide the knit" : "See the knit up close"}</button>}
          </div>
        </section>

        {/* 05 — the hem */}
        <section data-sec="5" aria-labelledby="ch5" className="relative h-[160svh] px-gut">
          <div className={`${BLEND} sticky flex max-w-[620px] flex-col gap-5`} style={{ top: mob ? "48svh" : "16svh" }}>
            <Eyebrow>05 / The hem</Eyebrow>
            <h2 id="ch5" className={H2}><Line>Wear your side</Line><Line delay=".18s">of the story.</Line></h2>
            <p data-rv="" className="serif m-0 max-w-[420px] text-[clamp(20px,1.7vw,26px)] italic leading-[1.2]" style={rise(14, ".9s", ".35s")}>It ends where every piece does — at the hem.</p>
          </div>
        </section>

        {/* 06 — the piece */}
        <section data-sec="6" aria-labelledby="ch6" className="relative h-[150svh]">
          <div className="sticky top-0 flex h-svh flex-col justify-end px-gut pb-[clamp(28px,7vh,64px)]">
            <div className={`${BLEND} flex flex-col gap-4`} style={{ maxWidth: mob ? "100%" : "46%" }}>
              <Eyebrow>Black · Embroidered chest mark</Eyebrow>
              <h2 id="ch6" className="display m-0 text-[clamp(56px,8vw,148px)] leading-[.82]"><Line>Bad</Line><Line delay=".16s">Influence</Line></h2>
              <span data-rv="" className="text-[22px] font-medium" style={rise(12, ".8s", ".3s", ".6s")}>{price}</span>
              <div data-rv="" className="flex flex-wrap gap-2.5" style={rise(14, ".8s", ".4s", ".6s")}>
                <Link href="/#pieces" className="label inline-flex h-14 items-center bg-bone px-7 text-ink hover:opacity-80">Explore the pieces</Link>
                <Link href="/#file" className="label inline-flex h-14 items-center border border-bone/50 px-6 hover:border-bone hover:opacity-100">Back to the drop</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* the hem: the shirt's hem becomes the footer's edge */}
      <div data-k="hem" aria-hidden className="pointer-events-none relative z-2 -mb-px h-[clamp(150px,20vw,320px)] overflow-hidden" style={{ background: "linear-gradient(180deg,#ECE6DA 0%,#ECE6DA 60%,#0F0E0D 60%)" }}>
        <div data-k="hemG" className="absolute -inset-x-[2%] top-0 h-[80%] origin-[50%_0] will-change-transform [filter:drop-shadow(0_12px_14px_rgba(0,0,0,.9))]">
          <span className="absolute left-[84.5%] top-[88%] h-6 w-2.5 bg-[#B9AC93] shadow-[inset_0_-2px_0_rgba(15,14,13,.18)]" />
          <div className="absolute inset-0" style={{
            backgroundColor: "#151413",
            backgroundImage: "url(/story/hem-knit.png),radial-gradient(120% 70% at 50% 100%,rgba(236,230,218,.05),rgba(236,230,218,0) 70%),url(/story/hem-drape.png)",
            backgroundSize: "36px 36px,100% 100%,100% 100%", backgroundRepeat: "repeat,no-repeat,no-repeat",
            maskImage: "linear-gradient(180deg,rgba(0,0,0,0) 0%,#000 40%),url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201000%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%2C0%20H1000%20V86%20C960%2C88.5%20900%2C92%20820%2C94.2%20C700%2C97%20600%2C96.4%20500%2C97.2%20C400%2C97.8%20300%2C96.6%20190%2C94.4%20C110%2C92.6%2050%2C89%200%2C86%20Z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")",
            maskSize: "100% 100%,100% 100%", maskRepeat: "no-repeat", maskComposite: "intersect", WebkitMaskComposite: "source-in",
          }} />
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <path d="M0,75.0 C50,78.0 110,81.6 190,83.4 C300,85.6 400,86.8 500,86.2 C600,85.4 700,86.0 820,83.2 C900,81.0 960,77.5 1000,75.0 L1000,86 C960,88.5 900,92 820,94.2 C700,97 600,96.4 500,97.2 C400,97.8 300,96.6 190,94.4 C110,92.6 50,89 0,86 Z" fill="rgba(0,0,0,.22)" />
            <path d="M0,75.4 C50,78.4 110,82.0 190,83.8 C300,86.0 400,87.2 500,86.6 C600,85.8 700,86.4 820,83.6 C900,81.4 960,77.9 1000,75.4" fill="none" stroke="rgba(0,0,0,.6)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            <path d="M0,77.6 C50,80.6 110,84.2 190,86.0 C300,88.2 400,89.4 500,88.8 C600,88.0 700,88.6 820,85.8 C900,83.6 960,80.1 1000,77.6" fill="none" stroke="rgba(214,207,195,.42)" strokeWidth="1.1" strokeDasharray="3.4 2.3" vectorEffect="non-scaling-stroke" />
            <path d="M0,79.8 C50,82.8 110,86.4 190,88.2 C300,90.4 400,91.6 500,91.0 C600,90.2 700,90.8 820,88.0 C900,85.8 960,82.3 1000,79.8" fill="none" stroke="rgba(214,207,195,.36)" strokeWidth="1.1" strokeDasharray="3.4 2.3" strokeDashoffset="1.4" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>

      <footer className="relative flex flex-col gap-[clamp(48px,8vh,90px)] bg-ink pb-6 pt-[clamp(48px,8vh,90px)] text-bone">
        <div className="label grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-7 px-gut">
          <div className="flex flex-col items-start gap-0.5"><span className="pb-2 text-stone">Shop</span><Link href="/#pieces" className="py-2">The pieces</Link><Link href="/#file" className="py-2">The Drop File</Link></div>
          <div className="flex flex-col items-start gap-0.5"><span className="pb-2 text-stone">Choose</span><Link href="/#making" className="py-2">How it’s made</Link><Link href="/our-story" aria-current="page" className="py-2">Our story</Link></div>
          <div className="flex flex-col items-start gap-0.5"><span className="pb-2 text-stone">Help</span><Link href="/#list" className="py-2">Shipping</Link><Link href="/#list" className="py-2">Returns</Link><Link href="/#list" className="py-2">Care</Link></div>
        </div>
        <div className="px-gut">
          <div className="display relative overflow-hidden pt-[.3em] text-[clamp(56px,15.2vw,300px)]">
            <div className="relative whitespace-nowrap leading-[.78]">Beyond Angels<Halo tone="maroon" className="absolute -top-[.36em] right-[1%] z-4 w-[.7em] -rotate-12" /></div>
          </div>
          <div className="label mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 text-[11px] text-stone">
            <span>© 2026 Beyond Angels</span><span>Prototype — stand-in imagery · story copy in draft</span>
            <button onClick={() => scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" })} className="cursor-pointer border-0 bg-transparent py-3 text-inherit uppercase">Back to top ↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
