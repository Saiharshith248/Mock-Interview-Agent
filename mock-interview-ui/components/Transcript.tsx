"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/lib/types";

function Avatar({ who }: { who: "ava" | "user" }) {
  const color = who === "ava" ? "#22e6ff" : "#ff2bd6";
  return (
    <svg viewBox="0 0 32 32" className="mt-0.5 h-7 w-7 shrink-0" style={{ color, filter: "drop-shadow(0 0 4px currentColor)" }} aria-hidden>
      {who === "ava" ? (
        <>
          <rect x="5" y="8" width="22" height="17" rx="6" fill="rgba(10,6,30,.85)" stroke="currentColor" strokeWidth="2" />
          <line x1="16" y1="3" x2="16" y2="8" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="3" r="1.8" fill="currentColor" />
          <circle cx="12" cy="16" r="2" fill="currentColor" />
          <circle cx="20" cy="16" r="2" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="16" cy="12" r="6" fill="rgba(10,6,30,.85)" stroke="currentColor" strokeWidth="2" />
          <path d="M5 28 Q5 19 16 19 Q27 19 27 28" fill="rgba(10,6,30,.85)" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

/** Chat-style transcript: no box, tiny character avatars, hidden scrollbar. */
export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="no-scrollbar fade-edges h-96 overflow-y-auto px-1 py-4">
      {lines.length === 0 && (
        <p className="text-sm text-cyan-100/40">The conversation will appear here.</p>
      )}
      <div className="flex flex-col gap-4">
        {lines.map((l) => (
          <div key={l.id} className={`flex items-start gap-2.5 ${l.final ? "" : "opacity-60"}`}>
            <Avatar who={l.role} />
            <p
              className={`text-[15px] leading-relaxed ${
                l.role === "ava"
                  ? "text-cyan-100 [text-shadow:0_0_8px_rgba(34,230,255,0.45)]"
                  : "text-fuchsia-100 [text-shadow:0_0_8px_rgba(255,43,214,0.4)]"
              }`}
            >
              {l.text}
            </p>
          </div>
        ))}
      </div>
      <div ref={end} />
    </div>
  );
}
