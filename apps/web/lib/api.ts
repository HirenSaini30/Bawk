import { supabase } from "./supabase-browser";
import { env } from "./env";

const API_URL = env.apiUrl;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ── Supervisor endpoints ──

export async function listChildren() {
  return apiFetch<{ children: any[] }>("/supervisor/children");
}

export async function getChildDetail(childId: string) {
  return apiFetch<{ profile: any; goals: any[]; tasks: any[] }>(
    `/supervisor/child/${childId}`
  );
}

export async function createGoal(data: {
  child_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  success_criteria: string[];
  constraints: Record<string, unknown>;
}) {
  return apiFetch("/supervisor/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getGoal(goalId: string) {
  return apiFetch<{ goal: any; tasks: any[] }>(`/supervisor/goals/${goalId}`);
}

export async function updateGoal(goalId: string, data: Record<string, unknown>) {
  return apiFetch(`/supervisor/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function generateTasks(data: {
  goal_id: string;
  desired_task_types: string[];
  count: number;
  constraints?: Record<string, unknown>;
}) {
  return apiFetch<{ tasks: any[] }>("/ai/tasks/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTask(taskId: string) {
  return apiFetch<any>(`/tasks/${taskId}`);
}

export async function updateTask(
  taskId: string,
  data: { title?: string; content?: Record<string, unknown> }
) {
  return apiFetch(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function publishTask(
  taskId: string,
  scheduledDates: string[]
) {
  return apiFetch<{ task_id: string; status: string; assignments: any[] }>(
    `/tasks/${taskId}/publish`,
    { method: "POST", body: JSON.stringify({ scheduled_dates: scheduledDates }) }
  );
}

export async function getChildProgress(childId: string) {
  return apiFetch<any>(`/supervisor/child/${childId}/progress`);
}

// ── Child endpoints ──

export async function getToday() {
  return apiFetch<{
    assignments: any[];
    rewards_status: any;
    streak_days: number;
  }>("/child/today");
}

export async function submitText(assignmentId: string, responseText: string) {
  return apiFetch<any>(`/child/assignments/${assignmentId}/submit_text`, {
    method: "POST",
    body: JSON.stringify({ response_text: responseText }),
  });
}

export async function submitVoice(assignmentId: string, audioBlob: Blob) {
  const { data: { session } } = await supabase.auth.getSession();
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch(
    `${API_URL}/child/assignments/${assignmentId}/submit_voice`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: formData,
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function getMyPokemon() {
  return apiFetch<{ pokemon: any[] }>("/child/pokemon");
}

export async function requestTts(text: string) {
  return apiFetch<{ narration_text: string }>("/ai/tts", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
