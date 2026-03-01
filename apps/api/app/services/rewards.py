"""Pokemon rewards system — deterministic MVP mechanics."""

import random
from app.db import get_supabase

# XP thresholds for evolution: stage 1 -> 2 at 100 XP, stage 2 -> 3 at 300 XP
EVOLUTION_THRESHOLDS = {1: 100, 2: 300}

BASE_XP_PER_COMPLETION = 25
BONUS_XP_ON_TOPIC = 10
COINS_PER_COMPLETION = 5

# Deterministic drop: every 3rd completion (by total count) grants a new Pokemon
DROP_INTERVAL = 3

STARTER_POKEMON = [
    {"pokemon_key": "ember_fox", "rarity": "common", "name": "Ember Fox"},
    {"pokemon_key": "aqua_turtle", "rarity": "common", "name": "Aqua Turtle"},
    {"pokemon_key": "leaf_owl", "rarity": "common", "name": "Leaf Owl"},
    {"pokemon_key": "spark_bunny", "rarity": "common", "name": "Spark Bunny"},
    {"pokemon_key": "cloud_bear", "rarity": "common", "name": "Cloud Bear"},
    {"pokemon_key": "crystal_deer", "rarity": "uncommon", "name": "Crystal Deer"},
    {"pokemon_key": "shadow_cat", "rarity": "uncommon", "name": "Shadow Cat"},
    {"pokemon_key": "breeze_falcon", "rarity": "uncommon", "name": "Breeze Falcon"},
    {"pokemon_key": "stone_pup", "rarity": "rare", "name": "Stone Pup"},
    {"pokemon_key": "star_dolphin", "rarity": "rare", "name": "Star Dolphin"},
]


async def grant_completion_reward(
    child_id: str,
    assignment_id: str,
    effort_score: int = 3,
    on_topic: bool = True,
) -> dict:
    """Award XP, coins, and potentially a new Pokemon for completing an assignment."""
    sb = get_supabase()

    xp = BASE_XP_PER_COMPLETION + (effort_score * 5)
    if on_topic:
        xp += BONUS_XP_ON_TOPIC
    coins = COINS_PER_COMPLETION + effort_score

    reward_payload: dict = {"pokemon_unlocked": None, "evolution": None}

    # Check total completions to determine if child earns a new Pokemon
    completions = (
        sb.table("rewards_ledger")
        .select("id", count="exact")
        .eq("child_id", child_id)
        .execute()
    )
    total_completions = (completions.count or 0) + 1

    pokemon_update = None

    if total_completions % DROP_INTERVAL == 0:
        # Deterministic selection cycling through the catalog
        owned = (
            sb.table("pokemon_collection")
            .select("pokemon_key")
            .eq("child_id", child_id)
            .execute()
        )
        owned_keys = {p["pokemon_key"] for p in (owned.data or [])}
        available = [p for p in STARTER_POKEMON if p["pokemon_key"] not in owned_keys]

        if available:
            # Pick from available, biased toward common first
            common = [p for p in available if p["rarity"] == "common"]
            pick = common[0] if common else available[0]

            new_pokemon = (
                sb.table("pokemon_collection")
                .insert(
                    {
                        "child_id": child_id,
                        "pokemon_key": pick["pokemon_key"],
                        "rarity": pick["rarity"],
                    }
                )
                .execute()
            )
            pokemon_update = new_pokemon.data[0] if new_pokemon.data else None
            reward_payload["pokemon_unlocked"] = pick["pokemon_key"]
        else:
            # All Pokemon owned — add XP to a random existing one for evolution
            existing = (
                sb.table("pokemon_collection")
                .select("*")
                .eq("child_id", child_id)
                .execute()
            )
            if existing.data:
                target = random.choice(existing.data)
                new_xp = target["xp"] + xp
                new_stage = target["evolution_stage"]
                threshold = EVOLUTION_THRESHOLDS.get(new_stage)
                if threshold and new_xp >= threshold:
                    new_stage += 1
                    reward_payload["evolution"] = {
                        "pokemon_key": target["pokemon_key"],
                        "new_stage": new_stage,
                    }
                updated = (
                    sb.table("pokemon_collection")
                    .update(
                        {
                            "xp": new_xp,
                            "level": target["level"] + 1,
                            "evolution_stage": new_stage,
                        }
                    )
                    .eq("id", target["id"])
                    .execute()
                )
                pokemon_update = updated.data[0] if updated.data else None

    # Write reward ledger entry
    reward_entry = (
        sb.table("rewards_ledger")
        .insert(
            {
                "child_id": child_id,
                "assignment_id": assignment_id,
                "xp_delta": xp,
                "coins_delta": coins,
                "reward_payload": reward_payload,
            }
        )
        .execute()
    )

    return {
        "reward_entry": reward_entry.data[0] if reward_entry.data else {},
        "pokemon_update": pokemon_update,
    }


async def get_rewards_status(child_id: str) -> dict:
    sb = get_supabase()

    ledger = (
        sb.table("rewards_ledger")
        .select("*")
        .eq("child_id", child_id)
        .order("created_at", desc=True)
        .execute()
    )
    entries = ledger.data or []
    total_xp = sum(e["xp_delta"] for e in entries)
    total_coins = sum(e["coins_delta"] for e in entries)

    pokemon = (
        sb.table("pokemon_collection")
        .select("*", count="exact")
        .eq("child_id", child_id)
        .execute()
    )

    return {
        "total_xp": total_xp,
        "total_coins": total_coins,
        "pokemon_count": pokemon.count or 0,
        "latest_reward": entries[0] if entries else None,
    }
