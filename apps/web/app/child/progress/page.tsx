"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMyProgress } from "@/lib/api";
import { Button } from "@/components/ui/button";

type ProgressData = {
  completed_total: number;
  open_total: number;
  recent_completed: Array<{
    id: string;
    completed_at?: string;
    task?: {
      title?: string;
      type?: string;
    };
  }>;
  rewards_status: {
    total_xp?: number;
    pokemon_count?: number;
    current_streak?: number;
  };
};

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-[24px] border border-tan-200 bg-white/80 px-5 py-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

export default function ChildProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProgress()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recent = data?.recent_completed ?? [];
  const rewards = data?.rewards_status ?? {};
  const completionRate = useMemo(() => {
    const completed = data?.completed_total ?? 0;
    const open = data?.open_total ?? 0;
    const total = completed + open;
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  }, [data?.completed_total, data?.open_total]);

  if (loading) {
    return (
      <div className="kid-container py-16 text-center text-kid-lg text-gray-400">
        Loading your progress...
      </div>
    );
  }

  return (
    <div className="kid-container space-y-6 py-8">
      <section className="rounded-[32px] border border-tan-200 bg-white/80 px-6 py-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">
              Progress Center
            </p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Keep going. You are building skills every day.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-600">
              This page shows how many activities you have finished, what is still open,
              and the progress you are making with rewards.
            </p>
          </div>
          <Link href="/child/home">
            <Button size="lg">Go To Activities</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Activities Completed"
          value={data?.completed_total ?? 0}
          accent="#EA580C"
        />
        <StatTile
          label="Open Activities"
          value={data?.open_total ?? 0}
          accent="#0284C7"
        />
        <StatTile label="Total XP" value={rewards.total_xp ?? 0} accent="#CA8A04" />
        <StatTile
          label="Pokemon Collected"
          value={rewards.pokemon_count ?? 0}
          accent="#7C3AED"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[28px] border border-tan-200 bg-white/80 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Wins</h2>
              <p className="mt-1 text-sm text-gray-600">
                Your latest finished activities appear here.
              </p>
            </div>
            <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              {completionRate}% done
            </div>
          </div>

          {recent.length === 0 ? (
            <div className="mt-6 rounded-[22px] border border-dashed border-tan-300 bg-tan-50 px-5 py-6 text-sm text-gray-600">
              No completed activities yet. Start one from the Activities tab and your
              progress will show up here.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recent.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-tan-200 bg-white px-4 py-4"
                >
                  <div className="text-base font-semibold text-gray-900">
                    {item.task?.title || "Activity"}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {(item.task?.type || "activity").replaceAll("_", " ")}
                  </div>
                  {item.completed_at && (
                    <div className="mt-2 text-xs text-gray-400">
                      Completed {new Date(item.completed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-tan-200 bg-white/80 px-6 py-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Reward Snapshot</h2>
            <div className="mt-5 space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3">
                <span>Current streak</span>
                <span className="font-semibold">
                  {rewards.current_streak ?? 0} days
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
                <span>Open activities</span>
                <span className="font-semibold">{data?.open_total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-yellow-50 px-4 py-3">
                <span>Total XP</span>
                <span className="font-semibold">{rewards.total_xp ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-tan-200 bg-white/80 px-6 py-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Explore</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/child/home">
                <Button variant="outline">Activities</Button>
              </Link>
              <Link href="/child/pokemon">
                <Button variant="secondary">Pokemon</Button>
              </Link>
              <Link href="/child/task/calming">
                <Button variant="calm">I Feel Upset</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
