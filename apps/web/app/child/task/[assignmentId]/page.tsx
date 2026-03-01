"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { submitText, submitVoice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudioRecorder } from "@/components/child/audio-recorder";
import { SocialStoryPlayer } from "@/components/child/social-story-player";
import { RoleplayPlayer } from "@/components/child/roleplay-player";
import { CalmingPlayer } from "@/components/child/calming-player";
import { ModelingPlayer } from "@/components/child/modeling-player";
import { TASK_TYPE_LABELS, POKEMON_DISPLAY } from "@/lib/utils";

export default function TaskPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("assignments")
        .select("*, task:tasks(*)")
        .eq("id", assignmentId)
        .single();

      setAssignment(data);
      setLoading(false);
    }
    load();
  }, [assignmentId, router]);

  const handleTextComplete = useCallback(
    async (responses: string[]) => {
      setSubmitting(true);
      try {
        const responseText = responses.filter(Boolean).join("\n\n") || "I completed the activity.";
        const res = await submitText(assignmentId, responseText);
        setResult(res);
      } catch (err: any) {
        alert(err.message || "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [assignmentId]
  );

  const handleCalmingComplete = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await submitText(
        assignmentId,
        "I completed the calming exercise."
      );
      setResult(res);
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId]);

  const handleVoiceComplete = useCallback(
    async (blob: Blob) => {
      setSubmitting(true);
      try {
        const res = await submitVoice(assignmentId, blob);
        setResult(res);
      } catch (err: any) {
        alert(err.message || "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [assignmentId]
  );

  if (loading) {
    return (
      <div className="kid-container text-center py-16 text-kid-lg text-gray-400">
        Loading activity...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="kid-container text-center py-16">
        <p className="text-kid-lg text-red-500 mb-4">
          Activity not found
        </p>
        <Button onClick={() => router.push("/child/home")}>
          Go Back Home
        </Button>
      </div>
    );
  }

  // Show results after submission
  if (result) {
    const pokemon = result.pokemon_update;
    const pokemonInfo = pokemon
      ? POKEMON_DISPLAY[pokemon.pokemon_key]
      : null;

    return (
      <div className="kid-container space-y-6 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-kid-xl font-bold text-calm-500">
          Great Job!
        </h1>

        <Card className="bg-calm-50 border-calm-200">
          <CardContent className="py-6">
            <p className="text-kid-base text-gray-800">
              {result.feedback}
            </p>
          </CardContent>
        </Card>

        {result.rewards && (
          <div className="flex justify-center gap-6">
            {result.rewards.xp_delta > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  +{result.rewards.xp_delta}
                </div>
                <div className="text-sm text-gray-500">XP Earned</div>
              </div>
            )}
            {result.rewards.coins_delta > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-yolk-500">
                  +{result.rewards.coins_delta}
                </div>
                <div className="text-sm text-gray-500">Coins</div>
              </div>
            )}
          </div>
        )}

        {pokemonInfo && (
          <Card className="bg-primary-50 border-primary-300 border-2">
            <CardContent className="py-6 text-center">
              <div className="text-5xl mb-2">{pokemonInfo.emoji}</div>
              <p className="text-kid-lg font-bold" style={{ color: pokemonInfo.color }}>
                New Pokemon: {pokemonInfo.name}!
              </p>
            </CardContent>
          </Card>
        )}

        {result.transcript && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-gray-500 mb-1">What we heard:</p>
              <p className="text-gray-700">{result.transcript}</p>
            </CardContent>
          </Card>
        )}

        <Button
          size="xl"
          onClick={() => {
            const xpDelta = result.rewards?.xp_delta;
            const qs = xpDelta
              ? `?celebrate=1&xp=${xpDelta}`
              : "?celebrate=1";
            router.push(`/child/home${qs}`);
          }}
        >
          Back to Home
        </Button>
      </div>
    );
  }

  const task = assignment.task || {};
  const taskType = task.type || "social_story";
  const content = task.content || {};

  return (
    <div className="kid-container space-y-6">
      {submitting && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-bounce">🌟</div>
            <p className="text-kid-lg text-primary-600 font-bold">
              Checking your work...
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-kid-lg font-bold text-gray-900 mb-2">
          {task.title || "Activity"}
        </h1>
        <Badge>{TASK_TYPE_LABELS[taskType] || taskType}</Badge>
      </div>

      {/* Input mode toggle for non-calming tasks */}
      {taskType !== "calming" && (
        <div className="flex justify-center gap-3">
          <Button
            variant={inputMode === "text" ? "primary" : "outline"}
            size="sm"
            onClick={() => setInputMode("text")}
          >
            Type Answers
          </Button>
          <Button
            variant={inputMode === "voice" ? "primary" : "outline"}
            size="sm"
            onClick={() => setInputMode("voice")}
          >
            🎤 Use Voice
          </Button>
        </div>
      )}

      {/* Task-type specific players */}
      {taskType === "social_story" && (
        inputMode === "voice" ? (
          <VoiceFallback content={content} onVoice={handleVoiceComplete} />
        ) : (
          <SocialStoryPlayer content={content} onComplete={handleTextComplete} />
        )
      )}

      {taskType === "roleplay" && (
        inputMode === "voice" ? (
          <VoiceFallback content={content} onVoice={handleVoiceComplete} />
        ) : (
          <RoleplayPlayer content={content} onComplete={handleTextComplete} />
        )
      )}

      {taskType === "modeling" && (
        inputMode === "voice" ? (
          <VoiceFallback content={content} onVoice={handleVoiceComplete} />
        ) : (
          <ModelingPlayer content={content} onComplete={handleTextComplete} />
        )
      )}

      {taskType === "calming" && (
        <CalmingPlayer content={content} onComplete={handleCalmingComplete} />
      )}
    </div>
  );
}

function VoiceFallback({
  content,
  onVoice,
}: {
  content: any;
  onVoice: (blob: Blob) => void;
}) {
  return (
    <div className="space-y-6">
      {content.scenario && (
        <Card>
          <CardContent className="py-4">
            <p className="text-kid-base text-gray-800">{content.scenario}</p>
          </CardContent>
        </Card>
      )}
      {content.pages && content.pages.length > 0 && (
        <Card>
          <CardContent className="py-4">
            {content.pages.map((page: any, i: number) => (
              <p key={i} className="text-kid-base text-gray-800 mb-3">
                {page.text}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
      {content.narration_text && (
        <Card>
          <CardContent className="py-4">
            <p className="text-kid-base text-gray-800">
              {content.narration_text}
            </p>
          </CardContent>
        </Card>
      )}
      <div className="text-center">
        <p className="text-kid-base text-gray-600 mb-4">
          Record your response using the button below:
        </p>
        <AudioRecorder onRecordingComplete={onVoice} />
      </div>
    </div>
  );
}
