/** Shared motion helpers — mirrors the reference's easing curves and single rAF clock. */
export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const oc = (t: number) => 1 - Math.pow(1 - t, 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const EASE = "cubic-bezier(.2,.8,.1,1)";
export const EASE_IO = "cubic-bezier(.7,0,.2,1)";

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isFine = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

type Frame = (f: number, now: number) => void;
const subs = new Set<Frame>();
let raf = 0;
let last = 0;

function loop() {
  raf = requestAnimationFrame(loop);
  const now = performance.now();
  const f = cl((now - (last || now)) / 16.67 || 1, 0.3, 3);
  last = now;
  subs.forEach((cb) => cb(f, now));
}

/** Subscribe to the shared frame loop. `f` is the frame factor (1 = 60fps). */
export function frame(cb: Frame) {
  subs.add(cb);
  if (subs.size === 1) {
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size) cancelAnimationFrame(raf);
  };
}

/** Height of one scroll segment in the pinned Drop File. */
export const fileSeg = () => Math.round(window.innerHeight * 0.95);

/** Smooth-scroll to a piece in the Drop File (pinned on desktop, stacked on mobile). */
export function goPiece(i: number) {
  const beh = reduced() ? "auto" : "smooth";
  if (window.innerWidth < 760) {
    const c = document.querySelectorAll("[data-mfile]")[i];
    if (c) window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - 64, behavior: beh });
    return;
  }
  const sec = document.getElementById("file");
  if (!sec) return;
  window.scrollTo({
    top: sec.getBoundingClientRect().top + scrollY + (i === 0 ? 0 : (i - 1 + 0.82) * fileSeg()),
    behavior: beh,
  });
}
