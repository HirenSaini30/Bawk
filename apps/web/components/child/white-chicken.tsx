"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-celebrate";

/* ── Palette tokens (match page) ───────────────────────── */
const C = {
  orange: "#F97316",
  orangeDeep: "#EA580C",
  yolk: "#FBBF24",
};

/* ── Keyframe styles (injected once) ───────────────────── */
const KEYFRAMES = `
@keyframes chk-walkAcross {
  0%   { transform: translateX(-180px) translateY(6px); }
  35%  { transform: translateX(-40px) translateY(-4px); }
  70%  { transform: translateX(90px) translateY(2px); }
  100% { transform: translateX(220px) translateY(-2px); }
}
@keyframes chk-idleBob {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-5px); }
}
@keyframes chk-chomp {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(-12deg); }
}
@keyframes chk-foodPop {
  0%   { transform: translateY(10px) scale(0.9); opacity: 0; }
  15%  { opacity: 1; }
  80%  { transform: translateY(0px) scale(1.05); opacity: 1; }
  100% { transform: translateY(-8px) scale(0.8); opacity: 0; }
}
@keyframes chk-toastIn {
  0%   { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0px); opacity: 1; }
}
@keyframes chk-sparkle {
  0%   { opacity: 0; transform: scale(0.9) translateY(6px); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: scale(1.1) translateY(-10px); }
}
`;

export function WhiteChicken({
  celebrate,
  toast,
  onDone,
}: {
  celebrate: boolean;
  toast: string;
  onDone?: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!celebrate) return;
    setActive(true);
    const t = window.setTimeout(
      () => {
        setActive(false);
        onDone?.();
      },
      reduced ? 900 : 1600
    );
    return () => window.clearTimeout(t);
  }, [celebrate, reduced, onDone]);

  return (
    <div className="relative mx-auto h-[360px] w-full max-w-5xl">
      <style>{KEYFRAMES}</style>

      <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2">
        {/* Walk wrapper */}
        <div
          className="relative"
          style={{
            animation:
              active && !reduced
                ? "chk-walkAcross 1400ms ease-in-out both"
                : undefined,
          }}
        >
          {/* Toast */}
          {active && (
            <div
              className="absolute left-1/2 -top-12 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(241,227,210,0.95)",
                color: C.orangeDeep,
                boxShadow: "0 18px 30px -24px rgba(234,88,12,0.40)",
                animation: reduced
                  ? undefined
                  : "chk-toastIn 180ms ease-out both",
                backdropFilter: "blur(10px)",
              }}
              role="status"
              aria-live="polite"
            >
              {toast}
            </div>
          )}

          {/* Food icon */}
          {active && (
            <div
              className="absolute -right-8 top-12 text-4xl"
              style={{
                animation: reduced
                  ? undefined
                  : "chk-foodPop 950ms ease-out both",
                filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.10))",
              }}
              aria-hidden
            >
              🌽
            </div>
          )}

          {/* Sparkles (motion only) */}
          {active && !reduced && (
            <>
              <div
                className="absolute -left-6 top-6 text-2xl"
                style={{ animation: "chk-sparkle 900ms ease-out both" }}
                aria-hidden
              >
                ✨
              </div>
              <div
                className="absolute right-10 -bottom-2 text-2xl"
                style={{
                  animation: "chk-sparkle 900ms ease-out 120ms both",
                }}
                aria-hidden
              >
                ✨
              </div>
            </>
          )}

          {/* Chicken SVG */}
          <svg
            width="250"
            height="180"
            viewBox="0 0 250 180"
            className="select-none"
            style={{
              filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.09))",
              animation: !active
                ? "chk-idleBob 1600ms ease-in-out infinite"
                : undefined,
            }}
            aria-label="Chicken mascot"
            role="img"
          >
            {/* Shadow */}
            <ellipse
              cx="128"
              cy="162"
              rx="72"
              ry="10"
              fill="rgba(0,0,0,0.06)"
            />

            {/* Body */}
            <path
              d="M60 108c0-40 30-70 73-70 25 0 46 11 59 28 10 13 16 28 16 44 0 37-29 65-75 65-44 0-73-25-73-67z"
              fill="#FFFFFF"
              stroke="#E7D7C6"
              strokeWidth="3"
            />

            {/* Wing */}
            <path
              d="M112 104c12-12 26-10 36 5-11 12-24 16-36 7-6-4-6-8 0-12z"
              fill="#FFF3E8"
              stroke="#E7D7C6"
              strokeWidth="3"
            />

            {/* Comb */}
            <path
              d="M145 34c10-12 22-9 22 5 7-6 16-2 13 8-5 12-24 12-35-13z"
              fill={C.orange}
              stroke={C.orangeDeep}
              strokeWidth="2"
            />

            {/* Eye */}
            <circle cx="173" cy="78" r="6" fill="#111827" />
            <circle cx="175" cy="76" r="2" fill="#FFFFFF" opacity="0.9" />

            {/* Beak (chomps during celebration) */}
            <g
              style={{
                transformOrigin: "193px 92px",
                animation:
                  active && !reduced
                    ? "chk-chomp 260ms ease-in-out 3"
                    : undefined,
              }}
            >
              <path
                d="M186 88l26 9-26 9c-4-7-4-11 0-18z"
                fill={C.yolk}
                stroke="#F59E0B"
                strokeWidth="2"
              />
            </g>

            {/* Legs */}
            <path
              d="M106 148v-20"
              stroke={C.orangeDeep}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M146 148v-20"
              stroke={C.orangeDeep}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Feet */}
            <path
              d="M98 148h22"
              stroke={C.orangeDeep}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M138 148h22"
              stroke={C.orangeDeep}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
