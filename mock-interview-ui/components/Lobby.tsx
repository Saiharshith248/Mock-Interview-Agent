"use client";

import { Icon } from "@/components/ui/Icon";
import { MicMeter } from "@/components/ui/MicMeter";
import { TopBar } from "@/components/ui/TopBar";
import type { useCamera } from "@/hooks/useCamera";
import { useMicCheck } from "@/hooks/useMicCheck";
import type { CandidateProfile } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System design",
  mixed: "Mixed",
};

/** Pre-join "green room": camera preview, mic check, what to expect, Begin. */
export function Lobby({
  title,
  profile,
  questions,
  minutes,
  error,
  cam,
  onBegin,
}: {
  title: string;
  profile: Partial<CandidateProfile>;
  questions: number;
  minutes: number;
  error?: string;
  cam: ReturnType<typeof useCamera>;
  onBegin: () => void;
}) {
  const mic = useMicCheck(true);
  const { on: camOn, error: camError, toggle: toggleCam, attach: attachCam } = cam;

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar step={2} />
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        {/* Preview */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-edge bg-panel">
            {camOn ? (
              <video ref={attachCam} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-[radial-gradient(50%_60%_at_50%_45%,rgb(143_124_240/0.12),transparent_70%)]">
                <div className="flex flex-col items-center gap-3 text-haze">
                  <div className="grid size-20 place-items-center rounded-full bg-raised">
                    <Icon name="user" className="size-9" />
                  </div>
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-4">
              <p className="flex items-center gap-2.5 text-sm text-cream">
                <Icon name="mic" />
                <MicMeter level={mic.getLevel} active={mic.state === "ok"} />
                {mic.state === "ok" ? "Say something to test your mic" : mic.state === "denied" ? "Mic blocked. Allow it in your browser" : "Checking mic…"}
              </p>
              <button onClick={toggleCam} className="btn btn-ghost !bg-black/40 !py-1.5 text-xs backdrop-blur">
                <Icon name={camOn ? "video-off" : "video"} className="size-3.5" />
                {camOn ? "Turn off camera" : "Turn on camera"}
              </button>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-dim">
            <Icon name="lock" className="size-3.5" />
            {camError ?? "Your camera stays on this device. It is never recorded or sent."}
          </p>
        </div>

        {/* Copy + begin */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-haze">{title}</p>
            <h1 className="mt-1 font-display text-5xl leading-[1.02] tracking-tight text-balance">
              Ready when <em className="text-apricot">you</em> are.
            </h1>
          </div>

          <dl className="grid grid-cols-3 gap-2">
            <Fact value={String(questions)} label="questions" />
            <Fact value={`${minutes} min`} label="time limit" />
            <Fact value={TYPE_LABEL[profile.interviewType ?? "mixed"] ?? "Mixed"} label="format" />
          </dl>

          <ul className="flex flex-col gap-2.5 text-sm text-haze">
            <li className="flex items-center gap-3"><Icon name="headphones" className="text-lilac" />Headphones on, so Ava doesn&apos;t hear herself.</li>
            <li className="flex items-center gap-3"><Icon name="mic" className="text-lilac" />Answer out loud. Pause when you&apos;re done and Ava follows up.</li>
            <li className="flex items-center gap-3"><Icon name="clock" className="text-lilac" />End early anytime and still get feedback.</li>
          </ul>

          {error && (
            <p className="flex items-start gap-2 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
              <Icon name="alert" className="mt-0.5" />
              {error}
            </p>
          )}

          <div>
            <button onClick={onBegin} className="btn btn-primary btn-lg">
              {error ? <><Icon name="rotate" />Try again</> : "Begin interview"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl border border-edge bg-panel px-4 py-3">
      <dt className="text-xs text-haze">{label}</dt>
      <dd className="font-display text-2xl leading-tight tabular-nums">{value}</dd>
    </div>
  );
}
