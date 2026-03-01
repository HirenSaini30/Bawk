"""Pokemon rewards system — deterministic progression mechanics."""

from app.db import get_supabase

# XP thresholds for evolution: stage 1 -> 2 at 100 XP, stage 2 -> 3 at 300 XP
EVOLUTION_THRESHOLDS = {1: 100, 2: 300}
POKEMON_UNLOCK_XP = 120

BASE_XP_PER_COMPLETION = 25
BONUS_XP_ON_TOPIC = 10
COINS_PER_COMPLETION = 5

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
    ledger = (
        sb.table("rewards_ledger")
        .select("xp_delta", count="exact")
        .eq("child_id", child_id)
        .execute()
    )
    total_xp_before = sum(entry["xp_delta"] for entry in (ledger.data or []))
    total_xp_after = total_xp_before + xp
    total_completions = (ledger.count or 0) + 1

    pokemon_update = None
    existing = (
        sb.table("pokemon_collection")
        .select("*")
        .eq("child_id", child_id)
        .order("created_at")
        .execute()
    )
    owned_pokemon = existing.data or []
    owned_keys = {p["pokemon_key"] for p in owned_pokemon}

    available = [p for p in STARTER_POKEMON if p["pokemon_key"] not in owned_keys]
    eligible_unlocks = min(len(STARTER_POKEMON), total_xp_after // POKEMON_UNLOCK_XP)

    if eligible_unlocks > len(owned_pokemon) and available:
        pick = available[0]
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
        unlocked = new_pokemon.data[0] if new_pokemon.data else None
        if unlocked:
            pokemon_update = unlocked
            reward_payload["pokemon_unlocked"] = pick["pokemon_key"]
            owned_pokemon.append(unlocked)

    if owned_pokemon:
        target = owned_pokemon[0]
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
        if updated.data:
            if reward_payload["pokemon_unlocked"] == target["pokemon_key"]:
                pokemon_update = updated.data[0]
            elif pokemon_update is None:
                pokemon_update = updated.data[0]

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
    total_completions = len(entries)

    pokemon = (
        sb.table("pokemon_collection")
        .select("*", count="exact")
        .eq("child_id", child_id)
        .order("created_at")
        .execute()
    )
    pokemon_rows = pokemon.data or []
    next_unlock_at_xp = None
    xp_until_next_unlock = 0
    unlock_progress_percent = 100
    if (pokemon.count or 0) < len(STARTER_POKEMON):
        next_unlock_at_xp = ((pokemon.count or 0) + 1) * POKEMON_UNLOCK_XP
        xp_until_next_unlock = max(0, next_unlock_at_xp - total_xp)
        previous_unlock_floor = (pokemon.count or 0) * POKEMON_UNLOCK_XP
        segment = max(1, next_unlock_at_xp - previous_unlock_floor)
        unlock_progress_percent = min(
            100,
            round(((total_xp - previous_unlock_floor) / segment) * 100),
        )
        unlock_progress_percent = max(0, unlock_progress_percent)

    return {
        "total_xp": total_xp,
        "total_coins": total_coins,
        "total_completions": total_completions,
        "pokemon_count": pokemon.count or 0,
        "next_unlock_at_xp": next_unlock_at_xp,
        "xp_until_next_unlock": xp_until_next_unlock,
        "unlock_progress_percent": unlock_progress_percent,
        "active_companion": pokemon_rows[0] if pokemon_rows else None,
        "latest_reward": entries[0] if entries else None,
    }
