"use client";

import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { RuleApplication as RuleApplicationType } from "@/types/wager";

interface Props {
  rules: RuleApplicationType[];
}

export function RuleApplication({ rules }: Props) {
  if (!rules.length) {
    return (
      <div className="soft-panel rounded p-6 text-center">
        <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>No rule applications available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rules.map((r, i) => {
        const satisfied = r.finding.toLowerCase().includes("satisfied") || r.finding.toLowerCase().includes("met");
        const failed    = r.finding.toLowerCase().includes("fail") || r.finding.toLowerCase().includes("not met") || r.finding.toLowerCase().includes("violated");
        const Icon  = satisfied ? CheckCircle2 : failed ? XCircle : MinusCircle;
        const color = satisfied ? "#C8B8B0" : failed ? "#E27070" : "#8A766D";

        return (
          <div key={i} className="rounded p-3" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.50)" }}>
            <div className="flex items-start gap-2.5">
              <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
              <div className="flex-1 min-w-0">
                <div className="font-nunito text-base mb-1" style={{ color: "var(--ink-text)" }}>{r.rule}</div>
                <div className="font-exo text-xs tracking-widest mb-1" style={{ color }}>{r.finding.toUpperCase()}</div>
                <div className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>{r.reason}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
