"use client";

import { useEffect, useState, type RefObject } from "react";

/** Progress (0..1) of a tall sticky-stage section through the viewport. */
function progress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  return span <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / span));
}

function subscribe(fn: () => void) {
  let raf = 0;
  const on = () => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; fn(); });
  };
  fn();
  window.addEventListener("scroll", on, { passive: true });
  window.addEventListener("resize", on);
  return () => {
    window.removeEventListener("scroll", on);
    window.removeEventListener("resize", on);
    if (raf) cancelAnimationFrame(raf);
  };
}

/** Discrete step index — re-renders only when the step changes, not every frame. */
export function useScrollIndex(ref: RefObject<HTMLElement | null>, count: number) {
  const [i, setI] = useState(0);
  useEffect(
    () =>
      subscribe(() => {
        if (ref.current) setI(Math.min(count - 1, Math.floor(progress(ref.current) * count)));
      }),
    [ref, count],
  );
  return i;
}

/** Continuous progress delivered straight to the DOM (no React re-render). */
export function useScrollEffect(
  ref: RefObject<HTMLElement | null>,
  apply: (p: number) => void,
) {
  useEffect(
    () => subscribe(() => ref.current && apply(progress(ref.current))),
    [ref, apply],
  );
}
