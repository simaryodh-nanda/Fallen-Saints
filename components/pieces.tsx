"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { PIECES, inr } from "@/lib/pieces";
import { cl, EASE, frame, goPiece, isFine, reduced } from "@/lib/motion";
import { AddBox } from "./add-box";

/** Drop 01 pieces: expanding rail on desktop (spring-dropped garments), 2-up grid on mobile. */
export function Pieces() {
  const sec = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sec.current!;
    const rm = reduced(), fine = isFine();
    const rgs = [...el.querySelectorAll<HTMLElement>("[data-rg]")];
    const segs = [...el.querySelectorAll<HTMLElement>("[data-seg]")];
    const cards = [...el.querySelectorAll<HTMLElement>("[data-rc]")];
    const RS = PIECES.map(() => ({ y: rm ? 0 : -innerHeight, vy: 0, a: 0, va: 0, ta: 0, ty: 0, hit: rm }));
    let railIn = 0;
    let railOn: number | null = null;

    const hover = (i: number, on: boolean, e?: Event) => {
      if (e && (e.type === "mouseenter" || e.type === "mouseleave") && !fine) return;
      const cur = e?.currentTarget as HTMLElement | undefined;
      const rel = (e as MouseEvent | FocusEvent | undefined)?.relatedTarget as Node | null | undefined;
      if (!on && rel && cur?.contains(rel)) return;
      if (on && railOn === i) return;
      railOn = on ? i : railOn === i ? null : railOn;
      RS.forEach((R, j) => {
        R.ty = railOn === j ? -22 : 0;
        if (j === i && on && !rm) R.va += 0.7;
        if (j === i && !on) R.ta = 0;
      });
      const any = railOn != null;
      cards.forEach((a) => {
        const j = +a.dataset.rc!, me = railOn === j;
        a.style.flexGrow = me ? "2" : "1";
        const x = a.querySelector<HTMLElement>("[data-rx]");
        if (x) x.style.gridTemplateRows = me ? "1fr" : "0fr";
        const g = a.querySelector<HTMLElement>("[data-rg]");
        if (g) g.style.opacity = any && !me ? ".5" : "1";
      });
    };
    const offs: (() => void)[] = [];
    cards.forEach((c) => {
      const i = +c.dataset.rc!;
      const inn = (e: Event) => hover(i, true, e), out = (e: Event) => hover(i, false, e);
      const mv = (e: MouseEvent) => {
        if (!fine || rm) return;
        const r = c.getBoundingClientRect();
        RS[i].ta = cl(-((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 7, -3.5, 3.5);
      };
      c.addEventListener("mouseenter", inn); c.addEventListener("mouseleave", out);
      c.addEventListener("focusin", inn); c.addEventListener("focusout", out); c.addEventListener("mousemove", mv);
      offs.push(() => {
        c.removeEventListener("mouseenter", inn); c.removeEventListener("mouseleave", out);
        c.removeEventListener("focusin", inn); c.removeEventListener("focusout", out); c.removeEventListener("mousemove", mv);
      });
    });

    const stop = frame((f, now) => {
      const H = innerHeight, r = el.getBoundingClientRect();
      if (r.top > H || r.bottom < 0) return;
      const n = Math.ceil(f), fs = f / n;
      if (!railIn && r.top < H * 0.78) {
        railIn = now;
        if (!rm) segs.forEach((ln, i) => ln.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 320, delay: (i % 4) * 150, easing: i % 4 === 3 ? EASE : "linear", fill: "backwards" }));
      }
      RS.forEach((R, i) => {
        const go = rm || (railIn && now - railIn > 380 + i * 130);
        for (let j = 0; j < n; j++) {
          if (go) { R.vy += (R.ty - R.y) * 0.045 * fs; R.vy *= Math.pow(0.8, fs); R.y += R.vy * fs; }
          R.va += (R.ta - R.a) * 0.014 * fs; R.va *= Math.pow(0.95, fs); R.a += R.va * fs;
        }
        if (!R.hit && go && R.y > -8) { R.hit = true; R.va += (i % 2 ? 1 : -1) * 0.9; }
      });
      rgs.forEach((g) => {
        const R = RS[+g.dataset.rg!];
        if (R) g.style.transform = `translateX(-50%) translateY(${R.y.toFixed(1)}px) rotate(${R.a.toFixed(2)}deg)`;
      });
    });
    return () => { stop(); offs.forEach((o) => o()); };
  }, []);

  return (
    <section id="pieces" ref={sec} data-tone="light" aria-label="Drop 01 — the pieces"
      className="relative flex flex-col gap-[clamp(22px,4vh,44px)] bg-bone px-gut pb-[clamp(56px,10vh,120px)] pt-[clamp(84px,12vh,124px)] text-ink">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h2 className="display m-0 flex flex-wrap items-baseline gap-x-[.2em] text-[clamp(48px,7vw,124px)] leading-[.84]">
          <span>Four pieces.</span>
          <em className="serif text-[.84em] normal-case tracking-[-.03em] font-stretch-[100%]">No filler.</em>
        </h2>
        <div className="label flex flex-col items-end gap-2 text-right">
          <span className="flex items-center gap-2">
            <span className="size-[9px] rounded-full bg-acid shadow-[0_0_0_1px_#0F0E0D]" />Drop 01 — available now
          </span>
          <span className="text-mute"><span className="hidden tab:inline">Hover a piece — size up, add to bag</span><span className="tab:hidden">Pick a size — add to bag</span></span>
        </div>
      </div>

      {/* desktop: expanding rail */}
      <div className="relative hidden h-[clamp(560px,76vh,860px)] tab:flex">
        {PIECES.map((p, i) => (
          <article key={p.id} data-rc={i} data-card="" aria-label={`${p.no} — ${p.name}`}
            className="relative min-w-0 flex-[1_1_0] overflow-hidden transition-[flex-grow] duration-[850ms] ease-io [container-type:size]"
            style={{ background: p.field, color: p.fg }}>
            <span data-seg="" aria-hidden className="pointer-events-none absolute inset-x-0 top-10 h-[3px] origin-left bg-acid" />
            <div role="button" tabIndex={0} aria-label={`View ${p.name}, ${inr(p.price)}`} onClick={() => goPiece(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goPiece(i); } }}
              className="absolute inset-0 cursor-pointer">
              <div data-rg={i} className="absolute left-1/2 top-5 h-[min(62cqh,140cqw)] origin-[50%_3%] transition-opacity duration-500 will-change-transform" style={{ transform: "translateX(-50%) translateY(-110vh)" }}>
                <Image data-gar="" src={p.img.src} width={p.img.w} height={p.img.h} alt={`${p.name} — ${p.colour}, front`} sizes="(max-width: 1100px) 30vw, 22vw" className="block h-full w-auto max-w-none drop-shadow-[0_26px_22px_rgba(0,0,0,.3)]" />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-[clamp(14px,1.4vw,22px)] bottom-[clamp(14px,1.4vw,22px)] flex flex-col gap-2.5">
              <span className="label truncate text-[11px]" style={{ color: p.mut }}>{p.no} — {p.colour} · {p.tech}</span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="min-w-0 text-[clamp(26px,2.3vw,40px)] font-bold uppercase leading-[.9] font-stretch-[72%]">{p.name}</span>
                <span className="whitespace-nowrap text-lg font-medium">{inr(p.price)}</span>
              </div>
              <div data-rx="" className="pointer-events-auto grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-io">
                <div className="min-h-0 overflow-hidden"><div className="pt-2"><AddBox piece={p} /></div></div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* mobile: 2-up grid */}
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 tab:hidden">
        {PIECES.map((p, i) => (
          <article key={p.id} data-card="" className="flex min-w-0 flex-col gap-2">
            <div role="button" tabIndex={0} aria-label={`View ${p.name}, ${inr(p.price)}`} onClick={() => goPiece(i)}
              className="relative aspect-3/4 cursor-pointer overflow-hidden" style={{ background: p.field, color: p.fg }}>
              <span data-seg="" aria-hidden className="absolute inset-x-0 top-6 h-0.5 origin-left bg-acid" />
              <div data-rg={i} className="absolute left-1/2 top-2.5 h-[80%] origin-[50%_3%] will-change-transform" style={{ transform: "translateX(-50%) translateY(-110vh)" }}>
                <Image data-gar="" src={p.img.src} width={p.img.w} height={p.img.h} alt={`${p.name} — ${p.colour}, front`} sizes="50vw" className="block h-full w-auto max-w-none drop-shadow-[0_16px_14px_rgba(0,0,0,.3)]" />
              </div>
              <span className="label absolute bottom-2 left-2.5 text-[11px]" style={{ color: p.mut }}>{p.no}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 text-[21px] font-bold uppercase leading-[.92] font-stretch-[72%]">{p.name}</span>
              <span className="whitespace-nowrap text-[15px] font-medium">{inr(p.price)}</span>
            </div>
            <span className="label text-[11px] text-mute">{p.colour} · {p.tech}</span>
            <div className="p-2.5" style={{ background: p.field, color: p.fg }}><AddBox piece={p} sizeH={40} addH={46} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
