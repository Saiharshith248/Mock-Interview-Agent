"use client";

import { InterviewRoom } from "@/components/InterviewRoom";
import { BotButton } from "@/components/BotButton";
import { PasteBox } from "@/components/PasteBox";
import { ProfileCard } from "@/components/ProfileCard";
import { PrepSpinner } from "@/components/PrepSpinner";
import { StepBar } from "@/components/StepBar";
import { Transcript } from "@/components/Transcript";
import { useLiveSession } from "@/hooks/useLiveSession";

export default function Home() {
  const s = useLiveSession();
  const live = s.status === "listening" || s.status === "speaking";

  if (s.interview) {
    return <InterviewRoom key={s.interview.token} interview={s.interview} profile={s.profile} onExit={() => window.location.reload()} />;
  }

  if (s.status === "done" && s.profile.targetRole) {
    return (
      <main className="neon-page">
        <div className="mx-auto w-full max-w-xl p-6">
          <StepBar current={2} />
          <h1 className="neon-title mb-2 mt-8 text-center text-4xl font-bold sm:text-5xl">
            {s.error ? "Couldn't set up your interview" : "Preparing your interview"}
          </h1>
          {s.error ? <p className="mb-4 mt-4 text-center text-sm text-pink-400">{s.error}</p> : <PrepSpinner />}
          <div className="mt-4">
            <ProfileCard profile={s.profile} />
          </div>
          {s.error && (
            <div className="mt-5 text-center">
              <button onClick={s.start} className="neon-btn neon-btn-cyan text-sm">Start over</button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="neon-page flex flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        <StepBar current={1} />
        <header className="mb-8 mt-8 text-center">
          <h1 className="neon-title text-4xl font-bold sm:text-6xl">Mock Interview Setup</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-cyan-100/60 sm:text-base">
            Talk to Ava for the short answers; paste the long ones. Use Chrome and headphones.
          </p>
        </header>

        {/* Transcript on top; the Ava bot bar is pinned to the bottom of the screen and sits in the layout, so it never covers content. */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Transcript lines={s.transcript} />
            {s.error && <p className="text-sm text-pink-400">{s.error}</p>}
          </div>
          <div className="flex flex-col gap-4">
            <ProfileCard profile={s.profile} />
            <PasteBox
              title="Job description"
              placeholder="Paste the job description here…"
              disabled={!live}
              onSend={(t) => s.sendPasted("JOB_DESCRIPTION", t)}
            />
            <PasteBox
              title="Resume"
              placeholder="Paste your resume here (use a sample resume for the demo)…"
              disabled={!live}
              allowPdf
              onSend={(t) => s.sendPasted("RESUME", t)}
            />
          </div>
        </div>
      </div>
      <BotButton status={s.status} onStart={s.start} onStop={s.stop} />
    </main>
  );
}
