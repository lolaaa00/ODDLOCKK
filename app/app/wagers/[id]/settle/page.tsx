"use client";

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Scale, AlertTriangle, Play, ExternalLink, Clock, Plus, Trash2 } from "lucide-react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { useWager, useSettlement } from "@/hooks/useOddLockReads";
import { useOddLockWrites } from "@/hooks/useOddLockWrites";
import { useOddLockPermissions } from "@/hooks/useOddLockPermissions";
import { EXPLORER_URL, isContractConfigured } from "@/lib/genlayerClient";
import { getDrafts } from "@/lib/storage/drafts";
import { SettlementDesk } from "@/components/settlement/SettlementDesk";
import type { SettlementReport } from "@/types/wager";
import type { OnChainSettlement } from "@/lib/oddlockContract";

type EvidenceItem = {
  sourceTitle: string;
  sourceUrl: string;
  sourceTier: "PRIMARY" | "FALLBACK" | "TERTIARY";
  finding: string;
};

function toSettlementReport(s: OnChainSettlement): SettlementReport {
  return {
    reportId: s.reportId,
    wagerId: s.wagerId,
    outcome: s.outcome as SettlementReport["outcome"],
    confidence: s.confidence,
    winningSide: s.winningSide,
    summary: s.summary,
    fetchedSourceEvidence: (s.fetchedSourceEvidence as SettlementReport["fetchedSourceEvidence"] | undefined) ?? [],
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
  const { isConnected } = useGenLayer();
  const contractReady = isContractConfigured();

  // Local draft fallback — resolve contractWagerId if this is a draft ID
  const draftFallback = useSyncExternalStore(
    () => () => {},
    () => getDrafts().find((d) => d.draftId === id) ?? null,
    () => null
  );
  const draftChecked = true;
  const [now] = useState(() => Date.now());

  // Resolve the on-chain wager ID: use contractWagerId from draft if available.
  // Wait for draft check to avoid flash errors.
  const contractWagerId = draftFallback?.contractWagerId || "";
  const onChainId = !draftChecked
    ? undefined
    : contractWagerId || (draftFallback ? undefined : id);

  // Contract reads
  const { data: wager, loading: wagerLoading, refetch: refetchWager } = useWager(onChainId);
  const { data: settlement } = useSettlement(wager?.settlementReportId);

  // Writes
  const { txStatus, txHash, txError, canWrite, openSettlement, requestSettlement } = useOddLockWrites();

  // Permissions
  const perms = useOddLockPermissions(wager);

  const deadlinePassed = wager ? now > wager.eventDeadline : false;
  const settlementOpensAtPassed = wager ? now >= wager.settlementOpensAt : false;
  const alreadyResolved = wager ? ["RESOLVED", "DISPUTED", "FINALIZED"].includes(wager.status) : false;
  const busy = txStatus === "signing" || txStatus === "pending";

  // ── Evidence items state ──────────────────────────────────────────────────
  const defaultEvidence = useMemo<EvidenceItem[]>(() => {
    if (!wager) return [];
    const terms = wager.terms as Record<string, unknown>;
    const items: EvidenceItem[] = [];
    if (terms.primarySource) {
      items.push({
        sourceTitle: "Primary Source",
        sourceUrl: String(terms.primarySource),
        sourceTier: "PRIMARY",
        finding: "",
      });
    }
    if (terms.fallbackSource) {
      items.push({
        sourceTitle: "Fallback Source",
        sourceUrl: String(terms.fallbackSource),
        sourceTier: "FALLBACK",
        finding: "",
      });
    }
    return items;
  }, [wager]);

  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceInitialised, setEvidenceInitialised] = useState(false);

  // Seed evidence items once when wager loads
  if (defaultEvidence.length > 0 && !evidenceInitialised && evidenceItems.length === 0) {
    setEvidenceItems(defaultEvidence);
    setEvidenceInitialised(true);
  }

  const updateEvidence = useCallback((index: number, field: keyof EvidenceItem, value: string) => {
    setEvidenceItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  const addEvidenceItem = useCallback(() => {
    setEvidenceItems((prev) => [
      ...prev,
      { sourceTitle: "", sourceUrl: "", sourceTier: "TERTIARY", finding: "" },
    ]);
  }, []);

  const removeEvidenceItem = useCallback((index: number) => {
    setEvidenceItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleOpenSettlement() {
    if (!wager) return;
    openSettlement(wager.wagerId, refetchWager);
  }

  async function handleRequestSettlement() {
    if (!wager) return;
    const terms = wager.terms as Record<string, unknown>;
    const lockedSourceUrls = [terms.primarySource, terms.fallbackSource]
      .map((url) => String(url ?? "").trim())
      .filter(Boolean);

    const validEvidence = evidenceItems.filter(
      (e) => e.finding.trim().length > 0 && lockedSourceUrls.includes(e.sourceUrl.trim())
    );
    const coveredUrls = new Set(validEvidence.map((e) => e.sourceUrl.trim()));
    if (lockedSourceUrls.some((url) => !coveredUrls.has(url))) {
      setShowEvidenceForm(true);
      return;
    }

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
      evidence: validEvidence,
      context: "Settlement requested with per-source evidence findings.",
    };
    requestSettlement(wager.wagerId, JSON.stringify(packet), refetchWager);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 route-in">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest transition-colors" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULE
      </Link>

      <div className="flex items-center gap-3">
        <Scale className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          RESOLUTION ROOM
        </h1>
      </div>

      {!contractReady && (
        <div className="rounded p-5" style={{ border: "1px solid rgba(226,112,112,0.35)", background: "rgba(226,112,112,0.06)" }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--invalid-alert)" }} />
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--invalid-alert)" }}>CONTRACT NOT CONFIGURED</span>
          </div>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
            Add NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable settlement.
          </p>
        </div>
      )}

      {contractReady && !isConnected && (
        <div className="rounded p-4" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>Connect your wallet to request settlement.</p>
        </div>
      )}

      {contractReady && !wager && !wagerLoading && draftFallback && (
        <div className="rounded p-5" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
          <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
            This capsule is a local draft and has not been submitted on-chain yet.
          </p>
        </div>
      )}

      {wagerLoading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
          <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING…</span>
        </div>
      )}

      {settlement && (
        <SettlementDesk
          report={toSettlementReport(settlement)}
          primarySource={String((wager?.terms as Record<string, unknown> | undefined)?.primarySource ?? "")}
          fallbackSource={String((wager?.terms as Record<string, unknown> | undefined)?.fallbackSource ?? "")}
        />
      )}

      {wager && canWrite && !alreadyResolved && (
        <div className="space-y-3">
          {perms.canOpenSettlement && wager.status === "LOCKED" && deadlinePassed && (
            <button
              onClick={handleOpenSettlement}
              disabled={busy}
              className="btn-tribunal w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              OPEN SETTLEMENT
            </button>
          )}

          {perms.canTriggerResolution && wager.status === "SETTLEMENT_OPEN" && (
            <div className="space-y-3">
              {/* Evidence Form */}
              <div className="rounded p-4 space-y-3" style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
                    SOURCE EVIDENCE ({evidenceItems.length})
                  </span>
                  <button
                    onClick={() => { setShowEvidenceForm((s) => !s); }}
                    className="font-exo text-xs tracking-widest transition-colors"
                    style={{ color: "var(--bio-glow)" }}
                  >
                    {showEvidenceForm ? "COLLAPSE" : "EDIT EVIDENCE"}
                  </button>
                </div>

                {!showEvidenceForm && evidenceItems.length > 0 && (
                  <div className="space-y-1">
                    {evidenceItems.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
                        <span className="font-exo text-xs tracking-widest px-1 py-0.5 rounded" style={{ background: "rgba(240,230,226,0.08)" }}>
                          {e.sourceTier}
                        </span>
                        <span className="truncate">{e.sourceUrl || e.sourceTitle || "(no URL)"}</span>
                        {e.finding ? (
                          <span style={{ color: "var(--canopy)" }}>✓ finding</span>
                        ) : (
                          <span style={{ color: "var(--dispute-signal)" }}>⚠ no finding</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showEvidenceForm && (
                  <div className="space-y-3">
                    <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                      Describe what each locked source shows about the outcome.
                      When the deployed runtime supports it, the contract can also fetch source content via a GenLayer web helper.
                    </p>
                    {evidenceItems.map((e, i) => (
                      <div key={i} className="rounded p-3 space-y-2" style={{ border: "1px solid rgba(240,230,226,0.1)", background: "rgba(62,34,32,0.50)" }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <select
                              value={e.sourceTier}
                              onChange={(ev) => updateEvidence(i, "sourceTier", ev.target.value)}
                              className="rounded px-2 py-1 font-exo text-xs tracking-widest focus:outline-none"
                              style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.8)", color: "var(--dim-label)" }}
                            >
                              <option value="PRIMARY">PRIMARY</option>
                              <option value="FALLBACK">FALLBACK</option>
                              <option value="TERTIARY">TERTIARY</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Source title"
                              value={e.sourceTitle}
                              onChange={(ev) => updateEvidence(i, "sourceTitle", ev.target.value)}
                              className="rounded px-2 py-1 font-nunito text-sm focus:outline-none flex-1"
                              style={{ border: "1px solid var(--glass-line)", background: "transparent", color: "var(--ink-text)" }}
                            />
                          </div>
                          {evidenceItems.length > 1 && (
                            <button onClick={() => removeEvidenceItem(i)} className="ml-2 shrink-0 transition-colors" style={{ color: "var(--invalid-alert)" }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="Source URL (e.g. https://espn.com/...)"
                          value={e.sourceUrl}
                          onChange={(ev) => updateEvidence(i, "sourceUrl", ev.target.value)}
                          className="w-full rounded px-2 py-1 font-azeret text-sm focus:outline-none"
                          style={{ border: "1px solid var(--glass-line)", background: "transparent", color: "var(--dim-label)" }}
                        />
                        <textarea
                          placeholder="What does this source show? Describe the specific outcome evidence…"
                          value={e.finding}
                          onChange={(ev) => updateEvidence(i, "finding", ev.target.value)}
                          rows={2}
                          className="w-full rounded px-2 py-1.5 font-nunito text-sm focus:outline-none resize-none"
                          style={{ border: "1px solid var(--glass-line)", background: "transparent", color: "var(--ink-text)" }}
                        />
                      </div>
                    ))}

                    {evidenceItems.length < 10 && (
                      <button
                        onClick={addEvidenceItem}
                        className="flex items-center gap-1.5 font-exo text-xs tracking-widest transition-colors"
                        style={{ color: "var(--dim-label)" }}
                      >
                        <Plus className="h-3.5 w-3.5" /> ADD SOURCE
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleRequestSettlement}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "var(--deep-vault)", border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
              >
                <Scale className="h-4 w-4" />
                REQUEST GENLAYER TRIBUNAL
              </button>
            </div>
          )}

          {wager.status === "LOCKED" && !deadlinePassed && (
            <div className="rounded p-4 text-center" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                Settlement opens after the event deadline passes.
              </p>
            </div>
          )}

          {wager.status === "LOCKED" && deadlinePassed && !settlementOpensAtPassed && (
            <div className="rounded p-4 text-center space-y-2" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "var(--dispute-signal)" }} />
                <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dispute-signal)" }}>SETTLEMENT WINDOW NOT YET OPEN</span>
              </div>
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                The event deadline has passed, but settlement opens at{" "}
                <span className="font-azeret">{new Date(wager.settlementOpensAt).toLocaleString()}</span>.
              </p>
            </div>
          )}

          {!perms.canTriggerResolution && !perms.canOpenSettlement && deadlinePassed && settlementOpensAtPassed && !perms.isParticipant && (
            <div className="rounded p-4 text-center" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                You are not a party to this capsule. Only participants, admins, or keepers can trigger resolution.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tx status */}
      {txStatus === "signing" && (
        <div className="flex items-center gap-2 rounded px-4 py-3" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--dispute-signal)" }} />
          <span className="font-azeret text-xs" style={{ color: "var(--dispute-signal)" }}>Waiting for wallet signature…</span>
        </div>
      )}
      {txStatus === "pending" && (
        <div className="space-y-1 rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(107,7,14,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>Submitted, awaiting GenLayer consensus…</span>
          </div>
          {txHash && (
            <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 font-azeret text-xs" style={{ color: "rgba(240,230,226,0.55)" }}>
              <ExternalLink className="h-3 w-3" />
              {txHash.slice(0, 20)}…{txHash.slice(-8)}
            </a>
          )}
        </div>
      )}
      {txStatus === "done" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(122,158,111,0.25)", background: "rgba(122,158,111,0.06)" }}>
          <span className="font-azeret text-xs" style={{ color: "var(--canopy)" }}>Transaction confirmed. Verdict loaded above.</span>
        </div>
      )}
      {txStatus === "error" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <span className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}
    </div>
  );
}
