"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTask, updateTask, publishTask } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_LABELS, todayISO } from "@/lib/utils";

export default function TaskEditPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduleDates, setScheduleDates] = useState(todayISO());

  useEffect(() => {
    getTask(taskId)
      .then((t) => {
        setTask(t);
        setEditTitle(t.title);
        setEditContent(JSON.stringify(t.content, null, 2));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  async function handleSave() {
    setSaving(true);
    try {
      const content = JSON.parse(editContent);
      const updated = await updateTask(taskId, {
        title: editTitle,
        content,
      });
      setTask({ ...task, ...(updated as any) });
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const dates = scheduleDates
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      await publishTask(taskId, dates);
      setTask({ ...task, status: "assigned" });
    } catch (err: any) {
      alert(err.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="supervisor-container text-center py-12 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="supervisor-container text-center py-12 text-red-500">
        Task not found
      </div>
    );
  }

  const isDraft = task.status === "draft";

  return (
    <div className="supervisor-container max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          <div className="flex gap-2 mt-2">
            <Badge>{TASK_TYPE_LABELS[task.type] || task.type}</Badge>
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
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={!isDraft}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content (JSON)
            </label>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={!isDraft}
              className="font-mono text-sm min-h-[300px]"
            />
          </div>
          {isDraft && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </CardContent>
      </Card>

      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Publish & Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule dates (comma-separated YYYY-MM-DD)
              </label>
              <Input
                value={scheduleDates}
                onChange={(e) => setScheduleDates(e.target.value)}
                placeholder="2025-01-15, 2025-01-16"
              />
            </div>
            <Button
              variant="calm"
              size="lg"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? "Publishing..." : "Publish & Assign to Client"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
