"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ModelingPlayerProps {
  content: {
    media_url?: string;
    media_type?: "video" | "audio";
    observation_prompts?: string[];
    reflection_questions?: string[];
    narration_text?: string;
  };
  onComplete: (responses: string[]) => void;
}

export function ModelingPlayer({ content, onComplete }: ModelingPlayerProps) {
  const prompts = content.observation_prompts || [];
  const questions = content.reflection_questions || [];
  const [phase, setPhase] = useState<"observe" | "reflect">("observe");
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));

  if (phase === "observe") {
    return (
      <div className="space-y-6">
        <h2 className="text-kid-lg font-bold text-primary-600 text-center">
          Watch & Learn
        </h2>

        {content.narration_text && (
          <Card>
            <CardContent className="py-6">
              <p className="text-kid-base text-gray-800">
                {content.narration_text}
              </p>
            </CardContent>
          </Card>
        )}

        {content.media_url && (
          <div className="rounded-kid overflow-hidden bg-gray-900">
            {content.media_type === "video" ? (
              <video
                src={content.media_url}
                controls
                className="w-full"
              />
            ) : (
              <audio src={content.media_url} controls className="w-full p-4" />
            )}
          </div>
        )}

        {prompts.length > 0 && (
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="py-4">
              <p className="font-bold text-primary-700 mb-2">
                Things to notice:
              </p>
              <ul className="space-y-2">
                {prompts.map((p, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-primary-400">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button
            size="xl"
            onClick={() =>
              questions.length > 0 ? setPhase("reflect") : onComplete([])
            }
          >
            {questions.length > 0 ? "Answer Questions" : "Finish"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-kid-lg font-bold text-primary-600 text-center">
        Your Turn to Think
      </h2>
      {questions.map((q, i) => (
        <Card key={i}>
          <CardContent>
            <p className="text-kid-base font-medium text-gray-800 mb-3">
              {q}
            </p>
            <textarea
              className="w-full rounded-kid border border-tan-200 px-4 py-3 text-kid-sm min-h-[80px] focus:ring-2 focus:ring-primary-300 focus:outline-none"
              placeholder="Type your thoughts..."
              value={answers[i]}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
            />
          </CardContent>
        </Card>
      ))}
      <div className="text-center">
        <Button size="xl" onClick={() => onComplete(answers)}>
          Done!
        </Button>
      </div>
    </div>
  );
}
