/**
 * Two standing neon characters for the interview stage. `active` switches on the
 * "talking" animation (mouth, head bob, arm gestures, stronger glow).
 */

function Mouth({ y }: { y: number }) {
  return (
    <g className="ch-mouth">
      {[-16, -8, 0, 8, 16].map((dx, i) => (
        <rect key={i} x={100 + dx - 2.5} y={y - 3} width={5} height={6} rx={2.5} className="ch-bar" style={{ animationDelay: `${i * 0.09}s` }} />
      ))}
    </g>
  );
}

/** Blip, the robot interviewer (left). */
export function BlipCharacter({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 200 340" className={`ch ch-blip ${active ? "ch-active" : ""}`} aria-hidden>
      <ellipse cx="100" cy="330" rx="62" ry="8" className="ch-floor" />
      <g className="ch-body">
        <g className="ch-head">
          <line x1="100" y1="20" x2="100" y2="45" />
          <circle cx="100" cy="14" r="6" className="ch-antenna" />
          <rect x="50" y="45" width="100" height="80" rx="22" className="ch-fill" />
          <circle cx="78" cy="80" r="9" className="ch-eye" />
          <circle cx="122" cy="80" r="9" className="ch-eye" />
          <Mouth y={106} />
        </g>
        <line x1="100" y1="125" x2="100" y2="140" />
        <rect x="65" y="140" width="70" height="100" rx="16" className="ch-fill" />
        <circle cx="100" cy="178" r="8" className="ch-core" />
        <g className="ch-arm-l"><line x1="65" y1="158" x2="34" y2="218" /><circle cx="34" cy="220" r="6" /></g>
        <g className="ch-arm-r"><line x1="135" y1="158" x2="166" y2="218" /><circle cx="166" cy="220" r="6" /></g>
        <line x1="86" y1="240" x2="86" y2="314" /><line x1="114" y1="240" x2="114" y2="314" />
        <line x1="70" y1="316" x2="96" y2="316" /><line x1="104" y1="316" x2="130" y2="316" />
      </g>
    </svg>
  );
}

/** The candidate (right): a friendly human figure. */
export function YouCharacter({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 200 340" className={`ch ch-you ${active ? "ch-active" : ""}`} aria-hidden>
      <ellipse cx="100" cy="330" rx="62" ry="8" className="ch-floor" />
      <g className="ch-body">
        <g className="ch-head">
          <circle cx="100" cy="82" r="38" className="ch-fill" />
          <path d="M62 78 C62 40 138 40 138 78 C128 62 112 56 100 56 C88 56 72 62 62 78 Z" className="ch-hair" />
          <circle cx="86" cy="84" r="5" className="ch-eye" />
          <circle cx="114" cy="84" r="5" className="ch-eye" />
          <Mouth y={104} />
        </g>
        <line x1="100" y1="120" x2="100" y2="138" />
        <path d="M66 150 Q66 138 82 138 L118 138 Q134 138 134 150 L134 238 L66 238 Z" className="ch-fill" />
        <g className="ch-arm-l"><line x1="68" y1="152" x2="38" y2="222" /><circle cx="37" cy="225" r="6" /></g>
        <g className="ch-arm-r"><line x1="132" y1="152" x2="162" y2="222" /><circle cx="163" cy="225" r="6" /></g>
        <line x1="86" y1="238" x2="86" y2="314" /><line x1="114" y1="238" x2="114" y2="314" />
        <line x1="72" y1="316" x2="96" y2="316" /><line x1="104" y1="316" x2="128" y2="316" />
      </g>
    </svg>
  );
}
