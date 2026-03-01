"""Task management — publish, edit (supervisor only)."""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.auth import AuthUser, require_supervisor
from app.db import (
    get_supabase,
    verify_supervisor_child_link,
    audit_log,
    list_supervisor_child_ids,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


class PublishTaskRequest(BaseModel):
    scheduled_dates: list[str] | None = None
    target_child_ids: list[str] = Field(default=[])
    assign_all_linked_children: bool = False


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

    target_child_ids = [task_data["child_id"], *(body.target_child_ids or [])]
    if body.assign_all_linked_children:
        target_child_ids.extend(await list_supervisor_child_ids(user.id))
    target_child_ids = list(dict.fromkeys(target_child_ids))

    for child_id in target_child_ids:
        if not await verify_supervisor_child_link(user.id, child_id):
            raise HTTPException(403, "Not linked to one or more selected clients")

    assignments = []
    published_task_ids = []
    scheduled_dates = body.scheduled_dates or [date.today().isoformat()]

    for child_id in target_child_ids:
        target_task_id = task_id
        if child_id == task_data["child_id"]:
            sb.table("tasks").update({"status": "assigned"}).eq("id", task_id).execute()
            published_task_ids.append(task_id)
        else:
            clone = (
                sb.table("tasks")
                .insert(
                    {
                        "goal_id": task_data["goal_id"],
                        "supervisor_id": user.id,
                        "child_id": child_id,
                        "type": task_data["type"],
                        "title": task_data["title"],
                        "content": task_data["content"],
                        "ai_generated": task_data["ai_generated"],
                        "status": "assigned",
                    }
                )
                .execute()
            )
            if clone.data:
                target_task_id = clone.data[0]["id"]
                published_task_ids.append(target_task_id)

        for date_str in scheduled_dates:
            row = (
                sb.table("assignments")
                .insert(
                    {
                        "task_id": target_task_id,
                        "child_id": child_id,
                        "scheduled_date": date_str,
                        "status": "assigned",
                    }
                )
                .execute()
            )
            if row.data:
                assignments.append(row.data[0])

    await audit_log(
        user.id,
        "publish_task",
        "task",
        task_id,
        {"dates": scheduled_dates, "target_child_ids": target_child_ids},
    )

    return {
        "task_id": task_id,
        "status": "assigned",
        "assignments": assignments,
        "published_task_ids": published_task_ids,
    }


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
