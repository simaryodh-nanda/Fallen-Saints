"use client";

import { useEffect } from "react";
import { EASE, reduced } from "@/lib/motion";

/** Clip-and-rise reveal for every [data-reveal] element, as it first enters the viewport. */
export function RevealObserver() {
  useEffect(() => {
    const rm = reduced();
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        if (!rm) el.animate([{ clipPath: "inset(0 0 100% 0)", transform: "translateY(30px)" }, { clipPath: "inset(0 0 0% 0)", transform: "none" }], { duration: 900, delay: (+(el.dataset.reveal ?? 0) || 0) * 90, easing: EASE, fill: "backwards" });
      }),
      { threshold: 0.2 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
