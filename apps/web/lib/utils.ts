import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type PokemonStageDisplay = {
  name: string;
  emoji: string;
  accent: string;
  description: string;
};

type PokemonDisplay = {
  rarity: "common" | "uncommon" | "rare";
  forms: PokemonStageDisplay[];
};

export const POKEMON_UNLOCK_XP = 120;

export const POKEMON_DISPLAY: Record<string, PokemonDisplay> = {
  ember_fox: {
    rarity: "common",
    forms: [
      { name: "Ember Fox", emoji: "🦊", accent: "#f97316", description: "A quick-footed fox that sparks courage." },
      { name: "Blaze Fox", emoji: "🔥", accent: "#ea580c", description: "Its tail glows when you stay focused." },
      { name: "Inferno Fox", emoji: "☄️", accent: "#c2410c", description: "A legendary buddy powered by brave choices." },
    ],
  },
  aqua_turtle: {
    rarity: "common",
    forms: [
      { name: "Aqua Turtle", emoji: "🐢", accent: "#0ea5e9", description: "Calm and steady through every challenge." },
      { name: "Wave Turtle", emoji: "🌊", accent: "#0284c7", description: "Learns to carry confidence like a wave." },
      { name: "Ocean Turtle", emoji: "🪸", accent: "#0369a1", description: "A deep-water guardian of patient progress." },
    ],
  },
  leaf_owl: {
    rarity: "common",
    forms: [
      { name: "Leaf Owl", emoji: "🦉", accent: "#22c55e", description: "Listens closely and notices the small wins." },
      { name: "Forest Owl", emoji: "🌲", accent: "#15803d", description: "Wiser and stronger with each completed task." },
      { name: "Ancient Owl", emoji: "🌿", accent: "#166534", description: "A quiet master of focus and reflection." },
    ],
  },
  spark_bunny: {
    rarity: "common",
    forms: [
      { name: "Spark Bunny", emoji: "🐰", accent: "#eab308", description: "Bounces into practice with bright energy." },
      { name: "Thunder Bunny", emoji: "⚡", accent: "#ca8a04", description: "Turns every bit of effort into momentum." },
      { name: "Storm Bunny", emoji: "🌩️", accent: "#a16207", description: "A fast, fearless helper for big goals." },
    ],
  },
  cloud_bear: {
    rarity: "common",
    forms: [
      { name: "Cloud Bear", emoji: "🐻", accent: "#8b5cf6", description: "A gentle buddy that keeps you grounded." },
      { name: "Storm Bear", emoji: "☁️", accent: "#7c3aed", description: "Grows bigger as your streak gets stronger." },
      { name: "Sky Bear", emoji: "🌌", accent: "#6d28d9", description: "A powerful guardian of calm confidence." },
    ],
  },
  crystal_deer: {
    rarity: "uncommon",
    forms: [
      { name: "Crystal Deer", emoji: "🦌", accent: "#06b6d4", description: "Moves gracefully through tricky social moments." },
      { name: "Prism Deer", emoji: "💎", accent: "#0891b2", description: "Learns to shine under pressure." },
      { name: "Aurora Deer", emoji: "🌈", accent: "#0e7490", description: "A rare companion that reflects your growth." },
    ],
  },
  shadow_cat: {
    rarity: "uncommon",
    forms: [
      { name: "Shadow Cat", emoji: "🐱", accent: "#6366f1", description: "Quiet, observant, and always ready to learn." },
      { name: "Phantom Cat", emoji: "🌙", accent: "#4f46e5", description: "Masters careful choices and calm thinking." },
      { name: "Nightfall Cat", emoji: "✨", accent: "#4338ca", description: "An agile expert in self-control." },
    ],
  },
  breeze_falcon: {
    rarity: "uncommon",
    forms: [
      { name: "Breeze Falcon", emoji: "🦅", accent: "#38bdf8", description: "Sees the whole situation from above." },
      { name: "Gale Falcon", emoji: "🌬️", accent: "#0284c7", description: "Builds speed as you complete more tasks." },
      { name: "Tempest Falcon", emoji: "🌀", accent: "#0369a1", description: "A sharp-eyed flier with elite focus." },
    ],
  },
  stone_pup: {
    rarity: "rare",
    forms: [
      { name: "Stone Pup", emoji: "🐶", accent: "#78716c", description: "Small but sturdy through hard moments." },
      { name: "Boulder Wolf", emoji: "🪨", accent: "#57534e", description: "Turns steady effort into real strength." },
      { name: "Mountain Wolf", emoji: "⛰️", accent: "#44403c", description: "An enormous ally built by persistence." },
    ],
  },
  star_dolphin: {
    rarity: "rare",
    forms: [
      { name: "Star Dolphin", emoji: "🐬", accent: "#c084fc", description: "A rare friend that appears with consistent effort." },
      { name: "Nova Dolphin", emoji: "🌠", accent: "#a855f7", description: "Glows brighter as your confidence grows." },
      { name: "Galaxy Dolphin", emoji: "🌌", accent: "#7e22ce", description: "A cosmic companion for long-term progress." },
    ],
  },
};

export function getPokemonDisplay(pokemonKey: string, evolutionStage = 1) {
  const base = POKEMON_DISPLAY[pokemonKey];
  if (!base) {
    return {
      rarity: "common" as const,
      form: {
        name: pokemonKey,
        emoji: "❓",
        accent: "#6b7280",
        description: "Unknown creature",
      },
    };
  }
  const safeIndex = Math.max(0, Math.min(base.forms.length - 1, (evolutionStage || 1) - 1));
  return {
    rarity: base.rarity,
    form: base.forms[safeIndex],
  };
}

export const TASK_TYPE_LABELS: Record<string, string> = {
  social_story: "Social Story",
  roleplay: "Roleplay Practice",
  modeling: "Watch & Learn",
  calming: "Calming Exercise",
};

export const CATEGORY_LABELS: Record<string, string> = {
  conversation: "Conversation",
  self_regulation: "Self-Regulation",
  help_seeking: "Help-Seeking",
  values: "Values",
  other: "Other",
};
