import { FaceMark } from "@/components/Orb";
import { Icon } from "@/components/ui/Icon";

/** App header: brand, two-step progress, and the setup tip. */
export function TopBar({ step, right }: { step: 1 | 2; right?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <FaceMark className="size-7" />
        <span className="font-display text-xl tracking-tight">Mock Interview</span>
      </div>

      <ol className="flex items-center gap-2.5 text-sm text-haze" aria-label="Progress">
        <Step n={1} label="Setup" state={step === 1 ? "on" : "done"} />
        <li aria-hidden className="h-px w-6 bg-edge-strong" />
        <Step n={2} label="Interview" state={step === 2 ? "on" : "todo"} />
      </ol>

      {right ?? (
        <p className="hidden items-center gap-2 text-sm text-haze md:flex">
          <Icon name="headphones" />
          Chrome + headphones work best
        </p>
      )}
    </header>
  );
}

function Step({ n, label, state }: { n: number; label: string; state: "on" | "done" | "todo" }) {
  return (
    <li className={`flex items-center gap-2 ${state === "on" ? "font-medium text-cream" : ""}`} aria-current={state === "on" ? "step" : undefined}>
      <span
        className={`grid size-5 place-items-center rounded-full text-[11px] font-semibold ${
          state === "on" ? "bg-cream text-night" : state === "done" ? "bg-mint text-night" : "bg-raised text-dim"
        }`}
      >
        {state === "done" ? <Icon name="check" className="size-3" /> : n}
      </span>
      {label}
    </li>
  );
}
