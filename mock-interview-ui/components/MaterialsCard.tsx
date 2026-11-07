"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { extractPdfText } from "@/lib/pdf";
import type { PastedKind } from "@/lib/types";

type Tab = { kind: PastedKind; label: string; hint: string; placeholder: string; pdf?: boolean; required?: boolean };

const TABS: Tab[] = [
  {
    kind: "JOB_DESCRIPTION",
    label: "Job description",
    hint: "Paste the full posting. Ava builds your questions from it.",
    placeholder: "Paste the job description here…",
    required: true,
  },
  {
    kind: "RESUME",
    label: "Resume",
    hint: "Optional. Helps Ava ask about your real experience.",
    placeholder: "Paste your resume, or drop a PDF below…",
    pdf: true,
  },
];

/** Job description + resume in one tabbed card. Both panes stay mounted so text survives tab switches. */
export function MaterialsCard({ disabled, onSend }: { disabled: boolean; onSend: (kind: PastedKind, text: string) => void }) {
  const [active, setActive] = useState<PastedKind>("JOB_DESCRIPTION");
  const [sent, setSent] = useState<Partial<Record<PastedKind, boolean>>>({});

  return (
    <section className="panel p-5 sm:p-6">
      <div role="tablist" aria-label="Materials" className="mb-4 flex gap-1 rounded-2xl bg-night p-1">
        {TABS.map((t) => (
          <button
            key={t.kind}
            role="tab"
            id={`tab-${t.kind}`}
            aria-selected={active === t.kind}
            aria-controls={`pane-${t.kind}`}
            onClick={() => setActive(t.kind)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-2 text-sm font-medium transition-colors ${
              active === t.kind ? "bg-raised text-cream shadow-sm" : "text-haze hover:text-cream"
            }`}
          >
            {t.label}
            {sent[t.kind] ? (
              <Icon name="check" className="size-3.5 text-mint" />
            ) : t.required ? (
              <span className="rounded-full bg-apricot/15 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-apricot">Req</span>
            ) : null}
          </button>
        ))}
      </div>

      {TABS.map((t) => (
        <Pane
          key={t.kind}
          tab={t}
          hidden={active !== t.kind}
          disabled={disabled}
          sent={!!sent[t.kind]}
          onSend={(text) => {
            onSend(t.kind, text);
            setSent((s) => ({ ...s, [t.kind]: true }));
          }}
          onEdit={() => setSent((s) => ({ ...s, [t.kind]: false }))}
        />
      ))}
    </section>
  );
}

function Pane({
  tab,
  hidden,
  disabled,
  sent,
  onSend,
  onEdit,
}: {
  tab: Tab;
  hidden: boolean;
  disabled: boolean;
  sent: boolean;
  onSend: (text: string) => void;
  onEdit: () => void;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const send = (t: string) => {
    if (t.trim()) onSend(t.trim());
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.type !== "application/pdf") return setErr("Only PDF files are supported.");
    setErr(undefined);
    setBusy(true);
    try {
      const t = await extractPdfText(f);
      if (!t) throw new Error("No text found (scanned PDF?). Try pasting instead.");
      setText(t);
      send(t);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read PDF.");
    } finally {
      setBusy(false);
    }
  };

  const inputId = `text-${tab.kind}`;

  return (
    <div role="tabpanel" id={`pane-${tab.kind}`} aria-labelledby={`tab-${tab.kind}`} hidden={hidden}>
      <label htmlFor={inputId} className="mb-2 block text-sm text-haze">
        {tab.hint}
      </label>
      <textarea
        id={inputId}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (sent) onEdit();
        }}
        placeholder={tab.placeholder}
        rows={6}
        className="field-input scroll-thin max-h-72 min-h-36 resize-y"
      />

      {tab.pdf && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled && !busy) void onFile(e.dataTransfer.files?.[0]);
          }}
          className={`mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm transition-colors ${
            dragging ? "border-lilac bg-lilac/10" : "border-edge-strong hover:border-haze"
          } ${disabled || busy ? "pointer-events-none opacity-50" : ""}`}
        >
          <Icon name={busy ? "loader" : "upload"} className={`size-5 text-lilac ${busy ? "animate-spin" : ""}`} />
          <span className="text-haze">
            <span className="font-medium text-cream">{busy ? "Reading PDF…" : "Drop a PDF"}</span>
            {busy ? "" : " or click to upload. It's read in your browser."}
          </span>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-dim">
          {disabled ? "Start talking to Ava first, then send this." : text ? `${text.length.toLocaleString()} characters` : ""}
        </span>
        {sent ? (
          <button onClick={() => send(text)} disabled={disabled || !text.trim()} className="btn btn-ghost">
            <Icon name="check" className="size-4 text-mint" />
            Sent · resend
          </button>
        ) : (
          <button onClick={() => send(text)} disabled={disabled || !text.trim()} className="btn btn-primary">
            Send to Ava
          </button>
        )}
      </div>
      {err && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose">
          <Icon name="alert" className="size-3.5" />
          {err}
        </p>
      )}
    </div>
  );
}
