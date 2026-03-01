"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTask, updateTask, publishTask, listChildren } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_LABELS } from "@/lib/utils";

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
  const [clients, setClients] = useState<any[]>([]);
  const [assignAllClients, setAssignAllClients] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

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

  useEffect(() => {
    listChildren()
      .then((result) => setClients(result.children ?? []))
      .catch(console.error);
  }, []);

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
      const result = await publishTask(taskId, {
        scheduled_dates: [],
        target_child_ids: selectedClientIds,
        assign_all_linked_children: assignAllClients,
      });
      setTask({ ...task, status: "assigned" });
      if (result.published_task_ids.length > 0) {
        setSelectedClientIds([]);
      }
    } catch (err: any) {
      alert(err.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
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
            <CardTitle>Assign to Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Assign this task now. The current client stays included by default, and you can add more or send it to all linked clients.
            </p>
            <div className="space-y-3 rounded-kid border border-tan-200 p-4">
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
                    .filter((client) => client.id !== task.child_id)
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
              variant="calm"
              size="lg"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing
                ? "Assigning..."
                : assignAllClients
                ? "Assign to All Clients"
                : "Assign to Selected Clients"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
