import { NeonBot } from "@/components/NeonBot";
import type { SessionStatus } from "@/lib/types";

const CAPTION: Record<SessionStatus, string> = {
  idle: "Tap Blip to start",
  connecting: "Connecting…",
  listening: "Listening… tap Blip to end",
  speaking: "Blip is speaking… tap to end",
  error: "Something went wrong. Tap Blip to retry",
  done: "Session ended. Tap Blip to start again",
};

/** The animated Blip bot IS the mic button. Fixed to the bottom of the screen. */
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center bg-gradient-to-t from-[#05010f] via-[#05010f]/90 to-transparent pb-3 pt-6">
      <button
        onClick={live ? onStop : onStart}
        disabled={status === "connecting"}
        aria-label={CAPTION[status]}
        className={`group relative h-48 w-48 cursor-pointer rounded-full transition-transform hover:scale-105 active:scale-95 disabled:cursor-wait ${
          status === "connecting" ? "animate-pulse" : ""
        }`}
      >
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.8]">
          <NeonBot state={botState} />
        </span>
      </button>
      <p className="mt-1 text-xs tracking-[0.25em] text-cyan-200/70">{CAPTION[status].toUpperCase()}</p>
    </div>
  );
}
