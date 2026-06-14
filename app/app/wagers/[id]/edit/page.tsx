"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getDrafts } from "@/lib/storage/drafts";
import { WagerCreateWizard } from "@/components/wagers/WagerCreateWizard";
import type { FormState } from "@/components/wagers/WagerCreateWizard";
import type { LocalDraft } from "@/types/wager";

/**
 * Convert a saved LocalDraft back into the wizard FormState.
 */
function draftToForm(draft: LocalDraft): Partial<FormState> {
  const t = draft.terms;
  // Parse deadline back into date + time strings
  let eventDeadlineDate = "";
  let eventDeadlineTime = "18:00";
  if (t.eventDeadline) {
    const d = new Date(t.eventDeadline);
    eventDeadlineDate = d.toISOString().slice(0, 10);
    eventDeadlineTime = d.toTimeString().slice(0, 5);
  }

  // Calculate settlementHoursAfter from the diff
  let settlementHoursAfter = "2";
  if (t.settlementOpensAt && t.eventDeadline) {
    const diffMs = t.settlementOpensAt - t.eventDeadline;
    if (diffMs > 0) {
      settlementHoursAfter = String(Math.round(diffMs / 3600000));
    }
  }

  return {
    title: draft.title || "",
    question: t.question || "",
    counterparty: draft.counterparty || "",
    stakeAmount: draft.stakeAmount || "100",
    creatorSide: "",
    counterpartySide: "",
    resolvesForCreatorIf: t.resolvesForCreatorIf || "",
    resolvesForCounterpartyIf: t.resolvesForCounterpartyIf || "",
    invalidIf: t.invalidIf || "",
    eventDeadlineDate,
    eventDeadlineTime,
    timezone: t.timezone || "UTC",
    settlementHoursAfter,
    primarySource: t.primarySource || "",
    fallbackSource: t.fallbackSource || "",
    conflictRule: t.conflictRule || "Primary source takes precedence unless unavailable.",
    cancellationRule: t.cancellationRule || "If event is cancelled, capsule is refunded to both parties.",
    postponementRule: t.postponementRule || "If event is postponed beyond deadline, capsule is refunded.",
    disputeWindowHours: String(t.disputeWindowHours ?? 24),
  };
}

export default function EditDraftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getDrafts().find((d) => d.draftId === id) ?? null;
    setDraft(found);
    setLoaded(true);
  }, [id]);

  // Block editing published drafts
  if (loaded && draft?.contractWagerId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 route-in">
        <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
          ← BACK TO CAPSULE
        </Link>
        <div className="rounded p-5" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>
            This capsule has already been published on-chain. On-chain capsules cannot be edited.
          </p>
        </div>
      </div>
    );
  }

  // Not found
  if (loaded && !draft) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 route-in">
        <Link href="/app/wagers" className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
          ← CAPSULES
        </Link>
        <div className="rounded p-5" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
            Draft not found.
          </p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center gap-2 py-24 justify-center">
        <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
        <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING…</span>
      </div>
    );
  }

  const initialValues = draftToForm(draft);

  return (
    <div className="max-w-2xl mx-auto space-y-6 route-in">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULE
      </Link>

      <div className="flex items-center gap-3">
        <Pencil className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          EDIT DRAFT
        </h1>
      </div>

      <WagerCreateWizard initialValues={initialValues} editDraftId={id} />
    </div>
  );
}
