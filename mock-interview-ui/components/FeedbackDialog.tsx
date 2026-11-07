"use client";

import { useEffect } from "react";
import type { Report } from "@/lib/types";

const KIND_ICON: Record<string, string> = {
  article: "📄",
  course: "🎓",
  video: "▶",
  practice: "⚡",
  book: "📘",
};

const searchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export function FeedbackDialog({
  report,
  error,
  onClose,
  onExit,
}: {
  report?: Report;
  error?: string;
  onClose: () => void;
  onExit: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const sections = report
    ? ([
        ["Strengths", report.strengths],
        ["To improve", report.improvements],
        ["Question feedback", report.question_feedback],
        ["Next steps", report.next_steps],
      ] as const)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-title"
        onClick={(e) => e.stopPropagation()}
        className="neon-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-cyan-400/30 px-5 py-4">
          <h2 id="fb-title" className="neon-title text-xl font-bold">Interview feedback</h2>
          <button onClick={onClose} aria-label="Close" className="neon-text text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {!report && !error && (
            <p className="neon-text animate-pulse py-8 text-center">Scoring your interview…</p>
          )}
          {error && <p className="text-pink-400">{error}</p>}

          {report && (
            <>
              <div className="flex items-center gap-5">
                <div className="neon-score">{report.overall_score}<span>/10</span></div>
                <p className="text-sm text-cyan-50/90">{report.summary}</p>
              </div>

              {sections.map(([title, items]) =>
                items.length ? (
                  <div key={title}>
                    <h3 className="mb-1.5 text-xs font-semibold tracking-widest text-fuchsia-300">{title.toUpperCase()}</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-cyan-50/90">
                      {items.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                ) : null,
              )}

              {report.resources?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold tracking-widest text-fuchsia-300">RESOURCES TO IMPROVE</h3>
                  <ul className="space-y-2">
                    {report.resources.map((r, i) => (
                      <li key={i}>
                        <a
                          href={searchUrl(r.search_query)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neon-link block rounded-xl border border-cyan-400/30 p-3 transition hover:border-cyan-300"
                        >
                          <span className="font-medium text-cyan-200">
                            {KIND_ICON[r.kind] ?? "🔗"} {r.title} <span className="text-xs opacity-60">↗</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-cyan-50/70">{r.why}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-cyan-400/30 px-5 py-3">
          <button onClick={onClose} className="neon-btn neon-btn-cyan text-sm">Close</button>
          <button onClick={onExit} className="neon-btn neon-btn-pink text-sm">Exit</button>
        </div>
      </div>
    </div>
  );
}
