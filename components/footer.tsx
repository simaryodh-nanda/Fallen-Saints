"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PIECES, inr } from "@/lib/pieces";
import { QuickView } from "./quick-view";
import { Halo } from "./halo";
import { HemEdge } from "./hem-edge";
import { Wardrobe } from "./wardrobe";
import { cl, frame, goPiece, io, reduced } from "@/lib/motion";
import { useBag } from "./bag";

type Slot = { p: number; hx: number; cx: number; rot: number; sc: number; up: number };

// Where each garment hangs on the rail, and where it ends up lying on the wordmark.
const ftSet = (mob: boolean): Slot[] =>
  mob
    ? [
        { p: 0, hx: 0.14, cx: 0.22, rot: -84, sc: 1, up: 0.3 },
        { p: 1, hx: 0.38, cx: 0.78, rot: 92, sc: 0.96, up: 0.3 },
        { p: 2, hx: 0.62, cx: 0.5, rot: 76, sc: 1, up: 0.3 },
        { p: 3, hx: 0.86, cx: 0.46, rot: -100, sc: 0.84, up: 0.3 },
      ]
    : [
        { p: 0, hx: 0.1, cx: 0.2, rot: -86, sc: 0.96, up: 0.3 },
        { p: 3, hx: 0.26, cx: 0.82, rot: 94, sc: 0.94, up: 0.3 },
        { p: 1, hx: 0.42, cx: 0.5, rot: 82, sc: 1, up: 0.3 },
        { p: 2, hx: 0.58, cx: 0.35, rot: -64, sc: 0.9, up: 0.3 },
        { p: 0, hx: 0.74, cx: 0.66, rot: 112, sc: 0.88, up: 0.3 },
        { p: 2, hx: 0.9, cx: 0.52, rot: -96, sc: 0.8, up: 0.3 },
      ];


export function Footer() {
  const { setOpen, count } = useBag();
  const root = useRef<HTMLElement>(null);
  const [w, setW] = useState(1280);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [joined, setJoined] = useState(false);
  const [fallen, setFallen] = useState(false);
  const api = useRef<{ drop: () => void; hang: () => void }>({ drop() {}, hang() {} });
  const [quick, setQuick] = useState<{ p: number; x: number; y: number; k: number } | null>(null);
  const mob = w < 760;
  const set = ftSet(mob);
  const gh = mob ? Math.round(w * 0.3) : Math.round(Math.min(w * 0.17, 320));

  useEffect(() => {
    const on = () => setW(innerWidth);
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);

  // Hanging-rail garments fly down onto the wordmark as the footer scrolls in.
  useEffect(() => {
    const ft = root.current!, rm = reduced();
    const sc = ft.querySelector<HTMLElement>('[data-k="ftScene"]')!, rl = ft.querySelector<HTMLElement>('[data-k="ftRail"]')!;
    const els = [...ft.querySelectorAll<HTMLElement>("[data-ft]")];
    let geo: { key: string; ok: boolean; g: { w: number; h: number; d: Slot; hx: number; hy: number; px: number; py: number }[] } | null = null;
    const FTS: ({ x: number; y: number; a: number; s: number; vx: number; vy: number; va: number } | null)[] = els.map(() => null);
    // Per-shirt drag state: while dragging it follows the pointer; released near the wire it re-hangs there.
    const ST = els.map(() => ({ drag: false, gx: 0, gy: 0, px: 0, py: 0, sx: 0, sy: 0, moved: false, pin: null as number | null, trig: false, vx: 0, vy: 0, free: false, hit: false, rest: null as { x: number; y: number; a: number } | null, dropAt: 0, home: false }));
    const ac = new AbortController();
    const local = (e: PointerEvent) => { const fr = ft.getBoundingClientRect(); return { x: e.clientX - fr.left, y: e.clientY - fr.top }; };
    els.forEach((el, k) => {
      const S = ST[k], sig = { signal: ac.signal };
      el.addEventListener("pointerdown", (e) => {
        const R = FTS[k];
        if (!R) return;
        const p = local(e);
        S.free = false; S.rest = null; S.dropAt = 0; S.vx = 0; S.vy = 0;
        S.drag = true; S.moved = false; S.px = p.x; S.py = p.y; S.sx = e.clientX; S.sy = e.clientY; S.gx = p.x - R.x; S.gy = p.y - R.y;
        try { el.setPointerCapture(e.pointerId); } catch {}
        el.style.cursor = "grabbing";
      }, sig);
      el.addEventListener("pointermove", (e) => {
        if (!S.drag) {
          // brushing past a hanging shirt makes it swing
          const R = FTS[k];
          if (R && !S.free && !S.rest) R.va += cl(e.movementX * 0.12, -3, 3);
          return;
        }
        S.vx = S.vx * 0.6 + e.movementX * 0.4; S.vy = S.vy * 0.6 + e.movementY * 0.4;
        const p = local(e);
        S.px = p.x; S.py = p.y;
        if (Math.hypot(e.clientX - S.sx, e.clientY - S.sy) > 6) { S.moved = true; S.pin = null; }
      }, sig);
      const release = (e: PointerEvent) => {
        if (!S.drag) return;
        S.drag = false;
        el.style.cursor = "grab";
        if (!S.moved) {
          // a shirt that is on the rail when you open it stays on the rail
          const q = geo?.g[k], R = FTS[k];
          if (q && R && S.pin == null && Math.abs(R.y - q.hy) < q.h * 0.25) S.pin = R.x;
          // plain click → quick add-to-bag for this piece
          setQuick({ p: ftSet(innerWidth < 760)[k]?.p ?? 0, x: e.clientX, y: e.clientY, k });
          return;
        }
        setQuick(null);
        const q = geo?.g[k], R = FTS[k];
        if (!q || !R) return;
        const fr = ft.getBoundingClientRect(), rr = rl.getBoundingClientRect();
        const hx = S.px - S.gx, hy = S.py - S.gy, L = rr.left - fr.left, Rt = rr.right - fr.left, ry = rr.top - fr.top;
        if (Math.abs(hy - (ry + 2)) < Math.max(70, q.h * 0.45) && hx > L - 40 && hx < Rt + 40) {
          S.pin = cl(hx, L + 14, Rt - 14); // re-hung on the wire
          R.va += (S.pin - R.x) * 0.02 + (k % 2 ? 1 : -1) * 1.4;
        } else {
          // let go elsewhere → it falls under gravity (carrying the throw) and lands on the wordmark
          S.pin = null; S.free = true; S.hit = false; S.home = false;
          R.vx = cl(S.vx * 0.9, -26, 26); R.vy = cl(S.vy * 0.9, -26, 26); R.va = cl(S.vx * 0.6, -14, 14);
        }
      };
      el.addEventListener("pointerup", release, sig);
      el.addEventListener("pointercancel", release, sig);
    });

    const doors = ft.querySelector<HTMLElement>('[data-k="ftDoors"]');
    let open = rm;
    const setDoors = (v: boolean) => { if (v && !open) openedAt = performance.now(); open = v; if (doors) doors.dataset.open = String(v); };
    setDoors(rm);
    const DOOR_MS = 900; // shirts start falling once the doors are mostly open
    let openedAt = rm ? -1e9 : 0;

    const dropOne = (k: number, delay: number) => {
      const S = ST[k], R = FTS[k], q = geo?.g[k];
      S.pin = null; S.rest = null; S.drag = false;
      if (!R || !q) return;
      if (rm) { S.rest = { x: q.px, y: q.py, a: q.d.rot }; return; }
      S.dropAt = performance.now() + delay;
    };
    api.current = {
      drop: () => { setDoors(true); const wait = Math.max(0, openedAt + DOOR_MS - performance.now()); els.forEach((_, k) => dropOne(k, wait + k * 120)); },
      hang: () => els.forEach((_, k) => {
        const S = ST[k], q = geo?.g[k];
        S.free = false; S.rest = null; S.dropAt = 0;
        if (q) S.pin = q.hx;
      }),
    };

    const geom = (W: number) => {
      const key = `${W}:${ft.offsetHeight}:${sc.offsetHeight}`;
      if (geo && geo.key === key && geo.ok) return geo;
      const fr = ft.getBoundingClientRect(), sr = sc.getBoundingClientRect(), rr = rl.getBoundingClientRect(), s = ftSet(W < 760);
      let ok = true;
      const g = els.map((el, k) => {
        const d = s[k] || s[0], h = el.offsetHeight, ww = el.offsetWidth || h * 0.63;
        if (!el.offsetWidth) ok = false;
        const rad = (d.rot * Math.PI) / 180, dd = 0.47 * h * d.sc;
        const cx = sr.left - fr.left + d.cx * sr.width, cy = sr.bottom - fr.top - d.up * h;
        return { w: ww, h, d, hx: rr.left - fr.left + d.hx * rr.width, hy: rr.top - fr.top + 2, px: cx + dd * Math.sin(rad), py: cy - dd * Math.cos(rad) };
      });
      return (geo = { key, ok, g });
    };

    const stopFrame = frame((f, now) => {
      const W = innerWidth, H = innerHeight, fr = ft.getBoundingClientRect();
      // doors open once the footer is well into view, and close again when it leaves (with some hysteresis)
      if (!rm) { if (fr.top < H * 0.55) setDoors(true); else if (fr.top > H * 0.92) setDoors(false); }
      if (fr.top > H + 200 || fr.bottom < -200) return;
      const G = geom(W);
      const n = Math.ceil(f), fs = f / n, m = W < 760;
      // the shirts hang from the rail just above the wordmark, and only drop onto the text over the final
      // ~300px of scrolling — so they are always seen hanging first, whatever the screen height
      const rem = document.documentElement.scrollHeight - innerHeight - scrollY;
      const railOn = rl.getBoundingClientRect().top < H * 0.85;
      const s = railOn ? (Math.min(300, H * 0.35) - rem) / Math.min(300, H * 0.35) : 0;
      els.forEach((el, k) => {
        const q = G.g[k];
        if (!q) return;
        const u = rm ? 1 : 0, d = q.d;
        const sway = rm || u > 0 ? 0 : Math.sin(now * 0.0012 + k * 1.9) * 1.6;
        const drift = (k % 2 ? 1 : -1) * (m ? 10 : 26) * Math.sin(u * Math.PI);
        const tx = q.hx + (q.px - q.hx) * io(u) + drift, ty = q.hy + (q.py - q.hy) * u * u;
        const ta = sway + d.rot * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) + (k % 2 ? -1 : 1) * 10 * Math.sin(u * Math.PI);
        let ts = 1 + (d.sc - 1) * u, ttx = tx, tty = ty, tta = ta;
        const S = ST[k];
        // reaching the footer knocks every shirt off the rail; scrolling back up re-hangs them
        if (!rm) {
          if (s > 0.15 && !S.trig) {
            S.trig = true;
            if (!S.drag && !S.free && !S.rest && S.pin == null) S.dropAt = Math.max(now, openedAt + DOOR_MS) + k * 120;
          } else if (s <= 0 && S.trig) {
            S.trig = false; S.free = false; S.rest = null; S.pin = null; S.dropAt = 0;
          }
        }
        if (S.dropAt && now >= S.dropAt) {
          S.dropAt = 0; S.free = true; S.hit = false; S.home = true;
          const R0 = FTS[k];
          if (R0) { R0.vx = (k % 2 ? 1 : -1) * 0.6; R0.vy = -1.2; R0.va = (k % 2 ? 1 : -1) * 1.2; }
        }
        const FR = FTS[k];
        if (S.free && FR && !S.drag) {
          // gravity: a soft fall that eases toward its spot and its lying angle, one small bounce, then settles
          const fl = q.py, lo = q.h * 0.45, hi = W - q.h * 0.45;
          for (let j = 0; j < n; j++) {
            FR.vy += 0.55 * fs;
            if (S.home) FR.vx += (q.px - FR.x) * 0.008 * fs;
            FR.vx *= Math.pow(0.97, fs);
            FR.va += (d.rot - FR.a) * 0.012 * fs; FR.va *= Math.pow(0.93, fs);
            FR.y += FR.vy * fs; FR.x += FR.vx * fs; FR.a += FR.va * fs;
            if (FR.x < lo || FR.x > hi) { FR.x = cl(FR.x, lo, hi); FR.vx *= -0.3; }
            if (FR.y >= fl) {
              FR.y = fl; S.hit = true;
              FR.vy = FR.vy > 4 ? -FR.vy * 0.22 : 0; FR.vx *= 0.8; FR.va *= 0.85;
            }
          }
          // hand over to the spring once it's down, so the last bit of settling is continuous
          if (S.hit && FR.y >= fl && FR.vy === 0) { S.rest = { x: S.home ? q.px : FR.x, y: fl, a: d.rot }; S.free = false; }
          FR.s += (d.sc - FR.s) * (1 - Math.pow(0.92, f));
          el.style.zIndex = String(40 + k);
          el.style.transform = `translate(${(FR.x - q.w / 2).toFixed(1)}px,${(FR.y - 0.03 * q.h).toFixed(1)}px) rotate(${FR.a.toFixed(2)}deg) scale(${FR.s.toFixed(3)})`;
          return;
        }
        if (S.drag) { ttx = S.px - S.gx; tty = S.py - S.gy; tta = cl((ttx - (FTS[k]?.x ?? ttx)) * 0.4, -16, 16); ts = 1; }
        else if (S.rest) { ttx = S.rest.x; tty = S.rest.y; tta = S.rest.a; ts = d.sc; }
        else if (S.pin != null) { ttx = S.pin; tty = q.hy; tta = Math.sin(now * 0.0012 + k * 1.9) * 1.6; ts = 1; }
        let R = FTS[k];
        if (!R || (rm && !S.drag && S.pin == null)) R = FTS[k] = { x: ttx, y: tty, a: tta, s: ts, vx: 0, vy: 0, va: 0 };
        for (let j = 0; j < n; j++) {
          R.vx = (R.vx + (ttx - R.x) * 0.16 * fs) * Math.pow(0.7, fs); R.x += R.vx * fs;
          R.vy = (R.vy + (tty - R.y) * 0.16 * fs) * Math.pow(0.7, fs); R.y += R.vy * fs;
          R.va = (R.va + (tta - R.a) * 0.12 * fs) * Math.pow(0.74, fs); R.a += R.va * fs;
        }
        R.s += (ts - R.s) * (1 - Math.pow(0.88, f));
        el.style.zIndex = String(u > 0 ? 10 + k : 1);
        el.style.transform = `translate(${(R.x - q.w / 2).toFixed(1)}px,${(R.y - 0.03 * q.h).toFixed(1)}px) rotate(${R.a.toFixed(2)}deg) scale(${R.s.toFixed(3)})`;
        if (S.drag || S.pin != null || S.rest) el.style.zIndex = String(40 + k);
      });
    });
    return () => { stopFrame(); ac.abort(); };
  }, [w]);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return setErr("Add your email first.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setErr("That email doesn’t look right — check it and try again.");
    setJoined(true);
  };

  const tick = [...PIECES, ...PIECES];
  const bar = "rail-bar bg-[linear-gradient(180deg,#8a837a_0%,#3a3632_45%,#1e1c1a_70%,#5a544d_100%)]";
  const colHead = "pb-2 text-stone";
  const colLink = "py-2";

  return (
    <footer ref={root} data-tone="dark" style={{ "--spacing-gut": "clamp(40px,5vw,76px)" } as React.CSSProperties} className="relative isolate flex flex-col gap-[clamp(36px,6vh,72px)] overflow-hidden bg-ink pb-6 pt-[clamp(72px,11vh,118px)] text-bone">
      <HemEdge className="absolute inset-x-0 top-0 z-4" />
      {/* the whole footer is a wardrobe: doors open as it scrolls into view, clothes fall when you reach the bottom */}
      <Wardrobe />
      <div className="pointer-events-none absolute inset-0 z-3">
        {set.map((s, k) => (
          <div key={k} data-ft={k} role="button" tabIndex={0} aria-label={`${PIECES[s.p].name} — drag to move, click to add to bag`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setQuick({ p: s.p, x: r.left + r.width / 2, y: r.bottom, k }); } }}
            className="pointer-events-auto absolute left-0 top-0 origin-[50%_3%] cursor-grab touch-none select-none will-change-transform"
            style={{ height: gh, transform: "translate(-200vw,0)" }}>
            <Image data-gar="" draggable={false} src={PIECES[s.p].img.src} width={PIECES[s.p].img.w} height={PIECES[s.p].img.h} alt="" sizes="20vw" loading="lazy"
              className="block h-full w-auto max-w-none brightness-[1.06] drop-shadow-[0_0_1.5px_rgba(236,230,218,.3)] drop-shadow-[0_26px_22px_rgba(0,0,0,.7)]" />
          </div>
        ))}
      </div>

      <div id="list" className="grid scroll-mt-[90px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-x-[clamp(40px,6vw,110px)] gap-y-8 px-gut">
        <h2 data-reveal="0" className="display m-0 flex flex-col text-[clamp(64px,9vw,170px)] leading-[.82]">
          <span>Next drop.</span>
          <span className="relative self-start">No noise.
            <span aria-hidden className="absolute -inset-x-[5%] -bottom-[10%] -top-[14%] -rotate-6 rounded-[50%] border-[3px] border-acid" />
          </span>
        </h2>
        <div className="flex max-w-[560px] flex-col gap-[18px]">
          <p className="m-0 text-lg leading-normal text-ash">Get an email when the next release is announced.</p>
          {joined ? (
            <div role="status" className="flex flex-col gap-2.5 border-y border-bone/30 py-[18px]">
              <span className="serif text-[30px] leading-[1.05] break-words">Noted — {email}</span>
              <span className="label text-[11px] leading-[1.6] text-stone">Signup isn’t connected in this prototype — you haven’t been subscribed yet.</span>
            </div>
          ) : (
            <form onSubmit={join} noValidate className="flex flex-col gap-2.5">
              <label htmlFor="ba-email" className="label text-[11px] text-stone">Your email</label>
              <div className="flex flex-wrap items-end gap-3">
                <input id="ba-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} aria-invalid={!!err} aria-describedby="ba-email-err" placeholder="name@email.com"
                  className={`serif h-[58px] min-w-0 flex-[1_1_240px] border-0 border-b-2 bg-transparent px-0.5 text-[26px] text-bone outline-none ${err ? "border-[#F2B8B5]" : "border-bone/50"}`} />
                <button type="submit" className="label h-14 cursor-pointer border-0 bg-acid px-[26px] text-ink active:scale-[.96]">Keep me in the loop</button>
              </div>
              <span id="ba-email-err" role="alert" className="label min-h-[18px] tracking-[.06em] text-[#F2B8B5]">{err}</span>
            </form>
          )}
        </div>
      </div>

      <div className="group overflow-hidden border-y border-bone/18">
        <div className="flex w-max animate-tick will-change-transform group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {tick.map((p, k) => {
            const dup = k >= PIECES.length;
            return (
              <button key={k} onClick={() => goPiece(PIECES.indexOf(p))} tabIndex={dup ? -1 : 0} aria-hidden={dup} aria-label={`View ${p.name}, ${inr(p.price)}`}
                className="flex h-[72px] cursor-pointer items-baseline gap-4 whitespace-nowrap border-0 bg-transparent pl-0 pr-[34px] text-inherit hover:text-acid">
                <span className="label text-[11px] text-stone">{p.code}</span>
                <span className="text-[34px] font-bold uppercase leading-[72px] font-stretch-[72%]">{p.name}</span>
                <span className="text-[17px]">{inr(p.price)}</span>
                <span aria-hidden className="pl-[18px] text-mute">●</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="label grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-7 px-gut">
        <div className="flex flex-col items-start gap-0.5"><span className={colHead}>Shop</span><a href="#pieces" className={colLink}>The pieces</a><a href="#file" className={colLink}>The Drop File</a><button onClick={() => setOpen(true)} className={`${colLink} cursor-pointer border-0 bg-transparent text-left text-inherit uppercase`}>Bag ({count})</button></div>
        <div className="flex flex-col items-start gap-0.5"><span className={colHead}>Choose</span><a href="#making" className={colLink}>Size guide</a><a href="#making" className={colLink}>Fabric &amp; fit</a><a href="/our-story" className={colLink}>Our story</a></div>
        <div className="flex flex-col items-start gap-0.5"><span className={colHead}>Help</span><span className={colLink}>Shipping</span><span className={colLink}>Returns</span><span className={colLink}>Care</span></div>
      </div>

      <div className="relative px-gut">
      <div data-k="ftWard" aria-hidden className="relative z-2" style={{ height: 14 }}>
    <span data-k="ftRail" className={`absolute inset-x-0 top-0 h-1 rounded-xs shadow-[0_3px_8px_rgba(0,0,0,.7)] ${bar}`} />
    <span className={`absolute -top-2.5 left-0 h-6 w-2 rounded-xs ${bar}`} /><span className={`absolute -top-2.5 right-0 h-6 w-2 rounded-xs ${bar}`} />
  </div>
        <div data-k="ftScene" className="display relative overflow-hidden text-[clamp(56px,15.2vw,300px)] leading-[.86]" style={{ paddingTop: Math.round(gh * 1.0), paddingBottom: Math.round(gh * 0.6) }}>
          <div data-reveal="0" className="relative z-1 whitespace-nowrap leading-[.78]">
            Beyond Angels
            <Halo tone="maroon" className="absolute -top-[.36em] right-[1%] z-4 w-[.7em] -rotate-12" />
          </div>
        </div>
        <div className="label mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 text-[11px] text-stone">
          <span>© 2026 Beyond Angels</span>
          <span>Prototype — stand-in imagery · payments &amp; email not connected</span>
          <button onClick={() => { if (fallen) api.current.hang(); else api.current.drop(); setFallen(!fallen); }} className="cursor-pointer border-0 bg-transparent py-3 text-left text-inherit uppercase hover:text-acid">{fallen ? "Hang them back ↑" : "Let them fall ↓"}</button>
          <button onClick={() => scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" })} className="cursor-pointer border-0 bg-transparent py-3 text-left text-inherit uppercase">Back to top ↑</button>
        </div>
      </div>

      <QuickView open={quick ? { p: quick.p, x: quick.x, y: quick.y } : null} onClose={() => setQuick(null)} />
    </footer>
  );
}
