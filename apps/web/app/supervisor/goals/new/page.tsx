"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createGoal } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { CATEGORY_LABELS } from "@/lib/utils";

export default function NewGoalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("conversation");
  const [difficulty, setDifficulty] = useState(3);
  const [criteriaText, setCriteriaText] = useState("");
  const [wordsToAvoid, setWordsToAvoid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!childId) {
      setError("No client selected");
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

      const goal = await createGoal({
        child_id: childId,
        title,
        description,
        category,
        difficulty,
        success_criteria: criteria,
        constraints: avoid.length ? { words_to_avoid: avoid } : {},
      });

      router.push(`/supervisor/goals/${(goal as any).id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
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
              {loading ? "Creating..." : "Create Goal"}
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
