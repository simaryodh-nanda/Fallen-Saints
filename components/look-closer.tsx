"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { PIECES, inr } from "@/lib/pieces";
import { cl, frame, io, lerp, oc, reduced } from "@/lib/motion";
import { AddBox } from "./add-box";

const P = PIECES[0];

/** Circular aperture that opens from a chest-mark crop to the full garment (reference: lastFrame). */
export function LookCloser() {
  const sec = useRef<HTMLElement>(null);

  useEffect(() => {
    const s = sec.current!, rm = reduced();
    const q = (k: string) => s.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
    const ap = q("apW"), g = q("apG"), ring = q("apRing"), lw = q("apL"), rw = q("apR"), cap = q("apCap"), buy = q("apBuy");
    return frame(() => {
      const W = innerWidth, H = innerHeight, r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) return;
      const mob = W < 760;
      const p = cl(-r.top / Math.max(1, r.height - H));
      const e = rm ? (p > 0.3 ? 1 : 0) : io(cl((p - 0.08) / 0.6));
      const R0 = Math.min(W, H) * (mob ? 0.28 : 0.17), R = lerp(R0, Math.hypot(W, H) / 2 + 24, e);
      ap.style.clipPath = `circle(${R.toFixed(1)}px at 50% 50%)`;
      const h = g.offsetHeight, w = (h * 760) / 1198, s1 = mob ? 0.78 : 1, sc = lerp(2.7, s1, e), dyE = mob ? -H * 0.15 : 0;
      const dx = lerp(-0.18 * w, -0.18 * w * (1 - s1), e), dy = lerp(0.09 * h, 0.09 * h * (1 - s1) + dyE, e);
      g.style.transform = `translate(-50%,-50%) translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
      ring.style.width = ring.style.height = `${(2 * R + 20).toFixed(0)}px`;
      ring.style.opacity = (1 - cl(e * 3)).toFixed(3);
      const gap = mob ? 18 : 34, wo = (1 - cl(e * 2.4)).toFixed(3), Rg = (R + gap).toFixed(1);
      lw.style.opacity = wo; lw.style.transform = mob ? `translate(-50%, calc(-100% - ${Rg}px))` : `translate(calc(-100% - ${Rg}px), -50%)`;
      rw.style.opacity = wo; rw.style.transform = mob ? `translate(-50%, ${Rg}px)` : `translate(${Rg}px, -50%)`;
      cap.style.opacity = (1 - cl(e * 3)).toFixed(3);
      const o = rm ? (e >= 1 ? 1 : 0) : oc(cl((p - 0.7) / 0.16));
      buy.style.opacity = o.toFixed(3);
      buy.style.visibility = o < 0.02 ? "hidden" : "visible";
      buy.style.transform = `translateY(${((1 - o) * 28).toFixed(1)}px)`;
      const tone = e > 0.85 ? "light" : "dark";
      if (s.dataset.tone !== tone) s.dataset.tone = tone;
    });
  }, []);

  return (
    <section id="last" ref={sec} data-tone="dark" aria-label="Look closer — Bad Influence" className="relative h-[240svh] bg-ink text-bone tab:h-[270vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-k="apW" className="absolute inset-0 bg-sand [clip-path:circle(17vmin_at_50%_50%)]">
          <div data-k="apG" className="absolute left-1/2 top-1/2 aspect-[760/1198] h-[56svh] origin-[68%_41%] will-change-transform tab:h-[min(84vh,64vw)]" style={{ transform: "translate(-50%,-50%)" }}>
            <Image src={P.img.src} width={P.img.w} height={P.img.h} alt="Bad Influence — black T-shirt with embroidered chest mark (stand-in garment)" sizes="(max-width: 760px) 90vw, 55vw" quality={80}
              className="size-full max-w-none object-contain drop-shadow-[0_30px_30px_rgba(15,14,13,.22)]" />
          </div>
        </div>
        <span data-k="apRing" aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[34vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-acid" />
        <span data-k="apL" aria-hidden className="serif pointer-events-none absolute left-1/2 top-1/2 whitespace-nowrap text-[clamp(56px,8.4vw,160px)] italic leading-none tracking-[-.03em]" style={{ transform: "translate(calc(-100% - 34px), -50%)" }}>Look</span>
        <span data-k="apR" aria-hidden className="serif pointer-events-none absolute left-1/2 top-1/2 whitespace-nowrap text-[clamp(56px,8.4vw,160px)] italic leading-none tracking-[-.03em]" style={{ transform: "translate(34px, -50%)" }}>closer.</span>
        <h2 className="sr-only">Look closer — Bad Influence</h2>
        <span data-k="apCap" className="label absolute inset-x-0 bottom-[clamp(20px,5vh,44px)] text-center text-[11px] text-stone">{P.code} · Embroidered chest mark · Keep scrolling</span>

        <div data-k="apBuy" className="invisible absolute inset-x-gut bottom-[clamp(18px,4vh,40px)] grid grid-cols-1 items-end gap-x-10 gap-y-4 text-ink opacity-0 tab:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          <div className="flex min-w-0 flex-col gap-3">
            <span className="label text-[11px] text-mute">The one that started it — {P.code}</span>
            <span className="display text-[clamp(44px,8vw,120px)] leading-[.82]">Bad<br />Influence</span>
            <span className="label">{inr(P.price)} · Black · Embroidered</span>
          </div>
          <div className="w-full max-w-[400px] justify-self-end"><AddBox piece={P} sizeH={48} addH={56} /></div>
        </div>
      </div>
    </section>
  );
}
