"use client";

import { Lobby } from "@/components/Lobby";
import { Orb } from "@/components/Orb";
import { Results } from "@/components/Results";
import { Icon } from "@/components/ui/Icon";
import { MicMeter } from "@/components/ui/MicMeter";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { useCamera } from "@/hooks/useCamera";
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
  const cam = useCamera();
  const title = [profile.targetRole, profile.company].filter(Boolean).join(" · ");

  if (s.phase === "report") {
    return <Results report={s.report} error={s.error} title={title} profile={profile} onExit={onExit} />;
  }

  if (s.phase === "lobby" || s.phase === "error") {
    return (
      <Lobby
        title={title}
        profile={profile}
        questions={s.total}
        minutes={interview.durationMinutes}
        error={s.phase === "error" ? s.error : undefined}
        cam={cam}
        onBegin={s.begin}
      />
    );
  }

  // connecting | live | wrapping: the call screen. Fills the viewport exactly, never scrolls.
  const connecting = s.phase === "connecting";
  const wrapping = s.phase === "wrapping";
  const speaking = s.bot === "speaking";
  const asked = Math.max(s.asked, connecting ? 0 : 1);
  const timeTone =
    s.secondsLeft < 60 ? "border-rose/40 bg-rose/10 text-rose animate-pulse" : s.secondsLeft < 120 ? "border-amber/40 bg-amber/10 text-amber" : "";

  const caption = connecting
    ? { big: "Connecting to Ava…", small: "Opening a private line. One moment." }
    : wrapping
      ? { big: "That's a wrap.", small: "Ava is closing out. Your feedback comes next." }
      : speaking
        ? { big: "Ava is asking…", small: "Listen through, then answer in your own words." }
        : { big: "Your turn.", small: "Take your time. Pause when you're done and Ava will follow up." };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      {/* Top bar: role, question progress, timer */}
      <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0">
          <p className="text-xs text-haze">Mock interview</p>
          <h1 className="truncate font-display text-xl leading-tight">{title || "Your interview"}</h1>
        </div>

        <div className="col-span-2 row-start-2 flex flex-col items-center gap-1.5 md:col-span-1 md:row-start-auto">
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: s.total }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-7 rounded-full transition-colors duration-500 sm:w-9 ${
                  i < asked - 1 ? "bg-lilac" : i === asked - 1 ? "bg-apricot" : "bg-edge"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-haze tabular-nums">
            {asked ? `Question ${asked} of ${s.total}` : `${s.total} questions`}
          </p>
        </div>

        <p
          className={`col-start-2 row-start-1 flex items-center gap-2 justify-self-end rounded-full border border-edge bg-raised px-3 py-1.5 font-mono text-sm tabular-nums md:col-start-3 ${timeTone}`}
          aria-label={`${mmss(s.secondsLeft)} left`}
        >
          <Icon name="clock" className="size-3.5" />
          {mmss(s.secondsLeft)}
        </p>
      </header>

      {/* Stage */}
      <section className="relative mx-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-hidden rounded-[2rem] border border-edge bg-[radial-gradient(60%_55%_at_50%_42%,rgb(143_124_240/0.14),transparent_70%),radial-gradient(40%_40%_at_50%_100%,rgb(255_158_109/0.08),transparent_70%)] bg-panel/60 px-4 sm:mx-6">
        {wrapping && (
          <p className="chip absolute top-4 left-1/2 -translate-x-1/2 !border-amber/30 !bg-amber/10 !text-amber">
            <Icon name="sparkle" className="size-3" />
            Wrapping up
          </p>
        )}

        <Orb
          state={connecting ? "connecting" : speaking ? "speaking" : "listening"}
          size="clamp(0.7rem, 2.1vh, 1.3rem)"
          level={speaking ? s.botLevel : s.userLevel}
        />

        <div className="flex max-w-md flex-col items-center gap-1.5 text-center" aria-live="polite">
          <p className="font-display text-3xl sm:text-4xl">{caption.big}</p>
          <p className="text-sm text-haze">{caption.small}</p>
        </div>

        <SelfTile cam={cam} level={s.userLevel} speaking={s.userSpeaking && !connecting} />
      </section>

      {s.error && (
        <p className="mx-auto mt-3 flex items-center gap-2 text-sm text-rose">
          <Icon name="alert" />
          {s.error}
        </p>
      )}

      {/* Control dock */}
      <footer className="flex flex-wrap items-center justify-center gap-3 px-4 py-4 sm:py-5">
        <span className="flex h-11 items-center gap-2.5 rounded-full border border-edge bg-raised px-4 text-sm text-haze">
          <Icon name="mic" className="size-4 text-cream" />
          <MicMeter level={s.userLevel} active={!connecting} />
          {connecting ? "Mic starting" : "Mic on"}
        </span>
        <button
          onClick={cam.toggle}
          className={`btn btn-icon ${cam.on ? "btn-ghost" : "btn-ghost !text-haze"}`}
          aria-label={cam.on ? "Hide my camera" : "Show my camera"}
          title="Only you can see your camera. It is never recorded or sent."
        >
          <Icon name={cam.on ? "video" : "video-off"} className="size-5" />
        </button>
        <button onClick={s.endNow} disabled={connecting} className="btn btn-danger !px-5">
          <Icon name="phone-off" />
          End interview
        </button>
      </footer>
    </main>
  );
}

/** Picture-in-picture self view. Without camera it shows an avatar ringed by your mic level. */
function SelfTile({
  cam,
  level,
  speaking,
}: {
  cam: ReturnType<typeof useCamera>;
  level: () => number;
  speaking: boolean;
}) {
  const { on: camOn, attach: attachCam } = cam;
  const ring = useAudioLevel<HTMLDivElement>(level, !camOn);
  return (
    <div
      className={`absolute right-3 bottom-3 aspect-[4/3] w-32 overflow-hidden rounded-2xl border bg-night shadow-xl shadow-black/50 transition-colors sm:right-4 sm:bottom-4 sm:w-48 ${
        speaking ? "border-lilac/70" : "border-edge"
      }`}
    >
      {camOn ? (
        <video ref={attachCam} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" />
      ) : (
        <div className="grid size-full place-items-center">
          <div
            ref={ring}
            className="grid size-12 place-items-center rounded-full bg-raised text-haze transition-[box-shadow] duration-75 sm:size-14"
            style={{ boxShadow: "0 0 0 calc(var(--level, 0) * 12px) rgb(183 164 255 / 0.35)" }}
          >
            <Icon name="user" className="size-6" />
          </div>
        </div>
      )}
      <span className="absolute bottom-1.5 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-cream">
        You
      </span>
    </div>
  );
}
