"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Local-only self preview. The stream is attached to <video> elements and nothing
 * else: it is never recorded, uploaded, or passed to the interview session.
 * `attach` is a callback ref, so the same stream can follow you from lobby to room.
 */
export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>();
  const live = useRef<MediaStream | null>(null);

  const attach = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && el.srcObject !== stream) el.srcObject = stream;
    },
    [stream],
  );

  const stop = useCallback(() => {
    live.current?.getTracks().forEach((t) => t.stop());
    live.current = null;
    setStream(null);
  }, []);

  const toggle = useCallback(async () => {
    if (live.current) return stop();
    setError(undefined);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      live.current = s;
      setStream(s);
    } catch {
      setError("Camera unavailable or permission denied.");
    }
  }, [stop]);

  useEffect(() => () => live.current?.getTracks().forEach((t) => t.stop()), []);

  return { on: !!stream, error, toggle, stop, attach };
}
