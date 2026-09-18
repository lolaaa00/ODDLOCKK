"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { EXPLORER_URL } from "@/lib/genlayerClient";
import type { ConsensusStage } from "@/hooks/useConsensusStage";

interface Props {
  stage: ConsensusStage;
  elapsed: number;
  hash: string;
  onRetry?: () => void;
}

const STAGE_ORDER = ["PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED"] as const;

const STAGE_LABELS: Record<string, { label: string; detail: string }> = {
  idle: { label: "IDLE", detail: "" },
  signing: { label: "AWAITING SIGNATURE", detail: "Confirm in your wallet" },
  PENDING: { label: "SUBMITTED", detail: "Transaction queued for consensus" },
  PROPOSING: { label: "PROPOSING", detail: "Leader validator executing contract" },
  COMMITTING: { label: "COMMITTING", detail: "Validators committing their results" },
  REVEALING: { label: "REVEALING", detail: "Validators revealing and comparing" },
  ACCEPTED: { label: "ACCEPTED", detail: "Consensus reached — verdict stored on-chain" },
  FINALIZED: { label: "FINALIZED", detail: "Past appeal window" },
  UNDETERMINED: { label: "UNDETERMINED", detail: "Validators did not reach consensus — nothing was written" },
  CANCELED: { label: "CANCELED", detail: "Transaction was canceled" },
  error: { label: "ERROR", detail: "Transaction failed" },
};

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function ConsensusTracker({ stage, elapsed, hash, onRetry }: Props) {
  if (stage === "idle") return null;

  const info = STAGE_LABELS[stage] ?? STAGE_LABELS.PENDING;
  const currentIdx = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
  const isTerminal = ["ACCEPTED", "FINALIZED", "CANCELED", "UNDETERMINED", "error"].includes(stage);
  const isUndetermined = stage === "UNDETERMINED";

  return (
    <div
      className="rounded overflow-hidden"
      style={{
        border: `1px solid ${isUndetermined ? "rgba(242,201,76,0.35)" : isTerminal && stage !== "error" ? "rgba(122,158,111,0.35)" : "rgba(240,230,226,0.15)"}`,
        background: isUndetermined ? "rgba(242,201,76,0.06)" : isTerminal && stage !== "error" ? "rgba(122,158,111,0.06)" : "rgba(107,7,14,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {!isTerminal && (
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
          )}
          {isTerminal && !isUndetermined && stage !== "error" && (
            <div className="h-2 w-2 rounded-full" style={{ background: "var(--canopy)" }} />
          )}
          <span className="font-exo text-xs tracking-widest" style={{ color: isUndetermined ? "var(--dispute-signal)" : "var(--dim-label)" }}>
            {info.label}
          </span>
        </div>
        <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Stage progression */}
      {stage !== "signing" && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 mb-2">
            {STAGE_ORDER.map((s, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      background: isPast || isActive
                        ? isTerminal && stage === "ACCEPTED" ? "var(--canopy)" : "var(--bio-glow)"
                        : "rgba(240,230,226,0.1)",
                    }}
                  />
                  {i < STAGE_ORDER.length - 1 && <div className="w-0.5" />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            {STAGE_ORDER.map((s, i) => {
              const isPast = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <span
                  key={s}
                  className="font-exo tracking-widest"
                  style={{
                    fontSize: "0.55rem",
                    color: isActive ? "var(--bio-glow)" : isPast ? "var(--canopy)" : "rgba(240,230,226,0.25)",
                  }}
                >
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail */}
      <div className="px-4 pb-3 space-y-2">
        <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
          {info.detail}
        </p>

        {hash && (
          <a
            href={`${EXPLORER_URL}/transactions/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-azeret text-xs hover:underline"
            style={{ color: "rgba(240,230,226,0.55)" }}
          >
            <ExternalLink className="h-3 w-3" />
            {hash.slice(0, 20)}…{hash.slice(-8)}
          </a>
        )}

        {isUndetermined && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded px-3 py-2 font-exo text-xs tracking-widest transition-colors hover:opacity-80"
            style={{ border: "1px solid var(--dispute-signal)", color: "var(--dispute-signal)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            RETRY SETTLEMENT
          </button>
        )}
      </div>
    </div>
  );
}
