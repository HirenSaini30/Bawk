"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToday } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_LABELS, POKEMON_DISPLAY } from "@/lib/utils";

export default function ChildHomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToday()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="kid-container text-center py-16 text-kid-lg text-gray-400">
        Loading your activities...
      </div>
    );
  }

  const assignments = data?.assignments || [];
  const rewards = data?.rewards_status || {};
  const streak = data?.streak_days || 0;

  return (
    <div className="kid-container space-y-8">
      {/* Greeting + Stats */}
      <div className="text-center">
        <h1 className="text-kid-xl font-bold text-primary-700 mb-2">
          Today&apos;s Activities
        </h1>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warm-500">{streak}</div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {rewards.total_xp || 0}
            </div>
            <div className="text-sm text-gray-500">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-calm-500">
              {rewards.pokemon_count || 0}
            </div>
            <div className="text-sm text-gray-500">Pokemon</div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      {assignments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-kid-lg text-gray-500 mb-4">
              No activities for today!
            </p>
            <p className="text-gray-400">
              Check back later or ask your helper if you expected something.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: any) => {
            const task = assignment.task || {};
            const taskType = task.type || "social_story";
            const typeColors: Record<string, string> = {
              social_story: "border-l-4 border-l-primary-400",
              roleplay: "border-l-4 border-l-warm-400",
              modeling: "border-l-4 border-l-blue-400",
              calming: "border-l-4 border-l-calm-400",
            };

            return (
              <Link
                key={assignment.id}
                href={`/child/task/${assignment.id}`}
              >
                <Card
                  className={`hover:shadow-lg transition-all cursor-pointer mb-4 ${
                    typeColors[taskType] || ""
                  }`}
                >
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="text-4xl">
                      {taskType === "social_story" && "📖"}
                      {taskType === "roleplay" && "🎭"}
                      {taskType === "modeling" && "🎬"}
                      {taskType === "calming" && "🌊"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-kid-base font-bold text-gray-900">
                        {task.title || "Activity"}
                      </h3>
                      <Badge className="mt-1">
                        {TASK_TYPE_LABELS[taskType] || taskType}
                      </Badge>
                    </div>
                    <Button size="lg">Start</Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Ask for Help */}
      <div className="text-center pt-4">
        <p className="text-gray-400 text-sm">
          Need help? You can always ask your supervisor!
        </p>
      </div>
    </div>
  );
}
