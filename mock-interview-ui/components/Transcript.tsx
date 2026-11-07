"use client";

import { useEffect, useRef, useState } from "react";
import { FaceMark } from "@/components/Orb";
import { Icon } from "@/components/ui/Icon";
import type { TranscriptLine } from "@/lib/types";

const NEAR_BOTTOM_PX = 48;

/**
 * Chat transcript that scrolls inside its own box.
 * - Never scrolls the page (we set scrollTop on the container, not scrollIntoView).
 * - Follows new lines only while you're at the bottom; scroll up to read and it stays put,
 *   showing a "New messages" button instead.
 */
export function Transcript({ lines, className = "" }: { lines: TranscriptLine[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [seenCount, setSeenCount] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [lines, atBottom]);

  const onScroll = () => {
    const el = box.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (near !== atBottom) {
      setAtBottom(near);
      if (!near) setSeenCount(lines.length);
    }
  };

  const jumpDown = () => {
    const el = box.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const hasUnseen = !atBottom && lines.length > seenCount;

  return (
    <div className={`relative flex min-h-0 flex-col ${className}`}>
      <div
        ref={box}
        onScroll={onScroll}
        className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6"
        aria-live="polite"
      >
        {lines.length === 0 && (
          <div className="m-auto max-w-xs text-center text-sm text-dim">
            <p className="font-display text-lg italic text-haze">Nothing said yet.</p>
            <p className="mt-1">Tap Ava to start. Your conversation will show up here.</p>
          </div>
        )}
        {lines.map((l) =>
          l.role === "ava" ? (
            <div key={l.id} className={`flex max-w-[88%] animate-rise items-end gap-2.5 ${l.final ? "" : "opacity-70"}`}>
              <FaceMark className="size-7" />
              <p className="rounded-2xl rounded-bl-md bg-raised px-4 py-2.5 text-[15px] leading-relaxed">{l.text}</p>
            </div>
          ) : (
            <div key={l.id} className={`flex max-w-[88%] animate-rise self-end ${l.final ? "" : "opacity-70"}`}>
              <p className="rounded-2xl rounded-br-md border border-apricot/25 bg-apricot/12 px-4 py-2.5 text-[15px] leading-relaxed">
                {l.text}
              </p>
            </div>
          ),
        )}
      </div>

      {hasUnseen && (
        <button
          onClick={jumpDown}
          className="btn btn-ghost absolute bottom-4 left-1/2 -translate-x-1/2 !py-1.5 text-xs shadow-lg shadow-black/40"
        >
          <Icon name="arrow-down" className="size-3.5" />
          New messages
        </button>
      )}
    </div>
  );
}
