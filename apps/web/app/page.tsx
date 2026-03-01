"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

/* ── Palette ──────────────────────────────────────────── */
const C = {
  bgA: "#FFF7ED",
  bgB: "#FFFBF5",
  ink: "rgba(17,24,39,0.55)",
  inkSoft: "rgba(17,24,39,0.35)",
  inkFaint: "rgba(17,24,39,0.22)",
  orange: "#F97316",
  orangeDeep: "#EA580C",
  orangeSoft: "#FFEDD5",
  yolk: "#FBBF24",
};

/* ── CSS keyframes (injected once) ────────────────────── */
const KEYFRAMES = `
@keyframes auth-idleBob {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-5px); }
}
@keyframes auth-fadeUp {
  0%   { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0px); }
}
@keyframes auth-fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes auth-fadeUp {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes auth-idleBob {
    0%,100% { transform: none; }
  }
}
`;

/* ── Small reusable inline components ─────────────────── */
function FloatingInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border bg-white/70 px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400",
        "transition focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300",
        "backdrop-blur-sm",
        props.className ?? "",
      ].join(" ")}
      style={{ borderColor: "rgba(241,227,210,0.7)", ...props.style }}
    />
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-[26px] px-12 py-4 text-lg font-extrabold text-white transition",
        "focus:outline-none focus:ring-4 focus:ring-orange-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className ?? "",
      ].join(" ")}
      style={{
        background: `linear-gradient(180deg, ${C.orange} 0%, ${C.orangeDeep} 100%)`,
        boxShadow: "0 24px 46px -28px rgba(234,88,12,0.65)",
      }}
    >
      {children}
    </button>
  );
}

/* ── Chicken mascot (idle-bob only) ───────────────────── */
function ChickenMascot({ size = 200 }: { size?: number }) {
  const s = size / 250; // scale factor relative to 250-width viewBox
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 250 180"
      className="select-none"
      style={{
        filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.09))",
        animation: "auth-idleBob 1600ms ease-in-out infinite",
      }}
      aria-label="Bawk chicken mascot"
      role="img"
    >
      <ellipse cx="128" cy="162" rx="72" ry="10" fill="rgba(0,0,0,0.06)" />
      <path
        d="M60 108c0-40 30-70 73-70 25 0 46 11 59 28 10 13 16 28 16 44 0 37-29 65-75 65-44 0-73-25-73-67z"
        fill="#FFFFFF" stroke="#E7D7C6" strokeWidth="3"
      />
      <path
        d="M112 104c12-12 26-10 36 5-11 12-24 16-36 7-6-4-6-8 0-12z"
        fill="#FFF3E8" stroke="#E7D7C6" strokeWidth="3"
      />
      <path
        d="M145 34c10-12 22-9 22 5 7-6 16-2 13 8-5 12-24 12-35-13z"
        fill={C.orange} stroke={C.orangeDeep} strokeWidth="2"
      />
      <circle cx="173" cy="78" r="6" fill="#111827" />
      <circle cx="175" cy="76" r="2" fill="#FFFFFF" opacity="0.9" />
      <path d="M186 88l26 9-26 9c-4-7-4-11 0-18z" fill={C.yolk} stroke="#F59E0B" strokeWidth="2" />
      <path d="M106 148v-20" stroke={C.orangeDeep} strokeWidth="4" strokeLinecap="round" />
      <path d="M146 148v-20" stroke={C.orangeDeep} strokeWidth="4" strokeLinecap="round" />
      <path d="M98 148h22" stroke={C.orangeDeep} strokeWidth="4" strokeLinecap="round" />
      <path d="M138 148h22" stroke={C.orangeDeep} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ── Soft field backdrop ──────────────────────────────── */
function SoftFieldBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="auth-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="auth-sun" cx="50%" cy="10%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="35%" stopColor="#FFFBF5" stopOpacity="0.70" />
          <stop offset="100%" stopColor="#FFF7ED" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="auth-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFF0D6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#A7E3B6" stopOpacity="0.50" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="800" fill="url(#auth-sun)" />
      <path
        d="M0 260c110-40 210-30 320 10 120 46 240 40 380-2 140-42 280-46 500 10v110H0V260z"
        fill="url(#auth-mist)" opacity="0.5"
      />
      <path
        d="M0 580c220-60 360-40 520 10 170 54 320 50 680-20v240H0V580z"
        fill="url(#auth-grass)"
      />
      {Array.from({ length: 24 }).map((_, i) => {
        const x = (i * 50) % 1200;
        const y = 620 + ((i * 37) % 140);
        const c = i % 3 === 0 ? "#F59E0B" : i % 3 === 1 ? "#FB7185" : "#FBBF24";
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(0.8)`} opacity="0.18">
            <circle cx="0" cy="0" r="4" fill={c} />
            <circle cx="8" cy="5" r="3" fill={c} />
            <circle cx="-8" cy="6" r="3" fill={c} />
            <circle cx="0" cy="10" r="2" fill="#22C55E" />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Role selector button ─────────────────────────────── */
function RoleOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-2xl border-2 px-4 py-3.5 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-orange-300",
        selected
          ? "border-orange-400 bg-orange-50 text-orange-700"
          : "border-transparent bg-white/60 text-gray-600 hover:bg-white/80",
      ].join(" ")}
      style={
        selected
          ? { boxShadow: "0 0 0 1px rgba(249,115,22,0.25)" }
          : undefined
      }
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT — 2-stage onboarding auth
   ═══════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const router = useRouter();

  /* ── View state ──────────────────────────────────────── */
  type View = "landing" | "auth";
  const [view, setView] = useState<View>("landing");

  /* ── Auth form state ─────────────────────────────────── */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  // DB stores "child" — we map the UI label "Client" to "child"
  const [role, setRole] = useState<"child" | "supervisor">("child");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  /* ── Session check on mount ──────────────────────────── */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await redirectByRole(session.user.id);
      }
      setCheckingSession(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function redirectByRole(userId: string) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !data?.role) {
      await supabase.auth.signOut();
      setError(
        "Your account profile is missing. Sign in again or create a new account."
      );
      router.replace("/");
      return;
    }

    if (data.role === "supervisor") {
      router.push("/supervisor/dashboard");
      return;
    }

    if (data.role === "child") {
      router.push("/child/home");
    }
  }

  async function handleAuth() {
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, display_name: displayName },
          },
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            role,
            display_name: displayName || email.split("@")[0],
          });
          await redirectByRole(data.user.id);
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) {
          await redirectByRole(data.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* ── Themed loading screen ──────────────────────────── */
  if (checkingSession) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(900px 600px at 50% 30%, ${C.bgB} 0%, ${C.bgA} 60%, ${C.bgA} 100%)`,
        }}
      >
        <style>{KEYFRAMES}</style>
        <SoftFieldBg />
        <div className="relative text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: `${C.orange} transparent ${C.orangeSoft} ${C.orangeSoft}` }}
          />
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Checking your account…
          </p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     STAGE A — Landing
     ═══════════════════════════════════════════════════════ */
  if (view === "landing") {
    return (
      <div
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
        style={{
          background: `radial-gradient(1100px 700px at 50% 20%, ${C.bgB} 0%, ${C.bgA} 55%, ${C.bgA} 100%)`,
        }}
      >
        <style>{KEYFRAMES}</style>
        <SoftFieldBg />

        <div
          className="relative flex flex-col items-center"
          style={{ animation: "auth-fadeUp 500ms ease-out both" }}
        >
          {/* Logo */}
          <div className="mb-4 h-20 w-20 overflow-hidden rounded-2xl">
            <Image
              src="/images/bawklogo.png"
              alt="Bawk logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Product name */}
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: C.orangeDeep }}
          >
            bawk
          </h1>

          {/* Tagline */}
          <p
            className="mt-2 text-base"
            style={{ color: C.inkSoft }}
          >
            Guided goals. Real progress.
          </p>

          {/* Chicken mascot */}
          <div className="mt-10">
            <ChickenMascot size={220} />
          </div>

          {/* CTA */}
          <div className="mt-10">
            <PrimaryButton onClick={() => setView("auth")}>
              Get Started
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     STAGE B — Auth form
     ═══════════════════════════════════════════════════════ */
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background: `radial-gradient(1100px 700px at 50% 20%, ${C.bgB} 0%, ${C.bgA} 55%, ${C.bgA} 100%)`,
      }}
    >
      <style>{KEYFRAMES}</style>
      <SoftFieldBg />

      <div
        className="relative w-full max-w-sm"
        style={{ animation: "auth-fadeUp 400ms ease-out both" }}
      >
        {/* Back link */}
        <button
          onClick={() => {
            setView("landing");
            setError("");
          }}
          className="mb-8 flex items-center gap-1 text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
          style={{ color: C.inkSoft }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {/* Logo + heading */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl">
            <Image
              src="/images/bawklogo.png"
              alt="Bawk logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: C.orangeDeep }}
          >
            bawk
          </h1>
        </div>

        {/* Toggle: Sign In / Sign Up */}
        <div
          className="mb-6 flex gap-1 rounded-2xl p-1"
          style={{ background: "rgba(249,115,22,0.08)" }}
          role="tablist"
        >
          <button
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={[
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition",
              "focus:outline-none focus:ring-2 focus:ring-orange-300",
              !isSignUp
                ? "bg-white text-orange-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={isSignUp}
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={[
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition",
              "focus:outline-none focus:ring-2 focus:ring-orange-300",
              isSignUp
                ? "bg-white text-orange-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            Sign Up
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          {isSignUp && (
            <>
              <FloatingInput
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />

              {/* Role selector */}
              <div className="flex gap-3">
                <RoleOption
                  label="I'm a Client"
                  selected={role === "child"}
                  onClick={() => setRole("child")}
                />
                <RoleOption
                  label="I'm a Supervisor"
                  selected={role === "supervisor"}
                  onClick={() => setRole("supervisor")}
                />
              </div>
            </>
          )}

          <FloatingInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <FloatingInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
        </div>

        {/* Error alert */}
        {error && (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: C.orangeSoft,
              color: C.orangeDeep,
              border: `1px solid rgba(249,115,22,0.25)`,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Submit button */}
        <div className="mt-6">
          <PrimaryButton
            onClick={handleAuth}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Loading…"
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </PrimaryButton>
        </div>

        {/* Toggle prompt */}
        <button
          className="mt-4 w-full text-center text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
          style={{ color: C.inkSoft }}
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
