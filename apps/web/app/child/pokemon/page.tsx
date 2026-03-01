"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyPokemon } from "@/lib/api";
import {
  getPokemonDisplay,
  POKEMON_DISPLAY,
  POKEMON_UNLOCK_XP,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EVOLUTION_THRESHOLDS: Record<number, number> = { 1: 100, 2: 300 };

function CreatureStage({
  label,
  emoji,
  accent,
  active,
}: {
  label: string;
  emoji: string;
  accent: string;
  active: boolean;
}) {
  return (
    <div
      className="rounded-2xl border px-3 py-3 text-center"
      style={{
        borderColor: active ? accent : "#E5E7EB",
        background: active ? `${accent}14` : "#FFFFFF",
      }}
    >
      <div className="text-3xl">{emoji}</div>
      <div
        className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: active ? accent : "#6B7280" }}
      >
        {label}
      </div>
    </div>
  );
}

export default function PokemonCollectionPage() {
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPokemon()
      .then((data) => {
        setPokemon(data.pokemon ?? []);
        setRewards(data.rewards_status ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const companion = rewards.active_companion;
  const companionDisplay = companion
    ? getPokemonDisplay(companion.pokemon_key, companion.evolution_stage)
    : null;

  const nextUnlockLabel = useMemo(() => {
    if (!rewards.next_unlock_at_xp) return "All creatures unlocked";
    return `${rewards.xp_until_next_unlock ?? 0} XP until your next creature`;
  }, [rewards.next_unlock_at_xp, rewards.xp_until_next_unlock]);

  if (loading) {
    return (
      <div className="kid-container text-center py-16 text-kid-lg text-gray-400">
        Loading your Pokemon...
      </div>
    );
  }

  return (
    <div className="kid-container space-y-6 py-8">
      <section className="rounded-[32px] border border-tan-200 bg-white/80 px-6 py-7 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">
              Creature Collection
            </p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Build your team and grow your buddy.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-600">
              Every activity gives XP. XP grows your main companion and unlocks new
              creatures over time.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 px-4 py-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-orange-600">
                Total XP
              </div>
              <div className="mt-2 text-3xl font-bold text-orange-700">
                {rewards.total_xp ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-sky-50 px-4 py-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-sky-600">
                Unlocked
              </div>
              <div className="mt-2 text-3xl font-bold text-sky-700">
                {rewards.pokemon_count ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-yellow-50 px-4 py-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-yellow-700">
                Next Unlock
              </div>
              <div className="mt-2 text-sm font-semibold text-yellow-800">
                {nextUnlockLabel}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="rounded-[28px] border-tan-200 bg-white/80 shadow-sm">
          <CardContent className="px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Unlock Progress</h2>
                <p className="mt-1 text-sm text-gray-600">
                  New creatures unlock every {POKEMON_UNLOCK_XP} total XP.
                </p>
              </div>
              <Badge variant="info">
                {rewards.next_unlock_at_xp
                  ? `${rewards.unlock_progress_percent ?? 0}%`
                  : "Complete"}
              </Badge>
            </div>

            <div className="mt-5 h-4 overflow-hidden rounded-full bg-tan-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-500"
                style={{
                  width: `${rewards.next_unlock_at_xp ? rewards.unlock_progress_percent ?? 0 : 100}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>{rewards.total_xp ?? 0} XP earned</span>
              <span>
                {rewards.next_unlock_at_xp
                  ? `${rewards.next_unlock_at_xp} XP target`
                  : "Full collection"}
              </span>
            </div>

            {companionDisplay ? (
              <div className="mt-8 rounded-[24px] border border-tan-200 bg-orange-50 px-5 py-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium uppercase tracking-[0.2em] text-orange-600">
                      Active Companion
                    </div>
                    <div className="mt-2 text-4xl">{companionDisplay.form.emoji}</div>
                    <h3
                      className="mt-2 text-2xl font-bold"
                      style={{ color: companionDisplay.form.accent }}
                    >
                      {companionDisplay.form.name}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-gray-600">
                      {companionDisplay.form.description}
                    </p>
                  </div>

                  <div className="w-full max-w-sm rounded-[22px] bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Growth level</span>
                      <span className="font-semibold text-gray-900">
                        Lv. {companion.level}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <span>Current form</span>
                      <span className="font-semibold text-gray-900">
                        Stage {companion.evolution_stage}
                      </span>
                    </div>
                    {EVOLUTION_THRESHOLDS[companion.evolution_stage] ? (
                      <>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-tan-200">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (companion.xp / EVOLUTION_THRESHOLDS[companion.evolution_stage]) * 100)}%`,
                              background: companionDisplay.form.accent,
                            }}
                          />
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {Math.max(
                            0,
                            EVOLUTION_THRESHOLDS[companion.evolution_stage] - companion.xp
                          )}{" "}
                          XP until next evolution
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                        Max evolution reached
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {POKEMON_DISPLAY[companion.pokemon_key]?.forms.map((form, index) => (
                    <CreatureStage
                      key={form.name}
                      label={`Stage ${index + 1}`}
                      emoji={form.emoji}
                      accent={form.accent}
                      active={companion.evolution_stage === index + 1}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-tan-300 bg-tan-50 px-5 py-6 text-sm text-gray-600">
                You have not unlocked your first creature yet. Finish activities and build up
                {` ${rewards.xp_until_next_unlock ?? POKEMON_UNLOCK_XP} XP `}to meet the next unlock.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-tan-200 bg-white/80 shadow-sm">
          <CardContent className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Team</h2>
            <p className="mt-1 text-sm text-gray-600">
              Every creature has its own form chain and rarity.
            </p>

            {pokemon.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-tan-200 bg-tan-50 px-5 py-6 text-center">
                <div className="text-6xl">🥚</div>
                <p className="mt-4 text-base text-gray-700">
                  No creatures unlocked yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {pokemon.map((p: any) => {
                  const display = getPokemonDisplay(p.pokemon_key, p.evolution_stage);
                  const nextThreshold = EVOLUTION_THRESHOLDS[p.evolution_stage];
                  const xpRemaining = nextThreshold ? Math.max(0, nextThreshold - p.xp) : 0;
                  return (
                    <div
                      key={p.id}
                      className="rounded-[24px] border border-tan-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
                            style={{ background: `${display.form.accent}14` }}
                          >
                            {display.form.emoji}
                          </div>
                          <div>
                            <div
                              className="text-lg font-bold"
                              style={{ color: display.form.accent }}
                            >
                              {display.form.name}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {display.form.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge
                            variant={
                              display.rarity === "rare"
                                ? "warning"
                                : display.rarity === "uncommon"
                                ? "info"
                                : "muted"
                            }
                          >
                            {display.rarity}
                          </Badge>
                          <Badge variant="default">Stage {p.evolution_stage}</Badge>
                          <Badge variant="success">Lv. {p.level}</Badge>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Growth XP</span>
                          <span>{p.xp} XP</span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-tan-200">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${nextThreshold ? Math.min(100, (p.xp / nextThreshold) * 100) : 100}%`,
                              background: display.form.accent,
                            }}
                          />
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {nextThreshold
                            ? `${xpRemaining} XP until the next form`
                            : "This creature is fully grown"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[28px] border border-tan-200 bg-white/80 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Full Creature Dex</h2>
            <p className="mt-1 text-sm text-gray-600">
              Locked entries show what is still left to unlock.
            </p>
          </div>
          <Button variant="outline" size="sm">
            {rewards.pokemon_count ?? 0}/{Object.keys(POKEMON_DISPLAY).length} unlocked
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(POKEMON_DISPLAY).map(([key, value]) => {
            const owned = pokemon.find((entry: any) => entry.pokemon_key === key);
            const currentStage = owned?.evolution_stage ?? 0;
            return (
              <div
                key={key}
                className="rounded-[24px] border px-4 py-4"
                style={{
                  borderColor: owned ? "#F1E3D2" : "#E5E7EB",
                  background: owned ? "#FFFFFF" : "#F9FAFB",
                  opacity: owned ? 1 : 0.7,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {owned ? value.forms[currentStage - 1]?.name ?? value.forms[0].name : "Locked Creature"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {owned ? value.forms[currentStage - 1]?.description ?? value.forms[0].description : "Keep earning XP to unlock more of the dex."}
                    </div>
                  </div>
                  <div className="text-3xl">{owned ? value.forms[currentStage - 1]?.emoji ?? value.forms[0].emoji : "❔"}</div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {value.forms.map((form, index) => (
                    <CreatureStage
                      key={form.name}
                      label={`Form ${index + 1}`}
                      emoji={owned && currentStage >= index + 1 ? form.emoji : "◻️"}
                      accent={form.accent}
                      active={owned ? currentStage === index + 1 : false}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
