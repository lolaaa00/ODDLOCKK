"use client";

import { useState, useCallback } from "react";
import { FileWarning, Send, Plus, Trash2 } from "lucide-react";

const GROUNDS = [
  { value: "SOURCE_ERROR",            label: "Source Error" },
  { value: "DEADLINE_ERROR",          label: "Deadline Error" },
  { value: "TERMS_MISAPPLIED",        label: "Terms Misapplied" },
  { value: "CANCELLATION_RULE_ERROR", label: "Cancellation Rule Error" },
  { value: "POSTPONEMENT_RULE_ERROR", label: "Postponement Rule Error" },
  { value: "SOURCE_MANIPULATION",     label: "Source Manipulation" },
  { value: "AMBIGUOUS_TERMS",         label: "Ambiguous Terms" },
];

type CounterEvidence = { sourceUrl: string; sourceTitle: string; finding: string };

interface Props {
  wagerId: string;
  onSubmit?: (ground: string, explanation: string, evidence?: CounterEvidence[]) => Promise<void>;
}

export function ObjectionSlip({ onSubmit }: Props) {
  const [ground, setGround] = useState("");
  const [explanation, setExplanation] = useState("");
  const [counterEvidence, setCounterEvidence] = useState<CounterEvidence[]>([
    { sourceUrl: "", sourceTitle: "", finding: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateEvidence = useCallback((index: number, field: keyof CounterEvidence, value: string) => {
    setCounterEvidence((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  const addEvidence = useCallback(() => {
    setCounterEvidence((prev) => [...prev, { sourceUrl: "", sourceTitle: "", finding: "" }]);
  }, []);

  const removeEvidence = useCallback((index: number) => {
    setCounterEvidence((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleSubmit() {
    if (!ground) { setError("Select a dispute ground"); return; }
    if (explanation.trim().length < 20) { setError("Provide a detailed explanation (min 20 chars)"); return; }
    const validEvidence = counterEvidence.filter((e) => e.finding.trim().length > 0);
    if (validEvidence.length === 0) { setError("Provide at least one counter-evidence finding"); return; }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit?.(ground, explanation, validEvidence);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded px-3 py-2 font-nunito text-base focus:outline-none transition-colors";
  const inputStyle = {
    border: "1px solid var(--glass-line)",
    background: "rgba(62,34,32,0.50)",
    color: "var(--ink-text)",
  };

  return (
    <div className="rounded p-5 space-y-4" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
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

      {/* Counter-evidence section */}
      <div>
        <label className="block font-exo text-xs tracking-widest mb-1.5" style={{ color: "var(--dim-label)" }}>
          COUNTER-EVIDENCE *
        </label>
        <p className="font-nunito text-sm mb-2" style={{ color: "var(--dim-label)" }}>
          Cite specific source findings that contradict the original verdict.
        </p>
        <div className="space-y-2">
          {counterEvidence.map((e, i) => (
            <div key={i} className="rounded p-3 space-y-2" style={{ border: "1px solid rgba(240,230,226,0.1)", background: "rgba(62,34,32,0.50)" }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Source title"
                  value={e.sourceTitle}
                  onChange={(ev) => updateEvidence(i, "sourceTitle", ev.target.value)}
                  className="rounded px-2 py-1 font-nunito text-sm focus:outline-none flex-1"
                  style={{ border: "1px solid var(--glass-line)", background: "transparent", color: "var(--ink-text)" }}
                />
                {counterEvidence.length > 1 && (
                  <button onClick={() => removeEvidence(i)} className="shrink-0 transition-colors" style={{ color: "var(--invalid-alert)" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="Source URL"
                value={e.sourceUrl}
                onChange={(ev) => updateEvidence(i, "sourceUrl", ev.target.value)}
                className="w-full rounded px-2 py-1 font-azeret text-sm focus:outline-none"
                style={{ border: "1px solid var(--glass-line)", background: "transparent", color: "var(--dim-label)" }}
              />
              <textarea
                placeholder="What does this source show that contradicts the verdict?"
                value={e.finding}
                onChange={(ev) => updateEvidence(i, "finding", ev.target.value)}
                rows={2}
                className="w-full rounded px-2 py-1.5 font-nunito text-sm focus:outline-none resize-none"
                style={{ border: "1px solid var(--glass-line)", background: "transparent", color: "var(--ink-text)" }}
              />
            </div>
          ))}
          {counterEvidence.length < 10 && (
            <button onClick={addEvidence} className="flex items-center gap-1.5 font-exo text-xs tracking-widest transition-colors" style={{ color: "var(--dim-label)" }}>
              <Plus className="h-3.5 w-3.5" /> ADD EVIDENCE
            </button>
          )}
        </div>
      </div>

      {error && <p className="font-nunito text-base" style={{ color: "var(--invalid-alert)" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded px-5 py-2.5 font-staatliches text-base tracking-widest transition-colors disabled:opacity-50"
        style={{ border: "1px solid rgba(200,155,60,0.25)", color: "var(--dispute-signal)", background: "transparent" }}
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
