"use client";

import { useEffect, useState } from "react";

const JOKES = [
  "Teaching robots to ask tricky questions…",
  "Reading your job description (all of it)…",
  "Sharpening the interview pencils…",
  "Bribing the HR bot with coffee…",
  "Practicing my serious interviewer face…",
  "Hiding the easy questions…",
  "Untangling some very long cables…",
  "Warming up my follow-up questions…",
  "Politely adjusting the tiny tie…",
];

/** Goofy loading state: bouncing robot head, orbiting dots, and rotating one-liners. */
export function PrepSpinner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % JOKES.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-6" role="status" aria-live="polite">
      <div className="prep-spinner">
        <span className="prep-orbit o1"><i /></span>
        <span className="prep-orbit o2"><i /></span>
        <span className="prep-orbit o3"><i /></span>
        <svg viewBox="0 0 64 64" className="prep-bot" aria-hidden>
          <line x1="32" y1="6" x2="32" y2="14" />
          <circle cx="32" cy="5" r="3.2" className="prep-antenna" />
          <rect x="12" y="14" width="40" height="32" rx="11" className="prep-head" />
          <circle cx="24" cy="30" r="4" className="prep-eye" />
          <circle cx="40" cy="30" r="4" className="prep-eye" />
          <path d="M23 39 Q32 44 41 39" />
          <rect x="22" y="48" width="20" height="10" rx="4" className="prep-head" />
        </svg>
      </div>
      <p key={i} className="prep-joke neon-text min-h-6 text-center text-base">{JOKES[i]}</p>
    </div>
  );
}
