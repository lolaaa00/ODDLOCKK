"use client";

import { useState } from "react";
import { FileWarning, Send } from "lucide-react";

const GROUNDS = [
  { value: "SOURCE_ERROR",            label: "Source Error" },
  { value: "DEADLINE_ERROR",          label: "Deadline Error" },
  { value: "TERMS_MISAPPLIED",        label: "Terms Misapplied" },
  { value: "CANCELLATION_RULE_ERROR", label: "Cancellation Rule Error" },
  { value: "POSTPONEMENT_RULE_ERROR", label: "Postponement Rule Error" },
  { value: "SOURCE_MANIPULATION",     label: "Source Manipulation" },
  { value: "AMBIGUOUS_TERMS",         label: "Ambiguous Terms" },
];

interface Props {
  wagerId: string;
  onSubmit?: (ground: string, explanation: string) => Promise<void>;
}

export function ObjectionSlip({ onSubmit }: Props) {
  const [ground, setGround] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!ground) { setError("Select a dispute ground"); return; }
    if (explanation.trim().length < 20) { setError("Provide a detailed explanation (min 20 chars)"); return; }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit?.(ground, explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded px-3 py-2 font-nunito text-base focus:outline-none transition-colors";
  const inputStyle = {
    border: "1px solid var(--glass-line)",
    background: "rgba(62,34,32,ALPHA)",
    color: "var(--ink-text)",
  };

  return (
    <div className="rounded p-5 space-y-4" style={{ border: "1px solid rgba(200,155,60,ALPHA)", background: "rgba(200,155,60,ALPHA)" }}>
      <div className="flex items-center gap-2">
        <FileWarning className="h-5 w-5" style={{ color: "var(--dispute-signal)" }} />
        <h3 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--dispute-signal)" }}>
          FILE OBJECTION
        </h3>
      </div>

      <div>
        <label className="block font-exo text-xs tracking-widest mb-1.5" style={{ color: "var(--dim-label)" }}>
          OBJECTION GROUND *
        </label>
        <select className={inputCls} style={inputStyle} value={ground} onChange={(e) => setGround(e.target.value)}>
          <option value="">Select ground…</option>
          {GROUNDS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block font-exo text-xs tracking-widest mb-1.5" style={{ color: "var(--dim-label)" }}>
          EXPLANATION *
        </label>
        <textarea
          className={`${inputCls} resize-none`}
          style={inputStyle}
          rows={4}
          placeholder="Explain precisely why the verdict is incorrect…"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      {error && <p className="font-nunito text-base" style={{ color: "var(--invalid-alert)" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded px-5 py-2.5 font-staatliches text-base tracking-widest transition-colors disabled:opacity-50"
        style={{ border: "1px solid rgba(200,155,60,ALPHA)", color: "var(--dispute-signal)", background: "transparent" }}
      >
        <Send className="h-4 w-4" />
        {submitting ? "FILING…" : "SUBMIT OBJECTION"}
      </button>

      <p className="font-exo text-sm text-center" style={{ color: "var(--dim-label)" }}>
        Objections trigger another GenLayer consensus round on the locked terms.
      </p>
    </div>
  );
}
