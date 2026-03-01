"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalmingPlayer } from "@/components/child/calming-player";
import { requestUpsetSupport } from "@/lib/api";

const FALLBACK_SUPPORT = {
  intro_text: "It is okay to feel upset. I will help you slow things down one step at a time.",
  steps: [
    {
      instruction: "Take one slow breath in through your nose, then let it out gently.",
      duration_seconds: 6,
      type: "breathing" as const,
    },
    {
      instruction: "Press your feet into the floor and notice how solid the ground feels.",
      duration_seconds: 8,
      type: "sensory" as const,
    },
    {
      instruction: "Look around and quietly name three things you can see.",
      duration_seconds: 10,
      type: "grounding" as const,
    },
    {
      instruction: "Tell yourself: I am safe, and this feeling can get smaller.",
      duration_seconds: 8,
      type: "affirmation" as const,
    },
  ],
  closing_text: "You did a good job taking care of yourself. If you still need help, ask your helper.",
};

export default function QuickCalmingPage() {
  const router = useRouter();
  const [content, setContent] = useState(FALLBACK_SUPPORT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestUpsetSupport()
      .then((data) => {
        if (data.support_plan?.steps?.length) {
          setContent(data.support_plan as typeof FALLBACK_SUPPORT);
        }
      })
      .catch(() => {
        // Keep the fallback flow if AI support is unavailable.
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="kid-container py-8">
      {loading && (
        <div className="text-center text-sm text-gray-500 mb-6">
          Creating a calming plan for you...
        </div>
      )}
      <CalmingPlayer
        content={content}
        onComplete={() => router.push("/child/home")}
      />
    </div>
  );
}
