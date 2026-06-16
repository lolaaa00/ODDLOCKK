"use client";

import { Gavel, Clock } from "lucide-react";
import { ObjectionSlip } from "./ObjectionSlip";
import type { DisputeReport } from "@/types/wager";

interface Props {
  wagerId: string;
  disputeWindowOpen: boolean;
  disputeWindowEnds?: number;
  existingDispute?: DisputeReport | null;
  onDispute?: (ground: string, explanation: string, evidence?: Array<{ sourceUrl: string; sourceTitle: string; finding: string }>) => Promise<void>;
}

export function DisputeBench({
  wagerId,
  disputeWindowOpen,
  disputeWindowEnds,
  existingDispute,
  onDispute,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Gavel className="h-5 w-5" style={{ color: "var(--dispute-signal)" }} />
        <h2 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          OBJECTION REVIEW
        </h2>
        {disputeWindowEnds && disputeWindowOpen && (
          <div className="ml-auto flex items-center gap-1.5 font-azeret text-sm" style={{ color: "var(--dispute-signal)" }}>
            <Clock className="h-3.5 w-3.5" />
            Window closes: {new Date(disputeWindowEnds).toLocaleString()}
          </div>
        )}
      </div>

      {!disputeWindowOpen && !existingDispute && (
        <div className="rounded p-6 text-center" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
            Objection window is not open. Objections can only be filed after a verdict is returned
            and within the configured window.
          </p>
        </div>
      )}

      {existingDispute && (
        <div className="rounded p-5" style={{ border: "1px solid rgba(200,155,60,0.28)", background: "rgba(107,7,14,0.08)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>OBJECTION FILED</div>
          <div className="font-nunito text-base mb-3" style={{ color: "var(--ink-text)" }}>
            Ground: <span className="font-azeret">{existingDispute.ground}</span>
          </div>
          <div className="font-exo text-xs tracking-widest mb-1" style={{ color: "var(--dim-label)" }}>TRIBUNAL VERDICT</div>
          <div className="font-staatliches text-base md:text-xl tracking-widest mb-2" style={{ color: "var(--ink-text)" }}>
            {existingDispute.outcome}
          </div>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>{existingDispute.summary}</p>
        </div>
      )}

      {disputeWindowOpen && !existingDispute && (
        <ObjectionSlip wagerId={wagerId} onSubmit={onDispute} />
      )}

      {/* Why GenLayer */}
      <div className="genlayer-note rounded p-4">
        <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>WHY THIS NEEDED GENLAYER</div>
        <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
          Deterministic smart contracts can lock terms and stakes, but cannot interpret source
          conflicts, late updates, cancellation rules, postponement rules, ambiguous wording, or
          review public evidence. GenLayer consensus acts as a source-aware referee, both at
          initial settlement and on dispute.
        </p>
      </div>
    </div>
  );
}
