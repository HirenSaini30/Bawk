"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getChildDetail,
  getChildProgress,
  linkChildByEmail,
  listChildren,
  updateGoal,
} from "@/lib/api";

const C = {
  border: "#F1E3D2",
  panelTint: "#FFFBF5",
};

type ChildRecord = {
  id: string;
  display_name: string;
  age_band?: string;
};

type GoalRow = {
  id: string;
  title: string;
  category: string;
  difficulty: number;
  active: boolean;
  childId: string;
  childName: string;
  completed: number;
  total: number;
};

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: C.border }}
    >
      <div className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.border }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{ borderColor: C.border, background: C.panelTint }}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default function SupervisorDashboardPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [clients, setClients] = useState<ChildRecord[]>([]);
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [detailData, setDetailData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");
  const [linkError, setLinkError] = useState("");
  const [goalActionId, setGoalActionId] = useState<string | null>(null);

  async function hydrateClients(nextClients: ChildRecord[]) {
    await Promise.allSettled(
      nextClients.map(async (client) => {
        const [progress, detail] = await Promise.all([
          getChildProgress(client.id).catch(() => null),
          getChildDetail(client.id).catch(() => null),
        ]);

        if (progress) {
          setProgressData((prev) => ({ ...prev, [client.id]: progress }));
        }
        if (detail) {
          setDetailData((prev) => ({ ...prev, [client.id]: detail }));
        }
      })
    );
  }

  async function loadWorkspace() {
    const result = await listChildren();
    const nextClients = result.children ?? [];
    setClients(nextClients);
    await hydrateClients(nextClients);
  }

  useEffect(() => {
    loadWorkspace()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const clientRows = useMemo(() => {
    return clients.map((client) => {
      const progress = progressData[client.id];
      const detail = detailData[client.id];
      return {
        id: client.id,
        name: client.display_name,
        ageBand: client.age_band || "Not set",
        completed7d: progress?.total_completed_7d ?? 0,
        completed30d: progress?.total_completed_30d ?? 0,
        activeGoals:
          detail?.goals?.filter((goal: any) => goal.active !== false).length ?? 0,
        totalTasks: detail?.tasks?.length ?? 0,
        difficultySignals: progress?.difficulty_signals?.length ?? 0,
      };
    });
  }, [clients, detailData, progressData]);

  const allGoals = useMemo<GoalRow[]>(() => {
    return clients.flatMap((client) => {
      const detail = detailData[client.id];
      const progress = progressData[client.id];
      const byGoal = new Map<string, { completed: number; total: number }>();

      for (const row of progress?.by_goal ?? []) {
        byGoal.set(row.goal_id, {
          completed: row.completed ?? 0,
          total: row.total ?? 0,
        });
      }

      return (detail?.goals ?? []).map((goal: any) => {
        const stats = byGoal.get(goal.id) ?? { completed: 0, total: 0 };
        return {
          id: goal.id,
          title: goal.title,
          category: goal.category,
          difficulty: goal.difficulty,
          active: goal.active !== false,
          childId: client.id,
          childName: client.display_name,
          completed: stats.completed,
          total: stats.total,
        };
      });
    });
  }, [clients, detailData, progressData]);

  const reportStats = useMemo(() => {
    const totalCompleted7d = clientRows.reduce((sum, row) => sum + row.completed7d, 0);
    const totalCompleted30d = clientRows.reduce(
      (sum, row) => sum + row.completed30d,
      0
    );
    const flaggedClients = clientRows.filter((row) => row.difficultySignals > 0).length;
    const achievedGoals = allGoals.filter(
      (goal) => goal.total > 0 && goal.completed >= goal.total
    ).length;

    return {
      totalClients: clients.length,
      totalCompleted7d,
      totalCompleted30d,
      activeGoals: allGoals.filter((goal) => goal.active).length,
      achievedGoals,
      flaggedClients,
    };
  }, [allGoals, clientRows, clients.length]);

  async function handleLinkClient() {
    const email = linkEmail.trim().toLowerCase();
    if (!email) {
      setLinkError("Enter the email address the child used to sign up.");
      return;
    }

    setLinking(true);
    setLinkError("");
    setLinkMessage("");
    try {
      const result = await linkChildByEmail(email);
      setLinkEmail("");
      setLinkMessage(`Linked ${result.child.display_name} successfully.`);
      await loadWorkspace();
    } catch (error: any) {
      setLinkError(error.message || "Could not link that client.");
    } finally {
      setLinking(false);
    }
  }

  async function handleToggleGoal(goal: GoalRow) {
    setGoalActionId(goal.id);
    try {
      await updateGoal(goal.id, { active: !goal.active });
      await loadWorkspace();
    } catch (error) {
      console.error(error);
    } finally {
      setGoalActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 text-sm text-gray-500">
        Loading supervisor workspace...
      </div>
    );
  }

  const renderEmptyClientsPanel = () => (
    <Panel
      title="Add your first client"
      subtitle="Enter the email address the child used to create their account."
    >
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={linkEmail}
          onChange={(event) => setLinkEmail(event.target.value)}
          placeholder="child@example.com"
          className="flex-1 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: C.border }}
        />
        <button
          type="button"
          onClick={handleLinkClient}
          disabled={linking}
          className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {linking ? "Linking..." : "Link Client"}
        </button>
      </div>
      {linkError && <p className="mt-3 text-sm text-red-600">{linkError}</p>}
      {linkMessage && <p className="mt-3 text-sm text-green-700">{linkMessage}</p>}
    </Panel>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={reportStats.totalClients} />
        <StatCard label="Active Goals" value={reportStats.activeGoals} />
        <StatCard label="Completed (7 days)" value={reportStats.totalCompleted7d} />
        <StatCard label="Flagged Clients" value={reportStats.flaggedClients} />
      </div>
      <Panel
        title="Supervisor overview"
        subtitle="A quick view of your current caseload."
      >
        {clients.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              No clients are linked yet, so there are no dashboard metrics to show.
            </p>
            <Link
              href="/supervisor/dashboard?tab=clients"
              className="inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              Go to Clients
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clientRows.map((client) => (
              <Link
                key={client.id}
                href={`/supervisor/child/${client.id}`}
                className="rounded-xl border p-4 hover:bg-orange-50"
                style={{ borderColor: C.border }}
              >
                <div className="text-base font-semibold text-gray-900">{client.name}</div>
                <div className="mt-1 text-sm text-gray-500">Age band: {client.ageBand}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">7d completions</div>
                    <div className="font-semibold text-gray-900">{client.completed7d}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">30d completions</div>
                    <div className="font-semibold text-gray-900">{client.completed30d}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Active goals</div>
                    <div className="font-semibold text-gray-900">{client.activeGoals}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Tracked tasks</div>
                    <div className="font-semibold text-gray-900">{client.totalTasks}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      {renderEmptyClientsPanel()}
      <Panel
        title="Clients"
        subtitle="Each linked client with tracked progress and metrics."
      >
        {clients.length === 0 ? (
          <p className="text-sm text-gray-600">
            Once a child is linked, they will appear here with their progress metrics.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {clientRows.map((client) => (
              <div
                key={client.id}
                className="rounded-xl border p-5"
                style={{ borderColor: C.border, background: C.panelTint }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-500">Age band: {client.ageBand}</p>
                  </div>
                  <Link
                    href={`/supervisor/child/${client.id}`}
                    className="text-sm font-medium text-orange-700"
                  >
                    Open
                  </Link>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <StatCard label="Completed (7d)" value={client.completed7d} />
                  <StatCard label="Completed (30d)" value={client.completed30d} />
                  <StatCard label="Active Goals" value={client.activeGoals} />
                  <StatCard label="Difficulty Flags" value={client.difficultySignals} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );

  const renderGoals = () => (
    <Panel
      title="Goals"
      subtitle="All goals across your linked clients, with progress and actions."
      action={
        clients.length > 0 ? (
          <Link
            href="/supervisor/goals/new"
            className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            Add Goal
          </Link>
        ) : null
      }
    >
      {allGoals.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            No goals yet. Goals will appear here once you add them for a linked client.
          </p>
          {clients.length === 0 && (
            <Link
              href="/supervisor/dashboard?tab=clients"
              className="inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              Link a Client First
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {allGoals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-xl border p-4"
              style={{ borderColor: C.border }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {goal.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {goal.childName} · {goal.category} · difficulty {goal.difficulty}/5
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    Progress: {goal.completed}/{goal.total || 0} activities completed
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/supervisor/goals/${goal.id}`}
                    className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50"
                    style={{ borderColor: C.border }}
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleGoal(goal)}
                    disabled={goalActionId === goal.id}
                    className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 disabled:opacity-50"
                    style={{ borderColor: C.border }}
                  >
                    {goalActionId === goal.id
                      ? "Saving..."
                      : goal.active
                      ? "Remove Goal"
                      : "Restore Goal"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Clients" value={reportStats.totalClients} />
        <StatCard label="7d completions" value={reportStats.totalCompleted7d} />
        <StatCard label="30d completions" value={reportStats.totalCompleted30d} />
        <StatCard label="Achieved Goals" value={reportStats.achievedGoals} />
        <StatCard label="Flagged Clients" value={reportStats.flaggedClients} />
      </div>
      <Panel
        title="Reports"
        subtitle="Data-based summaries from tracked client progress and goals."
      >
        {clients.length === 0 ? (
          <p className="text-sm text-gray-600">
            Reports will populate after you link clients and assign goals.
          </p>
        ) : (
          <div className="space-y-4">
            {clientRows.map((client) => (
              <div
                key={client.id}
                className="rounded-xl border p-4"
                style={{ borderColor: C.border, background: C.panelTint }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {client.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.completed7d} completions in 7 days · {client.completed30d} in 30 days
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {client.difficultySignals > 0
                      ? `${client.difficultySignals} difficulty flag(s)`
                      : "No difficulty flags"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {currentTab === "clients" && renderClients()}
      {currentTab === "goals" && renderGoals()}
      {currentTab === "reports" && renderReports()}
      {currentTab === "dashboard" && renderDashboard()}
    </div>
  );
}
