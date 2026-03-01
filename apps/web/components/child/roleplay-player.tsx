"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DialogueTurn {
  speaker: string;
  text?: string;
  is_child_turn: boolean;
  choices?: string[];
  hint?: string;
}

interface RoleplayPlayerProps {
  content: {
    scenario?: string;
    characters?: Array<{ name: string; description: string }>;
    dialogue_turns?: DialogueTurn[];
    debrief?: string;
  };
  onComplete: (responses: string[]) => void;
}

export function RoleplayPlayer({ content, onComplete }: RoleplayPlayerProps) {
  const turns = content.dialogue_turns || [];
  const [turnIndex, setTurnIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [phase, setPhase] = useState<"intro" | "dialogue" | "debrief">(
    "intro"
  );

  function handleChoice(choice: string) {
    setResponses([...responses, choice]);
    advance();
  }

  function handleCustomSubmit() {
    if (!customInput.trim()) return;
    setResponses([...responses, customInput]);
    setCustomInput("");
    advance();
  }

  function advance() {
    let next = turnIndex + 1;
    while (next < turns.length && !turns[next].is_child_turn) {
      next++;
    }
    if (next >= turns.length) {
      setPhase("debrief");
    } else {
      setTurnIndex(next);
    }
  }

  if (phase === "intro") {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-kid-lg font-bold text-primary-500">
          Roleplay Practice
        </h2>
        {content.scenario && (
          <Card>
            <CardContent className="py-6">
              <p className="text-kid-base text-gray-800">
                {content.scenario}
              </p>
            </CardContent>
          </Card>
        )}
        {content.characters && content.characters.length > 0 && (
          <div className="flex justify-center gap-4">
            {content.characters.map((c, i) => (
              <div
                key={i}
                className="bg-primary-50 rounded-kid p-4 text-center border border-tan-200"
              >
                <div className="text-2xl mb-1">🎭</div>
                <div className="font-bold text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-500">{c.description}</div>
              </div>
            ))}
          </div>
        )}
        <Button size="xl" onClick={() => setPhase("dialogue")}>
          Let&apos;s Start!
        </Button>
      </div>
    );
  }

  if (phase === "debrief") {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-kid-lg font-bold text-calm-500">Great Job!</h2>
        {content.debrief && (
          <Card>
            <CardContent className="py-6">
              <p className="text-kid-base text-gray-800">
                {content.debrief}
              </p>
            </CardContent>
          </Card>
        )}
        <Button size="xl" onClick={() => onComplete(responses)}>
          Finish
        </Button>
      </div>
    );
  }

  // Show dialogue history + current turn
  const currentTurn = turns[turnIndex];
  const history = turns.slice(0, turnIndex).filter((t) => !t.is_child_turn);

  return (
    <div className="space-y-4">
      {/* History */}
      {history.map((turn, i) => (
        <div
          key={i}
          className="flex gap-3 items-start"
        >
          <div className="bg-primary-100 text-primary-700 rounded-full px-3 py-1 text-sm font-bold shrink-0">
            {turn.speaker}
          </div>
          <div className="bg-tan-100 rounded-kid p-3 text-kid-sm border border-tan-200">
            {turn.text}
          </div>
        </div>
      ))}

      {/* NPC text leading up to child turn */}
      {!currentTurn.is_child_turn && currentTurn.text && (
        <div className="flex gap-3 items-start">
          <div className="bg-primary-100 text-primary-700 rounded-full px-3 py-1 text-sm font-bold shrink-0">
            {currentTurn.speaker}
          </div>
          <div className="bg-tan-100 rounded-kid p-3 text-kid-sm border border-tan-200">
            {currentTurn.text}
          </div>
        </div>
      )}

      {/* Child's turn */}
      {currentTurn.is_child_turn && (
        <Card className="border-2 border-primary-300 bg-primary-50">
          <CardContent className="py-6 space-y-4">
            <p className="text-kid-base font-bold text-center text-primary-600">
              Your Turn!
            </p>
            {currentTurn.hint && (
              <p className="text-sm text-gray-500 text-center">
                Hint: {currentTurn.hint}
              </p>
            )}

            {currentTurn.choices && currentTurn.choices.length > 0 ? (
              <div className="space-y-3">
                {currentTurn.choices.map((choice, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="lg"
                    className="w-full text-left justify-start"
                    onClick={() => handleChoice(choice)}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="w-full rounded-kid border border-tan-200 px-4 py-3 text-kid-sm min-h-[80px] focus:ring-2 focus:ring-primary-300 focus:outline-none"
                  placeholder="Type what you would say..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
                <Button size="lg" onClick={handleCustomSubmit} className="w-full">
                  Say It!
                </Button>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Remember: you can always ask your helper for support!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
