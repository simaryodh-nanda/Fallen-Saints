"use client";

import { useRef, useState } from "react";
import { SIZES, inr, type Piece, type Size } from "@/lib/pieces";
import { reduced } from "@/lib/motion";
import { useBag } from "./bag";

/** Size grid + add-to-bag button, themed from the piece's own palette (reference: sizes() / addState()). */
export function AddBox({
  piece, sizeH = 46, addH = 54, gap = 8, minAdd, full, getImg, onAdded,
}: { piece: Piece; sizeH?: number; addH?: number; gap?: number; minAdd?: number; full?: boolean; getImg?: () => HTMLImageElement | null; onAdded?: () => void }) {
  const { addFrom, justAdded } = useBag();
  const [size, setSize] = useState<Size | null>(null);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const ja = justAdded && justAdded.id === piece.id ? justAdded : null;

  const press = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) return;
    if (!size || piece.out.includes(size)) {
      setErr(true);
      if (!reduced())
        grid.current?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
          { duration: 380, easing: "ease-out" },
        );
      return;
    }
    const btn = e.currentTarget;
    if (!reduced()) btn.animate([{ transform: "scale(1)" }, { transform: "scale(.95)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.2,.8,.1,1)" });
    const card = btn.closest("[data-card]");
    const img = getImg?.() ?? card?.querySelector<HTMLImageElement>("[data-gar]") ?? null;
    setBusy(true);
    addFrom({ id: piece.id, size, img, btn, kbd: e.detail === 0 });
    onAdded?.();
    setTimeout(() => setBusy(false), 1400);
  };

  const label = busy ? "Adding…" : ja ? `In the bag — ${ja.size} ✓` : size ? `Add to bag${full ? ` — ${inr(piece.price)}` : ""}` : "Select a size";

  return (
    <div className="flex flex-col" style={{ gap }}>
      <div ref={grid} data-sizes={piece.id} role="group" aria-label={`Size for ${piece.name}`} className="grid grid-cols-5 gap-1.5">
        {SIZES.map((s) => {
          const out = piece.out.includes(s), on = size === s;
          return (
            <button
              key={s}
              disabled={out}
              aria-pressed={on}
              aria-label={out ? `Size ${s}, sold out` : `Size ${s}`}
              onClick={() => { setSize(s); setErr(false); }}
              className={`label min-w-0 border p-0 tracking-[.04em] transition-[background,color,transform] duration-200 active:scale-[.94] ${out ? "cursor-not-allowed line-through" : "cursor-pointer"}`}
              style={{
                height: sizeH,
                borderColor: on ? piece.fg : out ? piece.faint : piece.line,
                background: on ? piece.fg : "transparent", color: on ? piece.field : out ? piece.mut : piece.fg,
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
      <button
        onClick={press}
        aria-disabled={busy}
        className={`label w-full cursor-pointer border px-6 transition-[background,color,transform] duration-250 active:scale-[.97] ${size ? "border-solid" : "border-dashed"}`}
        style={{ height: addH, minWidth: minAdd, borderColor: piece.fg, background: size ? piece.fg : "transparent", color: size ? piece.field : piece.fg }}
      >
        {label}
      </button>
      <span role="alert" className="label min-h-3.5 text-[11px] tracking-[.06em]">
        {err ? "Choose a size first — then add it." : ""}
      </span>
    </div>
  );
}
