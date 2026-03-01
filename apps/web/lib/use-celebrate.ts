"use client";

import { useEffect, useState } from "react";

/* ── Detect prefers-reduced-motion ──────────────────────── */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return reduced;
}

/* ── Read celebrate + xp from search params, then clean up ─ */
export function useCelebrateFromSearchParams() {
  const [play, setPlay] = useState(false);
  const [xp, setXp] = useState<number | undefined>(undefined);

  useEffect(() => {
    const url = new URL(window.location.href);
    const celebrate = url.searchParams.get("celebrate");
    const xpParam = url.searchParams.get("xp");

    if (celebrate === "1") {
      setPlay(true);
      const parsed = xpParam ? Number(xpParam) : undefined;
      setXp(Number.isFinite(parsed as number) ? (parsed as number) : undefined);

      // Clean params so a refresh does not replay
      url.searchParams.delete("celebrate");
      url.searchParams.delete("xp");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return { play, xp, stop: () => setPlay(false) };
}
