"use client";

/* Homepage intro — "Unboxing the Wings". Plays on its own like a short film (no input needed):
     1 the sealed box · 2 hands take the tissue · 3 it tears, the tee shows through · 4 the tee is lifted out ·
     5 it floats free · 6 wings and halo open around it — then it dissolves into the hero (same wings, halo, white tee),
     whose own entrance (wordmark, tagline, nav, the Saint/Sinner seam) plays underneath.
   The six frames (public/intro/unbox-1…6, one camera, one set-up) dissolve into each other while a single slow
   camera push runs through the whole sequence, so it reads as one continuous move rather than a slideshow.
   - ~220KB of images, requested only on visits where the intro plays; never waits on a slow network.
   - Skip / scroll / any key jumps to the hero. Once per session (lib/intro.ts, ?intro to replay), never with reduced motion. */

import { useEffect, useRef, useState } from "react";
import { cl, frame, io, lerp } from "@/lib/motion";
import { introActive, sendIntro } from "@/lib/intro";

const FRAMES = [1, 2, 3, 4, 5, 6].map((n) => `/intro/unbox-${n}.jpg`);
const HOLD = 720; // per frame, ms
const XF = 420; //   dissolve between frames, ms
const RUN = HOLD * FRAMES.length; // 4320
const HERO = RUN - 380, OUT = 950; // hand-off starts during the last frame
const LOAD_TIMEOUT = 1600;

export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const live = useRef<boolean | null>(null); // decided once per mount (refs survive React's dev double-mount)
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (live.current === null) live.current = introActive();
    if (!live.current) return; // not playing this visit: CSS keeps it hidden
    scrollTo({ top: 0, behavior: "instant" });
    const el = root.current!, cam = el.querySelector<HTMLElement>("[data-cam]")!;
    const shots = [...el.querySelectorAll<HTMLElement>("[data-shot]")];
    const imgs = shots.map((s) => s.querySelector("img")!);
    let start = Infinity, heroSent = false, finished = false;
    const timers: number[] = [];

    const finish = () => { if (finished) return; finished = true; delete document.body.dataset.intro; setDone(true); };
    const goHero = () => {
      if (heroSent) return;
      heroSent = true;
      sendIntro("hero");
      document.body.dataset.intro = "hero";
    };
    const skip = () => {
      if (finished) return;
      if (start === Infinity) start = performance.now();
      start = Math.min(start, performance.now() - HERO); // jump to the hand-off
    };

    // load the frames now (only on visits that play the intro); start once the first two are ready
    imgs.forEach((im, i) => { im.src = FRAMES[i]; });
    Promise.all([imgs[0].decode(), imgs[1].decode()]).then(() => { if (start === Infinity) start = performance.now(); }, () => skip());
    timers.push(window.setTimeout(() => { if (start === Infinity) skip(); }, LOAD_TIMEOUT));

    const opts = { passive: true } as const;
    addEventListener("wheel", skip, opts);
    addEventListener("touchstart", skip, opts);
    addEventListener("keydown", skip);
    const skipBtn = el.querySelector<HTMLButtonElement>("[data-skip]")!;
    skipBtn.addEventListener("click", skip);

    const stop = frame((_, now) => {
      if (finished || start === Infinity) return;
      const t = now - start;
      // one continuous camera move across the whole film: a slow push-in with a slight drift
      const k = cl(t / (RUN + OUT));
      cam.style.transform = `translate(${lerp(0, -0.6, k).toFixed(2)}%, ${lerp(0.4, -0.8, k).toFixed(2)}%) scale(${lerp(1.0, 1.09, k).toFixed(4)})`;
      shots.forEach((s, i) => {
        const a = i * HOLD;
        const vin = i === 0 ? io(cl(t / 600)) : io(cl((t - a + XF / 2) / XF));
        const vout = i === FRAMES.length - 1 ? 1 : 1 - io(cl((t - a - HOLD + XF / 2) / XF));
        const v = vin * vout;
        s.style.opacity = v.toFixed(3);
        s.style.visibility = v > 0.001 ? "visible" : "hidden";
      });
      if (t >= HERO) goHero();
      el.style.opacity = (1 - io(cl((t - HERO) / OUT))).toFixed(3);
      if (t >= HERO + OUT) finish();
    });

    return () => {
      stop();
      timers.forEach(clearTimeout);
      removeEventListener("wheel", skip);
      removeEventListener("touchstart", skip);
      removeEventListener("keydown", skip);
      skipBtn.removeEventListener("click", skip);
      mounted.current = false;
      // only a real unmount mid-intro (e.g. navigating away) clears the flag — not the dev double-mount
      setTimeout(() => { if (!mounted.current && !finished) delete document.body.dataset.intro; }, 0);
    };
  }, []);

  if (done) return null;
  return (
    <div ref={root} data-intro-root="" aria-hidden className="pointer-events-none fixed inset-0 z-400 select-none bg-ink">
      {/* square film frame: fills a phone; on wider screens it sits centred and its edges melt into the black page */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[max(100vw,100svh)] -translate-x-1/2 -translate-y-1/2 tab:w-[min(96vh,96vw)] tab:[mask-image:radial-gradient(closest-side,#000_72%,transparent_100%)]">
        <div data-cam="" className="absolute inset-0 will-change-transform">
          {FRAMES.map((src, i) => (
            <div key={src} data-shot="" className="absolute inset-0" style={{ opacity: 0, visibility: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img: src is set only when the intro plays */}
              <img alt="" decoding="async" className="size-full object-cover" data-i={i} />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_45%,transparent_60%,rgba(0,0,0,.5))]" />
      <button data-skip="" type="button" className="label pointer-events-auto absolute bottom-[clamp(16px,3vh,28px)] right-[clamp(16px,3vw,32px)] cursor-pointer border-0 bg-transparent p-2 text-[10px] tracking-[.24em] text-stone/70 hover:text-bone">Skip</button>
    </div>
  );
}
