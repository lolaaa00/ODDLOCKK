"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Scale, AlertTriangle, Play, ExternalLink } from "lucide-react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import {
  readGetWager,
  readGetSettlement,
  writeOpenSettlement,
  writeRequestSettlement,
  waitForTx,
  type OnChainWager,
  type OnChainSettlement,
} from "@/lib/genlayer/contract";
import { getDrafts } from "@/lib/storage/drafts";
import { SettlementDesk } from "@/components/settlement/SettlementDesk";
import type { SettlementReport } from "@/types/wager";

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
  const { address, provider, canWrite, contractReady } = useGenLayer();

  const [wager, setWager] = useState<OnChainWager | null>(null);
  const [settlement, setSettlement] = useState<OnChainSettlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");

  const draftFallback =
    typeof window !== "undefined"
      ? (getDrafts().find((d) => d.draftId === id) ?? null)
      : null;

  const load = useCallback(async () => {
    if (!contractReady) return;
    setLoading(true);
    try {
      const w = await readGetWager(id);
      setWager(w);
      if (w.settlementReportId) {
        const s = await readGetSettlement(w.settlementReportId);
        setSettlement(s);
      }
    } catch {
      // wager may be a local draft only
    } finally {
      setLoading(false);
    }
  }, [id, contractReady]);

  useEffect(() => { load(); }, [load]);

  const deadlinePassed  = wager ? Date.now() > wager.eventDeadline : false;
  const alreadyResolved = wager ? ["RESOLVED", "DISPUTED", "FINALIZED"].includes(wager.status) : false;

  async function handleOpenSettlement() {
    if (!canWrite || !provider || !address || !wager) return;
    setTxError("");
    setTxStatus("signing");
    try {
      const hash = await writeOpenSettlement(provider, address, wager.wagerId);
      setTxHash(hash);
      setTxStatus("pending");
      await waitForTx(hash);
      setTxStatus("done");
      await load();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  async function handleRequestSettlement() {
    if (!canWrite || !provider || !address || !wager) return;
    setTxError("");
    setTxStatus("signing");
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
      evidence: [],
      context: "Requesting settlement via OddLock frontend.",
    };
    try {
      const hash = await writeRequestSettlement(provider, address, wager.wagerId, JSON.stringify(packet));
      setTxHash(hash);
      setTxStatus("pending");
      await waitForTx(hash);
      setTxStatus("done");
      await load();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  const explorerUrl = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL;

  return (
    <div className="max-w-3xl mx-auto space-y-6 route-in">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest transition-colors" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULE
      </Link>

      <div className="flex items-center gap-3">
        <Scale className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1 className="font-staatliches text-4xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          RESOLUTION ROOM
        </h1>
      </div>

      {!contractReady && (
        <div className="rounded p-5" style={{ border: "1px solid rgba(226,112,112,0.35)", background: "rgba(226,112,112,0.35)" }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--invalid-alert)" }} />
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--invalid-alert)" }}>CONTRACT NOT CONFIGURED</span>
          </div>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
            Add <span className="font-azeret" style={{ color: "var(--dim-label)" }}>NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS</span> to enable settlement.
          </p>
        </div>
      )}

      {contractReady && !canWrite && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(200,155,60,0.35)", background: "rgba(200,155,60,0.35)" }}>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>Connect your wallet to request settlement.</p>
        </div>
      )}

      {contractReady && !wager && !loading && draftFallback && (
        <div className="rounded p-5" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
            This capsule is a local draft and has not been submitted on-chain yet.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
          <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING…</span>
        </div>
      )}

      {settlement && (
        <SettlementDesk
          report={toSettlementReport(settlement)}
          primarySource={String((wager?.terms as Record<string,unknown> | undefined)?.primarySource ?? "")}
          fallbackSource={String((wager?.terms as Record<string,unknown> | undefined)?.fallbackSource ?? "")}
        />
      )}

      {wager && canWrite && !alreadyResolved && (
        <div className="space-y-3">
          {wager.status === "LOCKED" && deadlinePassed && (
            <button
              onClick={handleOpenSettlement}
              disabled={txStatus === "signing" || txStatus === "pending"}
              className="btn-tribunal w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play className="h-5 w-5" />
              OPEN SETTLEMENT
            </button>
          )}

          {wager.status === "SETTLEMENT_OPEN" && (
            <button
              onClick={handleRequestSettlement}
              disabled={txStatus === "signing" || txStatus === "pending"}
              className="w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: "var(--deep-vault)", border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
            >
              <Scale className="h-5 w-5" />
              REQUEST GENLAYER TRIBUNAL
            </button>
          )}

          {wager.status === "LOCKED" && !deadlinePassed && (
            <div className="rounded p-4 text-center" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
              <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
                Settlement opens after the event deadline passes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tx status */}
      {txStatus === "signing" && (
        <div className="flex items-center gap-2 rounded px-4 py-3" style={{ border: "1px solid rgba(200,155,60,0.35)", background: "rgba(200,155,60,0.35)" }}>
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--dispute-signal)" }} />
          <span className="font-azeret text-sm" style={{ color: "var(--dispute-signal)" }}>Waiting for wallet signature…</span>
        </div>
      )}
      {txStatus === "pending" && (
        <div className="space-y-1 rounded px-4 py-3" style={{ border: "1px solid rgba(200,155,60,0.35)", background: "rgba(200,155,60,0.35)" }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
            <span className="font-azeret text-sm" style={{ color: "var(--dim-label)" }}>Submitted, awaiting GenLayer consensus…</span>
          </div>
          {txHash && explorerUrl && (
            <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 font-azeret text-sm" style={{ color: "rgba(200,155,60,0.35)" }}>
              <ExternalLink className="h-3 w-3" />
              {txHash.slice(0, 20)}…{txHash.slice(-8)}
            </a>
          )}
        </div>
      )}
      {txStatus === "done" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(122,158,111,0.35)", background: "rgba(122,158,111,0.35)" }}>
          <span className="font-azeret text-sm" style={{ color: "var(--canopy)" }}>Transaction confirmed. Verdict loaded above.</span>
        </div>
      )}
      {txStatus === "error" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.35)", background: "rgba(226,112,112,0.35)" }}>
          <span className="font-nunito text-base" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}
    </div>
  );
}
