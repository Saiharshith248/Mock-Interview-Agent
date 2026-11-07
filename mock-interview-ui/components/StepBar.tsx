const STEPS = ["Setup", "Interview", "Feedback"];

/** Top progress tracker. `current` is 1-based; earlier steps show as done. */
export function StepBar({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progress" className="mx-auto flex w-full max-w-md items-center justify-center">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={active ? "step" : undefined}
                className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-bold transition ${
                  active
                    ? "neon-step-active border-pink-400 text-white"
                    : done
                      ? "border-emerald-300 text-emerald-300 [text-shadow:0_0_8px_rgba(61,255,160,0.8)] shadow-[0_0_10px_rgba(61,255,160,0.4)]"
                      : "border-cyan-200/25 text-cyan-100/35"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`text-[11px] tracking-[0.2em] ${
                  active ? "text-pink-200" : done ? "text-emerald-300/80" : "text-cyan-100/35"
                }`}
              >
                {label.toUpperCase()}
              </span>
            </div>
            {n < STEPS.length && (
              <span
                className={`mx-3 mb-5 h-px w-10 sm:w-16 ${done ? "bg-emerald-300/70 shadow-[0_0_6px_rgba(61,255,160,0.6)]" : "bg-cyan-200/20"}`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
