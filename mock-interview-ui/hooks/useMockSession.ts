"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CandidateProfile,
  LiveSession,
  PastedKind,
  SessionStatus,
  TranscriptLine,
} from "@/lib/types";

type Step = {
  delay: number;
  run: (api: {
    say: (role: "user" | "ava", text: string) => void;
    setProfile: (p: Partial<CandidateProfile>) => void;
    setStatus: (s: SessionStatus) => void;
  }) => void;
};

// Fake scripted conversation so the UI can be built without the Live API.
const SCRIPT: Step[] = [
  { delay: 800, run: (a) => { a.setStatus("speaking"); a.say("ava", "Hi, I'm Ava. What role are you preparing for?"); } },
  { delay: 2500, run: (a) => { a.setStatus("listening"); a.say("user", "A data analyst role at Stripe."); } },
  { delay: 1500, run: (a) => a.setProfile({ targetRole: "Data Analyst", company: "Stripe" }) },
  { delay: 800, run: (a) => { a.setStatus("speaking"); a.say("ava", "Great. Technical, behavioral, system design, or mixed?"); } },
  { delay: 2500, run: (a) => { a.setStatus("listening"); a.say("user", "Mixed please."); } },
  { delay: 1200, run: (a) => a.setProfile({ interviewType: "mixed" }) },
  { delay: 800, run: (a) => { a.setStatus("speaking"); a.say("ava", "How many years of experience do you have, and what kind?"); } },
  { delay: 2500, run: (a) => { a.setStatus("listening"); a.say("user", "Two years, full-time backend."); } },
  { delay: 1200, run: (a) => a.setProfile({ experienceYears: 2, experienceType: "Full-time backend" }) },
  { delay: 800, run: (a) => { a.setStatus("speaking"); a.say("ava", "Please paste the job description into the box on screen."); } },
  { delay: 1500, run: (a) => a.setStatus("listening") },
];

export function useMockSession(): LiveSession {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [profile, setProfileState] = useState<Partial<CandidateProfile>>({});
  const [error, setError] = useState<string>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const counter = useRef(0);

  const say = useCallback((role: "user" | "ava", text: string) => {
    setTranscript((t) => [...t, { id: String(counter.current++), role, text, final: true }]);
  }, []);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clear, []);

  const start = useCallback(async () => {
    setError(undefined);
    setStatus("connecting");
    let t = 0;
    const api = { say, setProfile: (p: Partial<CandidateProfile>) => setProfileState((s) => ({ ...s, ...p })), setStatus };
    SCRIPT.forEach((step) => {
      t += step.delay;
      timers.current.push(setTimeout(() => step.run(api), t));
    });
  }, [say]);

  const stop = useCallback(() => {
    clear();
    setStatus("done");
  }, []);

  const sendPasted = useCallback((kind: PastedKind, text: string) => {
    setProfileState((s) => (kind === "JOB_DESCRIPTION" ? { ...s, jobDescription: text } : { ...s, resumeText: text }));
    setStatus("speaking");
    say("ava", kind === "JOB_DESCRIPTION" ? "Got it, thanks for the job description." : "Got it, I have your resume.");
    timers.current.push(setTimeout(() => setStatus("listening"), 1500));
  }, [say]);

  // Fake voice so the orb moves while building the UI without the Live API.
  const audioLevel = useCallback(() => {
    const t = performance.now() / 1000;
    return Math.max(0, 0.45 + 0.35 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
  }, []);

  return { status, transcript, profile, error, start, stop, sendPasted, audioLevel };
}
