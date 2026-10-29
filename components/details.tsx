"use client";

import { useEffect, useRef } from "react";
import { cl, frame, reduced } from "@/lib/motion";
import { MakingScene, type SceneHandle } from "./making/scene";
import { STEPS } from "./making/steps";

const N = STEPS.length;

/** "How a piece gets made": one sticky scene, scrubbed by scroll, with the text column synced to the active stage. */
export function Details() {
  const sec = useRef<HTMLElement>(null);
  const scene = useRef<SceneHandle>(null);

  useEffect(() => {
    const el = sec.current!, rm = reduced();
    scene.current?.init();
    const texts = [...el.querySelectorAll<HTMLElement>("[data-mkt]")];
    const btns = [...el.querySelectorAll<HTMLElement>("[data-mkb]")];
    const bars = [...el.querySelectorAll<HTMLElement>('[data-k="mkbar"]')];
    const odo = el.querySelector<HTMLElement>('[data-k="odo"]');
    const fig = el.querySelector<HTMLElement>('[data-k="mkFig"]');
    let cur = -1;

    return frame((_, now) => {
      const vh = innerHeight, r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = cl(-r.top / Math.max(1, r.height - vh));
      scene.current?.update(p, now, rm);
      const u = p * N, c = Math.min(N - 1, Math.floor(u)), lp = cl(u - c);
      if (c !== cur) {
        cur = c;
        if (odo) odo.style.transform = `translateY(${-c}em)`;
        texts.forEach((t, i) => {
          const on = i === c;
          t.style.opacity = on ? "1" : "0";
          t.style.transform = on ? "none" : `translateY(${i < c ? -26 : 26}px)`;
          t.style.visibility = on ? "visible" : "hidden";
        });
        btns.forEach((b, i) => { b.style.color = i === c ? "#ECE6DA" : "#8A8278"; if (i === c) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
        if (fig) fig.textContent = STEPS[c].fig;
      }
      bars.forEach((b, i) => (b.style.transform = `scaleX(${(i < c ? 1 : i === c ? lp : 0).toFixed(3)})`));
    });
  }, []);

  const goStage = (i: number) => {
    const el = sec.current!, r = el.getBoundingClientRect();
    window.scrollTo({ top: r.top + scrollY + ((i + 0.08) / N) * (r.height - innerHeight), behavior: reduced() ? "auto" : "smooth" });
  };

  return (
    <section id="making" ref={sec} data-tone="dark" aria-label="How a piece gets made" className="relative h-[520vh] bg-char text-bone tab:h-[640vh]">
      <div className="sticky top-0 grid h-svh grid-cols-1 grid-rows-[minmax(0,40fr)_minmax(0,60fr)] gap-3.5 overflow-hidden px-gut pb-[clamp(18px,4vh,40px)] pt-[clamp(64px,10vh,100px)] tab:grid-cols-[1.05fr_1fr] tab:grid-rows-1 tab:gap-[clamp(18px,3vw,56px)]">
        <div className="relative flex min-h-0 flex-col gap-2.5">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-sand">
            <MakingScene ref={scene} />
          </div>
          <span data-k="mkFig" className="label text-[11px] text-stone">{STEPS[0].fig}</span>
        </div>

        <div className="flex min-h-0 flex-col justify-between gap-4">
          <div className="label hidden items-baseline justify-between gap-4 text-stone tab:flex">
            <span>How a piece gets made.</span><span>Scroll to make it</span>
          </div>
          <div aria-hidden className="display h-[1em] overflow-hidden text-[56px] leading-none tab:text-[clamp(120px,22vh,230px)]">
            <div data-k="odo" className="transition-transform duration-800 ease-io">
              {STEPS.map((h) => <div key={h.n} className="h-[1em]">{h.n}</div>)}
            </div>
          </div>
          <div className="grid min-h-0" aria-live="polite">
            {STEPS.map((h, i) => (
              <div key={h.n} data-mkt="" className={`col-start-1 row-start-1 flex flex-col gap-3.5 transition-[opacity,transform] duration-700 ease-out-expo ${i ? "invisible opacity-0" : "visible opacity-100"}`}>
                <span className="label text-acid">{h.heading}</span>
                <h3 className="serif m-0 text-[26px] leading-none tracking-[-.02em] text-balance tab:text-[clamp(36px,3.6vw,60px)]">{h.title}</h3>
                <p className="m-0 max-w-[44ch] text-[14.5px] leading-normal text-ash text-pretty tab:text-[17px] tab:leading-[1.55]">{h.body}</p>
                <div className="flex flex-wrap gap-2">
                  {h.chips.map((c) => <span key={c} className="label border border-stone px-2 py-[5px] text-[11px] text-ash">{c}</span>)}
                </div>
              </div>
            ))}
          </div>
          <nav aria-label="Process stages" className="grid grid-cols-5 gap-2">
            {STEPS.map((h, i) => (
              <button key={h.n} data-mkb="" onClick={() => goStage(i)} aria-label={`Go to stage ${h.n}: ${h.heading.slice(5)}`}
                className={`label flex min-h-11 cursor-pointer flex-col items-start gap-2.5 border-0 bg-transparent px-0 py-2 text-[11px] transition-colors duration-300 ${i ? "text-[#8A8278]" : "text-bone"}`}>
                <span className="block h-0.5 w-full overflow-hidden bg-bone/15">
                  <span data-k="mkbar" className="block h-full origin-left scale-x-0 bg-acid" />
                </span>
                <span>{h.n}<span className="hidden tab:inline"> {h.heading.slice(5).replace("THE ", "")}</span></span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
