"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToday } from "@/lib/api";
import { useCelebrateFromSearchParams } from "@/lib/use-celebrate";
import { WhiteChicken } from "@/components/child/white-chicken";
import { SoftFieldBackground } from "@/components/child/soft-field-background";

/* ── Palette tokens ─────────────────────────────────────── */
const COLORS = {
  bgA: "#FFF7ED",
  bgB: "#FFFBF5",
  ink: "rgba(17,24,39,0.55)",
  inkSoft: "rgba(17,24,39,0.35)",
  inkFaint: "rgba(17,24,39,0.22)",
  orange: "#F97316",
  orangeDeep: "#EA580C",
  yolk: "#FBBF24",
};

/* ── TopMetaChip ────────────────────────────────────────── */
function TopMetaChip({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string | number;
}) {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      style={{ color: COLORS.inkSoft }}
    >
      <span
        className="inline-grid h-7 w-7 place-items-center rounded-full"
        style={{ background: "rgba(249,115,22,0.10)" }}
      >
        {icon}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function ChildHomePage() {
  const router = useRouter();
  const { play, xp, stop } = useCelebrateFromSearchParams();

  /* ── Data fetch (keeps existing API contract intact) ──── */
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToday()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const assignments = data?.assignments || [];
  const rewards = data?.rewards_status || {};
  const streak = data?.streak_days || 0;

  /* ── Derived display values ──────────────────────────── */
  const totalXp = rewards.total_xp || 0;
  const pokemonCount = rewards.pokemon_count || 0;

  // TODO: Replace with real focused-time metric when available from API
  const totalFocusedHours = useMemo(() => {
    // Rough approximation: each assignment ≈ 5 min, convert to hours
    return Math.round(((assignments.length || 0) * 5) / 6) / 10 || 0;
  }, [assignments]);

  const level = useMemo(() => Math.max(1, Math.floor(totalXp / 100) + 1), [totalXp]);
  const levelPct = useMemo(() => totalXp % 100, [totalXp]);

  const dateLabel = useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${mm}.${dd}.${yyyy}`;
  }, []);

  const toast = xp ? `Yay! +${xp} XP` : "Yay! +20 XP";

  /* ── Navigate to the first pending assignment ─────────── */
  const handleRunGoal = useCallback(() => {
    const pending = assignments.find(
      (a: any) => a.status !== "completed" && a.status !== "done"
    );
    if (pending) {
      router.push(`/child/task/${pending.id}`);
    }
  }, [assignments, router]);

  /* ── Loading state ───────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="relative flex min-h-[80vh] items-center justify-center"
        style={{ background: COLORS.bgA }}
      >
        <p className="text-lg" style={{ color: COLORS.inkSoft }}>
          Loading your activities…
        </p>
      </div>
    );
  }

  /* ── Forest-style layout ─────────────────────────────── */
  return (
    <div
      className="relative min-h-[calc(100vh-56px)] overflow-hidden"
      style={{
        background: `radial-gradient(1100px 700px at 50% 10%, ${COLORS.bgB} 0%, ${COLORS.bgA} 55%, ${COLORS.bgA} 100%)`,
      }}
    >
      <SoftFieldBackground />

      {/* ── Top: date + meta chips ─────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-start justify-between gap-6">
          <div
            className="text-[28px] font-semibold tracking-tight"
            style={{ color: COLORS.ink }}
          >
            {dateLabel}
          </div>

          <div className="flex items-center gap-5">
            <TopMetaChip icon={<span aria-hidden>🌽</span>} value={totalXp} />
            <TopMetaChip
              icon={<span aria-hidden>⏱️</span>}
              value={assignments.length}
            />
          </div>
        </div>

        {/* ── Big metric: focused time ─────────────────── */}
        <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-[220px,1fr]">
          <div style={{ color: COLORS.inkFaint }}>
            <div className="text-sm leading-6">Total</div>
            <div className="text-sm leading-6">Focused</div>
            <div className="text-sm leading-6">Time</div>
          </div>

          <div className="text-right md:text-left">
            <div
              className="text-[64px] font-semibold tracking-tight"
              style={{ color: COLORS.inkSoft }}
            >
              {totalFocusedHours.toFixed(1)}{" "}
              <span style={{ color: COLORS.inkFaint }}>hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Center: chicken + stats ────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-2">
        <WhiteChicken celebrate={play} toast={toast} onDone={stop} />

        {/* Stats row */}
        <div className="mx-auto mt-1 grid max-w-3xl grid-cols-2 gap-6 px-2 text-sm">
          <div className="text-left" style={{ color: COLORS.inkSoft }}>
            <div className="font-semibold" style={{ color: COLORS.ink }}>
              Stats
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                🔥
              </span>
              <span className="tabular-nums">
                {streak} streak
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                🎴
              </span>
              <span className="tabular-nums">
                {pokemonCount} pokemon
              </span>
            </div>
          </div>

          <div className="text-right" style={{ color: COLORS.inkSoft }}>
            <div className="font-semibold" style={{ color: COLORS.ink }}>
              Level
            </div>
            <div className="mt-2 flex items-center justify-end gap-3">
              <div
                className="h-2 w-44 rounded-full"
                style={{ background: "rgba(17,24,39,0.10)" }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${levelPct}%`,
                    background: `linear-gradient(90deg, ${COLORS.yolk} 0%, ${COLORS.orange} 60%, ${COLORS.orangeDeep} 100%)`,
                  }}
                />
              </div>
              <span
                className="tabular-nums"
                style={{ color: COLORS.inkSoft }}
              >
                {level} | {levelPct}%
              </span>
            </div>
          </div>
        </div>

        {/* ── CTA: Run Goal ─────────────────────────────── */}
        <div className="mt-10 flex justify-center">
          <button
            className="rounded-[26px] px-12 py-5 text-lg font-extrabold text-white transition focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:opacity-50"
            style={{
              background: `linear-gradient(180deg, ${COLORS.orange} 0%, ${COLORS.orangeDeep} 100%)`,
              boxShadow: "0 24px 46px -28px rgba(234,88,12,0.65)",
            }}
            onClick={handleRunGoal}
            disabled={
              !assignments.some(
                (a: any) =>
                  a.status !== "completed" && a.status !== "done"
              )
            }
          >
            Run Goal
          </button>
        </div>

        {assignments.length === 0 && (
          <div
            className="mt-4 text-center text-xs"
            style={{ color: COLORS.inkFaint }}
          >
            No activities for today — check back later!
          </div>
        )}
      </div>
    </div>
  );
}
