"use client";

import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";
import { MicCapture, PcmPlayer, fromBase64, toBase64 } from "@/lib/audio";
import type { CandidateProfile, InterviewStart, Report } from "@/lib/types";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export type InterviewPhase = "lobby" | "connecting" | "live" | "wrapping" | "report" | "error";
export type BotState = "idle" | "speaking" | "listening";

type Turn = { role: "user" | "interviewer"; text: string };

/**
 * Second Live session: Ava's interviewer persona. The candidate's own words are
 * kept only in memory for the report and are never exposed for display.
 */
export function useInterviewSession(interview: InterviewStart, profile: Partial<CandidateProfile>) {
  const [phase, setPhase] = useState<InterviewPhase>("lobby");
  const [bot, setBot] = useState<BotState>("idle");
  const [userSpeaking, setUserSpeaking] = useState(false); // from mic level; drives the character animation
  const [asked, setAsked] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(interview.durationMinutes * 60);
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState<string>();

  const session = useRef<Session | null>(null);
  const mic = useRef<MicCapture | null>(null);
  const player = useRef<PcmPlayer | null>(null);
  const turns = useRef<Turn[]>([]);
  const speakingRef = useRef(false);
  // Watchdog bookkeeping: lets us re-prompt the interviewer if it goes quiet after an answer.
  const lastLoud = useRef(0);        // last time the mic heard speech
  const loudChunks = useRef(0);      // speech chunks since the interviewer last spoke
  const lastBotEnd = useRef(0);      // when the interviewer last finished talking
  const nudged = useRef(false);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ending = useRef(false);
  const closing = useRef(false);
  const timeUpSent = useRef(false);
  const botRef = useRef<BotState>("idle");

  const setBotState = useCallback((s: BotState) => {
    botRef.current = s;
    setBot(s);
  }, []);

  const addTurn = (role: Turn["role"], text: string) => {
    const last = turns.current[turns.current.length - 1];
    if (last && last.role === role) last.text += text;
    else turns.current.push({ role, text });
  };

  const teardown = useCallback(() => {
    closing.current = true;
    mic.current?.stop();
    mic.current = null;
    player.current?.close();
    player.current = null;
    session.current?.close();
    session.current = null;
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    speakingRef.current = false;
    setUserSpeaking(false);
  }, []);

  /** Cheap voice-activity check on each 100 ms PCM chunk (for animation only). */
  const trackLevel = useCallback((pcm: ArrayBuffer) => {
    const a = new Int16Array(pcm);
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
    const rms = Math.sqrt(sum / a.length) / 32768;
    if (rms > 0.02) {
      lastLoud.current = Date.now();
      loudChunks.current += 1;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        speakingRef.current = false;
        setUserSpeaking(false);
      }, 500);
      if (!speakingRef.current) {
        speakingRef.current = true;
        setUserSpeaking(true);
      }
    }
  }, []);

  const finish = useCallback(async () => {
    if (closing.current) return;
    teardown();
    setBotState("idle");
    setPhase("report");
    try {
      const res = await fetch(`${BACKEND}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          transcript: turns.current.filter((t) => t.text.trim()),
        }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setReport((await res.json()) as Report);
    } catch (e) {
      setError(`Could not build the report: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [teardown, profile, setBotState]);

  const fail = useCallback(
    (msg: string) => {
      teardown();
      setError(msg);
      setPhase("error");
      setBotState("idle");
    },
    [teardown, setBotState],
  );

  const handleMessage = useCallback(
    (msg: LiveServerMessage) => {
      for (const c of msg.toolCall?.functionCalls ?? []) {
        if (c.name === "question_asked") {
          const n = Number((c.args as { number?: number } | undefined)?.number);
          if (Number.isFinite(n)) setAsked((a) => Math.max(a, n));
        } else if (c.name === "end_interview") {
          ending.current = true;
          setPhase("wrapping");
        }
        session.current?.sendToolResponse({
          functionResponses: [{ id: c.id, name: c.name, response: { output: "ok" } }],
        });
      }

      const sc = msg.serverContent;
      if (!sc) return;

      if (sc.interrupted) {
        player.current?.clear();
        setBotState("listening");
      }
      for (const part of sc.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) {
          player.current?.enqueue(fromBase64(part.inlineData.data));
          loudChunks.current = 0;
          nudged.current = false;
          lastBotEnd.current = Date.now();
          if (botRef.current !== "speaking") setBotState("speaking");
        }
      }
      if (sc.inputTranscription?.text) addTurn("user", sc.inputTranscription.text); // memory only
      if (sc.outputTranscription?.text) addTurn("interviewer", sc.outputTranscription.text); // memory only
      if (sc.turnComplete) {
        lastBotEnd.current = Date.now();
        if (ending.current) {
          const p = player.current;
          const go = () => void finish();
          if (p?.playing) {
            p.onIdle = go;
            setTimeout(go, 8000);
          } else go();
        } else if (!player.current?.playing) setBotState("listening");
      }
    },
    [finish, setBotState],
  );

  const begin = useCallback(async () => {
    if (session.current) return;
    // Every interview starts from a clean slate: no transcript, flags, or progress carried over.
    turns.current = [];
    loudChunks.current = 0;
    nudged.current = false;
    lastBotEnd.current = Date.now();
    ending.current = false;
    closing.current = false;
    timeUpSent.current = false;
    setAsked(0);
    setReport(undefined);
    setSecondsLeft(interview.durationMinutes * 60);
    setError(undefined);
    setPhase("connecting");
    try {
      const ai = new GoogleGenAI({ apiKey: interview.token, httpOptions: { apiVersion: "v1alpha" } });
      player.current = new PcmPlayer();
      await player.current.resume();
      player.current.onIdle = () => {
        if (botRef.current === "speaking") setBotState("listening");
      };
      session.current = await ai.live.connect({
        model: interview.model,
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
      await mic.current.start((pcm) => {
        trackLevel(pcm);
        session.current?.sendRealtimeInput({
          audio: { data: toBase64(pcm), mimeType: "audio/pcm;rate=16000" },
        });
      });
      session.current.sendRealtimeInput({ text: "Hello, I'm ready to begin." });
      setPhase("live");
      setBotState("listening");
    } catch (e) {
      const denied = e instanceof DOMException && e.name === "NotAllowedError";
      fail(denied ? "Microphone permission was denied." : e instanceof Error ? e.message : String(e));
    }
  }, [interview, handleMessage, fail, setBotState, trackLevel]);

  /** Countdown while live; at zero ask the interviewer to wrap up, then force-finish after a grace period. */
  useEffect(() => {
    if (phase !== "live" && phase !== "wrapping") return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (secondsLeft > 0 || timeUpSent.current || phase !== "live") return;
    timeUpSent.current = true;
    session.current?.sendRealtimeInput({ text: "[TIME_UP] The allotted time is over. Wrap up now." });
    setTimeout(() => void finish(), 45000); // grace period; finish() is a no-op if already done
  }, [secondsLeft, phase, finish]);

  /**
   * Safety net: if the candidate finished an answer (>= 0.5 s of speech, then 4 s of quiet) and the
   * interviewer has not replied, or the candidate has said nothing for 15 s after a question,
   * send a one-off system nudge so the conversation never stalls.
   */
  useEffect(() => {
    if (phase !== "live") return;
    const id = setInterval(() => {
      const now = Date.now();
      const busy = botRef.current === "speaking" || player.current?.playing || speakingRef.current;
      if (busy || nudged.current || ending.current) return;
      if (loudChunks.current >= 5 && now - lastLoud.current > 4000) {
        nudged.current = true;
        session.current?.sendRealtimeInput({ text: "[ANSWER_DONE] The candidate has finished answering. Respond now." });
      } else if (loudChunks.current < 5 && now - lastBotEnd.current > 15000) {
        nudged.current = true;
        session.current?.sendRealtimeInput({ text: "[CANDIDATE_SILENT] The candidate has been quiet for a while." });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const endNow = useCallback(() => void finish(), [finish]);

  useEffect(() => teardown, [teardown]);

  return { phase, bot, userSpeaking, asked, total: interview.plan.questions.length, secondsLeft, report, error, begin, endNow };
}
