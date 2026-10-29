"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PIECES, inr } from "@/lib/pieces";
import { EASE_IO, reduced } from "@/lib/motion";
import { AddBox } from "./add-box";

/**
 * Click a shirt → a panel expands out of the click point. The shirt is shown large; the product types (all four pieces)
 * are an accordion on the right — the selected type opens to its details, sizes and Add to bag.
 */
type Open = { p: number; x: number; y: number };

export function QuickView({ open, onClose }: { open: Open | null; onClose: () => void }) {
  // keyed by click so each open starts fresh (selected type = the shirt that was clicked)
  return open ? <Panel key={`${open.p}-${open.x}-${open.y}`} open={open} onClose={onClose} /> : null;
}

function Panel({ open, onClose }: { open: Open; onClose: () => void }) {
  const [sel, setSel] = useState(open.p);
  const [side, setSide] = useState<"front" | "back">("front");
  const box = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = box.current;
    if (el && !reduced())
      el.animate(
        [{ clipPath: `circle(0px at ${open.x}px ${open.y}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${open.x}px ${open.y}px)` }],
        { duration: 650, easing: EASE_IO },
      );
    const t = setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 80);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", key);
    return () => { clearTimeout(t); removeEventListener("keydown", key); };
  }, [open, onClose]);

  const p = PIECES[sel];
  const shown = side === "back" && p.back ? p.back : p.img;

  return (
    <div data-quick="" role="dialog" aria-modal="true" aria-label={`${p.name} — product types`} className="fixed inset-0 z-455 flex items-center justify-center p-3 tab:p-8">
      <div onClick={onClose} className="absolute inset-0 bg-ink/70 backdrop-blur-sm" />
      <div ref={box} data-card="" className="relative grid max-h-[calc(100dvh-24px)] w-full max-w-[980px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden transition-colors duration-500 tab:max-h-[min(720px,calc(100dvh-64px))] tab:grid-cols-2 tab:grid-rows-1"
        style={{ background: p.field, color: p.fg }}>
        {/* the shirt */}
        <div className="relative flex h-[34dvh] items-center justify-center overflow-hidden tab:h-auto">
          <span className="label absolute left-5 top-5 text-[11px]" style={{ color: p.mut }}>{p.code} — {p.colour}</span>
          <Image key={shown.src} data-gar="" src={shown.src} width={shown.w} height={shown.h} alt={`${p.name} — ${p.colour}, ${side}`} sizes="(max-width: 760px) 60vw, 440px" priority
            className="h-[88%] w-auto max-w-none animate-[qvIn_.6s_cubic-bezier(.2,.8,.1,1)] drop-shadow-[0_30px_28px_rgba(0,0,0,.32)] tab:h-[78%]" />
          {p.back && (
            <div role="group" aria-label="Front or back" className="absolute inset-x-0 bottom-5 mx-auto flex w-fit gap-0.5 border p-[3px]" style={{ borderColor: p.line }}>
              {(["front", "back"] as const).map((s) => (
                <button key={s} onClick={() => setSide(s)} aria-pressed={side === s} className="label h-9 min-w-[76px] cursor-pointer border-0 px-4 text-[11px] transition-colors duration-300"
                  style={{ background: side === s ? p.fg : "transparent", color: side === s ? p.field : p.fg }}>{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* product types */}
        <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain p-5 tab:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="label text-[11px]" style={{ color: p.mut }}>Drop 01 — product types</span>
            <button ref={closeBtn} onClick={onClose} aria-label="Close" className="size-11 cursor-pointer border bg-transparent text-lg text-inherit active:scale-[.94]" style={{ borderColor: p.line }}>×</button>
          </div>
          {PIECES.map((x, i) => {
            const on = i === sel;
            return (
              <div key={x.id} className="border-t" style={{ borderColor: p.line }}>
                <button onClick={() => { setSel(i); setSide("front"); }} aria-expanded={on} className="flex w-full cursor-pointer items-center gap-4 border-0 bg-transparent py-3.5 text-left text-inherit">
                  <span className="relative block h-14 w-10 flex-none overflow-hidden" style={{ background: x.field }}>
                    <Image src={x.img.src} width={x.img.w} height={x.img.h} alt="" sizes="40px" className="absolute inset-x-0 top-1 mx-auto h-[90%] w-auto max-w-none" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label block text-[11px]" style={{ color: p.mut }}>{x.no} — {x.colour} · {x.type}</span>
                    <span className="block text-[clamp(24px,2.4vw,32px)] font-bold uppercase leading-[.95] font-stretch-[72%]">{x.name}</span>
                  </span>
                  <span className="whitespace-nowrap text-[17px] font-medium">{inr(x.price)}</span>
                  <span aria-hidden className={`text-xl leading-none transition-transform duration-400 ${on ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-500 ease-io ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="flex flex-col gap-3 pb-5">
                      <p className="serif m-0 text-[22px] italic leading-[1.1]">{x.copy}</p>
                      <span className="label text-[11px]" style={{ color: p.mut }}>{x.tech} · 240 GSM · Oversized</span>
                      {on && <AddBox key={x.id} piece={x} sizeH={44} addH={52} onAdded={() => setTimeout(onClose, 250)} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
