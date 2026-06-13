"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { RefereeSeal } from "./RefereeSeal";
import { EvidenceTrace } from "./EvidenceTrace";
import { RuleApplication } from "./RuleApplication";
import { SourceChain } from "./SourceChain";
import type { SettlementReport } from "@/types/wager";

interface Props {
  report: SettlementReport;
  primarySource?: string;
  fallbackSource?: string;
}

const GL = "rgba(107,7,14,0.08)";
const GL_BORDER = "rgba(203,194,192,0.13)";

export function SettlementDesk({ report, primarySource, fallbackSource }: Props) {
  const [openSection, setOpenSection] = useState<string | null>("evidence");

  function toggle(s: string) {
    setOpenSection((c) => (c === s ? null : s));
  }

  return (
    <div className="space-y-4">
      {/* Referee Seal */}
      <RefereeSeal report={report} />

      {/* Ambiguity notes */}
      {report.ambiguityNotes.length > 0 && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(242,201,76,0.30)", background: "rgba(242,201,76,0.06)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dispute-signal)" }}>
            AMBIGUITY NOTES
          </div>
          {report.ambiguityNotes.map((n, i) => (
            <p key={i} className="font-nunito text-base mb-1" style={{ color: "var(--dim-label)" }}>• {n}</p>
          ))}
        </div>
      )}

      {/* Manipulation warnings */}
      {report.manipulationWarnings.length > 0 && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(225,29,72,0.30)", background: "rgba(225,29,72,0.06)" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--invalid-alert)" }} />
            <div className="font-exo text-xs tracking-widest" style={{ color: "var(--invalid-alert)" }}>
              MANIPULATION WARNINGS
            </div>
          </div>
          {report.manipulationWarnings.map((w, i) => (
            <p key={i} className="font-nunito text-base mb-1" style={{ color: "rgba(226,112,112,0.85)" }}>• {w}</p>
          ))}
        </div>
      )}

      {/* Collapsible sections */}
      {[
        {
          id: "evidence",
          label: "EVIDENCE LEDGER",
          count: report.evidenceTrace.length,
          content: <EvidenceTrace traces={report.evidenceTrace} />,
        },
        {
          id: "rules",
          label: "TRIBUNAL REASONING",
          count: report.ruleApplication.length,
          content: <RuleApplication rules={report.ruleApplication} />,
        },
        {
          id: "sources",
          label: "SOURCE ASSESSMENT",
          count: report.sourceAssessment.length,
          content: (
            <SourceChain
              assessments={report.sourceAssessment}
              primarySource={primarySource}
              fallbackSource={fallbackSource}
            />
          ),
        },
      ].map(({ id, label, count, content }) => (
        <div key={id} className="rounded overflow-hidden" style={{ border: `1px solid ${GL_BORDER}` }}>
          <button
            onClick={() => toggle(id)}
            className="flex w-full items-center justify-between px-4 py-3 transition-colors"
            style={{ background: openSection === id ? "rgba(107,7,14,0.12)" : GL }}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
                {label}
              </span>
              <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>({count})</span>
            </div>
            {openSection === id
              ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "var(--dim-label)" }} />
              : <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--dim-label)" }} />
            }
          </button>
          {openSection === id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-4 pb-4 pt-3"
              style={{ borderTop: `1px solid ${GL_BORDER}` }}
            >
              {content}
            </motion.div>
          )}
        </div>
      ))}

      {/* Why GenLayer */}
      <div className="genlayer-note rounded p-5">
        <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>
          WHY THIS NEEDED GENLAYER
        </div>
        <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
          Traditional smart contracts can verify predefined conditions. This resolution required
          evaluating evidence, weighing source reliability, interpreting rules, and reasoning through
          ambiguity. GenLayer intelligent consensus enables decentralised judgment where deterministic
          logic alone is insufficient.
        </p>
      </div>
    </div>
  );
}
