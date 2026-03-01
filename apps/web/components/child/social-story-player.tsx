"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SocialStoryPlayerProps {
  content: {
    pages?: Array<{ text: string; narration_text?: string }>;
    reflection_questions?: string[];
  };
  onComplete: (responses: string[]) => void;
}

export function SocialStoryPlayer({
  content,
  onComplete,
}: SocialStoryPlayerProps) {
  const pages = content.pages || [];
  const questions = content.reflection_questions || [];
  const [pageIndex, setPageIndex] = useState(0);
  const [phase, setPhase] = useState<"story" | "questions">("story");
  const [answers, setAnswers] = useState<string[]>(
    questions.map(() => "")
  );

  const isLastPage = pageIndex >= pages.length - 1;

  function nextPage() {
    if (isLastPage) {
      if (questions.length > 0) {
        setPhase("questions");
      } else {
        onComplete([]);
      }
    } else {
      setPageIndex((p) => p + 1);
    }
  }

  function handleSubmitAnswers() {
    onComplete(answers);
  }

  if (phase === "questions") {
    return (
      <div className="space-y-6">
        <h2 className="text-kid-lg font-bold text-primary-600 text-center">
          Let&apos;s Think About It
        </h2>
        {questions.map((q, i) => (
          <Card key={i}>
            <CardContent>
              <p className="text-kid-base font-medium text-gray-800 mb-3">
                {q}
              </p>
              <textarea
                className="w-full rounded-kid border border-tan-200 px-4 py-3 text-kid-sm min-h-[80px] focus:ring-2 focus:ring-primary-300 focus:outline-none"
                placeholder="Type your answer here..."
                value={answers[i]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[i] = e.target.value;
                  setAnswers(newAnswers);
                }}
              />
            </CardContent>
          </Card>
        ))}
        <div className="text-center">
          <Button size="xl" onClick={handleSubmitAnswers}>
            Done!
          </Button>
        </div>
      </div>
    );
  }

  const page = pages[pageIndex];
  if (!page) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">This story has no pages.</p>
        <Button size="lg" onClick={() => onComplete([])}>
          Finish
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-gray-400">
        Page {pageIndex + 1} of {pages.length}
      </div>

      <Card className="bg-white">
        <CardContent className="py-8 px-6">
          <p className="text-kid-lg text-gray-800 leading-relaxed text-center">
            {page.text}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        {pageIndex > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setPageIndex((p) => p - 1)}
          >
            Back
          </Button>
        )}
        <Button size="xl" onClick={nextPage}>
          {isLastPage
            ? questions.length > 0
              ? "Answer Questions"
              : "Finish Story"
            : "Next Page"}
        </Button>
      </div>
    </div>
  );
}
