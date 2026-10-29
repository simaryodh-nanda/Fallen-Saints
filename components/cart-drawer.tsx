"use client";

/* Drawer animations key off refs set in effects (reference parity); compiler immutability rule is disabled here. */
/* eslint-disable react-hooks/immutability */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useBag } from "./bag";
import { PIECES, inr } from "@/lib/pieces";
import { EASE, reduced } from "@/lib/motion";


export function CartDrawer() {
  const { open, setOpen, setMenu, lines, count, total, change, remove, flashKey } = useBag();
  const box = useRef<HTMLElement>(null);
  const sub = useRef<HTMLSpanElement>(null);
  const was = useRef(false);
  const prevLines = useRef(lines);
  const [note, setNote] = useState(false);
  const [dock, setDock] = useState<"right" | "left">("right");
  const [dragX, setDragX] = useState<number | null>(null);
  const [vw, setVw] = useState(1280);
  const drag = useRef<{ id: number; ox: number; startX: number; moved: boolean } | null>(null);
  const width = Math.min(540, vw);
  const canDrag = vw > 600; // below that the drawer is full-width, so there is nowhere to move it
  const dockX = (d: "right" | "left") => (d === "right" ? vw - width : 0);

  useEffect(() => {
    const on = () => setVw(innerWidth);
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);

  // Drag by the header only; buttons / links / inputs keep their own behaviour, and the item list scrolls normally.
  const down = (e: React.PointerEvent) => {
    const hit = (e.target as Element).closest("button,a,input,[data-nodrag]");
    if (!canDrag || (hit && !hit.hasAttribute("data-draghandle"))) return;
    drag.current = { id: e.pointerId, ox: e.clientX - (dragX ?? dockX(dock)), startX: e.clientX, moved: false };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (Math.abs(e.clientX - d.startX) > 4) d.moved = true;
    if (d.moved) setDragX(Math.min(vw - width, Math.max(0, e.clientX - d.ox)));
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    // snap to the nearest edge; releasing near the original (right) edge returns it there
    const x = dragX ?? dockX(dock);
    setDock(x + width / 2 < vw / 2 ? "left" : "right");
    setDragX(null);
  };
  const nudge = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setDock("left"); }
    if (e.key === "ArrowRight") { e.preventDefault(); setDock("right"); }
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setMenu(false); } };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [setOpen, setMenu]);

  // On open: lines slide in staggered; the line just added flashes acid (reference: afterUpdate cartOpen).
  useEffect(() => {
    if (open && !was.current) {
      setNote(false);
      if (!reduced()) {
        box.current?.querySelectorAll<HTMLElement>("[data-line]").forEach((n, i) =>
          n.animate([{ opacity: 0, transform: "translateX(48px)" }, { opacity: 1, transform: "none" }], { duration: 650, delay: 220 + i * 70, easing: EASE, fill: "backwards" }));
        const k = flashKey.current;
        if (k) box.current?.querySelector<HTMLElement>(`[data-line="${k}"] [data-flash]`)?.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 1600, delay: 500, easing: "ease-out", fill: "backwards" });
        flashKey.current = null;
      }
      box.current?.querySelector<HTMLElement>("[data-first]")?.focus({ preventScroll: true });
    }
    was.current = open;
  }, [open, flashKey]);

  // Subtotal rolls down when the bag changes while open.
  useEffect(() => {
    if (open && prevLines.current !== lines && !reduced())
      sub.current?.animate([{ transform: "translateY(-35%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: EASE });
    prevLines.current = lines;
  }, [lines, open]);

  const drop = (e: React.MouseEvent, id: Parameters<typeof remove>[0], size: Parameters<typeof remove>[1]) => {
    const row = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-line]");
    if (!row || reduced()) return remove(id, size);
    row.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(40px)" }], { duration: 320, easing: EASE, fill: "forwards" }).onfinish = () => remove(id, size);
  };

  const pad = String(count).padStart(2, "0");
  return (
    <>
      <div className={`fixed inset-0 z-440 bg-ink/55 transition-opacity duration-[450ms] ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} />
      <aside
        ref={box} role="dialog" aria-modal="true" aria-label="Your bag" aria-hidden={!open}
        className={`fixed inset-y-0 z-450 flex flex-col overscroll-contain bg-ink pb-[env(safe-area-inset-bottom)] text-bone ${open ? "visible [clip-path:inset(0_0_0_0%)]" : dock === "right" ? "invisible [clip-path:inset(0_0_0_100%)]" : "invisible [clip-path:inset(0_100%_0_0)]"}`}
        style={{
          left: dragX ?? dockX(dock), width,
          transition: `clip-path .7s cubic-bezier(.7,0,.2,1), visibility 0s linear ${open ? "0s" : ".7s"}${dragX === null ? ", left .4s cubic-bezier(.2,.8,.1,1)" : ""}`,
        }}
      >
        <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          className={`flex select-none items-start justify-between gap-4 px-[clamp(18px,3vw,32px)] pb-4 pt-[18px] ${canDrag ? "cursor-grab touch-none" : ""}`}>
          <div className="relative flex items-end gap-3.5">
            <span className="display text-[clamp(72px,9vw,104px)] leading-[.78]">Bag</span>
            <span className="label pb-1 text-stone">{pad} {count === 1 ? "piece" : "pieces"}</span>
            <span aria-hidden className="absolute -left-1 -top-2.5 aspect-4/1 w-[62px] -rotate-10 rounded-[50%] border-2 border-acid" />
          </div>
          {canDrag && (
            <button data-draghandle="" onKeyDown={nudge} aria-label={`Bag panel is docked ${dock}. Use the left and right arrow keys to move it.`} title="Drag the header, or use ← →"
              className="label ml-auto h-11 cursor-grab border-0 bg-transparent text-[11px] text-stone">⠿ Move</button>
          )}
          <button data-first="" onClick={() => setOpen(false)} aria-label="Close bag" className="size-11 cursor-pointer border border-bone/30 bg-transparent text-lg text-inherit active:scale-[.94]">×</button>
        </div>
        <div className="mx-[clamp(18px,3vw,32px)] h-px bg-bone/18" />

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-6 px-[clamp(18px,3vw,32px)]">
            <p className="serif m-0 text-[clamp(40px,5vw,54px)] leading-none">Your bag is innocent. <em>For now.</em></p>
            <a href="#pieces" onClick={() => setOpen(false)} className="label inline-flex h-[54px] items-center self-start bg-acid px-7 text-ink active:scale-[.94]">Shop the drop</a>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-[1_1_0] overflow-y-auto overscroll-contain px-[clamp(18px,3vw,32px)] [-webkit-overflow-scrolling:touch]">
              {lines.map((l, i) => {
                const p = PIECES.find((x) => x.id === l.id)!, k = `${l.id}|${l.size}`;
                return (
                  <div key={k} data-line={k} className="relative grid grid-cols-[28px_104px_minmax(0,1fr)] gap-3.5 border-b border-bone/14 py-5">
                    <span data-flash="" aria-hidden className="pointer-events-none absolute -inset-x-8 inset-y-0 bg-acid opacity-0 mix-blend-soft-light" />
                    <span className="label pt-1 text-[11px] text-stone">{String(i + 1).padStart(2, "0")}</span>
                    <span className="block aspect-4/5" style={{ background: p.field }}>
                      <Image src={p.img.src} width={p.img.w} height={p.img.h} alt="" sizes="104px" className="size-full max-w-none object-contain p-2" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <span className="text-[26px] font-bold uppercase leading-[.92] font-stretch-[72%]">{p.name}</span>
                      <span className="label text-[11px] text-stone">Size {l.size} · {p.colour} · {inr(p.price)}</span>
                      <div className="mt-auto flex items-center justify-between gap-2.5">
                        <div role="group" aria-label="Quantity" className="flex items-center border border-bone/30">
                          <button onClick={(e) => (l.qty === 1 ? drop(e, l.id, l.size) : change(l.id, l.size, -1))} aria-label={l.qty === 1 ? "Remove from bag" : "Decrease quantity"} className="size-11 cursor-pointer border-0 bg-transparent text-[17px] text-inherit active:scale-[.94]">−</button>
                          <span aria-live="polite" className="label min-w-[26px] text-center text-[13px]">{l.qty}</span>
                          <button onClick={() => change(l.id, l.size, 1)} disabled={l.qty >= 10} aria-label="Increase quantity" className="size-11 cursor-pointer border-0 bg-transparent text-[17px] text-inherit active:scale-[.94] disabled:opacity-40">+</button>
                        </div>
                        <span className="whitespace-nowrap text-[17px]">{inr(p.price * l.qty)}</span>
                      </div>
                      <button onClick={(e) => drop(e, l.id, l.size)} className="label cursor-pointer self-start border-0 bg-transparent py-1.5 text-[11px] text-stone underline underline-offset-4">Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-bone/18 bg-[#141312] px-[clamp(18px,3vw,32px)] pb-[22px] pt-[18px]">
              <div className="flex items-baseline justify-between gap-3 overflow-hidden">
                <span className="label text-stone">Subtotal</span>
                <span ref={sub} className="display inline-block text-[46px] leading-[.9]">{inr(total)}</span>
              </div>
              <div className="label flex justify-between text-[11px] tracking-[.06em] text-stone"><span>Shipping</span><span>Calculated at checkout</span></div>
              {note ? (
                <div role="status" className="flex flex-col gap-3 border border-bone/35 p-4">
                  <span className="label text-acid">Prototype checkout</span>
                  <p className="m-0 text-[15px] leading-normal">Checkout isn’t connected yet — nothing has been charged and no order was placed. In production this hands the bag (pieces, sizes, {inr(total)}) to the payment provider.</p>
                  <button onClick={() => setNote(false)} className="label h-11 cursor-pointer self-start border border-bone/40 bg-transparent px-[18px] text-[11px] text-inherit">Back to bag</button>
                </div>
              ) : (
                <>
                  <button onClick={() => setNote(true)} className="label mt-1 h-[62px] cursor-pointer border-0 bg-acid text-[13px] text-ink active:scale-[.94]">Checkout — {inr(total)}</button>
                  <button onClick={() => setOpen(false)} className="label h-11 cursor-pointer border-0 bg-transparent text-[11px] text-bone underline underline-offset-4">Keep shopping</button>
                </>
              )}
              <span className="label text-center text-[11px] text-stone">Prototype — payment not connected</span>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
