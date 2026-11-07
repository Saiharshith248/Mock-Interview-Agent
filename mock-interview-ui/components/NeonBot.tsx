import type { BotState } from "@/hooks/useInterviewSession";

/** Animated neon orb that "talks" (pulses) while the bot speaks and breathes while listening. */
export function NeonBot({ state }: { state: BotState }) {
  return (
    <div className={`neon-bot neon-bot-${state}`} aria-hidden>
      <span className="ring r1" />
      <span className="ring r2" />
      <span className="ring r3" />
      <div className="core">
        <div className="eyes">
          <i />
          <i />
        </div>
        <div className="mouth">
          <b /><b /><b /><b /><b />
        </div>
      </div>
    </div>
  );
}
