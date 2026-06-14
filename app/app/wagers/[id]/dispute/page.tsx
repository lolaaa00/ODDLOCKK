"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useWager, useDispute } from "@/hooks/useOddLockReads";
import { useOddLockWrites } from "@/hooks/useOddLockWrites";
import { useOddLockPermissions } from "@/hooks/useOddLockPermissions";
import { isContractConfigured } from "@/lib/genlayerClient";
import { getDrafts } from "@/lib/storage/drafts";
import { DisputeBench } from "@/components/disputes/DisputeBench";
import type { DisputeReport, LocalDraft } from "@/types/wager";
import type { OnChainDispute } from "@/lib/oddlockContract";

function toDisputeReport(d: OnChainDispute): DisputeReport {
  return {
    reportId: d.reportId,
    wagerId: d.wagerId,
    ground: d.ground as DisputeReport["ground"],
    outcome: d.outcome as DisputeReport["outcome"],
    confidence: d.confidence,
    summary: d.summary,
    evidenceTrace: d.evidenceTrace as DisputeReport["evidenceTrace"],
    ruleApplication: d.ruleApplication as DisputeReport["ruleApplication"],
    responsibleUseNote: d.responsibleUseNote,
    createdAt: d.createdAt,
  };
}

export default function DisputePage() {
  const { id } = useParams<{ id: string }>();
  const contractReady = isContractConfigured();

  // Resolve draft ID → on-chain ID
  const [draftFallback, setDraftFallback] = useState<LocalDraft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);
  useEffect(() => {
    setDraftFallback(getDrafts().find((d) => d.draftId === id) ?? null);
    setDraftChecked(true);
  }, [id]);

  const contractWagerId = draftFallback?.contractWagerId || "";
  const onChainId = !draftChecked
    ? undefined
    : contractWagerId || (draftFallback ? undefined : id);

  // Contract reads
  const { data: wager, loading, refetch: refetchWager } = useWager(onChainId);
  const { data: dispute } = useDispute(wager?.disputeReportId);

  // Writes
  const { txError, disputeSettlement, canWrite } = useOddLockWrites();

  // Permissions
  const perms = useOddLockPermissions(wager);

  async function handleDispute(ground: string, explanation: string) {
    if (!wager) return;
    const packet = JSON.stringify({
      ground,
      explanation,
      wagerId: wager.wagerId,
    });
    disputeSettlement(wager.wagerId, packet, refetchWager);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 route-in">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULE
      </Link>

      {!contractReady && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--invalid-alert)" }} />
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--invalid-alert)" }}>CONTRACT NOT CONFIGURED</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
          <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING…</span>
        </div>
      )}

      {txError && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <span className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}

      {!perms.canDispute && wager && !loading && (
        <div className="rounded p-4" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
            {wager.status !== "RESOLVED"
              ? "Disputes can only be filed when a capsule is in RESOLVED status."
              : "The dispute window has closed or you are not a party to this capsule."}
          </p>
        </div>
      )}

      <DisputeBench
        wagerId={id}
        disputeWindowOpen={canWrite && perms.canDispute}
        existingDispute={dispute ? toDisputeReport(dispute) : null}
        onDispute={handleDispute}
      />
    </div>
  );
}
