"use client";

import { useEffect, useRef } from "react";

/**
 * Writes a smoothed `--level` (0..1) CSS variable onto the returned element every
 * animation frame, read from `get`. No React re-render per frame.
 */
export function useAudioLevel<T extends HTMLElement>(get?: () => number, active = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!get || !active) {
      el.style.setProperty("--level", "0");
      return;
    }
    let raf = 0;
    let v = 0;
    const tick = () => {
      const target = get();
      // Rise fast, fall slower so motion feels like speech, not flicker.
      v += (target - v) * (target > v ? 0.45 : 0.12);
      el.style.setProperty("--level", v.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--level", "0");
    };
  }, [get, active]);

  return ref;
}
