"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listChildren, getChildProgress } from "@/lib/api";

/* ══════════════════════════════════════════════════════════
   Chicken palette tokens (warm whites + orange + yolk yellow)
   ══════════════════════════════════════════════════════════ */
const C = {
  bg: "#FFF7ED",
  panel: "#FFFFFF",
  panelTint: "#FFFBF5",
  border: "#F1E3D2",
  text: "#1F2937",
  muted: "#6B7280",
  orange: "#F97316",
  orangeDeep: "#EA580C",
  orangeSoft: "#FFEDD5",
  yolk: "#FBBF24",
  yolkSoft: "#FEF3C7",
};

/* ── Helpers ────────────────────────────────────────────── */
function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ══════════════════════════════════════════════════════════
   Small UI primitives (Tailwind-only, no shadcn)
   ══════════════════════════════════════════════════════════ */

function DashCard({
  children,
  accent,
  className = "",
}: {
  children: React.ReactNode;
  accent?: "orange" | "yolk";
  className?: string;
}) {
  const accentStyle =
    accent === "orange"
      ? { borderTopColor: C.orange, borderTopWidth: 3 }
      : accent === "yolk"
      ? { borderTopColor: C.yolk, borderTopWidth: 3 }
      : undefined;

  return (
    <div
      className={cls("rounded-xl border bg-white shadow-sm", className)}
      style={{ borderColor: C.border, ...accentStyle }}
    >
      {children}
    </div>
  );
}

function ClientCard({
  name,
  active,
  subtitle,
  onClick,
}: {
  name: string;
  active?: boolean;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "min-w-[170px] rounded-lg border px-4 py-4 transition cursor-pointer text-left",
        "focus:outline-none focus:ring-2 focus:ring-orange-300",
        active
          ? "bg-orange-50 border-orange-300"
          : "bg-white border-[#F1E3D2] hover:bg-orange-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cls(
            "h-10 w-10 rounded-full grid place-items-center border shrink-0",
            active
              ? "bg-orange-100 border-orange-200"
              : "bg-[#FFF3E8] border-[#F1E3D2]"
          )}
        >
          <span className="text-sm font-semibold text-orange-700">
            {name.slice(0, 1).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {name}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {subtitle ?? "Active client"}
          </div>
        </div>
      </div>
    </button>
  );
}

function ActionButton({
  children,
  tone = "neutral",
  href,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "orange";
  href?: string;
}) {
  const classes = cls(
    "w-full rounded-lg border px-4 py-3 text-sm font-medium transition text-center block",
    "focus:outline-none focus:ring-2 focus:ring-orange-300",
    tone === "orange"
      ? "bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
      : "bg-white text-gray-800 hover:bg-orange-50"
  );
  const style = tone === "neutral" ? { borderColor: C.border } : undefined;

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} style={style}>
      {children}
    </button>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div
      className="inline-flex rounded-lg border p-1"
      style={{ borderColor: C.border, background: C.panelTint }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cls(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              "focus:outline-none focus:ring-2 focus:ring-orange-300",
              active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-700 hover:bg-white"
            )}
            style={active ? { border: `1px solid ${C.border}` } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SVG Line Chart (no external chart library)
   ══════════════════════════════════════════════════════════ */

type SeriesPoint = { day: string; value: number };

function SimpleLineChart({
  data,
  unit,
  height = 240,
}: {
  data: SeriesPoint[];
  unit: string;
  height?: number;
}) {
  const width = 920;
  const padding = { l: 48, r: 18, t: 14, b: 28 };

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border text-sm"
        style={{
          height,
          borderColor: C.border,
          background: C.panelTint,
          color: C.muted,
        }}
      >
        No data available yet
      </div>
    );
  }

  const vals = data.map((d) => d.value);
  const minY = Math.min(...vals);
  const maxY = Math.max(...vals);
  const yPad = Math.max(6, Math.round((maxY - minY) * 0.2));
  const y0 = Math.max(0, minY - yPad);
  const y1 = maxY + yPad;

  const xStep =
    (width - padding.l - padding.r) / Math.max(1, data.length - 1);
  const toX = (i: number) => padding.l + i * xStep;
  const toY = (v: number) => {
    const t = (v - y0) / Math.max(1, y1 - y0);
    return padding.t + (1 - t) * (height - padding.t - padding.b);
  };

  const path = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(d.value).toFixed(2)}`
    )
    .join(" ");

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const t = i / yTicks;
    const v = Math.round(y0 + (1 - t) * (y1 - y0));
    return { v, y: toY(v) };
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="block"
        role="img"
        aria-label={`Line chart showing ${unit} over time`}
      >
        {/* grid + y labels */}
        {ticks.map((tk, idx) => (
          <g key={idx}>
            <line
              x1={padding.l}
              x2={width - padding.r}
              y1={tk.y}
              y2={tk.y}
              stroke={C.border}
              strokeDasharray="3 6"
            />
            <text
              x={padding.l - 10}
              y={tk.y + 4}
              textAnchor="end"
              fontSize={11}
              fill={C.muted}
            >
              {tk.v}
              {unit}
            </text>
          </g>
        ))}

        {/* x labels */}
        {data.map((d, i) => (
          <text
            key={d.day}
            x={toX(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize={11}
            fill={C.muted}
          >
            {d.day}
          </text>
        ))}

        {/* line glow */}
        <path d={path} fill="none" stroke={C.orangeSoft} strokeWidth={8} />

        {/* main line */}
        <path d={path} fill="none" stroke={C.orange} strokeWidth={3} />

        {/* data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.value)} r={6} fill={C.yolkSoft} />
            <circle cx={toX(i)} cy={toY(d.value)} r={3} fill={C.orangeDeep} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Mock progress data generator
   ── TODO: Replace with real backend data when available ──
   ══════════════════════════════════════════════════════════ */

function generateMockMinutes(seed: string): SeriesPoint[] {
  // Deterministic-ish mock based on name length
  const base = 15 + (seed.length % 10) * 2;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return days.map((day, i) => ({
    day,
    value: base + ((i * 7 + seed.charCodeAt(0)) % 12),
  }));
}

function generateMockCompletion(seed: string): SeriesPoint[] {
  const base = 50 + (seed.length % 8) * 5;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return days.map((day, i) => ({
    day,
    value: Math.min(100, base + ((i * 5 + seed.charCodeAt(0)) % 20)),
  }));
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function SupervisorDashboard() {
  /* ── State ─────────────────────────────────────────────── */
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [metric, setMetric] = useState<"avg_minutes" | "completion">(
    "avg_minutes"
  );
  const [progressData, setProgressData] = useState<Record<string, any>>({});

  /* ── Fetch children (mapped to "clients" in UI) ────────── */
  useEffect(() => {
    listChildren()
      .then((data) => {
        // Backend returns { children: [...] } — map to clients in frontend only
        const clientsList = data.children ?? [];
        setClients(clientsList);

        // Try to fetch real progress for each client
        clientsList.forEach((child: any) => {
          getChildProgress(child.id)
            .then((prog) => {
              setProgressData((prev) => ({
                ...prev,
                [child.id]: prog,
              }));
            })
            .catch(() => {
              // If progress endpoint fails, we'll fall back to mock data
            });
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived values ────────────────────────────────────── */
  const selectedClient = clients[selectedIdx] ?? null;
  const clientName = selectedClient?.display_name ?? "Client";
  const clientId = selectedClient?.id;

  // Build chart series: try real data first, fall back to mock
  // TODO: Wire real progress data when backend returns daily breakdown
  const series: SeriesPoint[] = useMemo(() => {
    if (metric === "avg_minutes") {
      return generateMockMinutes(clientName);
    }
    return generateMockCompletion(clientName);
  }, [clientName, metric]);

  const avg =
    series.length === 0
      ? 0
      : Math.round(series.reduce((a, b) => a + b.value, 0) / series.length);

  // Summary stat cards from real progress data when available
  const realProgress = clientId ? progressData[clientId] : null;
  const completed7d = realProgress?.total_completed_7d ?? "—";
  const completed30d = realProgress?.total_completed_30d ?? "—";

  /* ── Loading state ─────────────────────────────────────── */
  if (loading) {
  return (
      <div
        className="flex items-center justify-center min-h-[60vh] text-sm"
        style={{ color: C.muted }}
      >
        Loading clients...
      </div>
    );
  }

  /* ── Empty state ───────────────────────────────────────── */
  if (clients.length === 0) {
    return (
      <div className="p-8">
        <DashCard>
          <div className="p-10 text-center">
            <p className="text-gray-600 mb-2 text-base">No clients linked yet.</p>
            <p className="text-sm" style={{ color: C.muted }}>
              Link clients through the Supabase dashboard or admin panel.
            </p>
          </div>
        </DashCard>
      </div>
    );
  }

  /* ── Main dashboard ────────────────────────────────────── */
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* ─── TOP: LIST OF CLIENTS ───────────────────────── */}
      <DashCard accent="yolk">
        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                List of Clients
              </h2>
              <p className="text-xs" style={{ color: C.muted }}>
                Select a client to view progress and manage plans.
              </p>
            </div>
            <Segmented
              value={metric}
              onChange={(v) => setMetric(v as "avg_minutes" | "completion")}
              options={[
                { label: "Avg minutes", value: "avg_minutes" },
                { label: "Completion %", value: "completion" },
              ]}
            />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
            {clients.map((c, i) => (
              <ClientCard
                key={c.id}
                name={c.display_name}
                subtitle={c.age_band ? `Age band: ${c.age_band}` : undefined}
                active={selectedIdx === i}
                onClick={() => setSelectedIdx(i)}
              />
            ))}
          </div>
        </div>
      </DashCard>

      {/* ─── BOTTOM: GRAPH + ACTIONS ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
        {/* ── Left: Progress graph panel ──────────────── */}
        <DashCard accent="orange">
          <div className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Progress
                </h2>
                <p className="text-xs" style={{ color: C.muted }}>
                  {metric === "avg_minutes"
                    ? "Average minutes spent on daily activities."
                    : "Percent of assigned activities completed."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: C.orangeSoft, color: C.orangeDeep }}
                >
                  {clientName}
                </span>
                <span className="text-xs" style={{ color: C.muted }}>
                  Avg: {metric === "avg_minutes" ? `${avg}m` : `${avg}%`}
                </span>
              </div>
            </div>

            <div
              className="mt-5 rounded-xl border"
              style={{ borderColor: C.border, background: C.panelTint }}
            >
              <div className="p-4">
                <SimpleLineChart
                  data={series}
                  unit={metric === "avg_minutes" ? "m" : "%"}
                />
              </div>
            </div>

            {/* Summary stat tiles */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                className="rounded-lg border bg-white p-4"
                style={{ borderColor: C.border }}
              >
                <div className="text-xs" style={{ color: C.muted }}>
                  Completed (7 days)
                </div>
                <div className="mt-1 text-sm font-semibold">{completed7d}</div>
              </div>
              <div
                className="rounded-lg border bg-white p-4"
                style={{ borderColor: C.border }}
              >
                <div className="text-xs" style={{ color: C.muted }}>
                  Completed (30 days)
                </div>
                <div className="mt-1 text-sm font-semibold">{completed30d}</div>
              </div>
              <div
                className="rounded-lg border bg-white p-4"
                style={{ borderColor: C.border }}
              >
                <div className="text-xs" style={{ color: C.muted }}>
                  Trend
                </div>
                {/* TODO: Compute from real data when available */}
                <div className="mt-1 text-sm font-semibold">Improving</div>
              </div>
            </div>
          </div>
        </DashCard>

        {/* ── Right: User Stuff / quick actions panel ─── */}
        <DashCard accent="yolk">
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  User Stuff
                </h3>
                <p className="text-xs" style={{ color: C.muted }}>
                  Quick actions and management.
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-full border grid place-items-center shrink-0"
                style={{ background: C.yolkSoft, borderColor: C.border }}
              >
                <span className="text-lg font-semibold text-orange-700">
                  {clientName.slice(0, 1).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <ActionButton
                tone="orange"
                href={
                  clientId
                    ? `/supervisor/child/${clientId}`
                    : "/supervisor/dashboard"
                }
              >
                Manage Goals
              </ActionButton>
              <ActionButton
                href={
                  clientId
                    ? `/supervisor/child/${clientId}`
                    : "/supervisor/dashboard"
                }
              >
                Manage Treatment Plan
              </ActionButton>
              <ActionButton>Add New Client</ActionButton>
            </div>

            {/* Info box */}
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: C.border, background: C.panelTint }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: C.orangeDeep }}
              >
                Neurodivergent-friendly defaults
              </div>
              <ul
                className="mt-2 space-y-1 text-xs"
                style={{ color: C.muted }}
              >
                <li>• Predictable layout, consistent actions</li>
                <li>• Large click targets</li>
                <li>• Calm colors, low visual noise</li>
                <li>• Clear labels (no ambiguity)</li>
              </ul>
            </div>
          </div>
        </DashCard>
      </div>
    </div>
  );
}
