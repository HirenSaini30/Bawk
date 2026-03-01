"""Supabase client helpers (service-role for server-side operations)."""

from supabase import create_client, Client
from app.config import get_settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        s = get_settings()
        _client = create_client(s.supabase_url, s.supabase_service_role_key)
    return _client


async def get_profile_role(user_id: str) -> str | None:
    sb = get_supabase()
    result = sb.table("profiles").select("role").eq("id", user_id).single().execute()
    if result.data:
        return result.data["role"]
    return None


async def verify_supervisor_child_link(supervisor_id: str, child_id: str) -> bool:
    sb = get_supabase()
    result = (
        sb.table("supervisor_child")
        .select("supervisor_id")
        .eq("supervisor_id", supervisor_id)
        .eq("child_id", child_id)
        .execute()
    )
    return len(result.data) > 0


async def list_supervisor_child_ids(supervisor_id: str) -> list[str]:
    sb = get_supabase()
    result = (
        sb.table("supervisor_child")
        .select("child_id")
        .eq("supervisor_id", supervisor_id)
        .execute()
    )
    return [row["child_id"] for row in (result.data or []) if row.get("child_id")]


async def audit_log(
    actor_id: str, action: str, target_type: str, target_id: str, metadata: dict | None = None
):
    sb = get_supabase()
    sb.table("audit_logs").insert(
        {
            "actor_id": actor_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "metadata": metadata or {},
        }
    ).execute()
