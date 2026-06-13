"use client";

import { useState } from "react";
import { Beaker, Play, AlertTriangle } from "lucide-react";
import { settlementReportSchema } from "@/lib/validation/wager";
import { RefereeSeal } from "@/components/settlement/RefereeSeal";
import { RuleApplication } from "@/components/settlement/RuleApplication";
import type { SettlementReport } from "@/types/wager";

const SAMPLE_PACKET = {
  question: "Will Team A win the match scheduled on [DATE]?",
  creatorSide: "Team A wins",
  counterpartySide: "Team B wins or Draw",
  eventDeadline: new Date(Date.now() + 86400000).toISOString(),
  primarySource: "https://official-league.example.com/results",
  fallbackSource: "https://sports-reference.example.com/results",
  conflictRule: "Primary source takes precedence unless unavailable for 24h.",
  cancellationRule: "If cancelled, refund both parties.",
  postponementRule: "If postponed beyond deadline, refund both parties.",
  invalidIf: "Event cannot be verified by either source.",
};

export function RefereePlayground() {
  const [packet, setPacket] = useState(JSON.stringify(SAMPLE_PACKET, null, 2));
  const [response, setResponse] = useState("");
  const [parsed, setParsed] = useState<SettlementReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function simulate() {
    setError("");
    setParsed(null);
    setLoading(true);

    try {
      JSON.parse(packet);
    } catch {
      setError("Settlement packet is not valid JSON.");
      setLoading(false);
      return;
    }

    // Simulate what GenLayer would return, for playground we show the input schema
    await new Promise((r) => setTimeout(r, 800));

    const mockReport: SettlementReport = {
      reportId: `playground_${Date.now()}`,
      wagerId: "playground",
      outcome: "MORE_EVIDENCE_REQUIRED",
      confidence: 0,
      winningSide: "N/A",
      summary:
        "This is a playground simulation. Connect to GenLayer Studionet and deploy OddLockReferee to receive a real settlement verdict.",
      evidenceTrace: [],
      ruleApplication: [
        {
          rule: "GenLayer contract must be deployed",
          finding: "Not satisfied (playground mode)",
          reason: "Deploy OddLockReferee to NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable live settlement.",
        },
      ],
      sourceAssessment: [],
      ambiguityNotes: [],
      manipulationWarnings: [],
      responsibleUseNote:
        "This is a testnet P2P wager settlement demo, not real-money gambling.",
      createdAt: Date.now(),
    };

    setResponse(JSON.stringify(mockReport, null, 2));
    const result = settlementReportSchema.safeParse(mockReport);
    if (result.success) {
      setParsed(mockReport);
    } else {
      setError("Validation failed: " + JSON.stringify(result.error.flatten()));
    }

    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Beaker className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1 className="font-staatliches text-3xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          REFEREE PLAYGROUND
        </h1>
      </div>

      <div className="rounded p-4 flex items-start gap-2" style={{ border: "1px solid rgba(226,112,112,0.30)", background: "rgba(226,112,112,0.06)" }}>
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--invalid-alert)" }} />
        <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
          Playground mode does not make real GenLayer calls. Deploy{" "}
          <span className="font-azeret" style={{ color: "var(--dim-label)" }}>OddLockReferee</span> to Studionet
          and add <span className="font-azeret" style={{ color: "var(--dim-label)" }}>NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS</span>{" "}
          to enable live settlement.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="font-exo text-sm tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>
            SETTLEMENT PACKET (JSON)
          </div>
          <textarea
            className="w-full h-48 rounded p-3 font-azeret text-xs focus:outline-none resize-none"
            style={{
              border: "1px solid var(--glass-line)",
              background: "rgba(61,26,22,0.55)",
              color: "var(--ink-text)",
            }}
            value={packet}
            onChange={(e) => setPacket(e.target.value)}
          />
        </div>
        <div>
          <div className="font-exo text-sm tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>
            REFEREE RESPONSE (JSON)
          </div>
          <textarea
            className="w-full h-48 rounded p-3 font-azeret text-xs focus:outline-none resize-none"
            style={{
              border: "1px solid var(--glass-line)",
              background: "rgba(61,26,22,0.55)",
              color: "var(--dim-label)",
            }}
            value={response}
            readOnly
            placeholder="Response will appear here..."
          />
        </div>
      </div>

      <button
        onClick={simulate}
        disabled={loading}
        className="btn-tribunal flex items-center gap-2 px-6 py-2.5 font-staatliches text-base tracking-widest transition-opacity disabled:opacity-50 rounded"
      >
        <Play className="h-4 w-4" />
        {loading ? "SIMULATING..." : "SIMULATE SETTLEMENT"}
      </button>

      {error && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(226,112,112,0.30)", background: "rgba(226,112,112,0.05)" }}>
          <p className="font-azeret text-sm" style={{ color: "var(--invalid-alert)" }}>{error}</p>
        </div>
      )}

      {parsed && (
        <div className="space-y-4">
          <RefereeSeal report={parsed} />
          {parsed.ruleApplication.length > 0 && (
            <div>
              <div className="font-exo text-sm tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>
                RULE APPLICATION
              </div>
              <RuleApplication rules={parsed.ruleApplication} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
