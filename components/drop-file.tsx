"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PIECES, inr, viewsOf, type Piece, type View } from "@/lib/pieces";
import { cl, EASE, fileSeg, frame, goPiece, io, reduced } from "@/lib/motion";
import { AddBox } from "./add-box";

const VIEWS = PIECES.map(viewsOf);
const count = (v: number, n: number) => `${String(v + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

function ViewImg({ v, fill }: { v: View; fill?: boolean }) {
  return (
    <Image
      src={v.img.src} width={v.img.w} height={v.img.h} alt="" sizes={fill ? "50vw" : "70px"}
      className={`size-full max-w-none ${v.kind === "photo" ? "object-cover" : "object-contain"}`}
    />
  );
}

function Layer({ p, v, on }: { p: Piece; v: View; on: boolean }) {
  const alt = `${p.name} — ${v.label}`;
  const common = { width: v.img.w, height: v.img.h, sizes: "(max-width: 900px) 90vw, 45vw", loading: "lazy" as const };
  return (
    <div className={`pointer-events-none absolute inset-0 transition-opacity duration-[550ms] ease-out-expo ${on ? "opacity-100" : "opacity-0"}`} aria-hidden={!on}>
      {v.kind === "img" && (
        <Image {...common} alt={alt} src={v.img.src} className="absolute left-1/2 top-0 h-[min(100cqh,160cqw)] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_30px_28px_rgba(0,0,0,.32)]" />
      )}
      {v.kind === "crop" && (
        <span className="absolute left-1/2 top-0 aspect-4/5 h-[min(100cqh,125cqw)] -translate-x-1/2 overflow-hidden shadow-[0_34px_44px_-26px_rgba(0,0,0,.5)]" style={{ background: p.field }}>
          <Image {...common} alt={alt} src={v.img.src} className="size-full max-w-none object-contain" style={{ transform: `scale(${v.zoom})`, transformOrigin: v.origin }} />
        </span>
      )}
      {v.kind === "photo" && (
        <Image {...common} alt={alt} src={v.img.src} className="absolute inset-0 size-full max-w-none object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,.3)]" />
      )}
    </div>
  );
}

export function DropFile() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<number[]>(PIECES.map(() => 0));
  const swing = useRef<{ a: number; va: number; pp: number | null }[]>(PIECES.map(() => ({ a: 0, va: 0, pp: null })));
  const prevView = useRef(view);

  // Changing views nudges the garment and pulses its width (reference: afterUpdate → gv).
  useEffect(() => {
    view.forEach((v, i) => {
      if (v === prevView.current[i]) return;
      if (!reduced()) swing.current[i].va += 0.7;
      if (!reduced() && innerWidth >= 760)
        stage.current?.querySelectorAll<HTMLElement>(`[data-gvw="${PIECES[i].id}"]`).forEach((n) =>
          n.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(.9)", offset: 0.42 }, { transform: "scaleX(1)" }], { duration: 620, easing: "cubic-bezier(.7,0,.2,1)" }));
    });
    prevView.current = view;
  }, [view]);

  useEffect(() => {
    const el = sec.current!, st = stage.current!;
    const rm = reduced();
    const q = (k: string) => st.querySelector<HTMLElement>(`[data-k="${k}"]`);
    const arts = [...st.querySelectorAll<HTMLElement>("[data-fp]")];
    const seam = q("fSeam"), tag = q("fSeamTag"), cnt = q("fCount");
    const hud = [q("fHud"), q("fTop")];
    const bars = [...st.querySelectorAll<HTMLElement>('[data-k="fbar"]')];
    const idxBtns = [...st.querySelectorAll<HTMLElement>("[data-fidx]")];
    let fa = -1, init = false;

    // Loupe: a clipped, magnified copy of the front image that follows the pointer.
    const lens = PIECES.map(() => ({ r: 0, tr: 0, x: 0, y: 0 }));
    const onLens = (e: MouseEvent) => {
      const lp = (e.target as Element).closest<HTMLElement>("[data-lp]");
      if (!lp) return;
      const i = +lp.dataset.lpi!, b = lp.getBoundingClientRect();
      lens[i].x = e.clientX - b.left; lens[i].y = e.clientY - b.top; lens[i].tr = 88;
    };
    const offLens = (e: MouseEvent) => {
      const lp = (e.target as Element).closest<HTMLElement>("[data-lp]");
      if (lp) lens[+lp.dataset.lpi!].tr = 0;
    };
    st.addEventListener("mousemove", onLens); st.addEventListener("mouseout", offLens);

    const stop = frame((f) => {
      const H = innerHeight;
      if (innerWidth < 760) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > H + 40) return;
      const n = Math.ceil(f), fs = f / n, seg = fileSeg();
      const k = cl(-r.top / seg, 0, 3.4);
      const raw = [1], T = [1];
      let idx = 0, seamX = 100, seamI = -1;
      for (let i = 1; i < 4; i++) {
        const u = cl((k - (i - 1) - 0.22) / 0.56), t = rm ? (u >= 0.5 ? 1 : 0) : io(u);
        raw.push(u); T.push(t);
        if (t >= 0.5) idx = i;
        if (t > 0.001 && t < 0.999) { seamX = (1 - t) * 100; seamI = i; }
      }
      arts.forEach((p) => {
        const i = +p.dataset.fp!, t = T[i], nx = T[i + 1] || 0;
        if (i > 0) p.style.clipPath = `inset(0 0 0 ${((1 - t) * 100).toFixed(3)}%)`;
        p.style.visibility = t <= 0.001 || nx >= 0.999 ? "hidden" : "visible";
        const pos = rm ? 0 : (1 - t) * 16 - nx * 9;
        const inn = p.querySelector<HTMLElement>("[data-fin]");
        if (inn) inn.style.transform = `translateX(${pos.toFixed(3)}vw)`;
        const nm = p.querySelector<HTMLElement>("[data-fname]");
        if (nm) nm.style.transform = rm ? "none" : `translateX(${((1 - t) * 6 - nx * 4).toFixed(3)}vw)`;
        const G = swing.current[i];
        if (G.pp != null && !rm) G.va += cl((pos - G.pp) * 0.9, -1.4, 1.4);
        G.pp = pos;
        for (let j = 0; j < n; j++) { G.va += -G.a * 0.014 * fs; G.va *= Math.pow(0.95, fs); G.a += G.va * fs; }
        G.a = cl(G.a, -14, 14);
        const ge = p.querySelector<HTMLElement>("[data-fg]");
        if (ge) ge.style.transform = `translateX(-50%) rotate(${G.a.toFixed(2)}deg)`;

        const L = lens[i];
        L.r += (L.tr - L.r) * 0.22 * Math.min(f, 2);
        const lp = p.querySelector<HTMLElement>("[data-lp]");
        if (lp) {
          const l = lp.querySelector<HTMLElement>("[data-lpl]"), z = lp.querySelector<HTMLElement>("[data-lpz]");
          const ring = lp.querySelector<HTMLElement>("[data-lpr]"), chip = lp.querySelector<HTMLElement>("[data-lpc]");
          if (l) l.style.clipPath = `circle(${Math.max(0, L.r).toFixed(1)}px at ${L.x}px ${L.y}px)`;
          if (z) z.style.transformOrigin = `${L.x}px ${L.y}px`;
          if (ring) { ring.style.width = ring.style.height = `${2 * L.r}px`; ring.style.transform = `translate(${L.x - L.r}px,${L.y - L.r}px)`; ring.style.opacity = L.r > 4 ? "1" : "0"; }
          if (chip) { chip.style.transform = `translate(${L.x + L.r * 0.6}px,${L.y + L.r * 0.8}px)`; chip.style.opacity = L.r > 40 ? "1" : "0"; }
        }
      });
      if (seam) { seam.style.left = `${seamX.toFixed(3)}%`; seam.style.opacity = seamI >= 0 ? "1" : "0"; }
      if (tag) {
        tag.style.left = `${seamX.toFixed(3)}%`; tag.style.opacity = seamI >= 0 ? "1" : "0";
        if (seamI >= 0 && tag.dataset.i !== String(seamI)) { tag.dataset.i = String(seamI); tag.textContent = `${PIECES[seamI].no} — ${PIECES[seamI].name} →`; }
      }
      if (idx !== fa || !init) {
        const first = !init;
        init = true; fa = idx;
        const P = PIECES[idx];
        hud.forEach((h) => h && (h.style.color = P.fg));
        if (cnt) cnt.textContent = `${P.no} / 04`;
        el.dataset.tone = P.fg === "#0F0E0D" ? "light" : "dark";
        idxBtns.forEach((b, i) => { b.style.opacity = i === idx ? "1" : ".55"; if (i === idx) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
        if (!first && !rm)
          arts[idx]?.querySelectorAll<HTMLElement>("[data-fr]").forEach((n, j) =>
            n.animate([{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "none" }], { duration: 680, delay: 60 + j * 60, easing: EASE, fill: "backwards" }));
      }
      bars.forEach((b, i) => (b.style.transform = `scaleX(${(i === 0 ? 1 : raw[i]).toFixed(3)})`));
    });
    return () => { stop(); st.removeEventListener("mousemove", onLens); st.removeEventListener("mouseout", offLens); };
  }, []);

  const setV = (i: number, v: number) => setView((a) => a.map((x, j) => (j === i ? v : x)));

  return (
    <section id="file" ref={sec} data-tone="light" aria-label="The Drop File" className="relative bg-ink text-bone">
      <h2 className="sr-only">The Drop File — Drop 01</h2>

      {/* desktop: pinned wipe-through. Row 1 = heading, row 2 = thumbs + shirt + text (same row). */}
      <div className="hidden h-[calc(100vh+323vh)] tab:block">
        <div ref={stage} className="sticky top-0 h-dvh overflow-hidden">
          {PIECES.map((p, i) => {
            const vs = VIEWS[i], cur = view[i], backIdx = vs.findIndex((v) => v.label === "Back");
            return (
              <article key={p.id} data-fp={i} data-card="" aria-label={`${p.no} — ${p.name}`}
                className={`absolute inset-0 overflow-hidden ${i ? "invisible [clip-path:inset(0_0_0_100%)]" : "visible"}`}
                style={{ zIndex: i + 1, background: p.field, color: p.fg }}>
                <div data-fin="" className="absolute inset-0 grid grid-cols-[auto_minmax(0,.85fr)_minmax(0,1.15fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-[clamp(20px,3vw,56px)] gap-y-[clamp(6px,1.6vh,18px)] px-gut pb-[clamp(110px,16vh,140px)] pt-[clamp(96px,13vh,120px)] will-change-transform">
                  <div data-fname="" aria-hidden className="display col-span-3 whitespace-nowrap text-[min(7.4vw,14vh)] leading-[.84] will-change-transform">{p.l1} {p.l2}</div>

                  <div className="flex min-h-0 min-w-0 flex-col justify-between gap-5">
                    <div role="group" aria-label={`Views of ${p.name}`} className="flex flex-col gap-2">
                      {vs.map((v, j) => (
                        <button key={j} onClick={() => setV(i, j)} aria-pressed={j === cur} aria-label={`Show ${v.label}`} title={v.label}
                          className={`relative block aspect-4/5 w-[min(58px,8vh)] flex-none cursor-pointer overflow-hidden border-2 p-0 transition-[border-color,box-shadow,opacity] duration-350 ${j === cur ? "border-acid opacity-100" : "opacity-70"}`}
                          style={{ background: p.field, borderColor: j === cur ? undefined : p.faint, boxShadow: j === cur ? `0 0 0 1px ${p.fg}` : "none" }}>
                          <span className={`absolute inset-0 ${v.kind === "img" ? "p-[8%]" : ""}`} style={{ transform: v.kind === "crop" ? `scale(${v.zoom})` : "none", transformOrigin: v.origin ?? "50% 50%" }}><ViewImg v={v} /></span>
                        </button>
                      ))}
                    </div>
                    <span aria-hidden className="label text-[11px]" style={{ color: p.mut }}>Hover the garment — look closer</span>
                  </div>

                  <div className="relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3.5">
                    <div className="relative size-full min-h-0 [container-type:size]">
                      <div data-fg={i} className="absolute left-1/2 top-0 h-[min(100cqh,160cqw)] origin-[50%_3%] will-change-transform" style={{ transform: "translateX(-50%)" }}>
                        <div data-lp="" data-lpi={i} data-gvw={p.id} className="relative h-full cursor-zoom-in">
                          <Image data-gar="" className={`block h-full w-auto max-w-none drop-shadow-[0_30px_28px_rgba(0,0,0,.32)] transition-opacity duration-[550ms] ease-out-expo ${cur === 0 ? "opacity-100" : "opacity-0"}`} src={p.img.src} width={p.img.w} height={p.img.h} alt={`${p.name} — ${p.colour}, front`} sizes="(max-width: 1100px) 40vw, 32vw" priority={i === 0} />
                          <div data-lpl="" aria-hidden className={`pointer-events-none absolute inset-0 [clip-path:circle(0px_at_50%_50%)] ${cur === 0 ? "opacity-100" : "opacity-0"}`} style={{ background: p.field }}>
                            <div data-lpz="" className="absolute inset-0 scale-[2.6]">
                              <Image src={p.img.src} width={p.img.w} height={p.img.h} alt="" sizes="60vw" className="size-full max-w-none object-contain" />
                            </div>
                          </div>
                          <span data-lpr="" aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-acid opacity-0" />
                          <span data-lpc="" aria-hidden className="label pointer-events-none absolute left-0 top-0 flex items-center gap-[7px] whitespace-nowrap px-2.5 py-[7px] text-[10px] opacity-0" style={{ background: p.fg, color: p.field }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M7.7 7.7L11 11" stroke="currentColor" strokeWidth="1.4" /></svg>Look closer
                          </span>
                        </div>
                      </div>
                      {vs.map((v, j) => j > 0 && <Layer key={j} p={p} v={v} on={cur === j} />)}
                    </div>
                    <div className="grid h-[76px] min-w-0 content-start justify-items-center gap-2.5">
                      {backIdx > 0 && (
                        <div role="group" aria-label="Front or back" className="flex gap-0.5 border p-[3px]" style={{ borderColor: p.line }}>
                          {[["Front", 0], ["Back", backIdx]].map(([l, t]) => (
                            <button key={l as string} onClick={() => setV(i, t as number)} aria-pressed={cur === t} className="label h-9 min-w-[76px] cursor-pointer border-0 px-4 text-[11px] transition-[background,color] duration-350"
                              style={{ background: cur === t ? p.fg : "transparent", color: cur === t ? p.field : p.fg }}>{l}</button>
                          ))}
                        </div>
                      )}
                      <span aria-live="polite" className="label max-w-full truncate text-[11px]" style={{ color: p.mut }}>{count(cur, vs.length)} — {vs[cur].label}</span>
                    </div>
                  </div>

                  <div className="flex min-h-0 min-w-0 max-w-[520px] flex-col justify-center gap-[clamp(12px,2.2vh,20px)] self-stretch">
                    <span data-fr="" className="label" style={{ color: p.mut }}>{p.code} · {p.colour} · {p.tech}</span>
                    <p data-fr="" className="serif m-0 text-[clamp(28px,2.6vw,44px)] italic leading-[1.04] tracking-[-.01em] text-balance">{p.copy}</p>
                    <div data-fr="" className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                      <span className="text-[34px] font-medium">{inr(p.price)}</span>
                      <span className="label" style={{ color: p.mut }}>{p.type} · 240 GSM · Oversized</span>
                    </div>
                    <div data-fr="" className="max-w-[440px]"><AddBox piece={p} sizeH={52} addH={60} minAdd={220} /></div>
                  </div>
                </div>
              </article>
            );
          })}
          <span data-k="fSeam" aria-hidden className="pointer-events-none absolute inset-y-0 left-full z-22 -ml-px w-[3px] bg-acid opacity-0" />
          <span data-k="fSeamTag" aria-hidden className="label pointer-events-none absolute left-full top-1/2 z-23 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-acid px-3 py-2 text-[11px] text-ink opacity-0" />
          <div data-k="fTop" className="label pointer-events-none absolute inset-x-gut top-[clamp(64px,9vh,84px)] z-25 flex justify-between gap-4 text-ink transition-colors duration-500">
            <span>The Drop File — Drop 01</span><span data-k="fCount">01 / 04</span>
          </div>
          <nav data-k="fHud" aria-label="Pieces in the Drop File" className="absolute inset-x-gut bottom-[clamp(28px,5vh,52px)] z-25 grid grid-cols-4 gap-3 text-ink transition-colors duration-500">
            {PIECES.map((p, i) => (
              <button key={p.id} data-fidx={i} onClick={() => goPiece(i)} aria-label={`Go to ${p.name}`}
                className="label flex min-h-11 cursor-pointer flex-col items-start gap-2.5 border-0 bg-transparent px-0 py-1.5 text-left text-[11px] text-inherit opacity-55 transition-opacity duration-300">
                <span className="relative block h-0.5 w-full overflow-hidden">
                  <span className="absolute inset-0 bg-current opacity-30" />
                  <span data-k="fbar" className="absolute inset-0 origin-left scale-x-0 bg-current" />
                </span>
                <span>{p.no} — {p.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* mobile: stacked cards with swipeable views */}
      <div className="grid pt-[84px] tab:hidden">
        <div className="flex flex-col gap-2.5 px-4 pb-5">
          <span className="display text-[19vw] leading-[.8]">The Drop File</span>
          <span className="label text-[11px] text-stone">Four pieces — swipe each one for every angle</span>
        </div>
        {PIECES.map((p, i) => <MobCard key={p.id} p={p} i={i} />)}
      </div>
    </section>
  );
}

function MobCard({ p, i }: { p: Piece; i: number }) {
  const vs = VIEWS[i];
  const [cur, setCur] = useState(0);
  return (
    <article data-mfile="" data-card="" aria-label={`${p.no} — ${p.name}`} className="flex flex-col" style={{ background: p.field, color: p.fg }}>
      <div className="relative h-[60svh] min-h-[380px] overflow-hidden [container-type:inline-size]">
        <div aria-hidden className="display pointer-events-none absolute left-4 top-4 whitespace-nowrap text-[17cqw] leading-[.8]">{p.l1}<br />{p.l2}</div>
        <div onScroll={(e) => setCur(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
          {vs.map((v, j) => (
            <div key={j} className="relative h-full flex-[0_0_100%] snap-start">
              {v.kind === "photo" ? (
                <Image src={v.img.src} width={v.img.w} height={v.img.h} alt={`${p.name} — ${v.label}`} sizes="100vw" loading="lazy" className="absolute inset-x-4 bottom-11 top-[30cqw] h-auto min-h-0 w-[calc(100%-32px)] max-w-none object-cover" />
              ) : (
                <Image data-gar={j === 0 ? "" : undefined} src={v.img.src} width={v.img.w} height={v.img.h} alt={`${p.name} — ${v.label}`} sizes="70vw" loading={j === 0 ? "eager" : "lazy"}
                  className="absolute left-[58%] top-[12%] h-[84%] w-auto max-w-none drop-shadow-[0_20px_18px_rgba(0,0,0,.32)]"
                  style={{ transform: v.kind === "crop" ? `translateX(-50%) scale(${v.zoom})` : "translateX(-50%)", transformOrigin: v.origin ?? "50% 50%" }} />
              )}
            </div>
          ))}
        </div>
        <span aria-live="polite" className="label pointer-events-none absolute right-4 top-4 text-[11px]">{count(cur, vs.length)}</span>
        <span className="label pointer-events-none absolute bottom-3.5 left-4 right-[52px] truncate text-[11px]" style={{ color: p.mut }}>{vs[cur]?.label}</span>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-[26px] pt-4">
        <span className="label text-[11px]" style={{ color: p.mut }}>{p.code} · {p.colour} · {p.tech}</span>
        <p className="serif m-0 text-2xl italic leading-[1.08] text-balance">{p.copy}</p>
        <span className="text-[26px] font-medium">{inr(p.price)}</span>
        <AddBox piece={p} sizeH={48} addH={54} />
      </div>
    </article>
  );
}
