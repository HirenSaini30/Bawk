"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getGoal, generateTasks, listChildren } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_LABELS, CATEGORY_LABELS, todayISO } from "@/lib/utils";

const TASK_TYPES = [
  { key: "social_story", label: "Social Story" },
  { key: "roleplay", label: "Roleplay" },
  { key: "calming", label: "Calming Exercise" },
  { key: "modeling", label: "Watch & Learn" },
];

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;

  const [data, setData] = useState<{ goal: any; tasks: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["social_story"]);
  const [genCount, setGenCount] = useState(1);
  const [assignNow, setAssignNow] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [assignAllClients, setAssignAllClients] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  async function loadGoal() {
    try {
      const result = await getGoal(goalId);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  useEffect(() => {
    listChildren()
      .then((result) => setClients(result.children ?? []))
      .catch(console.error);
  }, []);

  async function handleGenerate() {
    if (selectedTypes.length === 0) return;
    setGenerating(true);
    try {
      await generateTasks({
        goal_id: goalId,
        desired_task_types: selectedTypes,
        count: genCount,
        auto_assign_dates: assignNow ? [todayISO()] : undefined,
        target_child_ids: selectedClientIds,
        assign_all_linked_children: assignAllClients,
      });
      await loadGoal();
    } catch (err: any) {
      alert(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  }

  if (loading) {
    return (
      <div className="supervisor-container text-center py-12 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="supervisor-container text-center py-12 text-red-500">
        Goal not found
      </div>
    );
  }

  const { goal, tasks } = data;

  return (
    <div className="supervisor-container space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="info">
            {CATEGORY_LABELS[goal.category] || goal.category}
          </Badge>
          <Badge variant="muted">Difficulty {goal.difficulty}/5</Badge>
          <Badge variant={goal.active ? "success" : "warning"}>
            {goal.active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {goal.description && (
          <p className="text-gray-600 mt-3">{goal.description}</p>
        )}
      </div>

      {goal.success_criteria?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Success Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {goal.success_criteria.map((c: string, i: number) => (
                <li key={i} className="text-gray-700">{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate Tasks with AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task types to generate
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => toggleType(t.key)}
                  className={`px-4 py-2 rounded-kid text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                    selectedTypes.includes(t.key)
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-white text-gray-600 border-tan-200 hover:border-primary-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              How many tasks?
            </label>
            <select
              className="rounded-kid border border-tan-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={assignNow}
              onChange={(e) => setAssignNow(e.target.checked)}
              className="h-4 w-4 rounded border-tan-200"
            />
            Assign generated tasks to the client now
          </label>

          <div className="space-y-3 rounded-kid border border-tan-200 p-4">
            <div>
              <div className="text-sm font-medium text-gray-700">
                Add clients to each generated task
              </div>
              <p className="mt-1 text-sm text-gray-500">
                The goal&apos;s main client is always included. Add more linked clients or send to everyone.
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={assignAllClients}
                onChange={(e) => setAssignAllClients(e.target.checked)}
                className="h-4 w-4 rounded border-tan-200"
              />
              Include all linked clients
            </label>

            {!assignAllClients && clients.length > 1 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {clients
                  .filter((client) => client.id !== goal.child_id)
                  .map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 rounded-kid border border-tan-200 px-3 py-3 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(client.id)}
                        onChange={() => toggleClient(client.id)}
                        className="h-4 w-4 rounded border-tan-200"
                      />
                      <span>{client.display_name}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || selectedTypes.length === 0}
            size="lg"
          >
            {generating
              ? "Generating..."
              : assignNow
              ? "Generate & Assign"
              : "Generate Tasks"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-gray-400">
            No tasks yet. Use the generator above to create some.
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: any) => (
              <Link key={task.id} href={`/supervisor/tasks/${task.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {task.title}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge>
                          {TASK_TYPE_LABELS[task.type] || task.type}
                        </Badge>
                        <Badge
                          variant={
                            task.status === "assigned"
                              ? "success"
                              : task.status === "draft"
                              ? "muted"
                              : "warning"
                          }
                        >
                          {task.status}
                        </Badge>
                        {task.ai_generated && (
                          <Badge variant="info">AI Generated</Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 text-xl">&rarr;</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
