"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PIECES, type Size } from "@/lib/pieces";

export type Line = { id: string; size: Size; qty: number };
export type FlyStart = { id: string; size: Size; img: HTMLImageElement | null; btn: HTMLElement | null; kbd: boolean };

type Ctx = {
  lines: Line[];
  count: number;
  total: number;
  open: boolean;
  menu: boolean;
  justAdded: { id: string; size: Size } | null;
  flashKey: React.MutableRefObject<string | null>;
  setOpen: (v: boolean) => void;
  setMenu: (v: boolean) => void;
  /** Commit a line to the bag (no UI). */
  commit: (id: string, size: Size) => void;
  /** Run the full add-to-bag animation (fly → sheet), falling back to a static sheet. */
  addFrom: (s: FlyStart) => void;
  registerFly: (fn: ((s: FlyStart) => void) | null) => void;
  change: (id: string, size: Size, d: number) => void;
  remove: (id: string, size: Size) => void;
};

const BagCtx = createContext<Ctx | null>(null);

export function useBag() {
  const c = useContext(BagCtx);
  if (!c) throw new Error("useBag outside BagProvider");
  return c;
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [justAdded, setJust] = useState<{ id: string; size: Size } | null>(null);
  const flashKey = useRef<string | null>(null);
  const fly = useRef<((s: FlyStart) => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock page scroll behind the bag drawer and index menu.
  useEffect(() => {
    document.documentElement.style.overflow = open || menu ? "hidden" : "";
  }, [open, menu]);

  const commit = useCallback((id: string, size: Size) => {
    setLines((ls) => {
      const hit = ls.find((l) => l.id === id && l.size === size);
      return hit ? ls.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { id, size, qty: 1 }];
    });
    flashKey.current = `${id}|${size}`;
    setJust({ id, size });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJust(null), 3600);
  }, []);

  const addFrom = useCallback((s: FlyStart) => {
    if (fly.current) fly.current(s);
    else commit(s.id, s.size);
  }, [commit]);

  const registerFly = useCallback((fn: ((s: FlyStart) => void) | null) => { fly.current = fn; }, []);

  const change = useCallback((id: string, size: Size, d: number) => {
    setLines((ls) => ls.map((l) => (l.id === id && l.size === size ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));
  }, []);
  const remove = useCallback((id: string, size: Size) => {
    setLines((ls) => ls.filter((l) => !(l.id === id && l.size === size)));
  }, []);

  const value = useMemo<Ctx>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const total = lines.reduce((n, l) => n + l.qty * (PIECES.find((p) => p.id === l.id)?.price ?? 0), 0);
    return { lines, count, total, open, menu, justAdded, flashKey, setOpen, setMenu, commit, addFrom, registerFly, change, remove };
  }, [lines, open, menu, justAdded, commit, addFrom, registerFly, change, remove]);

  return <BagCtx.Provider value={value}>{children}</BagCtx.Provider>;
}
