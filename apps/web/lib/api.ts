import { supabase } from "./supabase-browser";
import { env } from "./env";

const API_URL = env.apiUrl;

async function getAuthHeaders(): Promise<Record<string, string>> {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const refreshResult = await supabase.auth.refreshSession();
    session = refreshResult.data.session;
  }

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
  options: RequestInit = {},
  hasRetried = false
): Promise<T> {
  const headers = await getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch {
    throw new Error(
      "Could not reach the API. Check that the backend is running and NEXT_PUBLIC_API_URL is correct."
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    if (
      !hasRetried &&
      res.status === 401 &&
      typeof body.detail === "string" &&
      body.detail.toLowerCase().includes("invalid token")
    ) {
      await supabase.auth.refreshSession();
      return apiFetch<T>(path, options, true);
    }
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ── Supervisor endpoints ──

export async function listChildren() {
  return apiFetch<{ children: any[] }>("/supervisor/children");
}

export async function linkChildByEmail(childEmail: string) {
  return apiFetch<{ linked: boolean; child: any }>("/supervisor/children/link", {
    method: "POST",
    body: JSON.stringify({ child_email: childEmail }),
  });
}

export async function getChildDetail(childId: string) {
  return apiFetch<{ profile: any; goals: any[]; tasks: any[] }>(
    `/supervisor/child/${childId}`
  );
}

export async function createGoal(data: {
  child_id?: string;
  child_ids?: string[];
  title: string;
  description: string;
  category: string;
  difficulty: number;
  success_criteria: string[];
  constraints: Record<string, unknown>;
}) {
  return apiFetch<{ goal: any; goals: any[] }>("/supervisor/goals", {
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
  auto_assign_dates?: string[];
  target_child_ids?: string[];
  assign_all_linked_children?: boolean;
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
  data: {
    scheduled_dates?: string[];
    target_child_ids?: string[];
    assign_all_linked_children?: boolean;
  }
) {
  return apiFetch<{
    task_id: string;
    status: string;
    assignments: any[];
    published_task_ids: string[];
  }>(
    `/tasks/${taskId}/publish`,
    { method: "POST", body: JSON.stringify(data) }
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

  let res: Response;
  try {
    res = await fetch(
      `${API_URL}/child/assignments/${assignmentId}/submit_voice`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      }
    );
  } catch {
    throw new Error(
      "Could not reach the API. Check that the backend is running and NEXT_PUBLIC_API_URL is correct."
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function getMyPokemon() {
  return apiFetch<{ pokemon: any[]; rewards_status: any }>("/child/pokemon");
}

export async function getMyProgress() {
  return apiFetch<{
    completed_total: number;
    open_total: number;
    recent_completed: any[];
    rewards_status: any;
  }>("/child/progress");
}

export async function requestTts(text: string) {
  return apiFetch<{ narration_text: string }>("/ai/tts", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function requestUpsetSupport(context?: string) {
  return apiFetch<{
    support_plan: {
      intro_text?: string;
      steps?: Array<{
        instruction: string;
        duration_seconds?: number;
        type: string;
      }>;
      closing_text?: string;
    };
  }>("/ai/upset-support", {
    method: "POST",
    body: JSON.stringify({ context }),
  });
}
