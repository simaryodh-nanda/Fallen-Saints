"use client";

import { useEffect, useRef } from "react";
import { frame, isFine } from "@/lib/motion";
import { Halo, HALO_TONES } from "./halo";
import { useBag } from "./bag";

/** Acid halo that trails the mouse; swells over [data-halo], hides over [data-lp] and overlays. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const { open, menu } = useBag();
  const overlay = useRef(false);
  useEffect(() => { overlay.current = open || menu; }, [open, menu]);

  useEffect(() => {
    if (!isFine()) return;
    const el = ref.current!;
    const m = { x: -99, y: -99, on: false, big: false, lp: false, dark: null as boolean | null };
    const c = { x: -99, y: -99, s: 1 };
    // which background is under the pointer? light → gold, dark → maroon (the hero is split at the seam)
    const tint = (t: Element | null) => {
      const sec = t?.closest<HTMLElement>("[data-tone]"), tone = sec?.dataset.tone;
      let dark = tone !== "light";
      if (tone === "split") { const seam = sec!.querySelector<HTMLElement>('[data-k="seam"]'); dark = !!seam && m.x > seam.getBoundingClientRect().left; }
      if (m.dark !== dark) { m.dark = dark; Object.entries(dark ? HALO_TONES.maroon : HALO_TONES.gold).forEach(([k, v]) => el.style.setProperty(k, v)); }
    };
    // the page can scroll under a still pointer, so re-check then too
    const onScroll = () => { if (m.on) tint(document.elementFromPoint(m.x, m.y)); };
    addEventListener("scroll", onScroll, { passive: true });
    const move = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      m.x = e.clientX; m.y = e.clientY; m.on = true;
      const t = e.target instanceof Element ? e.target : null;
      m.big = !!t?.closest("[data-halo]");
      m.lp = !!t?.closest("[data-lp]");
      tint(t);
    };
    addEventListener("pointermove", move, { passive: true });
    const stop = frame(() => {
      const on = m.on && !m.lp && !overlay.current;
      c.x += (m.x - c.x) * 0.24; c.y += (m.y - c.y) * 0.24; c.s += ((m.big ? 2.3 : 1) - c.s) * 0.18;
      el.style.opacity = on ? "1" : "0";
      el.style.transform = `translate(${c.x.toFixed(1)}px,${(c.y - (c.s - 1) * 10).toFixed(1)}px) scale(${c.s.toFixed(3)}) rotate(${(-8 * (c.s - 1)) / 1.3}deg)`;
    });
    return () => { stop(); removeEventListener("pointermove", move); removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-600 -ml-[26px] -mt-[24px] w-[52px] opacity-0">
      <Halo className="w-full" />
    </div>
  );
}
