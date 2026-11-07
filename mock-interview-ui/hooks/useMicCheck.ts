"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pre-interview mic test: opens the mic just to measure loudness, never sends audio
 * anywhere, and releases it on unmount (before the real session opens its own mic).
 */
export function useMicCheck(enabled: boolean) {
  const [state, setState] = useState<"pending" | "ok" | "denied">("pending");
  const level = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | undefined;
    let ctx: AudioContext | undefined;

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          level.current = Math.min(1, Math.sqrt(Math.sqrt(sum / buf.length)) * 2.2);
          raf = requestAnimationFrame(tick);
        };
        tick();
        setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      level.current = 0;
    };
  }, [enabled]);

  const getLevel = useCallback(() => level.current, []);
  return { state, getLevel };
}
