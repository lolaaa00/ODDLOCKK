"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Scale, AlertTriangle, Play, ExternalLink } from "lucide-react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { useWager, useSettlement } from "@/hooks/useOddLockReads";
import { useOddLockWrites } from "@/hooks/useOddLockWrites";
import { useOddLockPermissions } from "@/hooks/useOddLockPermissions";
import { EXPLORER_URL, isContractConfigured } from "@/lib/genlayerClient";
import { getDrafts } from "@/lib/storage/drafts";
import { SettlementDesk } from "@/components/settlement/SettlementDesk";
import type { SettlementReport } from "@/types/wager";
import type { OnChainSettlement } from "@/lib/oddlockContract";
import type { LocalDraft } from "@/types/wager";

function toSettlementReport(s: OnChainSettlement): SettlementReport {
  return {
    reportId: s.reportId,
    wagerId: s.wagerId,
    outcome: s.outcome as SettlementReport["outcome"],
    confidence: s.confidence,
    winningSide: s.winningSide,
    summary: s.summary,
    evidenceTrace: s.evidenceTrace as SettlementReport["evidenceTrace"],
    ruleApplication: s.ruleApplication as SettlementReport["ruleApplication"],
    sourceAssessment: s.sourceAssessment as SettlementReport["sourceAssessment"],
    ambiguityNotes: s.ambiguityNotes,
    manipulationWarnings: s.manipulationWarnings,
    responsibleUseNote: s.responsibleUseNote,
    createdAt: s.createdAt,
  };
}

export default function SettlePage() {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useGenLayer();
  const contractReady = isContractConfigured();

  // Contract reads
  const { data: wager, loading: wagerLoading, refetch: refetchWager } = useWager(id);
  const { data: settlement } = useSettlement(wager?.settlementReportId);

  // Local draft fallback
  const [draftFallback, setDraftFallback] = useState<LocalDraft | null>(null);
  useEffect(() => {
    setDraftFallback(getDrafts().find((d) => d.draftId === id) ?? null);
  }, [id]);

  // Writes
  const { txStatus, txHash, txError, canWrite, openSettlement, requestSettlement } = useOddLockWrites();

  // Permissions
  const perms = useOddLockPermissions(wager);

  const deadlinePassed = wager ? Date.now() > wager.eventDeadline : false;
  const alreadyResolved = wager ? ["RESOLVED", "DISPUTED", "FINALIZED"].includes(wager.status) : false;
  const busy = txStatus === "signing" || txStatus === "pending";

  async function handleOpenSettlement() {
    if (!wager) return;
    openSettlement(wager.wagerId, refetchWager);
  }

  async function handleRequestSettlement() {
    if (!wager) return;
    const terms = wager.terms as Record<string, unknown>;
    const packet = {
      wagerId: wager.wagerId,
      question: wager.question,
      creatorSide: wager.creatorSide,
      counterpartySide: wager.counterpartySide,
      eventDeadline: wager.eventDeadline,
      primarySource: terms.primarySource,
      fallbackSource: terms.fallbackSource,
      conflictRule: terms.conflictRule,
      cancellationRule: terms.cancellationRule,
      postponementRule: terms.postponementRule,
      invalidIf: terms.invalidIf,
      evidence: [
        {
          sourceTitle: String(terms.primarySource ?? "Primary"),
          sourceUrl: String(terms.primarySource ?? ""),
          finding: "Requesting settlement based on locked source policy.",
        },
      ],
      context: "Requesting settlement via OddLock frontend.",
    };
    requestSettlement(wager.wagerId, JSON.stringify(packet), refetchWager);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 route-in">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest transition-colors" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULE
      </Link>

      <div className="flex items-center gap-3">
        <Scale className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          RESOLUTION ROOM
        </h1>
      </div>

      {!contractReady && (
        <div className="rounded p-5" style={{ border: "1px solid rgba(226,112,112,0.35)", background: "rgba(226,112,112,0.06)" }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--invalid-alert)" }} />
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--invalid-alert)" }}>CONTRACT NOT CONFIGURED</span>
          </div>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
            Add NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable settlement.
          </p>
        </div>
      )}

      {contractReady && !isConnected && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>Connect your wallet to request settlement.</p>
        </div>
      )}

      {contractReady && !wager && !wagerLoading && draftFallback && (
        <div className="rounded p-5" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
            This capsule is a local draft and has not been submitted on-chain yet.
          </p>
        </div>
      )}

      {wagerLoading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
          <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING…</span>
        </div>
      )}

      {settlement && (
        <SettlementDesk
          report={toSettlementReport(settlement)}
          primarySource={String((wager?.terms as Record<string, unknown> | undefined)?.primarySource ?? "")}
          fallbackSource={String((wager?.terms as Record<string, unknown> | undefined)?.fallbackSource ?? "")}
        />
      )}

      {wager && canWrite && !alreadyResolved && (
        <div className="space-y-3">
          {perms.canOpenSettlement && wager.status === "LOCKED" && deadlinePassed && (
            <button
              onClick={handleOpenSettlement}
              disabled={busy}
              className="btn-tribunal w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              OPEN SETTLEMENT
            </button>
          )}

          {perms.canTriggerResolution && wager.status === "SETTLEMENT_OPEN" && (
            <button
              onClick={handleRequestSettlement}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: "var(--deep-vault)", border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
            >
              <Scale className="h-4 w-4" />
              REQUEST GENLAYER TRIBUNAL
            </button>
          )}

          {wager.status === "LOCKED" && !deadlinePassed && (
            <div className="rounded p-4 text-center" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                Settlement opens after the event deadline passes.
              </p>
            </div>
          )}

          {!perms.canTriggerResolution && !perms.canOpenSettlement && (
            <div className="rounded p-4 text-center" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                You do not have permission to trigger resolution for this capsule.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tx status */}
      {txStatus === "signing" && (
        <div className="flex items-center gap-2 rounded px-4 py-3" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--dispute-signal)" }} />
          <span className="font-azeret text-xs" style={{ color: "var(--dispute-signal)" }}>Waiting for wallet signature…</span>
        </div>
      )}
      {txStatus === "pending" && (
        <div className="space-y-1 rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(107,7,14,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>Submitted, awaiting GenLayer consensus…</span>
          </div>
          {txHash && (
            <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 font-azeret text-xs" style={{ color: "rgba(240,230,226,0.55)" }}>
              <ExternalLink className="h-3 w-3" />
              {txHash.slice(0, 20)}…{txHash.slice(-8)}
            </a>
          )}
        </div>
      )}
      {txStatus === "done" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(122,158,111,0.25)", background: "rgba(122,158,111,0.06)" }}>
          <span className="font-azeret text-xs" style={{ color: "var(--canopy)" }}>Transaction confirmed. Verdict loaded above.</span>
        </div>
      )}
      {txStatus === "error" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <span className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}
    </div>
  );
}
