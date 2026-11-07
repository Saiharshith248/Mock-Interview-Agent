import { NeonBot } from "@/components/NeonBot";
import type { SessionStatus } from "@/lib/types";

const CAPTION: Record<SessionStatus, string> = {
  idle: "Tap Ava to start",
  connecting: "Connecting…",
  listening: "Listening… tap Ava to end",
  speaking: "Ava is speaking… tap to end",
  error: "Something went wrong. Tap Ava to retry",
  done: "Session ended. Tap Ava to start again",
};

/** The animated Ava bot IS the mic button. Fixed to the bottom of the screen. */
export function BotButton({
  status,
  onStart,
  onStop,
}: {
  status: SessionStatus;
  onStart: () => void;
  onStop: () => void;
}) {
  const live = status === "listening" || status === "speaking";
  const botState = status === "speaking" ? "speaking" : status === "listening" ? "listening" : "idle";

  return (
    <div className="sticky bottom-0 z-40 mt-auto flex flex-col items-center bg-gradient-to-t from-[#05010f] via-[#05010f]/90 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4">
      <button
        onClick={live ? onStop : onStart}
        disabled={status === "connecting"}
        aria-label={CAPTION[status]}
        className={`bot-btn cursor-pointer disabled:cursor-wait ${
          status === "connecting" ? "animate-pulse" : ""
        }`}
      >
        <span className="bot-btn-inner">
          <NeonBot state={botState} />
        </span>
      </button>
      <p className="mt-1 text-xs tracking-[0.25em] text-cyan-200/70">{CAPTION[status].toUpperCase()}</p>
    </div>
  );
}
