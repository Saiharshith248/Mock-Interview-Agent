"use client";

import { InterviewRoom } from "@/components/InterviewRoom";
import { MaterialsCard } from "@/components/MaterialsCard";
import { Orb, type OrbState } from "@/components/Orb";
import { PrepSpinner } from "@/components/PrepSpinner";
import { ProfileCard } from "@/components/ProfileCard";
import { Transcript } from "@/components/Transcript";
import { Icon } from "@/components/ui/Icon";
import { TopBar } from "@/components/ui/TopBar";
import { useLiveSession } from "@/hooks/useLiveSession";
import type { CandidateProfile, SessionStatus } from "@/lib/types";

const STATUS: Record<SessionStatus, { label: string; tone: string }> = {
  idle: { label: "Ready when you are", tone: "text-haze" },
  connecting: { label: "Connecting…", tone: "text-haze" },
  listening: { label: "Your turn, Ava is listening", tone: "text-lilac" },
  speaking: { label: "Ava is talking", tone: "text-apricot" },
  error: { label: "Something went wrong", tone: "text-rose" },
  done: { label: "Session ended", tone: "text-haze" },
};

const toOrb = (s: SessionStatus): OrbState =>
  s === "speaking" ? "speaking" : s === "listening" ? "listening" : s === "connecting" ? "connecting" : s === "error" ? "error" : "idle";

export default function Home() {
  const s = useLiveSession();
  const live = s.status === "listening" || s.status === "speaking";

  if (s.interview) {
    return <InterviewRoom key={s.interview.token} interview={s.interview} profile={s.profile} onExit={() => window.location.reload()} />;
  }

  if (s.status === "done" && s.profile.targetRole) {
    return <Preparing profile={s.profile} error={s.error} onRestart={s.start} />;
  }

  const status = STATUS[s.status];

  return (
    <main className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <TopBar step={1} />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 pb-5 sm:px-6 lg:min-h-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Conversation: orb up top, transcript scrolls on its own below. */}
        <section className="panel flex min-h-[34rem] flex-col overflow-hidden lg:min-h-0">
          <div className="flex flex-col items-center gap-6 border-b border-edge px-6 py-6 sm:flex-row sm:gap-8">
            <button
              onClick={live ? s.stop : s.start}
              disabled={s.status === "connecting"}
              aria-label={live ? "End the session with Ava" : "Start talking to Ava"}
              className="grid size-40 shrink-0 cursor-pointer place-items-center rounded-full transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-wait"
            >
              <Orb state={toOrb(s.status)} size="0.62rem" level={s.audioLevel} />
            </button>

            <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <p className={`flex items-center gap-2 text-sm font-medium ${status.tone}`}>
                <span className={`size-2 rounded-full bg-current ${live ? "animate-pulse" : ""}`} />
                {status.label}
              </p>
              <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-[2.75rem]">
                Let&apos;s get you <em className="text-apricot">interview&#8209;ready.</em>
              </h1>
              <p className="max-w-md text-sm text-haze">
                Chat with Ava out loud about the role. Paste the long stuff <span className="lg:hidden">below</span><span className="hidden lg:inline">on the right</span>.
              </p>
              <div className="flex flex-wrap gap-2">
                {live ? (
                  <button onClick={s.stop} className="btn btn-ghost">
                    <Icon name="square" className="size-3.5" />
                    End session
                  </button>
                ) : (
                  <button onClick={s.start} disabled={s.status === "connecting"} className="btn btn-primary">
                    <Icon name="mic" />
                    {s.status === "idle" ? "Start talking" : s.status === "connecting" ? "Connecting…" : "Start again"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {s.error && (
            <p className="flex items-center gap-2 border-b border-edge bg-rose/10 px-6 py-3 text-sm text-rose">
              <Icon name="alert" />
              {s.error}
            </p>
          )}

          <Transcript lines={s.transcript} className="flex-1" />
        </section>

        {/* Profile + materials: scrolls on its own on desktop. */}
        <aside className="scroll-thin flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <ProfileCard profile={s.profile} />
          <MaterialsCard disabled={!live} onSend={s.sendPasted} />
        </aside>
      </div>
    </main>
  );
}

function Preparing({ profile, error, onRestart }: { profile: Partial<CandidateProfile>; error?: string; onRestart: () => void }) {
  const chips = [profile.targetRole, profile.company, profile.durationMinutes && `${profile.durationMinutes} min`].filter(Boolean);
  const steps = [
    { label: "Profile captured", done: true },
    { label: "Job description read", done: !!profile.jobDescription },
    { label: "Writing your questions", done: false },
  ];

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar step={2} />
      <div className="grid flex-1 place-items-center px-4 py-10">
        <section className="panel flex w-full max-w-md flex-col items-center gap-6 p-8 text-center">
          {error ? <Orb state="error" size="0.5rem" /> : <PrepSpinner />}
          <div>
            <h1 className="font-display text-3xl leading-tight">
              {error ? "Couldn't set up your interview" : <>Writing your <em className="text-apricot">questions…</em></>}
            </h1>
            <p className="mt-2 text-sm text-haze">
              {error ?? "Ava is tailoring the interview to your job description. This takes a few seconds."}
            </p>
          </div>

          {!error && (
            <ul className="flex w-full flex-col gap-2 text-left text-sm">
              {steps.map((st, i) => (
                <li key={st.label} className="flex items-center gap-3 rounded-2xl border border-edge bg-night/60 px-4 py-3">
                  {st.done ? (
                    <Icon name="check" className="size-4 text-mint" />
                  ) : i === steps.findIndex((x) => !x.done) ? (
                    <Icon name="loader" className="size-4 animate-spin text-apricot" />
                  ) : (
                    <Icon name="clock" className="size-4 text-dim" />
                  )}
                  <span className={st.done ? "" : "text-haze"}>{st.label}</span>
                </li>
              ))}
            </ul>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {chips.map((c) => (
                <span key={String(c)} className="chip">{c}</span>
              ))}
            </div>
          )}

          <button onClick={onRestart} className={`btn ${error ? "btn-primary" : "btn-ghost"}`}>
            <Icon name="rotate" />
            Start over
          </button>
        </section>
      </div>
    </main>
  );
}
