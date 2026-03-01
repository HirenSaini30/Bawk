"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getChildDetail, getChildProgress } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_LABELS, CATEGORY_LABELS } from "@/lib/utils";

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.childId as string;
  const [detail, setDetail] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getChildDetail(childId),
      getChildProgress(childId).catch(() => null),
    ])
      .then(([d, p]) => {
        setDetail(d);
        setProgress(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return (
      <div className="supervisor-container text-center py-12 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="supervisor-container text-center py-12 text-red-500">
        Client not found or access denied
      </div>
    );
  }

  return (
    <div className="supervisor-container space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {detail.profile?.display_name}
          </h1>
          {detail.profile?.age_band && (
            <Badge variant="info" className="mt-1">
              Age {detail.profile.age_band}
            </Badge>
          )}
        </div>
        <Link href={`/supervisor/goals/new?childId=${childId}`}>
          <Button>New Goal</Button>
        </Link>
      </div>

      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-primary-50 rounded-kid border border-tan-200">
                <div className="text-2xl font-bold text-primary-500">
                  {progress.total_completed_7d}
                </div>
                <div className="text-sm text-gray-500">Last 7 days</div>
              </div>
              <div className="text-center p-4 bg-yolk-50 rounded-kid border border-tan-200">
                <div className="text-2xl font-bold text-yolk-500">
                  {progress.total_completed_30d}
                </div>
                <div className="text-sm text-gray-500">Last 30 days</div>
              </div>
            </div>
            {progress.difficulty_signals?.length > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-kid p-4">
                <h4 className="font-semibold text-primary-600 mb-2">
                  Attention Needed
                </h4>
                <ul className="space-y-1">
                  {progress.difficulty_signals.map(
                    (signal: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700">
                        {signal}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Goals</h2>
        {detail.goals.length === 0 ? (
          <p className="text-gray-400">No goals yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {detail.goals.map((goal: any) => (
              <Link key={goal.id} href={`/supervisor/goals/${goal.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {goal.title}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="info">
                          {CATEGORY_LABELS[goal.category] || goal.category}
                        </Badge>
                        <Badge variant="muted">
                          Difficulty {goal.difficulty}/5
                        </Badge>
                        {!goal.active && (
                          <Badge variant="warning">Inactive</Badge>
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

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h2>
        {detail.tasks.length === 0 ? (
          <p className="text-gray-400">No tasks generated yet.</p>
        ) : (
          <div className="space-y-3">
            {detail.tasks.map((task: any) => (
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
