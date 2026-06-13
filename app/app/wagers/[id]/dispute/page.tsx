"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import {
  readGetWager,
  readGetDispute,
  writeDisputeSettlement,
  waitForTx,
  type OnChainWager,
  type OnChainDispute,
} from "@/lib/genlayer/contract";
import { DisputeBench } from "@/components/disputes/DisputeBench";
import type { DisputeReport } from "@/types/wager";

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
  const { address, provider, canWrite, contractReady } = useGenLayer();

  const [wager, setWager] = useState<OnChainWager | null>(null);
  const [dispute, setDispute] = useState<OnChainDispute | null>(null);
  const [loading, setLoading] = useState(false);
  const [txError, setTxError] = useState("");

  const load = useCallback(async () => {
    if (!contractReady) return;
    setLoading(true);
    try {
      const w = await readGetWager(id);
      setWager(w);
      if (w.disputeReportId) {
        const d = await readGetDispute(w.disputeReportId);
        setDispute(d);
      }
    } catch {
      // may be a local draft
    } finally {
      setLoading(false);
    }
  }, [id, contractReady]);

  useEffect(() => { load(); }, [load]);

  const disputeWindowOpen = (() => {
    if (!wager || wager.status !== "RESOLVED") return false;
    const hours = Number((wager.terms as Record<string, unknown>).disputeWindowHours ?? 24);
    const windowEnds = wager.resolvedAt + hours * 3600 * 1000;
    return Date.now() < windowEnds;
  })();

  async function handleDispute(ground: string, explanation: string) {
    if (!canWrite || !provider || !address || !wager) return;
    setTxError("");
    try {
      const packet = JSON.stringify({ ground, explanation, wagerId: wager.wagerId });
      const hash = await writeDisputeSettlement(provider, address, wager.wagerId, packet);
      await waitForTx(hash);
      await load();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
      throw err;
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 route-in">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULE
      </Link>

      {!contractReady && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(226,112,112,0.35)", background: "rgba(226,112,112,0.35)" }}>
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
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.35)", background: "rgba(226,112,112,0.35)" }}>
          <span className="font-nunito text-base" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}

      <DisputeBench
        wagerId={id}
        disputeWindowOpen={canWrite && disputeWindowOpen}
        existingDispute={dispute ? toDisputeReport(dispute) : null}
        onDispute={handleDispute}
      />
    </div>
  );
}
