"""Child-facing endpoints — today's work, submissions, pokemon."""

from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from app.auth import AuthUser, require_child
from app.config import get_settings
from app.db import get_supabase
from app.rate_limit import ai_rate_limit
from app.services import gemini
from app.services.rewards import grant_completion_reward, get_rewards_status

router = APIRouter(prefix="/child", tags=["child"])


class SubmitTextRequest(BaseModel):
    response_text: str = Field(min_length=1, max_length=5000)


@router.get("/today")
async def get_today(user: AuthUser = Depends(require_child)):
    sb = get_supabase()
    today = date.today().isoformat()

    assignments = (
        sb.table("assignments")
        .select("*, task:tasks(*)")
        .eq("child_id", user.id)
        .eq("scheduled_date", today)
        .in_("status", ["assigned", "in_progress"])
        .execute()
    )

    # Compute streak: consecutive days with at least one completion
    all_completed = (
        sb.table("assignments")
        .select("completed_at")
        .eq("child_id", user.id)
        .eq("status", "completed")
        .order("completed_at", desc=True)
        .limit(60)
        .execute()
    )

    streak = 0
    if all_completed.data:
        seen_dates = sorted(
            set(
                datetime.fromisoformat(a["completed_at"]).date()
                for a in all_completed.data
                if a["completed_at"]
            ),
            reverse=True,
        )
        check = date.today()
        for d in seen_dates:
            if d == check:
                streak += 1
                check = date.fromordinal(check.toordinal() - 1)
            elif d < check:
                break

    rewards = await get_rewards_status(user.id)

    return {
        "assignments": assignments.data or [],
        "rewards_status": rewards,
        "streak_days": streak,
    }


@router.post("/assignments/{assignment_id}/submit_text")
async def submit_text(
    assignment_id: str,
    body: SubmitTextRequest,
    user: AuthUser = Depends(require_child),
    _rl=Depends(ai_rate_limit),
):
    sb = get_supabase()

    assignment = (
        sb.table("assignments")
        .select("*, task:tasks(*, goal:goals(*))")
        .eq("id", assignment_id)
        .single()
        .execute()
    )
    if not assignment.data:
        raise HTTPException(404, "Assignment not found")

    if assignment.data["child_id"] != user.id:
        raise HTTPException(403, "Not your assignment")

    if assignment.data["status"] == "completed":
        raise HTTPException(400, "Already completed")

    task = assignment.data.get("task", {})
    goal = task.get("goal", {})

    feedback_result = await gemini.generate_feedback(
        task_type=task.get("type", ""),
        task_title=task.get("title", ""),
        goal_title=goal.get("title", ""),
        child_response=body.response_text,
    )

    submission = (
        sb.table("submissions")
        .insert(
            {
                "assignment_id": assignment_id,
                "child_id": user.id,
                "input_mode": "text",
                "input_text": body.response_text,
                "ai_feedback": feedback_result.get("feedback", ""),
                "scores": {
                    "effort": feedback_result.get("effort_score", 3),
                    "on_topic": feedback_result.get("on_topic", True),
                },
            }
        )
        .execute()
    )

    sb.table("assignments").update(
        {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", assignment_id).execute()

    reward_result = await grant_completion_reward(
        child_id=user.id,
        assignment_id=assignment_id,
        effort_score=feedback_result.get("effort_score", 3),
        on_topic=feedback_result.get("on_topic", True),
    )

    return {
        "submission": submission.data[0] if submission.data else {},
        "feedback": feedback_result.get("feedback", "Great job!"),
        "rewards": reward_result.get("reward_entry", {}),
        "pokemon_update": reward_result.get("pokemon_update"),
    }


@router.post("/assignments/{assignment_id}/submit_voice")
async def submit_voice(
    assignment_id: str,
    audio: UploadFile = File(...),
    user: AuthUser = Depends(require_child),
    _rl=Depends(ai_rate_limit),
):
    settings = get_settings()

    if audio.content_type and "audio" not in audio.content_type:
        raise HTTPException(400, "File must be audio")

    audio_bytes = await audio.read()
    if len(audio_bytes) > settings.max_upload_bytes:
        raise HTTPException(400, f"Audio file too large (max {settings.max_upload_bytes // 1024}KB)")

    sb = get_supabase()

    assignment = (
        sb.table("assignments")
        .select("*, task:tasks(*, goal:goals(*))")
        .eq("id", assignment_id)
        .single()
        .execute()
    )
    if not assignment.data:
        raise HTTPException(404, "Assignment not found")

    if assignment.data["child_id"] != user.id:
        raise HTTPException(403, "Not your assignment")

    if assignment.data["status"] == "completed":
        raise HTTPException(400, "Already completed")

    # Transcribe — audio bytes are NOT stored after this
    mime = audio.content_type or "audio/webm"
    transcript = await gemini.transcribe_audio(audio_bytes, mime)
    # Audio deleted by going out of scope — never persisted

    task = assignment.data.get("task", {})
    goal = task.get("goal", {})

    feedback_result = await gemini.generate_feedback(
        task_type=task.get("type", ""),
        task_title=task.get("title", ""),
        goal_title=goal.get("title", ""),
        child_response=transcript,
    )

    submission = (
        sb.table("submissions")
        .insert(
            {
                "assignment_id": assignment_id,
                "child_id": user.id,
                "input_mode": "voice",
                "transcript_text": transcript,
                "ai_feedback": feedback_result.get("feedback", ""),
                "scores": {
                    "effort": feedback_result.get("effort_score", 3),
                    "on_topic": feedback_result.get("on_topic", True),
                },
            }
        )
        .execute()
    )

    sb.table("assignments").update(
        {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", assignment_id).execute()

    reward_result = await grant_completion_reward(
        child_id=user.id,
        assignment_id=assignment_id,
        effort_score=feedback_result.get("effort_score", 3),
        on_topic=feedback_result.get("on_topic", True),
    )

    return {
        "submission": submission.data[0] if submission.data else {},
        "transcript": transcript,
        "feedback": feedback_result.get("feedback", "Great job!"),
        "rewards": reward_result.get("reward_entry", {}),
        "pokemon_update": reward_result.get("pokemon_update"),
    }


@router.get("/pokemon")
async def get_pokemon(user: AuthUser = Depends(require_child)):
    sb = get_supabase()
    pokemon = (
        sb.table("pokemon_collection")
        .select("*")
        .eq("child_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"pokemon": pokemon.data or []}
