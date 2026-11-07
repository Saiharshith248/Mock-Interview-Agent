"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local-only self preview to help the candidate feel confident.
 * The stream is attached to a <video> element and nothing else: it is never
 * recorded, uploaded, or passed to the interview session.
 */
export function SelfCam() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState<string>();

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setOn(false);
  };

  const toggle = async () => {
    if (on) return stop();
    setErr(undefined);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (video.current) video.current.srcObject = stream.current;
      setOn(true);
    } catch {
      setErr("Camera unavailable or permission denied.");
    }
  };

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`neon-frame relative aspect-video w-36 md:w-56 overflow-hidden rounded-2xl ${on ? "" : "opacity-60"}`}>
        <video ref={video} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        {!on && (
          <div className="absolute inset-0 grid place-items-center text-xs tracking-widest text-cyan-200/70">
            CAMERA OFF
          </div>
        )}
      </div>
      <button onClick={toggle} className="neon-btn neon-btn-cyan text-xs">
        {on ? "Hide my camera" : "Show my camera"}
      </button>
      <p className="max-w-44 md:max-w-56 text-center text-[11px] text-cyan-100/50">
        {err ?? "Only you can see this. It is never recorded or sent anywhere."}
      </p>
    </div>
  );
}
