import type { CandidateProfile } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System design",
  mixed: "Mixed",
};

function Row({ label, value, required }: { label: string; value?: string; required?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cyan-400/15 py-2 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-cyan-100/60">
        {label}
        {required ? <span className="text-red-500"> *</span> : <span className="normal-case"> (optional)</span>}
      </dt>
      {/* key={value} remounts on change so the highlight animation replays */}
      <dd
        key={value ?? "empty"}
        className={
          value
            ? "animate-[flash_1.2s_ease-out] rounded px-1 text-sm font-medium text-white [text-shadow:0_0_8px_rgba(34,230,255,0.8)]"
            : "text-sm text-cyan-100/25"
        }
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`neon-chip ${ok ? "neon-chip-ok" : ""}`}>
      {ok ? "✓ " : ""}
      {children}
    </span>
  );
}

export function ProfileCard({ profile }: { profile: Partial<CandidateProfile> }) {
  const exp =
    profile.experienceYears !== undefined
      ? `${profile.experienceYears} yr${profile.experienceYears === 1 ? "" : "s"}`
      : undefined;
  return (
    <section className="neon-card p-4">
      <h2 className="mb-2 text-sm font-semibold tracking-widest text-fuchsia-300">CANDIDATE PROFILE</h2>
      <dl>
        <Row label="Target role" required value={profile.targetRole} />
        <Row label="Company" value={profile.company} />
        <Row
          label="Interview type"
          value={profile.interviewType && TYPE_LABEL[profile.interviewType]}
        />
        <Row
          label="Duration"
          value={profile.durationMinutes ? `${profile.durationMinutes} min` : undefined}
        />
        <Row label="Experience" value={exp} />
        <Row label="Experience type" value={profile.experienceType} />
      </dl>
      <div className="mt-3 flex gap-2">
        <Badge ok={!!profile.jobDescription}>Job description *</Badge>
        <Badge ok={!!profile.resumeText}>Resume (optional)</Badge>
      </div>
    </section>
  );
}
