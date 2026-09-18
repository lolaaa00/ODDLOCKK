"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Shield, ExternalLink, CheckCircle, AlertTriangle, Globe } from "lucide-react";
import { useWager, useSettlement, useDispute } from "@/hooks/useOddLockReads";
import { EXPLORER_URL, CONTRACT_ADDRESS } from "@/lib/genlayerClient";
import { FetchedSourceEvidence } from "@/components/settlement/FetchedSourceEvidence";
import type { SettlementReport, FetchedSourceEvidence as FetchedSourceEvidenceType } from "@/types/wager";
import type { OnChainSettlement, OnChainDispute } from "@/lib/oddlockContract";

function toFetchedSources(raw: OnChainSettlement | OnChainDispute | null): FetchedSourceEvidenceType[] {
  if (!raw?.fetchedSourceEvidence) return [];
  return raw.fetchedSourceEvidence as FetchedSourceEvidenceType[];
}

export default function ProofPage() {
  const { id } = useParams<{ id: string }>();
  const { data: wager, loading: wagerLoading } = useWager(id);
  const settlementId = wager?.settlementReportId || "";
  const disputeId = wager?.disputeReportId || "";
  const { data: settlement, loading: settlementLoading } = useSettlement(settlementId);
  const { data: dispute } = useDispute(disputeId);

  const loading = wagerLoading || settlementLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse font-exo text-sm tracking-widest" style={{ color: "var(--dim-label)" }}>
          LOADING PROOF…
        </div>
      </div>
    );
  }

  if (!wager) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="font-nunito text-lg" style={{ color: "var(--dim-label)" }}>Wager not found.</p>
        <Link href="/app/wagers" className="text-sm underline mt-4 inline-block" style={{ color: "var(--dim-label)" }}>
          Back to wagers
        </Link>
      </div>
    );
  }

  const fetchedSources = toFetchedSources(settlement);
  const disputeFetchedSources = toFetchedSources(dispute);
  const allOk = fetchedSources.length > 0 && fetchedSources.every((s) => s.fetchStatus === "OK");
  const hasDigests = fetchedSources.some((s) => s.contentDigest);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6" style={{ color: "var(--canopy)" }} />
        <h1 className="font-exo text-xl tracking-wide" style={{ color: "var(--parchment)" }}>
          ON-CHAIN SOURCE VERIFICATION
        </h1>
      </div>

      <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
        This page shows proof that OddLock validators independently fetched and verified source content
        via <code className="font-azeret text-xs px-1 py-0.5 rounded" style={{ background: "rgba(107,7,14,0.12)" }}>gl.nondet.web.get(url)</code> before
        rendering a settlement verdict. Each source record includes a SHA-256 content digest for independent verification.
      </p>

      {/* Wager Summary */}
      <div className="rounded p-4" style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.06)" }}>
        <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>WAGER</div>
        <p className="font-nunito text-base mb-1" style={{ color: "var(--parchment)" }}>{wager.question || id}</p>
        <div className="flex flex-wrap gap-4 mt-2">
          <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>Status: {wager.status}</span>
          <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>ID: {id}</span>
          {wager.termsHash && (
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
              Terms hash: {wager.termsHash.slice(0, 16)}…
            </span>
          )}
        </div>
      </div>

      {/* Proof Status Banner */}
      <div
        className="flex items-center gap-3 rounded px-4 py-3"
        style={{
          border: `1px solid ${allOk ? "rgba(122,158,111,0.40)" : "rgba(226,112,112,0.30)"}`,
          background: allOk ? "rgba(122,158,111,0.08)" : "rgba(226,112,112,0.06)",
        }}
      >
        {allOk ? (
          <CheckCircle className="h-5 w-5" style={{ color: "var(--canopy)" }} />
        ) : (
          <AlertTriangle className="h-5 w-5" style={{ color: "var(--invalid-alert)" }} />
        )}
        <div>
          <div className="font-exo text-sm tracking-widest" style={{ color: allOk ? "var(--canopy)" : "var(--invalid-alert)" }}>
            {allOk ? "SOURCE VERIFICATION PASSED" : fetchedSources.length === 0 ? "NO SETTLEMENT YET" : "SOME SOURCES FAILED"}
          </div>
          {hasDigests && (
            <div className="font-azeret text-xs mt-0.5" style={{ color: "var(--dim-label)" }}>
              Content integrity verified via SHA-256 digests
            </div>
          )}
        </div>
      </div>

      {/* Settlement Outcome */}
      {settlement && (
        <div className="rounded p-4" style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.06)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>SETTLEMENT VERDICT</div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="font-exo text-sm tracking-widest px-2 py-1 rounded"
              style={{
                background: settlement.outcome === "MORE_EVIDENCE_REQUIRED" ? "rgba(242,201,76,0.15)" : "rgba(122,158,111,0.15)",
                color: settlement.outcome === "MORE_EVIDENCE_REQUIRED" ? "var(--dispute-signal)" : "var(--canopy)",
              }}
            >
              {settlement.outcome}
            </span>
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
              Confidence: {settlement.confidence}%
            </span>
          </div>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>{settlement.summary}</p>
          {settlement.reportType === "SUPERSEDING_SETTLEMENT" && settlement.supersedesReportId && (
            <div className="mt-2 font-azeret text-xs" style={{ color: "var(--dispute-signal)" }}>
              Supersedes: {settlement.supersedesReportId}
            </div>
          )}
        </div>
      )}

      {/* Fetched Source Evidence */}
      {fetchedSources.length > 0 && (
        <div className="space-y-2">
          <div className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
            SETTLEMENT SOURCE EVIDENCE
          </div>
          <FetchedSourceEvidence sources={fetchedSources as SettlementReport["fetchedSourceEvidence"]} />
        </div>
      )}

      {/* Dispute Source Evidence */}
      {disputeFetchedSources.length > 0 && (
        <div className="space-y-2">
          <div className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
            DISPUTE RE-EVALUATION SOURCE EVIDENCE
          </div>
          <FetchedSourceEvidence sources={disputeFetchedSources as SettlementReport["fetchedSourceEvidence"]} />
        </div>
      )}

      {/* On-chain Links */}
      <div className="rounded p-4 space-y-2" style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.06)" }}>
        <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>ON-CHAIN VERIFICATION</div>
        <a
          href={`${EXPLORER_URL}/contracts/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-azeret text-xs hover:underline"
          style={{ color: "var(--dim-label)" }}
        >
          <Globe className="h-3 w-3" />
          Contract on Studionet Explorer
          <ExternalLink className="h-3 w-3" />
        </a>
        <div className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
          Chain ID: 61999 (GenLayer Studionet)
        </div>
        <div className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
          Fetch API: gl.nondet.web.get(url) → Response(status, headers, body)
        </div>
      </div>

      <Link
        href={`/app/wagers/${id}`}
        className="inline-block font-exo text-xs tracking-widest hover:underline"
        style={{ color: "var(--dim-label)" }}
      >
        ← BACK TO WAGER
      </Link>
    </div>
  );
}
