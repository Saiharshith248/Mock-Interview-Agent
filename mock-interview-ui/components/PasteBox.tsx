"use client";

import { useState } from "react";
import { extractPdfText } from "@/lib/pdf";

export function PasteBox({
  title,
  placeholder,
  disabled,
  allowPdf,
  onSend,
}: {
  title: string;
  placeholder: string;
  disabled: boolean;
  allowPdf?: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  const send = (t: string) => {
    if (!t.trim()) return;
    onSend(t.trim());
    setSent(true);
  };

  const onFile = async (f?: File) => {
    if (!f) return;
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

  return (
    <section className="neon-card p-4">
      <h2 className="mb-2 text-sm font-semibold tracking-widest text-fuchsia-300">{title.toUpperCase()}</h2>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSent(false);
        }}
        placeholder={placeholder}
        rows={5}
        className="neon-input resize-y"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={() => send(text)}
          disabled={disabled || !text.trim()}
          className="neon-btn neon-btn-pink !px-4 !py-1.5 text-sm"
        >
          {sent ? "Sent ✓ (resend)" : "Send to Ava"}
        </button>
        {allowPdf && (
          <label
            className={`neon-btn neon-btn-cyan cursor-pointer !px-4 !py-1.5 text-sm ${
              disabled || busy ? "pointer-events-none opacity-40" : ""
            }`}
          >
            {busy ? "Reading PDF…" : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {disabled && <span className="text-xs text-cyan-100/40">Start the session first</span>}
      </div>
      {err && <p className="mt-2 text-xs text-pink-400">{err}</p>}
    </section>
  );
}
