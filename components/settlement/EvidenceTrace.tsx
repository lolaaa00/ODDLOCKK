"use client";

import { ExternalLink, CheckCircle2 } from "lucide-react";
import type { EvidenceTrace as EvidenceTraceType } from "@/types/wager";

interface Props {
  traces: EvidenceTraceType[];
}

const TIER_COLORS = {
  PRIMARY:  "#DDD0CC",
  FALLBACK: "#C8B8B0",
  TERTIARY: "#8A766D",
};

export function EvidenceTrace({ traces }: Props) {
  if (!traces.length) {
    return (
      <div className="soft-panel rounded p-6 text-center">
        <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>No evidence trace available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {traces.map((t, i) => {
        const color = TIER_COLORS[t.sourceTier] ?? "#B8C0CC";
        return (
          <div key={i} className="rounded p-4" style={{ border: `1px solid ${color}25`, background: `${color}06` }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="font-exo text-xs tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color, background: `${color}20` }}
                >
                  {t.sourceTier}
                </span>
                <span className="font-nunito text-base" style={{ color: "var(--ink-text)" }}>{t.sourceTitle}</span>
              </div>
              <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 transition-colors" style={{ color: "var(--dim-label)" }}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="font-nunito text-sm mb-2" style={{ color: "var(--dim-label)" }}>{t.finding}</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" style={{ color: "var(--canopy)" }} />
              <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
                SUPPORTS: {t.supportsOutcome}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
