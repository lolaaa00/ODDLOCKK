"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sha256Hex, generateId } from "@/lib/utils";
import { checkBlockedContent, isVague } from "@/lib/validation/wager";
import { saveDraft } from "@/lib/storage/drafts";
import { validateTerms } from "@/utils/oddlockArgs";
import type { WagerTerms } from "@/types/wager";

const STEP_LABELS = ["EVENT", "SIDES", "SOURCES", "RULES", "TERMS", "CONFIRM"];

const CATEGORY_OPTIONS = [
  { value: "SPORTS",      label: "Sports Result" },
  { value: "GAME",        label: "Game Result" },
  { value: "AWARD",       label: "Public Award" },
  { value: "LAUNCH_DATE", label: "Launch Date" },
  { value: "WEATHER",     label: "Weather Threshold" },
  { value: "PUBLIC_VOTE", label: "Public Vote/Result" },
  { value: "ON_CHAIN",    label: "On-Chain Milestone" },
  { value: "CEREMONY",    label: "Public Ceremony" },
  { value: "OTHER",       label: "Other (Low-risk)" },
];

const TZ_OPTIONS = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago",
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney",
];

export interface FormState {
  title: string; category: string; question: string; counterparty: string;
  stakeAmount: string; creatorSide: string; counterpartySide: string;
  eventDeadlineDate: string; eventDeadlineTime: string; timezone: string;
  settlementHoursAfter: string; primarySource: string; fallbackSource: string;
  conflictRule: string; cancellationRule: string; postponementRule: string;
  invalidIf: string; resolvesForCreatorIf: string; resolvesForCounterpartyIf: string;
  disputeWindowHours: string;
}

const EMPTY: FormState = {
  title: "", category: "SPORTS", question: "", counterparty: "", stakeAmount: "100",
  creatorSide: "", counterpartySide: "",
  eventDeadlineDate: "", eventDeadlineTime: "18:00", timezone: "UTC",
  settlementHoursAfter: "2",
  primarySource: "", fallbackSource: "",
  conflictRule: "Primary source takes precedence unless unavailable.",
  cancellationRule: "If event is cancelled, capsule is refunded to both parties.",
  postponementRule: "If event is postponed beyond deadline, capsule is refunded.",
  invalidIf: "If the question cannot be determined by trusted sources.",
  resolvesForCreatorIf: "", resolvesForCounterpartyIf: "",
  disputeWindowHours: "24",
};

export interface WagerWizardProps {
  /** Pre-fill fields when editing an existing draft */
  initialValues?: Partial<FormState>;
  /** The draftId to overwrite (edit mode) — if absent, creates a new draft */
  editDraftId?: string;
}

export function WagerCreateWizard({ initialValues, editDraftId }: WagerWizardProps = {}) {
  const isEditMode = !!editDraftId;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState("");
  const router = useRouter();

  // suppress unused import warning from sha256Hex
  void sha256Hex;

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (s === 0) {
      if (!form.title.trim()) errs.title = "Title required";
      if (!form.question || form.question.length < 10) errs.question = "Question must be at least 10 characters";
      if (!form.eventDeadlineDate) errs.eventDeadlineDate = "Deadline date required";
      if (!form.counterparty.match(/^0x[a-fA-F0-9]{40}$/)) errs.counterparty = "Invalid Ethereum address";
      if (!form.stakeAmount || isNaN(Number(form.stakeAmount)) || Number(form.stakeAmount) <= 0) errs.stakeAmount = "Enter a valid stake amount";
      const blockedQ = checkBlockedContent(form.question + " " + form.title);
      if (blockedQ) errs.question = blockedQ;
    }
    if (s === 1) {
      if (!form.creatorSide.trim()) errs.creatorSide = "Creator side required";
      if (!form.counterpartySide.trim()) errs.counterpartySide = "Counterparty side required";
      if (!form.resolvesForCreatorIf.trim()) errs.resolvesForCreatorIf = "Creator win condition required";
      if (!form.resolvesForCounterpartyIf.trim()) errs.resolvesForCounterpartyIf = "Counterparty win condition required";
    }
    if (s === 2) {
      if (!form.primarySource.match(/^https?:\/\//)) errs.primarySource = "Must be a valid URL (https://…)";
      if (!form.fallbackSource.match(/^https?:\/\//)) errs.fallbackSource = "Must be a valid URL (https://…)";
    }
    if (s === 3) {
      if (!form.conflictRule.trim()) errs.conflictRule = "Conflict rule required";
      if (!form.cancellationRule.trim()) errs.cancellationRule = "Cancellation rule required";
      if (!form.postponementRule.trim()) errs.postponementRule = "Postponement rule required";
      if (!form.invalidIf.trim()) errs.invalidIf = "Invalid condition required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validateStep(step)) setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    if (!validateStep(step)) return;
    setSubmitting(true);
    setTxError("");

    const deadlineMs = new Date(`${form.eventDeadlineDate}T${form.eventDeadlineTime}:00`).getTime();
    const settlementOpensAt = deadlineMs + Number(form.settlementHoursAfter) * 3600000;

    const terms: WagerTerms = {
      question: form.question,
      resolvesForCreatorIf: form.resolvesForCreatorIf,
      resolvesForCounterpartyIf: form.resolvesForCounterpartyIf,
      invalidIf: form.invalidIf,
      eventDeadline: deadlineMs,
      settlementOpensAt,
      timezone: form.timezone,
      primarySource: form.primarySource,
      fallbackSource: form.fallbackSource,
      conflictRule: form.conflictRule,
      cancellationRule: form.cancellationRule,
      postponementRule: form.postponementRule,
      disputeWindowHours: Number(form.disputeWindowHours),
    };

    // Validate terms before saving
    const termsValidation = validateTerms(terms);
    if (termsValidation) {
      setTxError(termsValidation);
      setSubmitting(false);
      return;
    }

    // Save draft locally — publishing happens on the draft detail page
    const draftId = editDraftId ?? generateId();
    saveDraft(draftId, form.title, terms, {
      counterparty: form.counterparty,
      stakeAmount: form.stakeAmount,
      status: "DRAFT_LOCAL",
    });

    setSubmitting(false);
    router.push(`/app/wagers/${draftId}`);
  }

  const vague = step === 0 && form.question ? isVague(form.question) : false;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress rail */}
      <div className="flex items-center gap-1 mb-6">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div
              className="h-0.5 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? "var(--bio-glow)" : "rgba(200,155,60,0.20)" }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-8">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className="font-exo text-sm tracking-widest"
            style={{ color: i === step ? "var(--bio-glow)" : "var(--dim-label)" }}
          >
            {label}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <Step0 form={form} set={set} errors={errors} vague={vague} />}
          {step === 1 && <Step1 form={form} set={set} errors={errors} />}
          {step === 2 && <Step2 form={form} set={set} errors={errors} />}
          {step === 3 && <Step3 form={form} set={set} errors={errors} />}
          {step === 4 && <Step4 form={form} set={set} errors={errors} />}
          {step === 5 && <Step5 form={form} />}
        </motion.div>
      </AnimatePresence>

      {/* Validation error */}
      {txError && (
        <div className="mt-4 rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.30)", background: "rgba(226,112,112,0.06)" }}>
          <span className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            onClick={back}
            className="flex items-center gap-2 rounded px-5 py-2.5 font-exo text-xs tracking-wider transition-colors"
            style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            BACK
          </button>
        )}
        <div className="flex-1" />
        {step < STEP_LABELS.length - 1 ? (
          <button
            onClick={next}
            className="btn-tribunal flex items-center gap-2 rounded px-6 py-2.5 font-staatliches text-base tracking-widest hover:opacity-90 transition-opacity"
          >
            NEXT
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-tribunal flex items-center gap-2 rounded px-8 py-2.5 font-staatliches text-base tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "SAVING…" : isEditMode ? "UPDATE DRAFT" : "SAVE CAPSULE DRAFT"}
          </button>
        )}
      </div>

      <p className="mt-4 font-exo text-xs text-center leading-relaxed" style={{ color: "rgba(138,118,109,0.35)" }}>
        Studionet/testnet only. Not real-money gambling. No real value involved.
      </p>
    </div>
  );
}

/* ── Shared components ── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-exo text-sm tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>{label}</label>
      {children}
      {error && <p className="mt-1 font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  border: "1px solid rgba(203,194,192,0.18)",
  background: "rgba(62,34,32,0.55)",
  color: "var(--ink-text)",
};
const inputCls = "w-full rounded px-3 py-2.5 font-nunito text-base focus:outline-none transition-colors placeholder-[rgba(168,152,144,0.55)]";

function Step0({ form, set, errors, vague }: { form: FormState; set: (k: keyof FormState, v: string) => void; errors: Partial<Record<keyof FormState, string>>; vague: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>DEFINE THE EVENT</h2>
      <Field label="CAPSULE TITLE *" error={errors.title}>
        <input className={inputCls} style={inputStyle} placeholder="e.g. Premier League match result" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="CATEGORY *">
        <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="RESOLUTION QUESTION *" error={errors.question}>
        <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={3} placeholder="What is the precise question? Be specific." value={form.question} onChange={(e) => set("question", e.target.value)} />
        {vague && (
          <div className="mt-1.5 flex items-start gap-2 rounded px-3 py-2" style={{ border: "1px solid rgba(240,230,226,0.18)", background: "rgba(200,155,60,0.06)" }}>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--dispute-signal)" }} />
            <p className="font-nunito text-sm" style={{ color: "var(--dispute-signal)" }}>This question may be hard to settle. Add precise source rules before locking.</p>
          </div>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="DEADLINE DATE *" error={errors.eventDeadlineDate}>
          <input type="date" className={inputCls} style={inputStyle} value={form.eventDeadlineDate} onChange={(e) => set("eventDeadlineDate", e.target.value)} />
        </Field>
        <Field label="DEADLINE TIME">
          <input type="time" className={inputCls} style={inputStyle} value={form.eventDeadlineTime} onChange={(e) => set("eventDeadlineTime", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="TIMEZONE">
          <select className={inputCls} style={inputStyle} value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
            {TZ_OPTIONS.map((tz) => <option key={tz}>{tz}</option>)}
          </select>
        </Field>
        <Field label="SETTLEMENT OPENS (hours after)">
          <input type="number" className={inputCls} style={inputStyle} min="1" max="168" value={form.settlementHoursAfter} onChange={(e) => set("settlementHoursAfter", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="COUNTERPARTY ADDRESS *" error={errors.counterparty}>
          <input className={inputCls} style={inputStyle} placeholder="0x…" value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} />
        </Field>
        <Field label="STAKE AMOUNT (GEN) *" error={errors.stakeAmount}>
          <input type="number" className={inputCls} style={inputStyle} min="1" value={form.stakeAmount} onChange={(e) => set("stakeAmount", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Step1({ form, set, errors }: { form: FormState; set: (k: keyof FormState, v: string) => void; errors: Partial<Record<keyof FormState, string>> }) {
  return (
    <div className="space-y-4">
      <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>SEAL BOTH POSITIONS</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded p-4" style={{ border: "1px solid rgba(240,230,226,0.18)", background: "rgba(200,155,60,0.06)" }}>
          <div className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>POSITION A (YOURS)</div>
          <Field label="SIDE STATEMENT *" error={errors.creatorSide}>
            <input className={inputCls} style={inputStyle} placeholder="e.g. Team A wins" value={form.creatorSide} onChange={(e) => set("creatorSide", e.target.value)} />
          </Field>
          <Field label="YOU WIN IF *" error={errors.resolvesForCreatorIf}>
            <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={2} placeholder="Exact win condition" value={form.resolvesForCreatorIf} onChange={(e) => set("resolvesForCreatorIf", e.target.value)} />
          </Field>
        </div>
        <div className="space-y-3 rounded p-4" style={{ border: "1px solid rgba(122,158,111,0.35)", background: "rgba(122,158,111,0.35)" }}>
          <div className="font-exo text-xs tracking-widest" style={{ color: "var(--canopy)" }}>POSITION B (COUNTERPARTY)</div>
          <Field label="SIDE STATEMENT *" error={errors.counterpartySide}>
            <input className={inputCls} style={inputStyle} placeholder="e.g. Team B wins or Draw" value={form.counterpartySide} onChange={(e) => set("counterpartySide", e.target.value)} />
          </Field>
          <Field label="COUNTERPARTY WINS IF *" error={errors.resolvesForCounterpartyIf}>
            <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={2} placeholder="Exact win condition" value={form.resolvesForCounterpartyIf} onChange={(e) => set("resolvesForCounterpartyIf", e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step2({ form, set, errors }: { form: FormState; set: (k: keyof FormState, v: string) => void; errors: Partial<Record<keyof FormState, string>> }) {
  return (
    <div className="space-y-4">
      <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>BUILD EVIDENCE CHAIN</h2>
      <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>GenLayer will check these sources when settling. Define them precisely before locking.</p>
      <Field label="PRIMARY SOURCE URL *" error={errors.primarySource}>
        <input className={inputCls} style={inputStyle} placeholder="https://official-source.com/results/…" value={form.primarySource} onChange={(e) => set("primarySource", e.target.value)} />
      </Field>
      <Field label="FALLBACK SOURCE URL *" error={errors.fallbackSource}>
        <input className={inputCls} style={inputStyle} placeholder="https://reliable-backup.com/…" value={form.fallbackSource} onChange={(e) => set("fallbackSource", e.target.value)} />
      </Field>
      <div className="rounded p-4 space-y-2" style={{ border: "1px solid var(--glass-line)", background: "rgba(200,155,60,0.20)" }}>
        <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>EVIDENCE CHAIN PREVIEW</div>
        <div className="font-azeret text-sm" style={{ color: "var(--dim-label)" }}>PRIMARY → {form.primarySource || "(not set)"}</div>
        <div className="h-px" style={{ background: "var(--glass-line)" }} />
        <div className="font-azeret text-sm" style={{ color: "rgba(138,118,109,0.35)" }}>FALLBACK → {form.fallbackSource || "(not set)"}</div>
      </div>
    </div>
  );
}

function Step3({ form, set, errors }: { form: FormState; set: (k: keyof FormState, v: string) => void; errors: Partial<Record<keyof FormState, string>> }) {
  return (
    <div className="space-y-4">
      <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>LOCK THE RULES</h2>
      <Field label="CONFLICT RULE *" error={errors.conflictRule}>
        <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={2} value={form.conflictRule} onChange={(e) => set("conflictRule", e.target.value)} />
      </Field>
      <Field label="CANCELLATION RULE *" error={errors.cancellationRule}>
        <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={2} value={form.cancellationRule} onChange={(e) => set("cancellationRule", e.target.value)} />
      </Field>
      <Field label="POSTPONEMENT RULE *" error={errors.postponementRule}>
        <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={2} value={form.postponementRule} onChange={(e) => set("postponementRule", e.target.value)} />
      </Field>
      <Field label="INVALID CONDITION *" error={errors.invalidIf}>
        <textarea className={cn(inputCls, "resize-none")} style={inputStyle} rows={2} value={form.invalidIf} onChange={(e) => set("invalidIf", e.target.value)} />
      </Field>
    </div>
  );
}

function Step4({ form, set, errors }: { form: FormState; set: (k: keyof FormState, v: string) => void; errors: Partial<Record<keyof FormState, string>> }) {
  return (
    <div className="space-y-4">
      <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>OBJECTION TERMS</h2>
      <Field label="OBJECTION WINDOW (hours after settlement)" error={errors.disputeWindowHours}>
        <input type="number" className={inputCls} style={inputStyle} min="1" max="168" value={form.disputeWindowHours} onChange={(e) => set("disputeWindowHours", e.target.value)} />
      </Field>
      <div className="rounded p-4 space-y-2" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
        <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>ALLOWED OBJECTION GROUNDS</div>
        {["SOURCE_ERROR", "DEADLINE_ERROR", "TERMS_MISAPPLIED", "CANCELLATION_RULE_ERROR", "POSTPONEMENT_RULE_ERROR", "SOURCE_MANIPULATION", "AMBIGUOUS_TERMS"].map((g) => (
          <div key={g} className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" style={{ color: "var(--canopy)" }} />
            <span className="font-azeret text-sm" style={{ color: "var(--dim-label)" }}>{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step5({ form }: { form: FormState }) {
  return (
    <div className="space-y-4">
      <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--dim-label)" }}>CONFIRM & SEAL</h2>
      <div className="space-y-3 rounded p-5" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
        <Row label="TITLE"              value={form.title} />
        <Row label="QUESTION"          value={form.question} />
        <Row label="POSITION A"        value={form.creatorSide} />
        <Row label="POSITION B"        value={form.counterpartySide} />
        <Row label="STAKE"             value={`${form.stakeAmount} GEN`} />
        <Row label="COUNTERPARTY"      value={form.counterparty} mono />
        <Row label="DEADLINE"          value={`${form.eventDeadlineDate} ${form.eventDeadlineTime} ${form.timezone}`} />
        <Row label="PRIMARY SOURCE"    value={form.primarySource} mono />
        <Row label="FALLBACK SOURCE"   value={form.fallbackSource} mono />
        <Row label="OBJECTION WINDOW"  value={`${form.disputeWindowHours}h`} />
      </div>
      <div className="rounded p-4" style={{ border: "1px solid rgba(240,230,226,0.18)", background: "rgba(200,155,60,0.06)" }}>
        <p className="font-nunito text-sm leading-relaxed" style={{ color: "var(--dim-label)" }}>
          This saves your capsule as a local draft. You can review it and then publish it to
          GenLayer Studionet from the draft detail page. All stakes are GEN on Studionet and have no real monetary value.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="font-exo text-sm tracking-widest min-w-[110px] mt-0.5" style={{ color: "var(--dim-label)" }}>{label}</span>
      <span className={cn("text-xs break-all", mono ? "font-azeret" : "font-nunito")} style={{ color: "var(--ink-text)" }}>
        {value || "N/A"}
      </span>
    </div>
  );
}
