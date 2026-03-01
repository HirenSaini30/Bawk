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
  return new Date().toISOString().split("T")[0];
}

export const POKEMON_DISPLAY: Record<
  string,
  { name: string; emoji: string; color: string }
> = {
  ember_fox: { name: "Ember Fox", emoji: "🦊", color: "#f97316" },
  aqua_turtle: { name: "Aqua Turtle", emoji: "🐢", color: "#06b6d4" },
  leaf_owl: { name: "Leaf Owl", emoji: "🦉", color: "#22c55e" },
  spark_bunny: { name: "Spark Bunny", emoji: "🐰", color: "#eab308" },
  cloud_bear: { name: "Cloud Bear", emoji: "🐻", color: "#a78bfa" },
  crystal_deer: { name: "Crystal Deer", emoji: "🦌", color: "#67e8f9" },
  shadow_cat: { name: "Shadow Cat", emoji: "🐱", color: "#6366f1" },
  breeze_falcon: { name: "Breeze Falcon", emoji: "🦅", color: "#38bdf8" },
  stone_pup: { name: "Stone Pup", emoji: "🐶", color: "#a8a29e" },
  star_dolphin: { name: "Star Dolphin", emoji: "🐬", color: "#c084fc" },
};

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
