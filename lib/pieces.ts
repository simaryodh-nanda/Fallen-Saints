export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export const GUIDE: Record<Size, { chest: number; length: number }> = {
  S: { chest: 42, length: 28 },
  M: { chest: 44, length: 29 },
  L: { chest: 46, length: 30 },
  XL: { chest: 48, length: 31 },
  XXL: { chest: 50, length: 32 },
};

export type Img = { src: string; w: number; h: number };

export type Piece = {
  id: string;
  no: string;
  code: string;
  name: string;
  colour: string;
  tech: string;
  type: string;
  price: number;
  img: Img;
  photo: Img | null;
  back: Img | null;
  field: string;
  fg: string;
  mut: string;
  line: string;
  out: Size[];
  copy: string;
  l1: string;
  l2: string;
  faint: string;
  detail: { origin: string; zoom: number; label: string };
};

export type View = { kind: "img" | "crop" | "photo"; img: Img; label: string; origin?: string; zoom?: number };

/** Views shown in the Drop File: front, close crop, back (if any), on-body photo (if any). */
export function viewsOf(p: Piece): View[] {
  const v: View[] = [
    { kind: "img", img: p.img, label: "Front" },
    { kind: "crop", img: p.img, label: p.detail.label, origin: p.detail.origin, zoom: p.detail.zoom },
  ];
  if (p.back) v.push({ kind: "img", img: p.back, label: "Back" });
  if (p.photo) v.push({ kind: "photo", img: p.photo, label: "On body — stand-in photo" });
  return v;
}

export const PIECES: Piece[] = [
  {
    id: "bad-influence", no: "01", code: "BA—01—01", name: "Bad Influence", colour: "Black",
    tech: "Embroidered chest mark", type: "T-shirt", price: 1799,
    img: { src: "/pieces/g-front.png", w: 760, h: 1198 }, photo: { src: "/pieces/tee-a.jpg", w: 1200, h: 800 }, back: { src: "/pieces/g-back.png", w: 760, h: 1222 },
    field: "#DDD5C6", fg: "#0F0E0D", mut: "#5C554C", line: "rgba(15,14,13,.32)", out: ["XXL"],
    copy: "Looks well-behaved from across the room. Isn’t.",
    l1: "Bad", l2: "Influence", faint: "rgba(15,14,13,.14)",
    detail: { origin: "68% 41%", zoom: 2.6, label: "Embroidered chest mark" },
  },
  {
    id: "good-intentions", no: "02", code: "BA—01—02", name: "Good Intentions", colour: "Bone",
    tech: "Screen print", type: "T-shirt", price: 1699,
    img: { src: "/pieces/g-bone.png", w: 515, h: 852 }, photo: { src: "/pieces/tee-h.jpg", w: 1200, h: 1200 }, back: null,
    field: "#1A1817", fg: "#ECE6DA", mut: "#A39C90", line: "rgba(236,230,218,.36)", out: ["S"],
    copy: "Clean, pale, completely convincing. For now.",
    l1: "Good", l2: "Intentions", faint: "rgba(236,230,218,.14)",
    detail: { origin: "50% 16%", zoom: 2.2, label: "Neckline & fabric" },
  },
  {
    id: "patron-of-nothing", no: "03", code: "BA—01—03", name: "Patron of Nothing", colour: "Black",
    tech: "Chain-stitch", type: "T-shirt", price: 1999,
    img: { src: "/pieces/g-tee.png", w: 349, h: 621 }, photo: { src: "/pieces/tee-c.jpg", w: 1200, h: 600 }, back: null,
    field: "#A23A35", fg: "#ECE6DA", mut: "#F0D9D3", line: "rgba(236,230,218,.55)", out: [],
    copy: "Devoted to absolutely nothing. Stitched like it matters.",
    l1: "Patron of", l2: "Nothing", faint: "rgba(236,230,218,.22)",
    detail: { origin: "50% 16%", zoom: 2.2, label: "Neckline & fabric" },
  },
  {
    id: "afterlife", no: "04", code: "BA—01—04", name: "Afterlife", colour: "Ink",
    tech: "Long sleeve", type: "Long sleeve", price: 1899,
    img: { src: "/pieces/g-long.png", w: 383, h: 617 }, photo: null, back: null,
    field: "#CFC6B4", fg: "#0F0E0D", mut: "#4A443C", line: "rgba(15,14,13,.34)", out: ["XL"],
    copy: "Long sleeves for the long night after.",
    l1: "Afterlife", l2: "", faint: "rgba(15,14,13,.14)",
    detail: { origin: "50% 16%", zoom: 2.2, label: "Neckline & fabric" },
  },
];

/** Fabric weight stated on the site (hero + piece specs). */
export const GSM = 240;

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
