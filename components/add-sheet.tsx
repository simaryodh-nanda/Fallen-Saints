"use client";

/* The fly/sheet choreography is an imperative, frame-driven engine (refs + performance.now in callbacks), mirroring the
   reference. React-compiler purity rules don't apply to it, so they are disabled for this file only. */
/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/purity, react-hooks/exhaustive-deps */

import { useCallback, useEffect, useRef, useState } from "react";
import { PIECES, inr, type Size } from "@/lib/pieces";
import { cl, EASE, frame, io, oc, reduced } from "@/lib/motion";
import { useBag, type FlyStart } from "./bag";

type Fly = { id: string; s: Size; t0: number; x: number; y: number; w: number; h: number; vx: number; vy: number; vw: number; vh: number; ar: number; landed: boolean; committed: boolean; tL?: number; kbd: boolean };


/**
 * Add-to-bag choreography (reference: add / flyFrame / land / flyEnd / dismissSheet / flyToBag):
 * ring burst → garment springs up to centre, then into a slot on a rising sheet → stamp + bump →
 * after 5.2s (or "keep shopping") the garment arcs into the bag button and the sheet drops away.
 */
export function AddSheet() {
  const { registerFly, commit, count, total, setOpen } = useBag();
  const [sheet, setSheet] = useState<{ id: string; s: Size } | null>(null);
  const [, force] = useState(0);
  const el = useRef<Record<string, HTMLElement | null>>({});
  const F = useRef<Fly | null>(null);
  const D = useRef<{ t0: number; mode: "keep" | "bag" } | null>(null);
  const flying = useRef(false);
  const hold = useRef(false);
  const autoT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocus = useRef<Element | null>(null);
  const fr = useRef(1);
  const q = (k: string) => el.current[k] ?? null;
  const ref = (k: string) => (n: HTMLElement | null) => { el.current[k] = n; };
  const piece = PIECES.find((p) => p.id === sheet?.id) ?? PIECES[0];

  const bagPulse = (tgt: HTMLElement | null) => {
    if (!tgt) return;
    tgt.animate([{ transform: "scale(1)" }, { transform: "scale(1.22,.8)" }, { transform: "scale(.94,1.08)" }, { transform: "scale(1)" }], { duration: 520, easing: EASE });
    const n = document.querySelector<HTMLElement>('[data-k="bagN"]');
    n?.animate([{ background: "#CFE34B", color: "#0F0E0D" }, { background: "transparent", color: "inherit" }], { duration: 900, easing: "ease-out" });
  };

  const flyToBag = () => {
    const si = q("slotImg") as HTMLImageElement | null, tgt = document.querySelector<HTMLElement>('[data-k="bag"]');
    if (!si || !tgt) return;
    const r = si.getBoundingClientRect(), b = tgt.getBoundingClientRect();
    if (!r.width) return;
    const c = document.createElement("img");
    c.src = si.currentSrc || si.src; c.alt = ""; c.setAttribute("data-fs-clone", "");
    Object.assign(c.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, objectFit: "contain", padding: getComputedStyle(si).padding, boxSizing: "border-box", zIndex: "520", pointerEvents: "none", willChange: "transform", filter: "drop-shadow(0 16px 18px rgba(0,0,0,.3))" });
    document.body.appendChild(c);
    const dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height / 2 - (r.top + r.height / 2), s = Math.max(0.05, 30 / r.height);
    const a = c.animate([
      { transform: "translate(0,0) scale(1) rotate(0)" },
      { transform: "translate(0,-26px) scale(1.04) rotate(-3deg)", offset: 0.18 },
      { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 90}px) scale(${s * 3.2}) rotate(9deg)`, offset: 0.62 },
      { transform: `translate(${dx}px,${dy}px) scale(${s}) rotate(14deg)`, opacity: 0.2 },
    ], { duration: 820, delay: 120, easing: "cubic-bezier(.55,0,.25,1)", fill: "forwards" });
    a.onfinish = () => { c.remove(); bagPulse(tgt); };
    setTimeout(() => c.isConnected && c.remove(), 1400);
  };

  const dismiss = useCallback((mode: "keep" | "bag") => {
    if (!sheet || F.current || D.current) return;
    if (autoT.current) clearTimeout(autoT.current);
    if (mode === "keep" && !reduced()) flyToBag();
    const d = (D.current = { t0: performance.now(), mode });
    if (reduced()) dismissFrame(performance.now() + 1000);
    else setTimeout(() => { if (D.current === d) dismissFrame(d.t0 + 1000); }, 800);
    if (mode === "bag") { lastFocus.current = null; setOpen(true); }
     
  }, [sheet, setOpen]);

  function dismissFrame(now: number) {
    const d = D.current;
    if (!d) return;
    const t = now - d.t0, k = io(cl(t / 440));
    const sh = q("sheet"), dim = q("dim");
    if (sh) sh.style.transform = `translateY(${(k * 105).toFixed(2)}%)`;
    if (dim) dim.style.opacity = (1 - k).toFixed(3);
    if (k >= 1) {
      D.current = null;
      if (dim) dim.style.pointerEvents = "none";
      setSheet(null);
      if (d.mode !== "bag") (lastFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    }
  }

  const armAuto = () => {
    if (autoT.current) clearTimeout(autoT.current);
    autoT.current = setTimeout(() => {
      if (hold.current) return armAuto();
      const sh = q("sheet");
      if (sh?.contains(document.activeElement)) return armAuto();
      dismissRef.current("keep");
    }, 5200);
  };
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; }, [dismiss]);

  const land = (now: number) => {
    const f = F.current;
    if (!f || f.landed) return;
    f.landed = true; f.tL = now;
    try { if (navigator.vibrate && !matchMedia("(pointer: fine)").matches) navigator.vibrate(12); } catch {}
    f.committed = true; commit(f.id, f.s);
    const stp = q("stamp"), inf = q("info");
    if (stp) { stp.style.opacity = "1"; stp.animate([{ transform: "scale(1.7) rotate(-14deg)", opacity: 0 }, { transform: "scale(1) rotate(-6deg)", opacity: 1 }], { duration: 380, delay: 120, easing: EASE, fill: "backwards" }); }
    if (inf) { inf.style.opacity = "1"; inf.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: 60, easing: EASE, fill: "backwards" }); }
  };

  const flyEnd = () => {
    const f = F.current;
    F.current = null;
    if (failT.current) clearTimeout(failT.current);
    const fly = q("fly"), si = q("slotImg"), sh = q("sheet"), dim = q("dim");
    if (fly) { fly.style.display = "none"; fly.style.filter = "none"; }
    if (si) si.style.opacity = "1";
    if (sh) { sh.style.transform = "translateY(0)"; sh.style.borderRadius = "0"; }
    if (dim) { dim.style.opacity = "1"; dim.style.pointerEvents = "auto"; }
    if (f && !f.committed) { f.committed = true; commit(f.id, f.s); }
    [q("stamp"), q("info")].forEach((e) => e && (e.style.opacity = "1"));
    flying.current = false;
    force((n) => n + 1);
    armAuto();
    if (f?.kbd) q("sheet")?.querySelector<HTMLElement>("[data-first]")?.focus({ preventScroll: true });
  };

  const start = useCallback((a: FlyStart) => {
    if (F.current || D.current || flying.current) return;
    const rm = reduced();
    lastFocus.current = document.activeElement;
    if (autoT.current) clearTimeout(autoT.current);
    const img = a.img;
    if (rm || !img || !img.getBoundingClientRect().width) {
      commit(a.id, a.size);
      setSheet({ id: a.id, s: a.size });
      requestAnimationFrame(() => {
        const sh = q("sheet"), dim = q("dim");
        if (sh) { sh.style.transform = "translateY(0)"; sh.style.borderRadius = "0"; sh.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); }
        if (dim) { dim.style.opacity = "1"; dim.style.pointerEvents = "auto"; }
        [q("slotImg"), q("stamp"), q("info")].forEach((e) => e && (e.style.opacity = "1"));
        armAuto();
        sh?.querySelector<HTMLElement>("[data-first]")?.focus({ preventScroll: true });
      });
      return;
    }
    if (a.btn) {
      const r = a.btn.getBoundingClientRect(), b = q("burst");
      if (b) {
        Object.assign(b.style, { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 2}px` });
        b.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(3.4)", opacity: 0 }], { duration: 560, easing: EASE });
      }
    }
    const r = img.getBoundingClientRect(), now = performance.now();
    F.current = { id: a.id, s: a.size, t0: now, x: r.left, y: r.top, w: r.width, h: r.height, vx: 0, vy: 0, vw: 0, vh: 0, ar: r.width / Math.max(1, r.height), landed: false, committed: false, kbd: a.kbd };
    const fly = q("fly"), fi = q("flyImg") as HTMLImageElement | null, sn = q("sheen");
    const cs = getComputedStyle(img), src = img.currentSrc || img.src;
    if (fly && fi) {
      fi.src = src; fi.style.objectFit = cs.objectFit === "cover" ? "cover" : "contain"; fi.style.objectPosition = cs.objectPosition; fly.style.padding = cs.padding;
      Object.assign(fly.style, { display: "block", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transform: "none", opacity: "1" });
      if (sn) { sn.style.inset = cs.padding; sn.style.webkitMaskImage = sn.style.maskImage = `url("${src}")`; sn.style.webkitMaskSize = sn.style.maskSize = "contain"; sn.style.webkitMaskRepeat = sn.style.maskRepeat = "no-repeat"; sn.style.webkitMaskPosition = sn.style.maskPosition = cs.objectPosition; }
    }
    const tk = q("flyTick"); if (tk) { tk.style.opacity = "0"; tk.style.transform = "scale(.4)"; }
    [q("slotImg"), q("stamp"), q("info")].forEach((e) => e && (e.style.opacity = "0"));
    flying.current = true;
    setSheet({ id: a.id, s: a.size });
    if (failT.current) clearTimeout(failT.current);
    failT.current = setTimeout(() => { if (F.current) { if (!F.current.landed) land(performance.now()); flyEnd(); } }, 2400);
     
  }, [commit]);

  useEffect(() => { registerFly(start); return () => registerFly(null); }, [registerFly, start]);

  // Physics (reference: flyFrame).
  useEffect(() => frame((f, now) => {
    fr.current = f;
    if (D.current && reduced()) return;
    const Fx = F.current;
    if (!Fx) return;
    const W = innerWidth, H = innerHeight, t = now - Fx.t0, mob = W < 760;
    const sh = q("sheet"), slot = q("slot"), fly = q("fly"), dim = q("dim");
    if (!sh || !slot || !fly) { land(now); flyEnd(); return; }
    const rise = oc(cl((t - 220) / 620));
    sh.style.transform = `translateY(${((1 - rise) * 105).toFixed(2)}%)`;
    const kr = (1 - rise) * (mob ? 80 : 220);
    sh.style.borderRadius = `50% 50% 0 0 / ${kr.toFixed(1)}px ${kr.toFixed(1)}px 0 0`;
    if (dim) { dim.style.opacity = cl(t / 380).toFixed(3); dim.style.pointerEvents = "auto"; }
    const sr = slot.getBoundingClientRect(), pd = 0.08;
    const rT = { left: sr.left + sr.width * pd, top: sr.top + sr.height * pd, width: sr.width * (1 - 2 * pd), height: sr.height * (1 - 2 * pd) };
    const chh = Math.min(H * (mob ? 0.4 : 0.5), (mob ? W * 0.7 : W * 0.32) / Math.max(0.4, Fx.ar)), cw = chh * Fx.ar;
    const rC = { left: W / 2 - cw / 2, top: Math.max(14, H * (mob ? 0.26 : 0.34) - chh / 2), width: cw, height: chh };
    const T = t < 520 ? rC : rT;
    if (!Fx.landed) {
      const nn = Math.min(4, Math.max(1, Math.ceil(f))), st = f / nn, kk = 0.13, cc = 0.48;
      for (let j = 0; j < nn; j++) {
        Fx.vx += ((T.left - Fx.x) * kk - Fx.vx * cc) * st; Fx.x += Fx.vx * st;
        Fx.vy += ((T.top - Fx.y) * kk - Fx.vy * cc) * st; Fx.y += Fx.vy * st;
        Fx.vw += ((T.width - Fx.w) * kk - Fx.vw * cc) * st; Fx.w += Fx.vw * st;
        Fx.vh += ((T.height - Fx.h) * kk - Fx.vh * cc) * st; Fx.h += Fx.vh * st;
      }
      if (t > 700 && (Math.abs(Fx.x - rT.left) + Math.abs(Fx.y - rT.top) + Math.abs(Fx.w - rT.width) < 5 || t > 1250)) land(now);
    }
    const d = cl(t / 520), s = cl((t - 520) / 420), lift = t < 520 ? oc(d) : 1 - io(s);
    let sx = 1, sy = 1, rx = 0, ry = 0, rz = 0;
    if (Fx.landed) {
      const l = cl((now - (Fx.tL ?? now)) / 460), bump = Math.sin(l * Math.PI * 2.2) * Math.exp(-3.2 * l), bp = Math.max(0, bump);
      Fx.x = rT.left; Fx.y = rT.top; Fx.w = rT.width; Fx.h = rT.height;
      sx = 1 + 0.05 * bp - 0.02 * Math.max(0, -bump); sy = 1 - 0.07 * bp + 0.03 * Math.max(0, -bump);
      slot.style.transform = `scale(${(1 - 0.04 * bp + 0.015 * Math.max(0, -bump)).toFixed(4)})`;
      if (l >= 1) { slot.style.transform = "none"; flyEnd(); return; }
    } else {
      const air = Math.sin(d * Math.PI) * (1 - s), drop = Math.sin(s * Math.PI);
      rx = 10 * air - 7 * drop + cl(Fx.vy * 0.12, -5, 5); ry = -14 * air + 5 * drop; rz = cl(Fx.vx * 0.25, -8, 8) * (1 - s * 0.6) - 3 * air;
      sx = sy = 1 + 0.05 * lift;
    }
    Object.assign(fly.style, {
      left: `${Fx.x.toFixed(1)}px`, top: `${Fx.y.toFixed(1)}px`, width: `${Fx.w.toFixed(1)}px`, height: `${Fx.h.toFixed(1)}px`,
      transform: `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`,
      filter: `drop-shadow(0 ${(8 + 46 * lift).toFixed(1)}px ${(12 + 34 * lift).toFixed(1)}px rgba(0,0,0,${(0.22 + 0.3 * lift).toFixed(3)}))`,
    });
    const sn = q("sheen"), sw = cl((t - 90) / 520);
    if (sn) { sn.style.opacity = sw > 0 && sw < 1 ? (Math.sin(sw * Math.PI) * 0.55).toFixed(3) : "0"; sn.style.backgroundPosition = `${(120 - sw * 240).toFixed(1)}% 0`; }
    const tk = q("flyTick");
    if (tk) { const a = cl((t - 60) / 220), b = Fx.landed ? cl((now - (Fx.tL ?? now)) / 200) : 0; tk.style.opacity = (a * (1 - b)).toFixed(3); tk.style.transform = `scale(${(0.4 + 0.6 * oc(a)).toFixed(3)})`; }
     
  }), []);

  // Block page scroll while the garment is in the air; Escape dismisses.
  useEffect(() => {
    const block = (e: Event) => { if (F.current && !F.current.landed) e.preventDefault(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && sheet && !F.current) dismissRef.current("keep"); };
    addEventListener("wheel", block, { passive: false }); addEventListener("touchmove", block, { passive: false }); addEventListener("keydown", key);
    return () => { removeEventListener("wheel", block); removeEventListener("touchmove", block); removeEventListener("keydown", key); };
  }, [sheet]);

  return (
    <>
      <div ref={ref("dim")} aria-hidden onClick={() => dismiss("keep")} className="pointer-events-none fixed inset-0 z-460 bg-ink/60 opacity-0 backdrop-blur-[5px]" />
      <div ref={ref("sheet")} role="dialog" aria-label="Added to your bag" style={{ transform: "translateY(105%)" }} aria-hidden={!sheet} onMouseEnter={() => (hold.current = true)} onMouseLeave={() => (hold.current = false)}
        className={`fixed inset-x-0 bottom-0 z-470 bg-bone px-[clamp(16px,4vw,64px)] pt-[clamp(22px,4.5vh,48px)] pb-[calc(clamp(22px,4vh,44px)+env(safe-area-inset-bottom))] text-ink shadow-[0_-30px_80px_-20px_rgba(0,0,0,.6)] ${sheet ? "visible" : "invisible"}`}>
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-[clamp(18px,3vw,56px)] tab:grid-cols-[auto_minmax(0,1fr)]">
          <div ref={ref("slot")} className="relative aspect-4/5 h-[24svh] origin-[50%_70%] justify-self-center shadow-[inset_0_2px_14px_rgba(15,14,13,.2)] tab:h-[min(36vh,330px)] tab:justify-self-start" style={{ background: piece.field }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={ref("slotImg") as React.Ref<HTMLImageElement>} src={piece.img.src} alt={piece.name} className="size-full object-contain p-[8%] opacity-0" />
            <span ref={ref("stamp")} className="label absolute -left-3 top-4 -rotate-6 whitespace-nowrap bg-acid px-2.5 py-[7px] text-[11px] text-ink opacity-0 shadow-[0_6px_14px_rgba(15,14,13,.2)]">In the bag ✓</span>
          </div>
          <div ref={ref("info")} role="status" aria-live="polite" className="flex min-w-0 flex-col gap-3.5 opacity-0">
            <span className="label text-mute">Added to your bag — {piece.code}</span>
            <span className="display text-[clamp(48px,6.4vw,104px)] leading-[.82]">{piece.name}</span>
            <span className="label text-[13px] tracking-[.06em]">Size {sheet?.s} · {piece.colour} · {inr(piece.price)}</span>
            <span className="label text-mute">Bag — {count} {count === 1 ? "piece" : "pieces"} · {inr(total)}</span>
            <div className="flex flex-col gap-2.5 pt-1.5 tab:flex-row">
              <button data-first="" onClick={() => dismiss("bag")} className="label h-14 cursor-pointer border-0 bg-acid px-7 text-ink active:scale-[.94]">View bag</button>
              <button onClick={() => dismiss("keep")} className="label h-14 cursor-pointer border border-ink bg-transparent px-7 text-ink active:scale-[.94]">Keep shopping</button>
            </div>
          </div>
        </div>
      </div>
      <div ref={ref("fly")} aria-hidden className="pointer-events-none fixed left-0 top-0 z-480 hidden size-0 origin-[50%_60%] will-change-[transform,left,top]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={ref("flyImg") as React.Ref<HTMLImageElement>} src={PIECES[0].img.src} alt="" className="size-full object-contain" />
        <div ref={ref("sheen")} className="absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0)_38%,rgba(255,255,255,.75)_50%,rgba(255,255,255,0)_62%)] bg-[length:300%_100%] opacity-0" />
        <span ref={ref("flyTick")} className="absolute right-[6%] top-[6%] flex size-10 items-center justify-center rounded-full bg-acid text-base text-ink opacity-0">✓</span>
      </div>
      <div ref={ref("burst")} aria-hidden className="pointer-events-none fixed left-0 top-0 z-490 size-11 rounded-full border-2 border-acid opacity-0" style={{ transform: "translate(-50%,-50%)" }} />
    </>
  );
}
