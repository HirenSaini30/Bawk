"""Supervisor endpoints — goals, children, progress."""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.auth import AuthUser, require_supervisor
from app.db import get_supabase, verify_supervisor_child_link, audit_log

router = APIRouter(prefix="/supervisor", tags=["supervisor"])


class CreateGoalRequest(BaseModel):
    child_id: str
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    category: str
    difficulty: int = Field(default=3, ge=1, le=5)
    success_criteria: list[str] = Field(default=[])
    constraints: dict = Field(default={})


class UpdateGoalRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)
    success_criteria: list[str] | None = None
    constraints: dict | None = None
    active: bool | None = None


@router.get("/children")
async def list_children(user: AuthUser = Depends(require_supervisor)):
    sb = get_supabase()
    links = (
        sb.table("supervisor_child")
        .select("child_id, profiles!supervisor_child_child_id_fkey(id, display_name, age_band, role)")
        .eq("supervisor_id", user.id)
        .execute()
    )
    children = []
    for link in links.data or []:
        profile = link.get("profiles")
        if profile:
            children.append(profile)
    return {"children": children}


@router.get("/child/{child_id}")
async def get_child_detail(
    child_id: str, user: AuthUser = Depends(require_supervisor)
):
    if not await verify_supervisor_child_link(user.id, child_id):
        raise HTTPException(403, "Not linked to this child")

    sb = get_supabase()
    profile = sb.table("profiles").select("*").eq("id", child_id).single().execute()
    goals = (
        sb.table("goals")
        .select("*")
        .eq("child_id", child_id)
        .eq("supervisor_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    tasks = (
        sb.table("tasks")
        .select("*")
        .eq("child_id", child_id)
        .eq("supervisor_id", user.id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    return {
        "profile": profile.data,
        "goals": goals.data or [],
        "tasks": tasks.data or [],
    }


@router.post("/goals")
async def create_goal(
    body: CreateGoalRequest, user: AuthUser = Depends(require_supervisor)
):
    if not await verify_supervisor_child_link(user.id, body.child_id):
        raise HTTPException(403, "Not linked to this child")

    valid_categories = {"conversation", "self_regulation", "help_seeking", "values", "other"}
    if body.category not in valid_categories:
        raise HTTPException(400, f"Invalid category: {body.category}")

    sb = get_supabase()
    result = (
        sb.table("goals")
        .insert(
            {
                "supervisor_id": user.id,
                "child_id": body.child_id,
                "title": body.title,
                "description": body.description,
                "category": body.category,
                "difficulty": body.difficulty,
                "success_criteria": body.success_criteria,
                "constraints": body.constraints,
            }
        )
        .execute()
    )

    await audit_log(user.id, "create_goal", "goal", result.data[0]["id"] if result.data else "")

    return result.data[0] if result.data else {}


@router.patch("/goals/{goal_id}")
async def update_goal(
    goal_id: str,
    body: UpdateGoalRequest,
    user: AuthUser = Depends(require_supervisor),
):
    sb = get_supabase()
    goal = sb.table("goals").select("*").eq("id", goal_id).single().execute()
    if not goal.data:
        raise HTTPException(404, "Goal not found")
    if goal.data["supervisor_id"] != user.id:
        raise HTTPException(403, "Not your goal")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No updates provided")

    result = sb.table("goals").update(updates).eq("id", goal_id).execute()
    await audit_log(user.id, "update_goal", "goal", goal_id, updates)

    return result.data[0] if result.data else {}


@router.get("/goals/{goal_id}")
async def get_goal(goal_id: str, user: AuthUser = Depends(require_supervisor)):
    sb = get_supabase()
    goal = sb.table("goals").select("*").eq("id", goal_id).single().execute()
    if not goal.data:
        raise HTTPException(404, "Goal not found")
    if goal.data["supervisor_id"] != user.id:
        raise HTTPException(403, "Not your goal")

    tasks = (
        sb.table("tasks")
        .select("*")
        .eq("goal_id", goal_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"goal": goal.data, "tasks": tasks.data or []}


@router.get("/child/{child_id}/progress")
async def get_progress(
    child_id: str, user: AuthUser = Depends(require_supervisor)
):
    if not await verify_supervisor_child_link(user.id, child_id):
        raise HTTPException(403, "Not linked to this child")

    sb = get_supabase()
    now = date.today()
    d7 = (now - timedelta(days=7)).isoformat()
    d30 = (now - timedelta(days=30)).isoformat()

    completed_7d = (
        sb.table("assignments")
        .select("id", count="exact")
        .eq("child_id", child_id)
        .eq("status", "completed")
        .gte("completed_at", d7)
        .execute()
    )

    completed_30d = (
        sb.table("assignments")
        .select("id", count="exact")
        .eq("child_id", child_id)
        .eq("status", "completed")
        .gte("completed_at", d30)
        .execute()
    )

    goals = (
        sb.table("goals")
        .select("id, title")
        .eq("child_id", child_id)
        .eq("supervisor_id", user.id)
        .eq("active", True)
        .execute()
    )

    by_goal = []
    difficulty_signals = []
    for g in goals.data or []:
        tasks = (
            sb.table("tasks")
            .select("id")
            .eq("goal_id", g["id"])
            .execute()
        )
        task_ids = [t["id"] for t in (tasks.data or [])]
        if not task_ids:
            by_goal.append({"goal_id": g["id"], "goal_title": g["title"], "completed": 0, "total": 0})
            continue

        total_assignments = (
            sb.table("assignments")
            .select("id, status", count="exact")
            .eq("child_id", child_id)
            .in_("task_id", task_ids)
            .execute()
        )
        completed = sum(1 for a in (total_assignments.data or []) if a["status"] == "completed")
        total = total_assignments.count or 0

        by_goal.append({
            "goal_id": g["id"],
            "goal_title": g["title"],
            "completed": completed,
            "total": total,
        })

        if total > 3 and completed / total < 0.4:
            difficulty_signals.append(f"Low completion rate for '{g['title']}' ({completed}/{total})")

    # Check for low-effort submissions
    recent_subs = (
        sb.table("submissions")
        .select("scores")
        .eq("child_id", child_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    low_effort_count = sum(
        1 for s in (recent_subs.data or [])
        if s.get("scores", {}).get("effort", 3) <= 2
    )
    if low_effort_count >= 3:
        difficulty_signals.append("Multiple recent low-effort responses — child may be disengaged or struggling")

    return {
        "child_id": child_id,
        "total_completed_7d": completed_7d.count or 0,
        "total_completed_30d": completed_30d.count or 0,
        "by_goal": by_goal,
        "difficulty_signals": difficulty_signals,
    }
