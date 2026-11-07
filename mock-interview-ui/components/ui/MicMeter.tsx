"use client";

import { useAudioLevel } from "@/hooks/useAudioLevel";

const GAINS = [0.7, 1.15, 1.5, 1.1, 0.8];

/** Five bars that bounce with a live 0..1 level. */
export function MicMeter({ level, active = true }: { level?: () => number; active?: boolean }) {
  const ref = useAudioLevel<HTMLSpanElement>(level, active);
  return (
    <span ref={ref} className="meter" aria-hidden>
      {GAINS.map((k, i) => (
        <i key={i} style={{ "--k": k } as React.CSSProperties} />
      ))}
    </span>
  );
}
