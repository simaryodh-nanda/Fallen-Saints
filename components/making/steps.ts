import { GSM } from "@/lib/pieces";

export type Step = { n: string; heading: string; title: string; body: string; chips: string[]; fig: string };

/** Content for the five manufacturing stages — edit copy here. */
export const STEPS: Step[] = [
  { n: "01", heading: "01 — THE FABRIC", title: "It starts with the right weight.", body: "Before it’s a shirt, it’s a roll of cotton jersey. Weight comes first — heavier cloth drapes instead of clinging.", chips: [`${GSM} GSM`, "Cotton jersey"], fig: "Fig. 01 — Cotton jersey, unrolled" },
  { n: "02", heading: "02 — THE CUT", title: "From fabric to form.", body: "Every piece begins with a precise cut. The pattern goes down on the cloth and the scissors follow it: front, back, two sleeves and the neckband.", chips: ["Front · Back", "Sleeves ×2", "Neckband"], fig: "Fig. 02 — Pattern laid, panels cut" },
  { n: "03", heading: "03 — THE BUILD", title: "Every seam has a purpose.", body: "Separate fabric panels become a wearable garment: shoulders, sides, sleeves, neckline and hems, joined seam by seam.", chips: ["Shoulder seams", "Side seams", "Hems"], fig: "Fig. 03 — Panels joined into a shirt" },
  { n: "04", heading: "04 — THE DETAIL", title: "Embroidered, not printed.", body: "The chest mark is stitched in, thread by thread.", chips: ["Chest mark", "Stitched, not printed"], fig: "Fig. 04 — Chest mark, being stitched" },
  { n: "05", heading: "05 — THE FINISH", title: "Finished with intention.", body: "Checked, folded, and ready to find its person.", chips: ["Quality check", "Brand card", "Ready to ship"], fig: "Fig. 05 — Checked, folded, carded and boxed" },
];
