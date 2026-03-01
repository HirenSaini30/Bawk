"""AI endpoints — task generation and supportive child-facing guidance."""

from fastapi import APIRouter, Depends, HTTPException
from google.api_core.exceptions import GoogleAPICallError
from pydantic import BaseModel, Field
from app.auth import AuthUser, require_supervisor, get_current_user, require_child
from app.db import (
    get_supabase,
    verify_supervisor_child_link,
    audit_log,
    list_supervisor_child_ids,
)
from app.rate_limit import ai_rate_limit
from app.services import gemini

router = APIRouter(prefix="/ai", tags=["ai"])


class GenerateTasksRequest(BaseModel):
    goal_id: str
    desired_task_types: list[str] = Field(min_length=1)
    count: int = Field(default=1, ge=1, le=5)
    constraints: dict | None = None
    auto_assign_dates: list[str] | None = None
    target_child_ids: list[str] = Field(default=[])
    assign_all_linked_children: bool = False


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class UpsetSupportRequest(BaseModel):
    context: str | None = Field(default=None, max_length=500)


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

    target_child_ids = [goal_data["child_id"], *(body.target_child_ids or [])]
    if body.assign_all_linked_children:
        target_child_ids.extend(await list_supervisor_child_ids(user.id))
    target_child_ids = list(dict.fromkeys(target_child_ids))

    for child_id in target_child_ids:
        if not await verify_supervisor_child_link(user.id, child_id):
            raise HTTPException(403, "Not linked to one or more selected clients")

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

    try:
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
    except GoogleAPICallError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini task generation failed: {exc.message}",
        )

    created_tasks = []
    for task_draft in tasks:
        task_type = task_draft.get("type", body.desired_task_types[0])
        for child_id in target_child_ids:
            row = (
                sb.table("tasks")
                .insert(
                    {
                        "goal_id": body.goal_id,
                        "supervisor_id": user.id,
                        "child_id": child_id,
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
                created_task = row.data[0]
                created_tasks.append(created_task)

                if body.auto_assign_dates:
                    sb.table("tasks").update({"status": "assigned"}).eq(
                        "id", created_task["id"]
                    ).execute()

                    for date_str in body.auto_assign_dates:
                        sb.table("assignments").insert(
                            {
                                "task_id": created_task["id"],
                                "child_id": child_id,
                                "scheduled_date": date_str,
                                "status": "assigned",
                            }
                        ).execute()
                    created_task["status"] = "assigned"

    await audit_log(
        user.id,
        "generate_tasks",
        "goal",
        body.goal_id,
        {"count": len(created_tasks), "target_child_ids": target_child_ids},
    )

    return {"tasks": created_tasks}


@router.post("/tts")
async def text_to_speech(
    body: TtsRequest,
    user: AuthUser = Depends(get_current_user),
    _rl=Depends(ai_rate_limit),
):
    try:
        cleaned = await gemini.text_to_speech_text(body.text)
    except GoogleAPICallError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini narration cleanup failed: {exc.message}",
        )
    # For MVP, return the cleaned narration text.
    # In production, pipe this through Google Cloud TTS for actual audio bytes.
    return {"narration_text": cleaned}


@router.post("/upset-support")
async def upset_support(
    body: UpsetSupportRequest,
    user: AuthUser = Depends(require_child),
    _rl=Depends(ai_rate_limit),
):
    sb = get_supabase()
    profile = (
        sb.table("profiles")
        .select("age_band")
        .eq("id", user.id)
        .single()
        .execute()
    )
    age_band = profile.data.get("age_band", "10-12") if profile.data else "10-12"
    try:
        support_plan = await gemini.generate_upset_support_plan(
            age_band=age_band,
            context=(body.context or "").strip(),
        )
    except GoogleAPICallError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini upset-support generation failed: {exc.message}",
        )
    return {"support_plan": support_plan}
