"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createGoal, listChildren } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { CATEGORY_LABELS } from "@/lib/utils";

type AssignmentMode = "single" | "multiple" | "all";

export default function NewGoalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId") || "";
  const [clients, setClients] = useState<any[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(
    childId ? "single" : "multiple"
  );
  const [selectedChildId, setSelectedChildId] = useState(childId);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
    childId ? [childId] : []
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("conversation");
  const [difficulty, setDifficulty] = useState(3);
  const [criteriaText, setCriteriaText] = useState("");
  const [wordsToAvoid, setWordsToAvoid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listChildren()
      .then((data) => setClients(data.children ?? []))
      .catch(console.error);
  }, []);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (assignmentMode === "all" && clients.length === 0) {
      setError("Link at least one client before creating a goal for everyone.");
      return;
    }
    if (assignmentMode === "single" && !selectedChildId) {
      setError("No client selected");
      return;
    }
    if (assignmentMode === "multiple" && selectedChildIds.length === 0) {
      setError("Select at least one client.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const criteria = criteriaText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const avoid = wordsToAvoid
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const result = await createGoal({
        child_id: assignmentMode === "single" ? selectedChildId : undefined,
        child_ids:
          assignmentMode === "all"
            ? clients.map((client) => client.id)
            : assignmentMode === "multiple"
            ? selectedChildIds
            : undefined,
        title,
        description,
        category,
        difficulty,
        success_criteria: criteria,
        constraints: avoid.length ? { words_to_avoid: avoid } : {},
      });

      if (assignmentMode === "single") {
        router.push(`/supervisor/goals/${result.goal.id}`);
      } else {
        router.push("/supervisor/dashboard?tab=goals");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  }

  function toggleClient(clientId: string) {
    setSelectedChildIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  }

  return (
    <div className="supervisor-container max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Who should get this goal?
            </label>
            <div className="space-y-3 rounded-kid border border-tan-200 p-4">
              <p className="text-sm text-gray-600">
                Choose one client, a custom group, or every linked child.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { key: "single", label: "One Client" },
                  { key: "multiple", label: "Multiple Clients" },
                  { key: "all", label: "All Clients" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setAssignmentMode(mode.key as AssignmentMode)}
                    className={`rounded-kid border px-3 py-3 text-sm font-medium transition ${
                      assignmentMode === mode.key
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-tan-200 bg-white text-gray-700 hover:border-primary-300"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {assignmentMode === "single" && (
                <Select
                  value={selectedChildId}
                  onChange={(e) => {
                    setSelectedChildId(e.target.value);
                    setSelectedChildIds(e.target.value ? [e.target.value] : []);
                  }}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.display_name}
                    </option>
                  ))}
                </Select>
              )}

              {assignmentMode === "multiple" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {clients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 rounded-kid border border-tan-200 px-3 py-3 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChildIds.includes(client.id)}
                        onChange={() => toggleClient(client.id)}
                        className="h-4 w-4"
                      />
                      <span>{client.display_name}</span>
                    </label>
                  ))}
                </div>
              )}

              {assignmentMode === "all" && (
                <p className="text-sm text-gray-600">
                  This will create one goal for every currently linked client.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Title
            </label>
            <Input
              placeholder="e.g., Ask for help when stuck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              placeholder="Describe what the client should learn or practice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty (1-5)
              </label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} — {["Very Easy", "Easy", "Medium", "Hard", "Very Hard"][n - 1]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Success Criteria (one per line)
            </label>
            <Textarea
              placeholder="Client raises hand to ask for help&#10;Uses polite words like 'please' or 'excuse me'"
              value={criteriaText}
              onChange={(e) => setCriteriaText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Words/Topics to Avoid (comma-separated)
            </label>
            <Input
              placeholder="e.g., punishment, timeout, bad behavior"
              value={wordsToAvoid}
              onChange={(e) => setWordsToAvoid(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} disabled={loading} size="lg">
              {loading
                ? "Creating..."
                : assignmentMode === "all"
                ? "Create Goal For All Clients"
                : assignmentMode === "multiple"
                ? "Create Goals For Selected Clients"
                : "Create Goal"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
