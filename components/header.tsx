"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PIECES } from "@/lib/pieces";
import { EASE, frame, reduced } from "@/lib/motion";
import { useBag } from "./bag";

const LINKS = [
  { k: "pieces", label: "Pieces", href: "/#pieces" },
  { k: "file", label: "Drop file", href: "/#file" },
  { k: "making", label: "Details", href: "/#making" },
  { k: "story", label: "Our story", href: "/our-story" },
] as const;

const MENU = [
  { k: "pieces", n: "01", label: "The pieces", img: PIECES[0].img, bg: "#DDD5C6", fit: "contain", pad: "10%", cap: "Four pieces — available now" },
  { k: "file", n: "02", label: "Drop file", img: PIECES[2].img, bg: "#A23A35", fit: "contain", pad: "10%", cap: "Look closer" },
  { k: "making", n: "03", label: "Details", img: PIECES[0].photo!, bg: "#0F0E0D", fit: "cover", pad: "0", cap: "Fabric, fit, stitch" },
  { k: "story", n: "04", label: "Our story", img: PIECES[0].img, bg: "#ECE6DA", fit: "contain", pad: "10%", cap: "Not made to fit in" },
  { k: "list", n: "05", label: "Next drop", img: PIECES[3].img, bg: "#CFC6B4", fit: "contain", pad: "10%", cap: "An email when it’s announced" },
  { k: "bag", n: "06", label: "Bag", img: PIECES[1].img, bg: "#1A1817", fit: "contain", pad: "10%", cap: "What you’ve already decided" },
] as const;

export function Header() {
  const router = useRouter();
  const { count, setOpen, menu, setMenu } = useBag();
  const nav = useRef<HTMLElement>(null);
  const menuEl = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(0);
  const hoverLink = useRef<string | null>(null);
  const act = useRef<string | null>(null);

  const paint = () => {
    nav.current?.querySelectorAll<HTMLElement>("[data-nav]").forEach((a) => {
      const k = a.dataset.nav, on = k === act.current || k === hoverLink.current;
      const ln = a.querySelector<HTMLElement>("[data-navline]");
      if (ln) ln.style.transform = on ? "scaleX(1)" : "scaleX(0)";
      if (k === act.current) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  };

  // Tone-aware, hide-on-scroll-down header (same rules as the reference).
  useEffect(() => {
    const el = nav.current!;
    let lsy: number | null = null, hidden = false, key = "";
    return frame(() => {
      const H = innerHeight;
      let tone = "dark";
      document.querySelectorAll<HTMLElement>("[data-tone]").forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= 30 && r.bottom > 30) tone = s.dataset.tone!;
      });
      const sy = scrollY, dsy = sy - (lsy ?? sy);
      lsy = sy;
      const solid = sy > 140;
      if (!solid) hidden = false; else if (dsy > 3) hidden = true; else if (dsy < -3) hidden = false;
      if (document.querySelector("[data-hdr-blend]")) {
        if (el.dataset.blend !== "1") { el.dataset.blend = "1"; el.style.transform = "none"; el.style.mixBlendMode = "difference"; el.style.color = "#ECE6DA"; el.style.backgroundColor = "transparent"; el.style.backdropFilter = "none"; key = ""; }
        return;
      }
      if (el.dataset.blend === "1") { el.dataset.blend = "0"; key = ""; }
      const nk = tone + (solid ? "s" : "") + (hidden ? "h" : "");
      if (nk !== key) {
        key = nk;
        const lt = tone === "light";
        el.style.transform = hidden ? "translateY(-110%)" : "none";
        el.style.mixBlendMode = !solid && tone === "split" ? "difference" : "normal";
        el.style.color = lt ? "#0F0E0D" : "#ECE6DA";
        el.style.backgroundColor = solid ? (lt ? "rgba(236,230,218,.94)" : "rgba(15,14,13,.92)") : "transparent";
        el.style.backdropFilter = solid ? "blur(10px)" : "none";
      }
      let a: string | null = null;
      for (const id of ["pieces", "file", "making"]) {
        const s = document.getElementById(id);
        if (s) { const r = s.getBoundingClientRect(); if (r.top <= H * 0.4 && r.bottom > H * 0.4) a = id; }
      }
      if (a !== act.current) { act.current = a; paint(); }
    });
  }, []);

  // Menu link rise on open.
  useEffect(() => {
    if (!menu || reduced()) return;
    menuEl.current?.querySelectorAll<HTMLElement>("[data-mlink]").forEach((n, i) =>
      n.animate([{ transform: "translateY(105%)" }, { transform: "none" }], { duration: 800, delay: 180 + i * 60, easing: EASE, fill: "backwards" }));
    setTimeout(() => menuEl.current?.querySelector<HTMLElement>("[data-first]")?.focus({ preventScroll: true }), 40);
  }, [menu]);

  const go = (e: React.MouseEvent, k: string) => {
    e.preventDefault();
    setMenu(false);
    if (k === "bag") { setTimeout(() => setOpen(true), 300); return; }
    if (k === "story") { router.push("/our-story"); return; }
    setTimeout(() => { const t = document.getElementById(k); if (t) t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); else router.push(`/#${k}`); }, 250);
  };

  return (
    <>
      <header
        ref={nav}
        className="pointer-events-none fixed inset-x-0 top-0 z-300 flex items-center justify-between gap-4 px-gut py-2.5 text-bone mix-blend-difference transition-[transform,background-color] duration-500 ease-io"
      >
        <Link href="/" className="display pointer-events-auto text-[26px] leading-none tracking-[.01em]">Beyond Angels</Link>
        <nav aria-label="Primary" className="label pointer-events-auto hidden gap-[30px] mid:flex">
          {LINKS.map((l) => (
            <Link key={l.k} href={l.href} data-nav={l.k}
              onMouseEnter={() => { hoverLink.current = l.k; paint(); }}
              onMouseLeave={() => { hoverLink.current = null; paint(); }}
              className="relative block py-3">
              {l.label}
              <span data-navline="" className="absolute inset-x-0 bottom-[7px] h-px origin-left scale-x-0 bg-current transition-transform duration-[450ms] ease-out-expo" />
            </Link>
          ))}
        </nav>
        <div className="pointer-events-auto flex items-center gap-[clamp(14px,2vw,26px)]">
          <button data-k="bag" className="label flex cursor-pointer items-center gap-2 border-0 bg-transparent py-2.5 text-inherit" onClick={() => setOpen(true)} aria-label={`Open bag, ${count} items`}>
            Bag<span data-k="bagN" className="inline-flex h-6 min-w-6 items-center justify-center rounded-xl border border-current px-1.5 text-[11px] tracking-normal">{count}</span>
          </button>
          <button className="label flex cursor-pointer items-center gap-2.5 border-0 bg-transparent py-2.5 text-inherit" onClick={() => setMenu(true)} aria-label="Open index" aria-expanded={menu}>
            Index
            <span className="flex w-[22px] flex-col gap-[5px]">
              <span className="block h-px bg-current" />
              <span className="ml-auto block h-px w-3.5 bg-current" />
            </span>
          </button>
        </div>
      </header>

      <div
        ref={menuEl} role="dialog" aria-modal="true" aria-label="Index" aria-hidden={!menu}
        className={`fixed inset-0 z-500 flex flex-col bg-ink text-bone transition-[clip-path,visibility] duration-[750ms] ease-io ${menu ? "visible [clip-path:inset(0_0_0%_0)] delay-0" : "invisible [clip-path:inset(0_0_100%_0)] [transition-delay:0s,.75s]"}`}
      >
        <div className="flex items-center justify-between gap-4 px-gut py-2.5">
          <span className="display text-[26px] leading-none">Beyond Angels</span>
          <button data-first="" onClick={() => setMenu(false)} className="label flex h-11 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-inherit">
            Close <span className="text-lg">×</span>
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-[clamp(20px,4vw,64px)] px-gut py-[clamp(10px,3vh,40px)] tab:grid-cols-[1.15fr_1fr]">
          <nav aria-label="Index" className="flex flex-col justify-center border-t border-bone/15">
            {MENU.map((m, i) => (
              <Link key={m.k} href={m.k === "story" ? "/our-story" : `/#${m.k === "bag" ? "top" : m.k}`} onClick={(e) => go(e, m.k)} onMouseEnter={() => setHov(i)} onFocus={() => setHov(i)}
                className="group flex items-baseline gap-[clamp(14px,2vw,28px)] overflow-hidden border-b border-bone/15 py-[clamp(6px,1.2vh,14px)] hover:opacity-100">
                <span className="label w-7 flex-none text-stone">{m.n}</span>
                <span data-mlink="" className="display block text-[17vw] leading-[.86] transition-[transform,color] duration-500 ease-out-expo group-hover:translate-x-[18px] group-hover:text-acid tab:text-[min(8.4vw,13vh)]">
                  {m.k === "bag" ? `Bag (${count})` : m.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="relative hidden min-h-0 tab:block">
            {MENU.map((m, i) => (
              <figure key={m.k} className={`absolute inset-0 m-0 flex flex-col gap-2.5 transition-opacity duration-500 ${hov === i ? "opacity-100" : "opacity-0"}`}>
                <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: m.bg }}>
                  <Image src={m.img.src} width={m.img.w} height={m.img.h} alt="" sizes="40vw" className="size-full max-w-none" style={{ objectFit: m.fit, padding: m.pad }} />
                </div>
                <figcaption className="label text-[11px] text-stone">{m.n} — {m.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="label flex flex-wrap justify-between gap-2.5 px-gut pb-[22px] pt-4 text-[11px] text-stone">
          <span className="flex items-center gap-2 text-bone"><span className="size-[9px] rounded-full bg-acid" />Drop 01 — available now</span>
          <span>Prototype — payments not connected</span>
        </div>
      </div>
    </>
  );
}
