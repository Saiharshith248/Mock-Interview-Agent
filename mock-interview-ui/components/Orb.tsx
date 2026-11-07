"use client";

import { useAudioLevel } from "@/hooks/useAudioLevel";

export type OrbState = "idle" | "connecting" | "listening" | "speaking" | "error";

/**
 * Ava's face: three rings, two eyes and a talking mouth. It breathes while idle,
 * ripples while listening (swelling with your mic) and warms up and talks while
 * Ava speaks (pulsing with her real voice). Scale it with `size` (a CSS font-size).
 */
export function Orb({
  state,
  size = "1rem",
  level,
  className = "",
}: {
  state: OrbState;
  size?: string;
  level?: () => number;
  className?: string;
}) {
  const ref = useAudioLevel<HTMLDivElement>(level, state === "speaking" || state === "listening");
  return (
    <div ref={ref} className={`orb orb-${state} ${className}`} style={{ fontSize: size }} aria-hidden>
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

/** Tiny static version of Ava's face for avatars and the brand mark. */
export function FaceMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#1a1522" stroke="#b7a4ff" strokeWidth="1.5" />
      <circle cx="11.5" cy="13.5" r="2.2" fill="#fff8ee" />
      <circle cx="20.5" cy="13.5" r="2.2" fill="#fff8ee" />
      <g fill="#ff9e6d">
        <rect x="11" y="20" width="1.6" height="2.4" rx=".8" />
        <rect x="13.6" y="19.2" width="1.6" height="4" rx=".8" />
        <rect x="16.2" y="18.6" width="1.6" height="5.2" rx=".8" />
        <rect x="18.8" y="19.4" width="1.6" height="3.6" rx=".8" />
      </g>
    </svg>
  );
}
