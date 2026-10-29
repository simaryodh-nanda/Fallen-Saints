"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { PIECES, inr, type Piece } from "@/lib/pieces";
import { cl, EASE, frame, goPiece, oc, reduced } from "@/lib/motion";
import { Halo, HALO_TONES } from "./halo";

const [A, B] = PIECES;
/** Where the seam rests: the middle, splitting the two shirts. */
const REST = 50;

/* Wings: grow out of the shirt's shoulders. Each slot is a zero-size anchor sitting just inside a shoulder (so the root is
   tucked behind the shirt); both wing images inside are offset so their own shoulder joint lands exactly on that anchor,
   and the anchor is also the flap pivot. Each slot holds both wings — angel and fallen — and the frame loop cross-fades
   them from the seam: black shirt fully showing → two angel wings; white shirt fully showing → two fallen wings;
   while the seam crosses the shirts → angel left, fallen right. */
// shoulder joint of each source image, as a fraction of its width (x) and of its width again (y, so one --ww var sizes all)
const ROOT = {
  angel: { x: 0.86, y: 0.37 * (922 / 1100), w: 1100, h: 922 },
  fallen: { x: 0.06, y: 0.45 * (933 / 1100), w: 1100, h: 933 },
};
function WingSlot({ side }: { side: "left" | "right" }) {
  const left = side === "left";
  const img = (kind: "angel" | "fallen", on: boolean) => {
    const r = ROOT[kind], flip = left ? kind === "fallen" : kind === "angel", rx = flip ? 1 - r.x : r.x;
    return (
      <Image data-wv={kind} src={`/wings/${kind}-wing.png`} width={r.w} height={r.h} alt="" sizes="(max-width: 760px) 70vh, 82vh" quality={80}
        className={`absolute h-auto max-w-none ${flip ? "-scale-x-100" : ""} ${kind === "angel" ? "drop-shadow-[0_24px_30px_rgba(15,14,13,.35)]" : "drop-shadow-[0_24px_30px_rgba(0,0,0,.55)]"}`}
        style={{ width: "var(--ww)", left: `calc(var(--ww) * ${-rx})`, top: `calc(var(--ww) * ${-r.y.toFixed(4)})`, opacity: on ? 1 : 0 }} />
    );
  };
  return (
    <div data-k="wing" data-side={side} aria-hidden
      className={`pointer-events-none absolute top-[26svh] size-0 origin-top-left will-change-transform [--ww:66svh] tab:top-[37vh] tab:[--ww:min(82vh,48vw)] ${left ? "left-[calc(50%-9.5svh)] tab:left-[calc(50%-12vh)]" : "left-[calc(50%+9.5svh)] tab:left-[calc(50%+12vh)]"}`}>
      {img("angel", left)}
      {img("fallen", !left)}
    </div>
  );
}

function Layer({ p, dark }: { p: Piece; dark: boolean }) {
  return (
    <>
      {/* angel wing (white, left) and fallen wing (black, right); same in both layers so the seam never cuts them */}
      <WingSlot side="left" />
      <WingSlot side="right" />
      <div className="display pointer-events-none absolute inset-x-0 top-[40%] flex -translate-y-1/2 flex-col items-center justify-center gap-x-[.16em] whitespace-nowrap text-[30vw] leading-[.82] tab:top-[47%] tab:flex-row tab:text-[15.4vw]">
        <span className="block overflow-hidden"><span data-k="wm" className="block">Beyond</span></span>
        <span className="block overflow-hidden"><span data-k="wm" className="block">Angels</span></span>
      </div>
      <div data-k="hg" className="pointer-events-none absolute left-1/2 top-[17svh] h-[48svh] origin-[50%_0] will-change-transform tab:top-[18vh] tab:h-[62vh]" style={{ transform: "translateX(-50%)" }}>
        <Image
          src={p.img.src} width={p.img.w} height={p.img.h} priority
          alt={dark ? "" : `${p.name} — ${p.colour} T-shirt on a hanger`}
          sizes="(max-width: 900px) 60vw, 34vw"
          className={`h-full w-auto max-w-none ${dark ? "drop-shadow-[0_30px_34px_rgba(0,0,0,.55)]" : "drop-shadow-[0_30px_28px_rgba(15,14,13,.22)]"}`}
        />
      </div>
      <button
        data-halo="" data-k="info" data-side={dark ? "right" : "left"} tabIndex={dark ? -1 : 0} onClick={() => goPiece(dark ? 1 : 0)}
        className={`absolute top-[19vh] z-10 hidden cursor-pointer flex-col gap-2 border-0 bg-transparent p-0 text-inherit mid:flex ${dark ? "right-[clamp(16px,4vw,56px)] items-end text-right" : "left-[clamp(16px,4vw,56px)] items-start text-left"}`}
      >
        <span className="label" style={{ color: p.mut }}>{p.no} — {p.colour} / {p.tech.split(" ")[0].toLowerCase()}</span>
        <span className="text-[32px] font-bold uppercase leading-[.9] font-stretch-[72%]">{p.name}</span>
        <span className="label border-b border-current pb-[3px]">{inr(p.price)} — View piece</span>
      </button>
      <div className="absolute inset-x-[clamp(16px,4vw,56px)] bottom-[clamp(20px,4.5vh,48px)] flex flex-wrap items-end justify-between gap-x-10 gap-y-[22px]">
        <div data-k="heroFade" className="flex max-w-[560px] flex-col gap-5">
          {dark ? (
            <div className="serif m-0 text-[clamp(34px,4.2vw,68px)] leading-[.98] tracking-[-.02em]">Good intentions.<br /><em>Bad influence.</em></div>
          ) : (
            <h1 className="serif m-0 text-[clamp(34px,4.2vw,68px)] leading-[.98] tracking-[-.02em]"><span className="sr-only">Beyond Angels — </span>Good intentions.<br /><em>Bad influence.</em></h1>
          )}
          <div className="flex flex-wrap items-center gap-x-[26px] gap-y-3">
            <a href="#pieces" tabIndex={dark ? -1 : 0} className={`label inline-flex h-[54px] items-center px-7 ${dark ? "bg-bone text-ink" : "bg-ink text-bone"}`}>Shop the drop</a>
            <a href="#file" tabIndex={dark ? -1 : 0} className="label border-b border-current py-1.5">Open the drop file</a>
          </div>
        </div>
        <div data-k="heroFade" className="label flex flex-col items-end gap-2 text-right">
          <span className="flex items-center gap-2">
            <span className={`size-[9px] rounded-full bg-acid ${dark ? "" : "shadow-[0_0_0_1px_#0F0E0D]"}`} />Drop 01 — available now
          </span>
          <span className={dark ? "text-stone" : "text-mute"}>4 pieces · 240 GSM · S–XXL</span>
        </div>
      </div>
    </>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const rm = reduced();
    const q = (k: string) => el.querySelector<HTMLElement>(`[data-k="${k}"]`);
    const layB = q("layB"), seam = q("seam"), tag = q("seamTag"), halo = q("halo");
    const hg = [...el.querySelectorAll<HTMLElement>('[data-k="hg"]')];
    const info = [...el.querySelectorAll<HTMLElement>('[data-k="info"]')];
    const wings = [...el.querySelectorAll<HTMLElement>('[data-k="wing"]')];
    const wingImgs = [...el.querySelectorAll<HTMLImageElement>("[data-wv]")].map(
      (n) => [n, (n.closest("[data-k=wing]") as HTMLElement).dataset.side, n.dataset.wv] as const,
    );
    const H = innerHeight;

    // Spring state: seam position, garment drop/swing, halo drop/tilt (same constants as the reference).
    const S = { x: 100, v: 0, t: 100 };
    const G = { y: -H * 1.1, vy: 0, a: 0, va: 0 };
    const L = { y: -H * 0.8, vy: 0, r: -34, vr: 0 };
    const t0 = performance.now();
    let intro = true;
    let drag = false;

    const skip = () => {
      intro = false;
      S.x = S.t = REST; S.v = 0; G.y = 0; G.vy = 0; L.y = 0; L.vy = 0; L.r = -9;
      el.querySelectorAll<HTMLElement>('[data-k="wm"],[data-k="heroFade"]').forEach((n) => n.getAnimations().forEach((a) => a.finish()));
    };

    if (rm) skip();
    else {
      el.querySelectorAll<HTMLElement>('[data-k="wm"]').forEach((n, i) =>
        n.animate([{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], { duration: 1100, delay: 260 + (i % 2) * 110, easing: EASE, fill: "backwards" }));
      el.querySelectorAll<HTMLElement>('[data-k="heroFade"]').forEach((n) =>
        n.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 120, easing: EASE, fill: "backwards" }));
    }

    const heroX = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return cl(((e.clientX - r.left) / r.width) * 100, 6, 94);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") { if (!intro) S.t = heroX(e); }
      else if (drag) S.t = heroX(e);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") { drag = true; if (intro) skip(); S.t = heroX(e); }
    };
    const onUp = () => { drag = false; };
    const onSkip = () => { if (intro) skip(); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    addEventListener("wheel", onSkip, { passive: true });
    addEventListener("touchstart", onSkip, { passive: true });
    addEventListener("keydown", onSkip);

    const stop = frame((f, now) => {
      const n = Math.ceil(f), fs = f / n, elapsed = now - t0;
      if (intro) { if (elapsed > 760) S.t = REST; if (elapsed > 2400) intro = false; }
      for (let i = 0; i < n; i++) {
        S.v += (S.t - S.x) * 0.03 * fs; S.v *= Math.pow(0.85, fs); S.x += S.v * fs;
        const tA = cl(-S.v * 1.5, -8, 8);
        G.va += (tA - G.a) * 0.06 * fs; G.va *= Math.pow(0.9, fs); G.a += G.va * fs;
        if (!intro || elapsed > 140) { G.vy += -G.y * 0.04 * fs; G.vy *= Math.pow(0.8, fs); G.y += G.vy * fs; }
        if (!intro || elapsed > 1150) { L.vy += -L.y * 0.05 * fs; L.vy *= Math.pow(0.78, fs); L.y += L.vy * fs; }
        L.vr += (-9 + G.a * 1.6 - L.r) * 0.05 * fs; L.vr *= Math.pow(0.86, fs); L.r += L.vr * fs;
      }
      if (el.getBoundingClientRect().bottom > 0) {
        hg.forEach((g) => (g.style.transform = `translateX(-50%) translateY(${G.y.toFixed(1)}px) rotate(${G.a.toFixed(2)}deg)`));
        // wings: unfold from the shoulders on load, then a slow flap (each side slightly out of phase),
        // a breathing lift, and a flutter that follows how fast the seam is moving
        const open = intro && !rm ? oc(cl((elapsed - 250) / 1500)) : 1;
        wings.forEach((w) => {
          const left = w.dataset.side === "left", ph = left ? 0 : 0.6;
          const beat = rm ? 0 : Math.sin(now * 0.0016 + ph);
          const th = -34 * (1 - open) + beat * 4.2 + cl(S.v * 0.9, -9, 9);
          const lift = rm ? 0 : -Math.max(0, beat) * 5;
          w.style.transform = `translateY(${lift.toFixed(1)}px) rotate(${((left ? 1 : -1) * th).toFixed(2)}deg) scale(${(0.6 + 0.4 * open).toFixed(3)},${((0.6 + 0.4 * open) * (1 + beat * 0.015)).toFixed(4)})`;
          w.style.opacity = open.toFixed(3);
        });
        // the whole product block (label, name, price) shows only while its own shirt is fully visible (seam has cleared it)
        const half = ((hg[0]?.offsetWidth ?? 0) / 2 / el.clientWidth) * 100 + 1.5;
        const showL = cl((S.x - (50 + half)) / 3 + 1); // black shirt fully on its own side
        const showR = cl((50 - half - S.x) / 3 + 1); //   white shirt fully on its own side
        info.forEach((n) => {
          const v = n.dataset.side === "left" ? showL : showR;
          n.style.opacity = v.toFixed(3);
          n.style.pointerEvents = v > 0.66 ? "auto" : "none";
        });
        // wings follow the same switch: angel+angel, fallen+fallen, or one of each while the seam crosses
        wingImgs.forEach(([img, slot, kind]) => {
          const angel = slot === "left" ? 1 - showR : showL;
          img.style.opacity = (kind === "angel" ? angel : 1 - angel).toFixed(3);
        });
        if (layB) layB.style.clipPath = `inset(0 0 0 ${S.x.toFixed(2)}%)`;
        if (seam) seam.style.left = `${S.x.toFixed(2)}%`;
        if (tag) { tag.style.left = `${S.x.toFixed(2)}%`; tag.style.opacity = String(cl((100 - S.x) / 8)); }
        if (halo) {
          halo.style.transform = `translate(-50%,${L.y.toFixed(1)}px) rotate(${L.r.toFixed(2)}deg)`;
          const dark = S.x < 44; // the halo sits on the centre line: only once the seam is clearly left of it is it over the dark side
          if (halo.dataset.dark !== String(dark)) { halo.dataset.dark = String(dark); Object.entries(dark ? HALO_TONES.maroon : HALO_TONES.gold).forEach(([k, v]) => halo.style.setProperty(k, v)); }
        }
      }
    });

    return () => {
      stop();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
      removeEventListener("wheel", onSkip);
      removeEventListener("touchstart", onSkip);
      removeEventListener("keydown", onSkip);
    };
  }, []);

  return (
    <section id="top" ref={root} data-tone="split" aria-label="Beyond Angels — Drop 01" className="relative h-svh min-h-[600px] touch-pan-y overflow-hidden bg-bone">
      <div className="absolute inset-0 bg-bone text-ink"><Layer p={A} dark={false} /></div>
      <div data-k="layB" aria-hidden className="absolute inset-0 bg-ink text-bone [clip-path:inset(0_0_0_100%)]"><Layer p={B} dark /></div>
      <div data-k="seam" className="pointer-events-none absolute inset-y-0 left-full -ml-px w-0.5 bg-acid" />
      <div data-k="seamTag" className="label pointer-events-none absolute left-full top-[62%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-acid px-3 py-2 text-[11px] text-ink">
        <span className="hidden tab:inline">Saint ← → Sinner</span><span className="tab:hidden">← Drag →</span>
      </div>
      {/* halo (broken, gold): its transform is driven from JS */}
      <div data-k="halo" className="pointer-events-none absolute left-1/2 top-[calc(17svh-30px)] w-[92px] tab:top-[calc(18vh-44px)] tab:w-[140px]" style={{ transform: "translate(-50%,-80vh)" }}>
        <Halo className="w-full" />
      </div>
    </section>
  );
}
