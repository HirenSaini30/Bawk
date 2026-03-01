"""Task management — publish, edit (supervisor only)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.auth import AuthUser, require_supervisor
from app.db import get_supabase, verify_supervisor_child_link, audit_log

router = APIRouter(prefix="/tasks", tags=["tasks"])


class PublishTaskRequest(BaseModel):
    scheduled_dates: list[str] = Field(min_length=1)


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    content: dict | None = None


@router.post("/{task_id}/publish")
async def publish_task(
    task_id: str,
    body: PublishTaskRequest,
    user: AuthUser = Depends(require_supervisor),
):
    sb = get_supabase()

    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(404, "Task not found")

    task_data = task.data
    if task_data["supervisor_id"] != user.id:
        raise HTTPException(403, "Not your task")

    if not await verify_supervisor_child_link(user.id, task_data["child_id"]):
        raise HTTPException(403, "Not linked to this child")

    sb.table("tasks").update({"status": "assigned"}).eq("id", task_id).execute()

    assignments = []
    for date_str in body.scheduled_dates:
        row = (
            sb.table("assignments")
            .insert(
                {
                    "task_id": task_id,
                    "child_id": task_data["child_id"],
                    "scheduled_date": date_str,
                    "status": "assigned",
                }
            )
            .execute()
        )
        if row.data:
            assignments.append(row.data[0])

    await audit_log(user.id, "publish_task", "task", task_id, {"dates": body.scheduled_dates})

    return {"task_id": task_id, "status": "assigned", "assignments": assignments}


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    body: UpdateTaskRequest,
    user: AuthUser = Depends(require_supervisor),
):
    sb = get_supabase()

    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(404, "Task not found")

    if task.data["supervisor_id"] != user.id:
        raise HTTPException(403, "Not your task")

    if task.data["status"] != "draft":
        raise HTTPException(400, "Can only edit draft tasks")

    updates = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.content is not None:
        updates["content"] = body.content

    if not updates:
        raise HTTPException(400, "No updates provided")

    result = sb.table("tasks").update(updates).eq("id", task_id).execute()
    await audit_log(user.id, "update_task", "task", task_id, updates)

    return result.data[0] if result.data else {}


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    user: AuthUser = Depends(require_supervisor),
):
    sb = get_supabase()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(404, "Task not found")

    if task.data["supervisor_id"] != user.id:
        if not await verify_supervisor_child_link(user.id, task.data["child_id"]):
            raise HTTPException(403, "Access denied")

    return task.data
