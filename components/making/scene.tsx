"use client";

/* Imperative, scroll-driven SVG timeline (per-frame DOM writes), like the site's other motion engines. */

import { forwardRef, useImperativeHandle, useRef } from "react";
import { GSM } from "@/lib/pieces";
import { cl, io, lerp, oc } from "@/lib/motion";

// ── Garment geometry (assembled coordinates, viewBox 600×640). The same paths are the cut panels, the sewn shirt,
//    and the thing that gets folded — so the garment never changes between stages. ──────────────────────────────
const FRONT = "M190 150 L255 150 Q300 192 345 150 L410 150 L410 470 L190 470 Z";
const BACK = "M190 150 L255 150 Q300 168 345 150 L410 150 L410 470 L190 470 Z";
const SLEEVE_L = "M190 150 L120 195 L150 245 L190 215 Z";
const SLEEVE_R = "M410 150 L480 195 L450 245 L410 215 Z";
const COLLAR = "M250 146 Q300 190 350 146 L346 158 Q300 202 254 158 Z";
const INK = "#12100d";
const TABLE = "#DDD5C6";
const HOLE = "#C9BFAB";

type Panel = { k: string; d: string; lx: number; ly: number; ex: number; ey: number; label: string; lc: [number, number]; ls: number };
// lx/ly: where the pattern piece sits on the cloth. ex/ey: how it drifts apart once cut.
const PANELS: Panel[] = [
  { k: "front", d: FRONT, lx: -110, ly: -70, ex: -26, ey: -14, label: "FRONT", lc: [300, 300], ls: 20 },
  { k: "back", d: BACK, lx: 120, ly: -70, ex: 26, ey: -14, label: "BACK", lc: [300, 300], ls: 20 },
  { k: "sleeveL", d: SLEEVE_L, lx: -20, ly: 290, ex: -14, ey: 20, label: "SLEEVE", lc: [155, 200], ls: 9 },
  { k: "sleeveR", d: SLEEVE_R, lx: -210, ly: 290, ex: 14, ey: 20, label: "SLEEVE", lc: [445, 200], ls: 9 },
  { k: "collar", d: COLLAR, lx: 90, ly: 330, ex: 18, ey: 22, label: "NECK", lc: [300, 178], ls: 8 },
];
const CUT_WIN: [number, number][] = [[0.16, 0.3], [0.3, 0.44], [0.44, 0.56], [0.56, 0.68], [0.68, 0.78]];

type Seam = { k: string; d: string; a: number; b: number };
const SEAMS: Seam[] = [
  { k: "shL", d: "M190 152 L252 152", a: 0.3, b: 0.36 },
  { k: "shR", d: "M348 152 L410 152", a: 0.36, b: 0.42 },
  { k: "siL", d: "M192 215 L192 468", a: 0.42, b: 0.48 },
  { k: "siR", d: "M408 215 L408 468", a: 0.48, b: 0.54 },
  { k: "arL", d: "M192 152 L192 215", a: 0.64, b: 0.67 },
  { k: "arR", d: "M408 152 L408 215", a: 0.67, b: 0.7 },
  { k: "coll", d: "M254 156 Q300 198 346 156", a: 0.76, b: 0.84 },
  { k: "hem", d: "M192 458 L408 458", a: 0.84, b: 0.91 },
  { k: "cuL", d: "M130 200 L158 238", a: 0.91, b: 0.95 },
  { k: "cuR", d: "M470 200 L442 238", a: 0.95, b: 1.0 },
];

const EMB = { x: 340, y: 225 }; // chest mark, wearer's left chest — same spot as the product photos

const seg = (p: number, a: number, b: number) => cl((p - a) / (b - a));
/** Dash pattern that reveals a stitched line up to length d. */
function stitch(d: number) {
  const n = Math.floor(d / 8), rem = d - n * 8;
  let s = "";
  for (let i = 0; i < n; i++) s += "4.5 3.5 ";
  return s + `${Math.max(0, Math.min(4.5, rem)).toFixed(2)} 2000`;
}

export type SceneHandle = { update: (p: number, now: number, reduced: boolean) => void; init: () => void };

export const MakingScene = forwardRef<SceneHandle>(function MakingScene(_, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const cache = useRef<{ q: (k: string) => SVGElement | null; ready: boolean; len: Record<string, number>; shown: Record<string, number> } | null>(null);

  useImperativeHandle(ref, () => ({
    init() {
      const el = svg.current!;
      const q = (k: string) => el.querySelector<SVGElement>(`[data-k="${k}"]`);
      const len: Record<string, number> = {};
      el.querySelectorAll<SVGGeometryElement>("[data-len]").forEach((n) => {
        len[n.dataset.len!] = n.getTotalLength();
      });
      cache.current = { q, ready: true, len, shown: {} };
    },
    update(p, now, rm) {
      const c = cache.current;
      if (!c) return;
      const { q, len } = c;
      const st = (k: string, css: Partial<CSSStyleDeclaration>) => { const n = q(k); if (n) Object.assign(n.style, css); return n; };
      const s1 = seg(p, 0, 0.2), s2 = seg(p, 0.2, 0.4), s3 = seg(p, 0.4, 0.6), s4 = seg(p, 0.6, 0.8), s5 = seg(p, 0.8, 1);

      // ── camera ──
      const zoom4 = io(seg(s4, 0, 0.18)) * (1 - io(seg(s4, 0.86, 1)));
      const z1 = 1 - io(s1);
      const scale = lerp(lerp(1, 1.5, z1), 2.4, zoom4);
      const cx = lerp(lerp(300, 220, z1), EMB.x, zoom4), cy = lerp(lerp(320, 190, z1), EMB.y, zoom4);
      st("cam", { transform: `translate(300px,320px) scale(${scale.toFixed(4)}) translate(${-cx.toFixed(1)}px,${-cy.toFixed(1)}px)` });

      // ── 01 fabric: roll unrolls across the mat, folds relax, GSM card pinned ──
      const u = io(seg(s1, 0, 0.8));
      const fc = q("fabClip"); if (fc) fc.setAttribute("width", (u * 480).toFixed(1));
      const rollW = 34 * (1 - 0.72 * u);
      const roll = q("roll"); if (roll) { roll.setAttribute("width", rollW.toFixed(1)); roll.setAttribute("x", (62 - rollW).toFixed(1)); }
      st("folds", { opacity: (1 - 0.85 * io(seg(s1, 0.35, 1))).toFixed(3) });
      const gsm = io(seg(s1, 0.55, 0.8)) * (1 - seg(s2, 0, 0.18));
      st("gsm", { opacity: gsm.toFixed(3), transform: `translateY(${((1 - io(seg(s1, 0.55, 0.8))) * -30).toFixed(1)}px)` });
      st("fabric", { opacity: (1 - io(seg(s3, 0, 0.25))).toFixed(3) });

      // ── 02 pattern + cut ──
      const paperIn = io(seg(s2, 0, 0.14));
      const lift = io(seg(s2, 0.82, 1));
      const mvBody = io(seg(s3, 0, 0.28)), mvSleeve = io(seg(s3, 0.54, 0.64)), mvCollar = io(seg(s3, 0.7, 0.76));
      let active = -1, activeCp = 0;
      PANELS.forEach((P, i) => {
        const [a, b] = CUT_WIN[i], cp = seg(s2, a, b);
        if (cp > 0 && cp < 1) { active = i; activeCp = cp; }
        const mv = i < 2 ? mvBody : i < 4 ? mvSleeve : mvCollar;
        const x = lerp(P.lx, 0, mv) + P.ex * lift * (1 - mv), y = lerp(P.ly, 0, mv) + P.ey * lift * (1 - mv);
        const g = q(`p-${P.k}`);
        if (g) {
          let tf = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
          if (P.k === "sleeveL" || P.k === "sleeveR") {
            const fold = io(seg(s5, 0.2, 0.36));
            tf += ` scale(${Math.max(0.02, 1 - fold).toFixed(3)},1)`; // sleeve folds in behind the body
            g.style.opacity = (1 - seg(fold, 0.6, 1)).toFixed(3);
          }
          g.style.transform = tf;
          const sh = lift * (1 - mv * 0.9);
          const f = sh > 0.01 ? `drop-shadow(0 ${(sh * 10).toFixed(1)}px ${(sh * 9).toFixed(1)}px rgba(0,0,0,${(sh * 0.45).toFixed(2)}))` : "none";
          if (g.dataset.f !== f) { g.style.filter = f; g.dataset.f = f; }
        }
        const fl = q(`fill-${P.k}`); if (fl) fl.style.opacity = cp >= 1 ? "1" : "0";
        const hole = q(`h-${P.k}`); if (hole) hole.style.opacity = (lift * (1 - mv)).toFixed(3);
        const paper = q(`paper-${P.k}`);
        if (paper) { paper.style.opacity = (paperIn * (1 - seg(s2, b, b + 0.05))).toFixed(3); paper.style.transform = `translateY(${((1 - paperIn) * -60).toFixed(1)}px)`; }
        const o = q(`o-${P.k}`);
        if (o) { const L = len[`o-${P.k}`] || 400; o.style.strokeDasharray = String(L); o.style.strokeDashoffset = String(L * (1 - cp)); o.style.opacity = cp > 0.002 ? Math.max(0, 1 - seg(s2, 0.8, 0.9) - mv).toString() : "0"; }
      });
      const sc = q("scissors");
      if (sc) {
        if (active >= 0) {
          const P = PANELS[active], path = q(`o-${P.k}`) as unknown as SVGGeometryElement, L = len[`o-${P.k}`] || 400, d = L * activeCp;
          const a = path.getPointAtLength(Math.min(d, L - 3)), b = path.getPointAtLength(Math.min(d + 3, L));
          const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          const open = rm ? 9 : 4 + 15 * Math.abs(Math.sin(d * 0.3));
          sc.style.transform = `translate(${(a.x + P.lx).toFixed(1)}px,${(a.y + P.ly).toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`;
          sc.style.opacity = "1";
          st("blUp", { transform: `rotate(${-open.toFixed(1)}deg)` });
          st("blLo", { transform: `scale(1,-1) rotate(${-open.toFixed(1)}deg)` });
        } else sc.style.opacity = "0";
      }
      st("cutTag", { opacity: (active >= 0 ? 1 : 0).toString() });

      // ── 03 stitching ──
      let head: { x: number; y: number } | null = null;
      SEAMS.forEach((S) => {
        const L = len[`s-${S.k}`] || 100, prog = seg(s3, S.a, S.b), n = q(`s-${S.k}`) as unknown as SVGGeometryElement | null;
        if (!n) return;
        n.style.strokeDasharray = stitch(L * prog);
        n.style.opacity = prog > 0.01 ? "1" : "0";
        if (prog > 0 && prog < 1) { const pt = n.getPointAtLength(L * prog); head = { x: pt.x, y: pt.y }; }
      });
      const seamDim = io(seg(s4, 0, 0.12));
      st("seams", { opacity: (1 - 0.72 * seamDim).toFixed(3) });
      const sew = q("sew");
      if (sew) {
        const h = head as { x: number; y: number } | null;
        if (h) {
          const bob = rm ? 0 : Math.sin(now * 0.07) * 4;
          sew.style.opacity = "1";
          sew.style.transform = `translate(${h.x.toFixed(1)}px,${(h.y + bob).toFixed(1)}px)`;
        } else sew.style.opacity = "0";
      }
      st("sewTag", { opacity: (head ? 1 : 0).toString() });

      // ── 04 embroidery ──
      const hoop = io(seg(s4, 0.1, 0.22)) * (1 - io(seg(s4, 0.84, 0.94)));
      st("hoop", { opacity: hoop.toFixed(3), transform: `translate(${EMB.x}px,${EMB.y}px) scale(${lerp(1.25, 1, hoop).toFixed(3)})` });
      const parts: [string, number, number][] = [["emRing", 0.2, 0.5], ["emLine", 0.5, 0.62]];
      let needle: { x: number; y: number } | null = null;
      parts.forEach(([k, a, b]) => {
        const L = len[k] || 100, prog = seg(s4, a, b), n = q(k) as unknown as SVGGeometryElement | null;
        if (!n) return;
        n.style.strokeDasharray = stitch(L * prog);
        n.style.opacity = prog > 0.01 ? "1" : "0";
        if (prog > 0 && prog < 1) { const pt = n.getPointAtLength(L * prog); needle = { x: pt.x + EMB.x, y: pt.y + EMB.y }; }
      });
      [["emDot1", 0.62, 0.7], ["emDot2", 0.7, 0.78], ["emRed", 0.78, 0.82]].forEach(([k, a, b]) => {
        const t = oc(seg(s4, a as number, b as number));
        st(k as string, { transform: `scale(${t.toFixed(3)})`, opacity: t > 0 ? "1" : "0" });
      });
      const nd = q("needle");
      if (nd) {
        const nn = needle as { x: number; y: number } | null;
        if (nn) { nd.style.opacity = "1"; nd.style.transform = `translate(${nn.x.toFixed(1)}px,${(nn.y + (rm ? 0 : Math.sin(now * 0.08) * 3)).toFixed(1)}px)`; } else nd.style.opacity = "0";
      }

      // ── 05 QC → fold → box → card → lid ──
      const qc = seg(s5, 0, 0.2);
      const mg = q("lens");
      if (mg) {
        const vis = qc > 0 && qc < 1 ? 1 : 0;
        mg.style.opacity = vis.toString();
        mg.style.transform = `translate(${(300 + Math.sin(qc * Math.PI * 2) * 90).toFixed(1)}px,${(190 + io(qc) * 240).toFixed(1)}px)`;
      }
      st("qcTag", { opacity: (seg(s5, 0.13, 0.19) * (1 - seg(s5, 0.24, 0.3))).toFixed(3) });
      const sx = lerp(1, 0.58, io(seg(s5, 0.36, 0.5))), sy = lerp(1, 0.5, io(seg(s5, 0.5, 0.62))), mvBox = io(seg(s5, 0.62, 0.7));
      st("tee", { transform: `translate(0px,${(110 * mvBox).toFixed(1)}px) translate(300px,150px) scale(${sx.toFixed(4)},${sy.toFixed(4)}) translate(-300px,-150px)` });
      st("creaseV", { opacity: io(seg(s5, 0.36, 0.48)).toFixed(3) });
      st("creaseH", { opacity: io(seg(s5, 0.5, 0.6)).toFixed(3) });
      st("box", { opacity: io(seg(s5, 0.5, 0.6)).toFixed(3) });
      const cp = io(seg(s5, 0.7, 0.82)), lp = io(seg(s5, 0.82, 0.94));
      st("card", { opacity: cl(cp * 3).toFixed(3), transform: `translate(0px,${(-(1 - cp) * 700).toFixed(1)}px) rotate(${(-5 * cp).toFixed(1)}deg)` });
      st("lid", { transform: `translateY(${(-(1 - lp) * 900).toFixed(1)}px)` });
      st("tape", { opacity: io(seg(s5, 0.92, 0.97)).toFixed(3) });
      st("ready", { opacity: io(seg(s5, 0.95, 1)).toFixed(3) });
    },
  }));

  const D = { fill: "none", strokeLinejoin: "round", strokeLinecap: "round" } as const;
  return (
    <svg ref={svg} viewBox="0 0 600 640" role="img" preserveAspectRatio="xMidYMid meet" className="block size-full"
      aria-label="A T-shirt being made: cotton jersey unrolled, pattern cut, panels stitched, chest mark embroidered, then folded, carded and boxed.">
      <defs>
        <pattern id="mk-knit" width="6" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 1 L3 5 L6 1" fill="none" stroke="rgba(236,230,218,.11)" strokeWidth=".8" />
        </pattern>
        <pattern id="mk-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0 H0 V30" fill="none" stroke="rgba(15,14,13,.07)" strokeWidth="1" />
        </pattern>
        <linearGradient id="mk-fold" gradientUnits="userSpaceOnUse" x1="60" y1="60" x2="190" y2="100" spreadMethod="repeat">
          <stop offset="0" stopColor="#ECE6DA" stopOpacity="0" />
          <stop offset=".25" stopColor="#ECE6DA" stopOpacity=".12" />
          <stop offset=".55" stopColor="#000" stopOpacity=".5" />
          <stop offset=".8" stopColor="#ECE6DA" stopOpacity=".07" />
          <stop offset="1" stopColor="#ECE6DA" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mk-roll" x1="0" x2="1">
          <stop offset="0" stopColor="#0a0908" /><stop offset=".45" stopColor="#3a352f" /><stop offset="1" stopColor="#0a0908" />
        </linearGradient>
        <clipPath id="mk-fab"><rect data-k="fabClip" x="62" y="60" width="0" height="520" /></clipPath>
      </defs>

      <rect width="600" height="640" fill={TABLE} />
      <rect width="600" height="640" fill="url(#mk-grid)" />

      <g data-k="cam" style={{ transformOrigin: "0 0" }}>
        {/* 01 — cotton jersey roll, unrolled across the mat */}
        <g data-k="fabric">
          <g clipPath="url(#mk-fab)">
            <rect x="62" y="60" width="480" height="520" fill={INK} />
            <rect x="62" y="60" width="480" height="520" fill="url(#mk-knit)" />
            <rect data-k="folds" x="62" y="60" width="480" height="520" fill="url(#mk-fold)" />
            <rect x="62" y="60" width="480" height="520" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2" />
          </g>
          <rect data-k="roll" x="28" y="52" width="34" height="536" rx="14" fill="url(#mk-roll)" />
          <g data-k="gsm" style={{ opacity: 0 }}>
            <g transform="translate(370 84) rotate(3)">
              <rect width="150" height="78" fill="#ECE6DA" />
              <rect width="150" height="5" fill="#CFE34B" />
              <text x="12" y="24" fontSize="9" fill="#5C554C" style={{ fontFamily: "var(--font-archivo)", letterSpacing: ".1em" }}>FABRIC WEIGHT</text>
              <text x="12" y="60" fontSize="38" fill="#0F0E0D" style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontStretch: "62%" }}>{GSM} GSM</text>
              <text x="12" y="72" fontSize="7.5" fill="#5C554C" style={{ fontFamily: "var(--font-archivo)", letterSpacing: ".1em" }}>COTTON JERSEY</text>
            </g>
          </g>
        </g>

        {/* 02 — holes left where pieces are cut out */}
        {PANELS.map((P) => <path key={P.k} data-k={`h-${P.k}`} d={P.d} fill={HOLE} opacity="0" style={{ transform: `translate(${P.lx}px,${P.ly}px)` }} />)}

        {/* box base sits under the shirt so it can be folded into it */}
        <g data-k="box" style={{ opacity: 0 }}>
          <ellipse cx="300" cy="520" rx="165" ry="14" fill="rgba(15,14,13,.2)" />
          <rect x="170" y="180" width="260" height="330" fill="#A9835A" />
          <rect x="186" y="196" width="228" height="298" fill="#5A432B" />
        </g>

        {/* the garment: five panels that are cut, joined, embroidered, folded */}
        <g data-k="tee" style={{ transformOrigin: "0 0" }}>
          {PANELS.map((P) => (
            <g key={P.k} data-k={`p-${P.k}`} style={{ transform: `translate(${P.lx}px,${P.ly}px)`, transformOrigin: P.k === "sleeveL" ? "190px 150px" : P.k === "sleeveR" ? "410px 150px" : "0 0" }}>
              <g data-k={`fill-${P.k}`} style={{ opacity: 0 }}>
                <path d={P.d} fill={INK} stroke="rgba(236,230,218,.3)" strokeWidth="1.5" strokeLinejoin="round" />
                <path d={P.d} fill="url(#mk-knit)" />
              </g>
              <g data-k={`paper-${P.k}`} style={{ opacity: 0 }}>
                <path d={P.d} fill="#ECE6DA" fillOpacity=".92" stroke="#0F0E0D" strokeWidth="1.2" strokeDasharray="6 4" />
                <text x={P.lc[0]} y={P.lc[1]} textAnchor="middle" fontSize={P.ls} fill="#0F0E0D" style={{ fontFamily: "var(--font-archivo)", fontWeight: 600, letterSpacing: ".12em" }}>{P.label}</text>
              </g>
              <path data-k={`o-${P.k}`} data-len={`o-${P.k}`} d={P.d} stroke="#CFE34B" strokeWidth="2.6" {...D} style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }} />
            </g>
          ))}
          <g data-k="seams" {...D}>
            {SEAMS.map((S) => <path key={S.k} data-k={`s-${S.k}`} data-len={`s-${S.k}`} d={S.d} stroke="#CFE34B" strokeWidth="2.4" style={{ strokeDasharray: "0 2000" }} />)}
          </g>
          {/* embroidery — the chest mark from the product photos */}
          <g transform={`translate(${EMB.x} ${EMB.y})`} {...D}>
            <circle data-k="emRing" data-len="emRing" r="24" stroke="#ECE6DA" strokeWidth="2.4" transform="rotate(-90)" style={{ strokeDasharray: "0 2000" }} />
            <path data-k="emLine" data-len="emLine" d="M-10 10 L10 -10" stroke="#ECE6DA" strokeWidth="2.4" style={{ strokeDasharray: "0 2000" }} />
            <circle data-k="emDot1" cx="-11" cy="11" r="4" fill="#ECE6DA" style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }} />
            <circle data-k="emDot2" cx="11" cy="-11" r="5.5" fill="#ECE6DA" style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }} />
            <circle data-k="emRed" cx="0" cy="-24" r="2.4" fill="#D9453B" style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }} />
          </g>
          <path data-k="creaseV" d="M245 150 V470 M355 150 V470" stroke="rgba(236,230,218,.22)" strokeWidth="1.5" strokeDasharray="3 5" style={{ opacity: 0 }} />
          <path data-k="creaseH" d="M190 310 H410" stroke="rgba(236,230,218,.22)" strokeWidth="1.5" strokeDasharray="3 5" style={{ opacity: 0 }} />
        </g>

        {/* machine head + needle used while sewing and embroidering */}
        <g data-k="sew" style={{ opacity: 0 }}>
          <g transform="translate(-9 -22)"><rect width="18" height="12" rx="2" fill="#ECE6DA" /><rect x="6" y="12" width="6" height="8" fill="#8A8278" /></g>
          <line x1="0" y1="-10" x2="0" y2="2" stroke="#ECE6DA" strokeWidth="2" strokeLinecap="round" />
          <circle r="2.6" fill="#CFE34B" />
        </g>
        <g data-k="needle" style={{ opacity: 0 }}>
          <line x1="0" y1="0" x2="8" y2="-24" stroke="#ECE6DA" strokeWidth="2" strokeLinecap="round" />
          <circle r="2.8" fill="#CFE34B" />
        </g>
        <g data-k="hoop" style={{ opacity: 0 }}>
          <circle r="64" fill="rgba(207,227,75,.04)" stroke="#B79B6A" strokeWidth="8" />
          <circle r="58" fill="none" stroke="rgba(15,14,13,.35)" strokeWidth="1.2" />
          <rect x="60" y="-6" width="14" height="12" fill="#8C6B40" />
        </g>

        {/* pattern tissue labels + scissors */}
        <g data-k="scissors" style={{ opacity: 0, filter: "drop-shadow(0 4px 4px rgba(0,0,0,.5))" }}>
          <g transform="translate(-34 0) scale(1.15)">
            {(["blUp", "blLo"] as const).map((k) => (
              <g key={k} data-k={k}>
                <path d="M-2 0 L34 0 L4 -5 Z" fill={k === "blUp" ? "#ECE6DA" : "#CFC6B4"} stroke="#0F0E0D" strokeWidth=".8" strokeLinejoin="round" />
                <path d="M-2 0 L-13 -9" stroke="#CFE34B" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="-20" cy="-13" r="7.5" fill="none" stroke="#CFE34B" strokeWidth="3.4" />
              </g>
            ))}
            <circle r="2.6" fill="#0F0E0D" stroke="#ECE6DA" strokeWidth="1" />
          </g>
        </g>

        {/* quality-check lens */}
        <g data-k="lens" style={{ opacity: 0 }}>
          <circle r="56" fill="rgba(207,227,75,.08)" stroke="#CFE34B" strokeWidth="4" />
          <line x1="40" y1="40" x2="82" y2="82" stroke="#CFE34B" strokeWidth="9" strokeLinecap="round" />
        </g>

        {/* brand card, lid, tape */}
        <g data-k="card" style={{ opacity: 0 }}>
          <g transform="translate(0 0)">
            <rect x="238" y="285" width="124" height="92" fill="#ECE6DA" />
            <rect x="238" y="285" width="124" height="5" fill="#CFE34B" />
            <text x="248" y="312" fontSize="13" fill="#0F0E0D" style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontStretch: "62%" }}>BEYOND ANGELS</text>
            <text x="248" y="332" fontSize="10" fill="#0F0E0D" style={{ fontFamily: "var(--font-bodoni)", fontStyle: "italic" }}>Good intentions.</text>
            <text x="248" y="345" fontSize="10" fill="#0F0E0D" style={{ fontFamily: "var(--font-bodoni)", fontStyle: "italic" }}>Bad influence.</text>
            <text x="248" y="367" fontSize="6.5" fill="#5C554C" style={{ fontFamily: "var(--font-archivo)", letterSpacing: ".1em" }}>DROP 01 · NUMBERED</text>
          </g>
        </g>
        <g data-k="lid" style={{ transform: "translateY(-900px)" }}>
          <rect x="164" y="174" width="272" height="342" fill="#B9925F" stroke="#8C6B40" strokeWidth="2" />
          <path d="M164 174 L436 516 M436 174 L164 516" stroke="rgba(15,14,13,.06)" />
          <g data-k="tape" style={{ opacity: 0 }}>
            <rect x="288" y="174" width="24" height="342" fill="#D9C6A0" opacity=".92" />
            <g transform="rotate(-6 300 345)"><rect x="240" y="322" width="120" height="46" fill="#CFE34B" /><text x="300" y="351" textAnchor="middle" fontSize="15" fill="#0F0E0D" style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontStretch: "62%", letterSpacing: ".04em" }}>BEYOND ANGELS</text></g>
          </g>
        </g>
      </g>

      {/* HUD tags (not affected by camera) */}
      <g style={{ fontFamily: "var(--font-archivo)", fontStretch: "118%", fontWeight: 500, letterSpacing: ".08em" }}>
        <g data-k="cutTag" style={{ opacity: 0 }}><rect x="24" y="24" width="168" height="26" fill="#CFE34B" /><text x="36" y="41" fontSize="11" fill="#0F0E0D">CUTTING THE PATTERN…</text></g>
        <g data-k="sewTag" style={{ opacity: 0 }}><rect x="24" y="24" width="150" height="26" fill="#CFE34B" /><text x="36" y="41" fontSize="11" fill="#0F0E0D">STITCHING SEAMS…</text></g>
        <g data-k="qcTag" style={{ opacity: 0 }}><rect x="24" y="24" width="228" height="26" fill="#CFE34B" /><text x="36" y="41" fontSize="11" fill="#0F0E0D">QUALITY CHECK — PASS ✓</text></g>
        <g data-k="ready" style={{ opacity: 0 }}><rect x="24" y="590" width="158" height="26" fill="#0F0E0D" /><text x="36" y="607" fontSize="11" fill="#CFE34B">READY TO SHIP</text></g>
      </g>
    </svg>
  );
});
