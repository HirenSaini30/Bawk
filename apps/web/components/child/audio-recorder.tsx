"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxSeconds?: number;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  maxSeconds = 60,
  disabled = false,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(1000);
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= maxSeconds - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Could not access microphone. Please allow microphone access.");
    }
  }, [maxSeconds, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {recording ? (
        <>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
            <span className="text-kid-base font-bold text-red-600">
              Recording... {seconds}s
            </span>
          </div>
          <Button
            variant="danger"
            size="xl"
            onClick={stopRecording}
            className="min-w-[200px]"
          >
            Stop Recording
          </Button>
          <p className="text-sm text-gray-400">
            Max {maxSeconds} seconds
          </p>
        </>
      ) : (
        <Button
          variant="secondary"
          size="xl"
          onClick={startRecording}
          disabled={disabled}
          className="min-w-[200px]"
        >
          🎤 Record My Answer
        </Button>
      )}
    </div>
  );
}
