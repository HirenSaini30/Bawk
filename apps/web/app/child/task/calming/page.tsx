"use client";

import { useRouter } from "next/navigation";
import { CalmingPlayer } from "@/components/child/calming-player";

const QUICK_CALMING = {
  intro_text: "It's okay to feel upset. Let's take a moment together to feel calmer.",
  steps: [
    {
      instruction: "First, let's take a slow, deep breath in... hold it... and breathe out slowly.",
      duration_seconds: 6,
      type: "breathing" as const,
    },
    {
      instruction: "Great! Let's do that one more time. Breathe in slowly...",
      duration_seconds: 6,
      type: "breathing" as const,
    },
    {
      instruction: "What would you like to try next?",
      type: "choice" as const,
      choices: [
        { label: "More breathing", next_step: 0 },
        { label: "Grounding exercise", next_step: 3 },
        { label: "I feel better now", next_step: 5 },
      ],
    },
    {
      instruction: "Look around you. Can you name 3 things you can see right now? Take your time.",
      duration_seconds: 10,
      type: "grounding" as const,
    },
    {
      instruction: "Now, can you name 2 things you can hear? Listen carefully...",
      duration_seconds: 8,
      type: "grounding" as const,
    },
  ],
  closing_text: "You did a great job taking care of yourself! Remember, it's always okay to ask your helper for support.",
};

export default function QuickCalmingPage() {
  const router = useRouter();

  return (
    <div className="kid-container py-8">
      <CalmingPlayer
        content={QUICK_CALMING}
        onComplete={() => router.push("/child/home")}
      />
    </div>
  );
}
