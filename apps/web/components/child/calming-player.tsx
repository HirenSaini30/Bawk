"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CalmingStep {
  instruction: string;
  duration_seconds?: number;
  type: "breathing" | "grounding" | "visualization" | "choice";
  choices?: Array<{ label: string; next_step: number }>;
}

interface CalmingPlayerProps {
  content: {
    intro_text?: string;
    steps?: CalmingStep[];
    closing_text?: string;
  };
  onComplete: () => void;
}

export function CalmingPlayer({ content, onComplete }: CalmingPlayerProps) {
  const steps = content.steps || [];
  const [phase, setPhase] = useState<"intro" | "steps" | "closing">("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startStep(idx: number) {
    setStepIndex(idx);
    const step = steps[idx];
    if (step?.duration_seconds) {
      setCountdown(step.duration_seconds);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev !== null && prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
  }

  function nextStep() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(null);
    if (stepIndex >= steps.length - 1) {
      setPhase("closing");
    } else {
      startStep(stepIndex + 1);
    }
  }

  function handleChoice(nextStepIdx: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(null);
    if (nextStepIdx >= steps.length) {
      setPhase("closing");
    } else {
      startStep(nextStepIdx);
    }
  }

  if (phase === "intro") {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl">🌿</div>
        <h2 className="text-kid-lg font-bold text-calm-500">
          Calming Exercise
        </h2>
        {content.intro_text && (
          <p className="text-kid-base text-gray-700">{content.intro_text}</p>
        )}
        <Button
          variant="calm"
          size="xl"
          onClick={() => {
            setPhase("steps");
            startStep(0);
          }}
        >
          Let&apos;s Begin
        </Button>
      </div>
    );
  }

  if (phase === "closing") {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl">🌟</div>
        <h2 className="text-kid-lg font-bold text-calm-500">
          You Did It!
        </h2>
        {content.closing_text && (
          <p className="text-kid-base text-gray-700">{content.closing_text}</p>
        )}
        <Button variant="calm" size="xl" onClick={onComplete}>
          All Done
        </Button>
      </div>
    );
  }

  const step = steps[stepIndex];
  if (!step) {
    return (
      <div className="text-center">
        <Button variant="calm" size="xl" onClick={onComplete}>
          Finish
        </Button>
      </div>
    );
  }

  const bgColors: Record<string, string> = {
    breathing: "bg-calm-50 border-calm-200",
    grounding: "bg-calm-50 border-calm-200",
    visualization: "bg-yolk-50 border-yolk-200",
    choice: "bg-primary-50 border-primary-200",
  };

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-gray-400">
        Step {stepIndex + 1} of {steps.length}
      </div>

      <Card className={`border-2 ${bgColors[step.type] || ""}`}>
        <CardContent className="py-8 text-center space-y-6">
          <div className="text-4xl">
            {step.type === "breathing" && "🌬️"}
            {step.type === "grounding" && "🌍"}
            {step.type === "visualization" && "🎨"}
            {step.type === "choice" && "🤔"}
          </div>

          <p className="text-kid-lg text-gray-800 font-medium">
            {step.instruction}
          </p>

          {countdown !== null && countdown > 0 && (
            <div className="text-5xl font-bold text-primary-600 animate-pulse">
              {countdown}
            </div>
          )}

          {step.type === "choice" && step.choices ? (
            <div className="space-y-3 max-w-sm mx-auto">
              {step.choices.map((choice, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => handleChoice(choice.next_step)}
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          ) : (
            <Button
              variant="calm"
              size="xl"
              onClick={nextStep}
              disabled={countdown !== null && countdown > 0}
            >
              {countdown === 0 ? "Continue" : "Next"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
