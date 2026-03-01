"""AI endpoints — task generation and TTS (supervisor & child)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.auth import AuthUser, require_supervisor, get_current_user
from app.db import get_supabase, verify_supervisor_child_link, audit_log
from app.rate_limit import ai_rate_limit
from app.services import gemini

router = APIRouter(prefix="/ai", tags=["ai"])


class GenerateTasksRequest(BaseModel):
    goal_id: str
    desired_task_types: list[str] = Field(min_length=1)
    count: int = Field(default=1, ge=1, le=5)
    constraints: dict | None = None


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@router.post("/tasks/generate")
async def generate_tasks(
    body: GenerateTasksRequest,
    user: AuthUser = Depends(require_supervisor),
    _rl=Depends(ai_rate_limit),
):
    sb = get_supabase()
    goal = sb.table("goals").select("*").eq("id", body.goal_id).single().execute()
    if not goal.data:
        raise HTTPException(404, "Goal not found")

    goal_data = goal.data
    if goal_data["supervisor_id"] != user.id:
        raise HTTPException(403, "Not your goal")

    if not await verify_supervisor_child_link(user.id, goal_data["child_id"]):
        raise HTTPException(403, "Not linked to this child")

    child_profile = (
        sb.table("profiles")
        .select("age_band")
        .eq("id", goal_data["child_id"])
        .single()
        .execute()
    )
    age_band = child_profile.data.get("age_band", "10-12") if child_profile.data else "10-12"

    valid_types = {"social_story", "roleplay", "modeling", "calming"}
    for t in body.desired_task_types:
        if t not in valid_types:
            raise HTTPException(400, f"Invalid task type: {t}")

    tasks = await gemini.generate_tasks(
        goal_title=goal_data["title"],
        goal_description=goal_data["description"],
        category=goal_data["category"],
        difficulty=goal_data["difficulty"],
        age_band=age_band,
        task_types=body.desired_task_types,
        count=body.count,
        constraints=goal_data.get("constraints", {}),
        success_criteria=goal_data.get("success_criteria", []),
    )

    created_tasks = []
    for task_draft in tasks:
        task_type = task_draft.get("type", body.desired_task_types[0])
        row = (
            sb.table("tasks")
            .insert(
                {
                    "goal_id": body.goal_id,
                    "supervisor_id": user.id,
                    "child_id": goal_data["child_id"],
                    "type": task_type,
                    "title": task_draft.get("title", "Untitled Task"),
                    "content": task_draft.get("content", {}),
                    "ai_generated": True,
                    "status": "draft",
                }
            )
            .execute()
        )
        if row.data:
            created_tasks.append(row.data[0])

    await audit_log(user.id, "generate_tasks", "goal", body.goal_id, {"count": len(created_tasks)})

    return {"tasks": created_tasks}


@router.post("/tts")
async def text_to_speech(
    body: TtsRequest,
    user: AuthUser = Depends(get_current_user),
    _rl=Depends(ai_rate_limit),
):
    from fastapi.responses import Response

    cleaned = await gemini.text_to_speech_text(body.text)
    # For MVP, return the cleaned narration text.
    # In production, pipe this through Google Cloud TTS for actual audio bytes.
    return {"narration_text": cleaned}
