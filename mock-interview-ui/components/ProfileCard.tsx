import { Icon } from "@/components/ui/Icon";
import type { CandidateProfile } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System design",
  mixed: "Mixed",
};

function Row({ label, value, required }: { label: string; value?: string; required?: boolean }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 border-t border-edge py-2.5 first:border-0">
      <dt className="text-sm text-haze">{label}</dt>
      {/* key={value} remounts on change so the highlight animation replays */}
      <dd
        key={value ?? "empty"}
        className={`min-w-0 rounded-md px-1.5 py-0.5 text-sm [overflow-wrap:anywhere] ${
          value ? "animate-flash font-medium text-cream" : "text-dim"
        }`}
      >
        {value ?? (required ? "Needed" : "Optional")}
      </dd>
      <span className="w-4">{value && <Icon name="check" className="size-4 text-mint" />}</span>
    </div>
  );
}

/** What Ava has captured so far, plus progress on the two required items. */
export function ProfileCard({ profile }: { profile: Partial<CandidateProfile> }) {
  const exp =
    profile.experienceYears !== undefined
      ? `${profile.experienceYears} yr${profile.experienceYears === 1 ? "" : "s"}${profile.experienceType ? ` · ${profile.experienceType}` : ""}`
      : profile.experienceType;
  const done = [profile.targetRole, profile.jobDescription].filter(Boolean).length;

  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl leading-none">Your interview</h2>
        <span className={`chip ${done === 2 ? "!border-mint/30 !bg-mint/10 !text-mint" : ""}`}>
          {done === 2 && <Icon name="check" className="size-3" />}
          {done} of 2 required
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-lilac to-apricot transition-[width] duration-500"
          style={{ width: `${done * 50}%` }}
        />
      </div>
      <dl>
        <Row label="Target role" required value={profile.targetRole} />
        <Row label="Job description" required value={profile.jobDescription ? "Received" : undefined} />
        <Row label="Company" value={profile.company} />
        <Row label="Interview type" value={profile.interviewType && TYPE_LABEL[profile.interviewType]} />
        <Row label="Duration" value={profile.durationMinutes ? `${profile.durationMinutes} min` : undefined} />
        <Row label="Experience" value={exp} />
        <Row label="Resume" value={profile.resumeText ? "Received" : undefined} />
      </dl>
    </section>
  );
}
