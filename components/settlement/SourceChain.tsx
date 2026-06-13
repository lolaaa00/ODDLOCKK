"use client";

import { Link2, ShieldCheck, ShieldAlert } from "lucide-react";
import type { SourceAssessment } from "@/types/wager";

interface Props {
  assessments: SourceAssessment[];
  primarySource?: string;
  fallbackSource?: string;
}

const RELIABILITY_COLOR = { HIGH: "#C8B8B0", MEDIUM: "#DDD0CC", LOW: "#E27070", UNKNOWN: "#8A766D" };
const RISK_COLOR         = { LOW: "#C8B8B0", MEDIUM: "#DDD0CC", HIGH: "#E27070" };

export function SourceChain({ assessments, primarySource, fallbackSource }: Props) {
  return (
    <div className="space-y-3">
      {(primarySource || fallbackSource) && (
        <div className="rounded p-4" style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.08)" }}>
          <div className="font-exo text-xs tracking-widest mb-3" style={{ color: "var(--dim-label)" }}>SOURCE CHAIN</div>
          <div className="space-y-2">
            {primarySource && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: "var(--bio-glow)" }} />
                <span className="font-exo text-xs tracking-widest w-16 shrink-0" style={{ color: "var(--dim-label)" }}>PRIMARY</span>
                <a href={primarySource} target="_blank" rel="noopener noreferrer"
                  className="font-azeret text-sm hover:underline truncate" style={{ color: "var(--dim-label)" }}>
                  {primarySource}
                </a>
              </div>
            )}
            {primarySource && fallbackSource && (
              <div className="ml-1 h-4 w-px border-l border-dashed" style={{ borderColor: "rgba(240,230,226,0.18)" }} />
            )}
            {fallbackSource && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: "var(--canopy)" }} />
                <span className="font-exo text-xs tracking-widest w-16 shrink-0" style={{ color: "var(--canopy)" }}>FALLBACK</span>
                <a href={fallbackSource} target="_blank" rel="noopener noreferrer"
                  className="font-azeret text-sm hover:underline truncate" style={{ color: "var(--canopy)" }}>
                  {fallbackSource}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {assessments.length > 0 && (
        <div className="space-y-2">
          {assessments.map((a, i) => {
            const relColor  = RELIABILITY_COLOR[a.reliability as keyof typeof RELIABILITY_COLOR] ?? "#B8C0CC";
            const riskColor = RISK_COLOR[a.manipulationRisk as keyof typeof RISK_COLOR] ?? "#B8C0CC";
            return (
              <div key={i} className="rounded p-3" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.50)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-3.5 w-3.5" style={{ color: "var(--dim-label)" }} />
                  <span className="font-azeret text-sm truncate" style={{ color: "var(--dim-label)" }}>{a.sourceUrl}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" style={{ color: relColor }} />
                    <span className="font-exo text-xs tracking-widest" style={{ color: relColor }}>{a.reliability}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" style={{ color: riskColor }} />
                    <span className="font-exo text-xs tracking-widest" style={{ color: riskColor }}>RISK: {a.manipulationRisk}</span>
                  </div>
                </div>
                {a.notes && <p className="mt-1.5 font-nunito text-sm" style={{ color: "var(--dim-label)" }}>{a.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
