"use client";

import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";
import { MicCapture, PcmPlayer, fromBase64, toBase64 } from "@/lib/audio";
import type {
  CandidateProfile,
  InterviewStart,
  InterviewType,
  LiveSession,
  PastedKind,
  SessionStatus,
  TranscriptLine,
} from "@/lib/types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const REQUIRED: (keyof CandidateProfile)[] = ["targetRole", "jobDescription"];

const missingRequired = (p: Partial<CandidateProfile>) => REQUIRED.filter((k) => !p[k]);

const INTERVIEW_TYPES: Record<string, InterviewType> = {
  technical: "technical",
  behavioral: "behavioral",
  behavioural: "behavioral",
  system_design: "system_design",
  mixed: "mixed",
};

function normalizeType(v: string): InterviewType | undefined {
  return INTERVIEW_TYPES[v.trim().toLowerCase().replace(/[\s-]+/g, "_")];
}

function parseYears(v: string): number | undefined {
  const m = v.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : undefined;
}

export function useLiveSession(): LiveSession {
  const [status, setStatusState] = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [profile, setProfileState] = useState<Partial<CandidateProfile>>({});
  const [error, setError] = useState<string>();
  const [interview, setInterview] = useState<InterviewStart>();

  const session = useRef<Session | null>(null);
  const mic = useRef<MicCapture | null>(null);
  const player = useRef<PcmPlayer | null>(null);
  const profileRef = useRef<Partial<CandidateProfile>>({});
  const statusRef = useRef<SessionStatus>("idle");
  const open = useRef<{ user?: string; ava?: string }>({});
  const counter = useRef(0);
  const submitting = useRef(false);
  const closing = useRef(false);

  const setStatus = useCallback((s: SessionStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const patchProfile = useCallback((p: Partial<CandidateProfile>) => {
    profileRef.current = { ...profileRef.current, ...p };
    setProfileState(profileRef.current);
  }, []);

  /** Append streaming transcription text to the open line for this role. */
  const appendText = useCallback((role: "user" | "ava", text: string) => {
    const other = role === "user" ? "ava" : "user";
    const otherId = open.current[other];
    if (otherId) {
      open.current[other] = undefined;
      setTranscript((t) => t.map((l) => (l.id === otherId ? { ...l, final: true } : l)));
    }
    const id = open.current[role];
    if (id) {
      setTranscript((t) => t.map((l) => (l.id === id ? { ...l, text: l.text + text } : l)));
    } else {
      const nid = String(counter.current++);
      open.current[role] = nid;
      setTranscript((t) => [...t, { id: nid, role, text, final: false }]);
    }
  }, []);

  const finalizeLines = useCallback(() => {
    open.current = {};
    setTranscript((t) => t.map((l) => (l.final ? l : { ...l, final: true })));
  }, []);

  const teardown = useCallback(() => {
    closing.current = true;
    mic.current?.stop();
    mic.current = null;
    player.current?.close();
    player.current = null;
    session.current?.close();
    session.current = null;
  }, []);

  const fail = useCallback(
    (msg: string) => {
      teardown();
      setError(msg);
      setStatus("error");
    },
    [teardown, setStatus],
  );

  const finish = useCallback(async () => {
    if (closing.current) return; // already handed off or stopped
    const p = profileRef.current;
    teardown();
    const missing = missingRequired(p);
    if (missing.length) {
      setError(`Profile incomplete: missing ${missing.join(", ")}`);
      setStatus("error");
      return;
    }
    setStatus("done");
    try {
      const res = await fetch(`${BACKEND}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setInterview((await res.json()) as InterviewStart);
    } catch (e) {
      setError(`Could not prepare the interview: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [teardown, setStatus]);

  const handleToolCall = useCallback(
    (msg: LiveServerMessage) => {
      const calls = msg.toolCall?.functionCalls ?? [];
      const responses = calls.map((c) => {
        const args = (c.args ?? {}) as { field?: string; value?: string };
        if (c.name === "update_field" && args.field && args.value !== undefined) {
          const v = args.value;
          switch (args.field) {
            case "target_role": patchProfile({ targetRole: v }); break;
            case "company": patchProfile({ company: v }); break;
            case "experience_type": patchProfile({ experienceType: v }); break;
            case "interview_type": {
              const t = normalizeType(v);
              if (t) patchProfile({ interviewType: t });
              break;
            }
            case "duration_minutes": {
              const n = parseYears(v);
              if (n !== undefined) patchProfile({ durationMinutes: Math.min(60, Math.max(5, Math.round(n))) });
              break;
            }
            case "experience_years": {
              const n = parseYears(v);
              if (n !== undefined) patchProfile({ experienceYears: n });
              break;
            }
          }
        } else if (c.name === "submit_profile") {
          const missing = missingRequired(profileRef.current);
          if (missing.length) {
            // Don't let the model finish early; tell it what is still needed.
            return {
              id: c.id,
              name: c.name,
              response: {
                error: `Cannot submit yet. Still missing required: ${missing.join(", ")}. Ask the candidate for it (job description is pasted on screen), then confirm again.`,
              },
            };
          }
          submitting.current = true; // finish after Ava's goodbye is spoken
        }
        return { id: c.id, name: c.name, response: { output: "ok" } };
      });
      if (responses.length) session.current?.sendToolResponse({ functionResponses: responses });
    },
    [patchProfile],
  );

  const handleMessage = useCallback(
    (msg: LiveServerMessage) => {
      if (msg.toolCall) handleToolCall(msg);
      const sc = msg.serverContent;
      if (!sc) return;

      if (sc.interrupted) {
        player.current?.clear();
        setStatus("listening");
      }
      for (const part of sc.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) {
          player.current?.enqueue(fromBase64(part.inlineData.data));
          if (statusRef.current !== "speaking") setStatus("speaking");
        }
      }
      if (sc.inputTranscription?.text) appendText("user", sc.inputTranscription.text);
      if (sc.outputTranscription?.text) appendText("ava", sc.outputTranscription.text);

      if (sc.turnComplete) {
        finalizeLines();
        if (submitting.current) {
          // Let the closing sentence finish playing, then hand off.
          submitting.current = false;
          const p = player.current;
          const go = () => void finish();
          if (p?.playing) {
            p.onIdle = go;
            setTimeout(go, 8000); // fallback; finish() is guarded by teardown below
          } else go();
        } else if (!player.current?.playing) {
          setStatus("listening");
        }
      }
    },
    [handleToolCall, appendText, finalizeLines, finish, setStatus],
  );

  const start = useCallback(async () => {
    if (session.current) return;
    setError(undefined);
    setInterview(undefined);
    setTranscript([]);
    profileRef.current = {};
    setProfileState({});
    open.current = {};
    submitting.current = false;
    closing.current = false;
    setStatus("connecting");

    try {
      const res = await fetch(`${BACKEND}/api/live-token`, { method: "POST" });
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);
      const { token, model } = (await res.json()) as { token: string; model: string };

      // Prompt, tools and audio config are locked into the token server-side.
      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });
      player.current = new PcmPlayer();
      await player.current.resume();
      player.current.onIdle = () => {
        if (statusRef.current === "speaking") setStatus("listening");
      };

      session.current = await ai.live.connect({
        model,
        callbacks: {
          onmessage: handleMessage,
          onerror: (e) => {
            if (!closing.current) fail(e.message || "Live connection error");
          },
          onclose: () => {
            if (!closing.current) fail("Connection closed unexpectedly");
          },
        },
      });

      mic.current = new MicCapture();
      await mic.current.start((pcm) =>
        session.current?.sendRealtimeInput({
          audio: { data: toBase64(pcm), mimeType: "audio/pcm;rate=16000" },
        }),
      );
      // Kickoff so Ava greets first.
      session.current.sendRealtimeInput({ text: "Hello" });
      setStatus("listening");
    } catch (e) {
      const denied = e instanceof DOMException && e.name === "NotAllowedError";
      fail(denied ? "Microphone permission was denied." : e instanceof Error ? e.message : String(e));
    }
  }, [handleMessage, fail, setStatus]);

  const stop = useCallback(() => {
    teardown();
    setStatus("idle"); // "done" is reserved for a real hand-off to the interview
  }, [teardown, setStatus]);

  const sendPasted = useCallback(
    (kind: PastedKind, text: string) => {
      patchProfile(kind === "JOB_DESCRIPTION" ? { jobDescription: text } : { resumeText: text });
      session.current?.sendRealtimeInput({ text: `[${kind}]\n${text}` });
    },
    [patchProfile],
  );

  const audioLevel = useCallback(
    () => (statusRef.current === "speaking" ? player.current?.level() ?? 0 : mic.current?.level ?? 0),
    [],
  );

  useEffect(() => teardown, [teardown]);

  return { status, transcript, profile, error, interview, start, stop, sendPasted, audioLevel };
}
