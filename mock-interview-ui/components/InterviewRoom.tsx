"use client";

import { useState } from "react";
import { AvaCharacter, YouCharacter } from "@/components/Characters";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { SelfCam } from "@/components/SelfCam";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import type { CandidateProfile, InterviewStart } from "@/lib/types";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function InterviewRoom({
  interview,
  profile,
  onExit,
}: {
  interview: InterviewStart;
  profile: Partial<CandidateProfile>;
  onExit: () => void;
}) {
  const s = useInterviewSession(interview, profile);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const live = s.phase === "live" || s.phase === "wrapping";
  const ended = s.phase === "report";

  return (
    <main className="neon-page">
      <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col overflow-hidden p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.3em] text-fuchsia-300/80">MOCK INTERVIEW</p>
            <h1 className="neon-title text-xl font-bold">
              {profile.targetRole}
              {profile.company ? ` · ${profile.company}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-5 text-right">
            <div>
              <p className="text-[10px] tracking-widest text-cyan-200/60">QUESTION</p>
              <p className="neon-text font-mono text-lg">{Math.max(s.asked, live ? 1 : 0)} / {s.total}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-widest text-cyan-200/60">TIME LEFT</p>
              <p className={`font-mono text-lg ${s.secondsLeft < 60 && live ? "neon-pulse text-pink-400" : "neon-text"}`}>
                {mmss(s.secondsLeft)}
              </p>
            </div>
          </div>
        </header>

        {/* Stage: Ava on the left, you on the right. Only the one talking animates. No text here. */}
        <section className="grid min-h-0 flex-1 grid-cols-2 items-end gap-2 py-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex justify-start md:justify-center">
            <AvaCharacter active={live && s.bot === "speaking"} />
          </div>
          <div className="order-last col-span-2 flex justify-center self-center md:order-none md:col-span-1">
            <SelfCam />
          </div>
          <div className="flex justify-end md:justify-center">
            <YouCharacter active={live && s.userSpeaking} />
          </div>
        </section>

        {s.error && <p className="mb-3 text-center text-sm text-pink-400">{s.error}</p>}

        <footer className="flex flex-wrap items-center justify-center gap-4 pb-3">
          {(s.phase === "lobby" || s.phase === "error") && (
            <button onClick={s.begin} className="neon-btn neon-btn-pink">
              {s.phase === "error" ? "Retry" : "Begin interview"}
            </button>
          )}
          {s.phase === "connecting" && (
            <button disabled className="neon-btn neon-btn-cyan">Connecting…</button>
          )}
          {live && (
            <button onClick={s.endNow} className="neon-btn neon-btn-pink">End interview</button>
          )}
          {ended && (
            <>
              <button onClick={() => setFeedbackOpen(true)} className="neon-btn neon-btn-pink">Feedback</button>
              <button onClick={onExit} className="neon-btn neon-btn-cyan">Exit</button>
            </>
          )}
        </footer>
      </div>

      {ended && feedbackOpen && (
        <FeedbackDialog
          report={s.report}
          error={s.error}
          onClose={() => setFeedbackOpen(false)}
          onExit={onExit}
        />
      )}
    </main>
  );
}
