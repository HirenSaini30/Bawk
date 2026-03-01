"""Seed script: inserts Pokemon catalog and task templates into Supabase."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db import get_supabase

POKEMON_CATALOG = [
    {"pokemon_key": "ember_fox", "name": "Ember Fox", "rarity": "common", "evolves_to": "blaze_fox", "evo_threshold": 100},
    {"pokemon_key": "blaze_fox", "name": "Blaze Fox", "rarity": "common", "evolves_to": "inferno_fox", "evo_threshold": 300},
    {"pokemon_key": "aqua_turtle", "name": "Aqua Turtle", "rarity": "common", "evolves_to": "wave_turtle", "evo_threshold": 100},
    {"pokemon_key": "wave_turtle", "name": "Wave Turtle", "rarity": "common", "evolves_to": "ocean_turtle", "evo_threshold": 300},
    {"pokemon_key": "leaf_owl", "name": "Leaf Owl", "rarity": "common", "evolves_to": "forest_owl", "evo_threshold": 100},
    {"pokemon_key": "forest_owl", "name": "Forest Owl", "rarity": "common", "evolves_to": "ancient_owl", "evo_threshold": 300},
    {"pokemon_key": "spark_bunny", "name": "Spark Bunny", "rarity": "common", "evolves_to": "thunder_bunny", "evo_threshold": 100},
    {"pokemon_key": "cloud_bear", "name": "Cloud Bear", "rarity": "common", "evolves_to": "storm_bear", "evo_threshold": 100},
    {"pokemon_key": "crystal_deer", "name": "Crystal Deer", "rarity": "uncommon", "evolves_to": "prism_deer", "evo_threshold": 150},
    {"pokemon_key": "shadow_cat", "name": "Shadow Cat", "rarity": "uncommon", "evolves_to": "phantom_cat", "evo_threshold": 150},
    {"pokemon_key": "breeze_falcon", "name": "Breeze Falcon", "rarity": "uncommon", "evolves_to": "gale_falcon", "evo_threshold": 150},
    {"pokemon_key": "stone_pup", "name": "Stone Pup", "rarity": "rare", "evolves_to": "boulder_wolf", "evo_threshold": 200},
    {"pokemon_key": "star_dolphin", "name": "Star Dolphin", "rarity": "rare", "evolves_to": "nova_dolphin", "evo_threshold": 200},
]

TASK_TEMPLATES = [
    {
        "type": "social_story",
        "name": "Basic Social Story",
        "template": {
            "description": "A short illustrated social story with reflection questions",
            "prompt_template": "Create a social story about {topic} for a child aged {age_band}.",
            "output_schema": {
                "pages": [{"text": "string", "narration_text": "string"}],
                "reflection_questions": ["string"],
            },
        },
    },
    {
        "type": "roleplay",
        "name": "Two-Person Dialogue",
        "template": {
            "description": "A guided dialogue practice between the child and one character",
            "prompt_template": "Create a roleplay dialogue about {topic} with {character_count} turns.",
            "output_schema": {
                "scenario": "string",
                "characters": [{"name": "string", "description": "string"}],
                "dialogue_turns": [{"speaker": "string", "text": "string", "is_child_turn": "boolean", "choices": ["string"]}],
                "debrief": "string",
            },
        },
    },
    {
        "type": "modeling",
        "name": "Video/Audio Observation",
        "template": {
            "description": "Watch or listen to a model, then answer reflection questions",
            "prompt_template": "Create observation prompts and reflection questions for a {media_type} about {topic}.",
            "output_schema": {
                "observation_prompts": ["string"],
                "reflection_questions": ["string"],
                "narration_text": "string",
            },
        },
    },
    {
        "type": "calming",
        "name": "Guided Calming Routine",
        "template": {
            "description": "A short calming exercise with breathing and grounding options",
            "prompt_template": "Create a calming routine with {step_count} steps including both breathing and grounding.",
            "output_schema": {
                "intro_text": "string",
                "steps": [{"instruction": "string", "duration_seconds": "number", "type": "string"}],
                "closing_text": "string",
            },
        },
    },
]


def seed():
    sb = get_supabase()

    print("Seeding task templates...")
    for tmpl in TASK_TEMPLATES:
        existing = (
            sb.table("task_templates")
            .select("id")
            .eq("type", tmpl["type"])
            .eq("name", tmpl["name"])
            .execute()
        )
        if not existing.data:
            sb.table("task_templates").insert(tmpl).execute()
            print(f"  Created template: {tmpl['name']}")
        else:
            print(f"  Skipped (exists): {tmpl['name']}")

    print(f"\nPokemon catalog has {len(POKEMON_CATALOG)} entries (stored in app code, not DB).")
    print("Seed complete!")


if __name__ == "__main__":
    seed()
