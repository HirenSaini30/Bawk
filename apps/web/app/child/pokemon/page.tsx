"use client";

import { useEffect, useState } from "react";
import { getMyPokemon } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POKEMON_DISPLAY } from "@/lib/utils";

const EVOLUTION_THRESHOLDS: Record<number, number> = { 1: 100, 2: 300 };

export default function PokemonCollectionPage() {
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPokemon()
      .then((data) => setPokemon(data.pokemon))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="kid-container text-center py-16 text-kid-lg text-gray-400">
        Loading your Pokemon...
      </div>
    );
  }

  return (
    <div className="kid-container space-y-6">
      <div className="text-center">
        <h1 className="text-kid-xl font-bold text-primary-600 mb-2">
          My Pokemon
        </h1>
        <p className="text-gray-500">
          {pokemon.length === 0
            ? "Complete activities to collect Pokemon!"
            : `You have ${pokemon.length} Pokemon!`}
        </p>
      </div>

      {pokemon.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🥚</div>
            <p className="text-kid-base text-gray-500">
              Your first Pokemon is waiting for you!
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Complete activities to earn XP and discover Pokemon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {pokemon.map((p: any) => {
            const display = POKEMON_DISPLAY[p.pokemon_key] || {
              name: p.pokemon_key,
              emoji: "❓",
              color: "#666",
            };
            const threshold = EVOLUTION_THRESHOLDS[p.evolution_stage];
            const progressPercent = threshold
              ? Math.min(100, (p.xp / threshold) * 100)
              : 100;

            return (
              <Card
                key={p.id}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="py-6">
                  <div
                    className="text-5xl mb-2"
                    style={{ filter: `drop-shadow(0 0 8px ${display.color}40)` }}
                  >
                    {display.emoji}
                  </div>
                  <h3
                    className="font-bold text-lg"
                    style={{ color: display.color }}
                  >
                    {display.name}
                  </h3>
                  <div className="flex justify-center gap-2 mt-2">
                    <Badge
                      variant={
                        p.rarity === "rare"
                          ? "warning"
                          : p.rarity === "uncommon"
                          ? "info"
                          : "muted"
                      }
                    >
                      {p.rarity}
                    </Badge>
                    <Badge variant="default">Stage {p.evolution_stage}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-500">
                      Level {p.level} — {p.xp} XP
                    </div>
                    {threshold && (
                      <div className="mt-2 bg-tan-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: display.color,
                          }}
                        />
                      </div>
                    )}
                    {threshold && (
                      <div className="text-xs text-gray-400 mt-1">
                        {p.xp}/{threshold} to evolve
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pokedex preview */}
      <div>
        <h2 className="text-kid-base font-bold text-gray-700 mb-3 text-center">
          All Pokemon to Discover
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(POKEMON_DISPLAY).map(([key, display]) => {
            const owned = pokemon.some((p: any) => p.pokemon_key === key);
            return (
              <div
                key={key}
                className={`text-center p-3 rounded-kid border ${
                  owned
                    ? "bg-white border-tan-200"
                    : "bg-gray-100 border-tan-200 opacity-50"
                }`}
              >
                <div className="text-2xl">
                  {owned ? display.emoji : "❓"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {owned ? display.name : "???"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
