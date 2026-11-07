"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { TopBar } from "@/components/ui/TopBar";
import type { CandidateProfile, Report } from "@/lib/types";

const KIND_ICON: Record<string, IconName> = {
  article: "file-text",
  course: "graduation",
  video: "play",
  practice: "zap",
  book: "book",
};

const searchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

const verdict = (score: number) =>
  score >= 8.5 ? "Interview-ready." : score >= 7 ? "Strong showing." : score >= 5 ? "Solid base to build on." : "A good first rep.";

/** Full-page feedback after the interview. Scrolls as a normal page. */
export function Results({
  report,
  error,
  title,
  profile,
  onExit,
}: {
  report?: Report;
  error?: string;
  title: string;
  profile: Partial<CandidateProfile>;
  onExit: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar
        step={2}
        right={
          <button onClick={onExit} className="btn btn-primary">
            <Icon name="rotate" />
            New interview
          </button>
        }
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pt-4 pb-12 sm:px-6">
        {error && !report ? (
          <section className="panel flex flex-col items-center gap-4 p-10 text-center">
            <Icon name="alert" className="size-8 text-rose" />
            <h1 className="font-display text-3xl">We couldn&apos;t build your feedback</h1>
            <p className="max-w-md text-sm text-haze">{error}</p>
            <button onClick={onExit} className="btn btn-primary">Start a new interview</button>
          </section>
        ) : !report ? (
          <Skeleton />
        ) : (
          <>
            <section className="panel grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8">
              <ScoreRing score={report.overall_score} />
              <div className="text-center sm:text-left">
                <p className="text-sm text-haze">
                  {[title, profile.interviewType && profile.interviewType.replace("_", " ")].filter(Boolean).join(" · ")}
                </p>
                <h1 className="mt-1 font-display text-4xl leading-tight tracking-tight">{verdict(report.overall_score)}</h1>
                <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-haze">{report.summary}</p>
              </div>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <ListCard title="What went well" items={report.strengths} icon="check" tone="text-mint" />
              <ListCard title="To work on" items={report.improvements} icon="arrow-up-right" tone="text-amber" />
            </div>

            {report.question_feedback.length > 0 && (
              <section className="panel p-6">
                <h2 className="mb-4 font-display text-2xl">Question by question</h2>
                <ol className="flex flex-col">
                  {report.question_feedback.map((q, i) => (
                    <li key={i} className="flex gap-4 border-t border-edge py-3.5 first:border-0 first:pt-0">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-raised font-mono text-xs text-haze">{i + 1}</span>
                      <p className="text-sm leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {report.next_steps.length > 0 && (
              <section className="panel p-6">
                <h2 className="mb-4 font-display text-2xl">Next steps</h2>
                <ol className="flex flex-col gap-3">
                  {report.next_steps.map((n, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-apricot/15 text-xs font-semibold text-apricot">{i + 1}</span>
                      {n}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {report.resources?.length > 0 && (
              <section className="panel p-6">
                <h2 className="mb-4 font-display text-2xl">Resources</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {report.resources.map((r, i) => (
                    <li key={i}>
                      <a
                        href={searchUrl(r.search_query)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full gap-3 rounded-2xl border border-edge p-4 transition-colors hover:border-edge-strong hover:bg-raised"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lilac/12 text-lilac">
                          <Icon name={KIND_ICON[r.kind] ?? "link"} className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium">
                            {r.title}
                            <Icon name="external" className="size-3 text-dim transition-colors group-hover:text-haze" />
                          </span>
                          <span className="mt-0.5 block text-sm text-haze">
                            <span className="capitalize">{r.kind}</span> · {r.why}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex justify-center pt-2">
              <button onClick={onExit} className="btn btn-primary btn-lg">
                <Icon name="rotate" />
                Practice another interview
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  return (
    <div className="relative mx-auto size-36" role="img" aria-label={`Score ${score} out of 10`}>
      <svg viewBox="0 0 132 132" className="size-full -rotate-90">
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b7a4ff" />
            <stop offset="100%" stopColor="#ff9e6d" />
          </linearGradient>
        </defs>
        <circle cx="66" cy="66" r={r} fill="none" stroke="#201c27" strokeWidth="10" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="url(#score-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-5xl leading-none tabular-nums">{score}</p>
          <p className="mt-1 text-xs text-haze">out of 10</p>
        </div>
      </div>
    </div>
  );
}

function ListCard({ title, items, icon, tone }: { title: string; items: string[]; icon: IconName; tone: string }) {
  if (!items.length) return null;
  return (
    <section className="panel p-6">
      <h2 className="mb-4 font-display text-2xl">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((x, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
            <Icon name={icon} className={`mt-0.5 size-4 ${tone}`} />
            {x}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Scoring your interview">
      <section className="panel flex flex-col items-center gap-6 p-8 sm:flex-row">
        <div className="size-36 shrink-0 animate-pulse rounded-full bg-raised" />
        <div className="flex w-full flex-col gap-3">
          <p className="font-display text-3xl italic text-haze">Scoring your interview…</p>
          <div className="h-3 w-full animate-pulse rounded-full bg-raised" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-raised" />
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="panel flex flex-col gap-3 p-6">
            <div className="h-5 w-32 animate-pulse rounded-full bg-raised" />
            <div className="h-3 animate-pulse rounded-full bg-raised" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-raised" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
