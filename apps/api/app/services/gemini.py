"""Gemini AI client wrapper with structured prompting and safety controls."""

import json
import google.generativeai as genai
from app.config import get_settings

_configured = False

SYSTEM_SAFETY_RULES = """You are a supportive assistant for neurodivergent children (ages 7-15) 
practicing social skills. You MUST follow these rules at ALL times:

1. TONE: Always be warm, encouraging, patient, and supportive. Never use sarcasm.
2. NO DIAGNOSIS LANGUAGE: Never reference or imply diagnoses, disorders, or medical terms.
3. NO SHAME OR THREATS: Never shame, criticize harshly, threaten, or use punishment language.
4. ENCOURAGEMENT: Celebrate effort over results. Use phrases like "Great try!" or "You're learning!"
5. SAFETY: If the child seems upset or confused, gently suggest "You can always ask your helper (supervisor) if you need support."
6. SIMPLICITY: Use short sentences. Adjust reading level to the child's age band.
7. JSON ONLY: When generating tasks, respond ONLY with valid JSON. No markdown, no extra text.
8. PRIVACY: Never ask for or reference personal information, real names, or locations.
"""

TASK_GENERATION_PROMPT = """Generate {count} practice task(s) for a child working on this goal.

Goal: {goal_title}
Description: {goal_description}
Category: {category}
Difficulty: {difficulty}/5
Child age band: {age_band}
Desired task types: {task_types}

Constraints from supervisor:
{constraints}

Success criteria:
{success_criteria}

For each task, produce a JSON object matching the type:

**social_story**: {{
  "type": "social_story",
  "title": "short title",
  "content": {{
    "pages": [
      {{"text": "page text for the child", "narration_text": "slightly simpler text for audio narration"}}
    ],
    "reflection_questions": ["question about the story"]
  }}
}}

**roleplay**: {{
  "type": "roleplay",
  "title": "short title",
  "content": {{
    "scenario": "describe the situation",
    "characters": [{{"name": "Friend", "description": "a classmate"}}],
    "dialogue_turns": [
      {{"speaker": "Friend", "text": "Hi! Want to play?", "is_child_turn": false}},
      {{"speaker": "You", "is_child_turn": true, "choices": ["Sure!", "Maybe later", "What are you playing?"], "hint": "Any answer is okay!"}}
    ],
    "debrief": "You did great practicing conversation!"
  }}
}}

**calming**: {{
  "type": "calming",
  "title": "short title",
  "content": {{
    "intro_text": "Let's take a moment to feel calm.",
    "steps": [
      {{"instruction": "Take a deep breath in for 4 counts", "duration_seconds": 4, "type": "breathing"}},
      {{"instruction": "Would you like to try breathing or grounding?", "type": "choice", "choices": [{{"label": "Breathing", "next_step": 0}}, {{"label": "Grounding", "next_step": 2}}]}}
    ],
    "closing_text": "Great job taking care of yourself!"
  }}
}}

**modeling**: {{
  "type": "modeling",
  "title": "short title",
  "content": {{
    "observation_prompts": ["Watch how the person asks for help"],
    "reflection_questions": ["What did you notice?", "How would you do it?"],
    "narration_text": "In this example, notice how..."
  }}
}}

Include at least one "ask for help" moment in every task.
Keep text short and clear for a child in the {age_band} age range.

Respond with a JSON array of task objects. No other text."""

FEEDBACK_PROMPT = """The child just completed a practice task. Give brief, supportive feedback.

Task type: {task_type}
Task title: {task_title}
Goal they are working on: {goal_title}
Their response: {child_response}

Rules:
- Be warm, specific, and encouraging
- Mention something they did well
- Give ONE gentle suggestion for next time (frame it positively)
- End with encouragement
- 2-4 sentences max
- If their response seems off-topic or confused, be kind and suggest asking their supervisor
- Never criticize or use shame language

Respond with a JSON object:
{{"feedback": "your feedback text", "effort_score": 1-5, "on_topic": true/false}}"""

TTS_CLEAN_PROMPT = """Convert the following text to be spoken aloud to a child (age {age_band}).
Make it sound natural, warm, and clear. Keep it simple. Remove any formatting.
Return ONLY the cleaned text, nothing else.

Text: {text}"""


def _ensure_configured():
    global _configured
    if not _configured:
        genai.configure(api_key=get_settings().gemini_api_key)
        _configured = True


def _get_model(model_name: str = "gemini-1.5-flash"):
    _ensure_configured()
    return genai.GenerativeModel(
        model_name,
        system_instruction=SYSTEM_SAFETY_RULES,
        generation_config=genai.GenerationConfig(
            temperature=0.7,
            top_p=0.9,
            response_mime_type="application/json",
        ),
    )


def _get_text_model(model_name: str = "gemini-1.5-flash"):
    _ensure_configured()
    return genai.GenerativeModel(
        model_name,
        system_instruction=SYSTEM_SAFETY_RULES,
        generation_config=genai.GenerationConfig(
            temperature=0.7,
            top_p=0.9,
        ),
    )


async def generate_tasks(
    goal_title: str,
    goal_description: str,
    category: str,
    difficulty: int,
    age_band: str,
    task_types: list[str],
    count: int,
    constraints: dict,
    success_criteria: list[str],
) -> list[dict]:
    model = _get_model()
    prompt = TASK_GENERATION_PROMPT.format(
        count=count,
        goal_title=goal_title,
        goal_description=goal_description,
        category=category,
        difficulty=difficulty,
        age_band=age_band or "10-12",
        task_types=", ".join(task_types),
        constraints=json.dumps(constraints, indent=2) if constraints else "None specified",
        success_criteria="\n".join(f"- {c}" for c in success_criteria) if success_criteria else "None specified",
    )
    response = model.generate_content(prompt)
    tasks = json.loads(response.text)
    if isinstance(tasks, dict):
        tasks = [tasks]
    return tasks


async def generate_feedback(
    task_type: str,
    task_title: str,
    goal_title: str,
    child_response: str,
) -> dict:
    model = _get_model()
    prompt = FEEDBACK_PROMPT.format(
        task_type=task_type,
        task_title=task_title,
        goal_title=goal_title,
        child_response=child_response,
    )
    response = model.generate_content(prompt)
    return json.loads(response.text)


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    _ensure_configured()
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        [
            "Transcribe this audio. Return ONLY the transcription text, nothing else.",
            {"mime_type": mime_type, "data": audio_bytes},
        ]
    )
    return response.text.strip()


async def text_to_speech_text(text: str, age_band: str = "10-12") -> str:
    """Clean text for TTS. Actual audio synthesis uses Google Cloud TTS or Gemini TTS."""
    model = _get_text_model()
    prompt = TTS_CLEAN_PROMPT.format(age_band=age_band, text=text)
    response = model.generate_content(prompt)
    return response.text.strip()
