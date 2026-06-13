"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Scale, FileWarning, ChevronRight, ExternalLink, Layers } from "lucide-react";
import { getDrafts } from "@/lib/storage/drafts";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import {
  readGetWager,
  writeAcceptWager,
  writeFundWager,
  writeCancelWager,
  writeFinalizeWager,
  writeClaimWinnings,
  writeClaimRefund,
  waitForTx,
  type OnChainWager,
} from "@/lib/genlayer/contract";
import { TermsLockPanel } from "@/components/wagers/TermsLockPanel";
import { StakeTestUnitBox } from "@/components/wagers/StakeTestUnitBox";
import { EventCountdown } from "@/components/wagers/EventCountdown";
import type { LocalDraft } from "@/types/wager";
import { sha256Hex, formatTimestamp } from "@/lib/utils";

const FALLBACK_DEADLINE = Date.now() + 86400000;

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  INVITED:             { color: "#DDD0CC", bg: "rgba(240,230,226,0.08)", border: "rgba(240,230,226,0.15)" },
  ACCEPTED:            { color: "#C8B8B0", bg: "rgba(240,230,226,0.06)", border: "rgba(240,230,226,0.15)" },
  CREATOR_FUNDED:      { color: "#DDD0CC", bg: "rgba(240,230,226,0.08)", border: "rgba(240,230,226,0.15)" },
  COUNTERPARTY_FUNDED: { color: "#DDD0CC", bg: "rgba(240,230,226,0.08)", border: "rgba(240,230,226,0.15)" },
  LOCKED:              { color: "#DDD0CC", bg: "rgba(107,7,14,0.18)",   border: "rgba(240,230,226,0.18)" },
  SETTLEMENT_OPEN:     { color: "#DDD0CC", bg: "rgba(139,10,20,0.55)",               border: "rgba(240,230,226,0.22)" },
  RESOLVED:            { color: "#C8B8B0", bg: "rgba(240,230,226,0.06)", border: "rgba(240,230,226,0.15)" },
  DISPUTED:            { color: "#DDD0CC", bg: "rgba(240,230,226,0.08)", border: "rgba(240,230,226,0.15)" },
  FINALIZED:           { color: "#C8B8B0", bg: "rgba(240,230,226,0.06)", border: "rgba(240,230,226,0.18)" },
  CANCELLED:           { color: "#8A766D", bg: "rgba(138,118,109,0.08)", border: "rgba(138,118,109,0.20)" },
  INVALID:             { color: "#E27070", bg: "rgba(226,112,112,0.08)", border: "rgba(226,112,112,0.25)" },
};

export default function WagerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address, provider, canWrite, contractReady } = useGenLayer();

  const [wager, setWager] = useState<OnChainWager | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsHash, setTermsHash] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");

  const draft: LocalDraft | null =
    typeof window !== "undefined"
      ? (getDrafts().find((d) => d.draftId === id) ?? null)
      : null;

  const load = useCallback(async () => {
    if (!contractReady) return;
    setLoading(true);
    try {
      const w = await readGetWager(id);
      setWager(w);
      const h = await sha256Hex(JSON.stringify(w.terms));
      setTermsHash(h);
    } catch {
      // fall through to local draft
    } finally {
      setLoading(false);
    }
  }, [id, contractReady]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (wager || !draft?.terms) return;
    let cancelled = false;
    sha256Hex(JSON.stringify(draft.terms)).then((h) => {
      if (!cancelled) setTermsHash(h);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function execTx(fn: () => Promise<string>) {
    setTxError("");
    setTxStatus("signing");
    try {
      const hash = await fn();
      setTxHash(hash);
      setTxStatus("pending");
      await waitForTx(hash);
      setTxStatus("done");
      await load();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  const explorerUrl = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL;
  const busy = txStatus === "signing" || txStatus === "pending";

  // On-chain capsule view
  if (wager) {
    const s = STATUS_STYLES[wager.status] ?? STATUS_STYLES.CANCELLED;
    const terms = wager.terms as Record<string, unknown>;
    const isCreator      = address?.toLowerCase() === wager.creator.toLowerCase();
    const isCounterparty = address?.toLowerCase() === wager.counterparty.toLowerCase();

    return (
      <div className="space-y-6 max-w-3xl mx-auto route-in">
        <Link href="/app/wagers" className="font-exo text-xs tracking-widest transition-colors" style={{ color: "var(--dim-label)" }}>
          ← CAPSULES
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-exo text-sm tracking-widest px-2 py-0.5 rounded"
              style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
            >
              {wager.status}
            </span>
          </div>
          <h1 className="font-staatliches text-3xl tracking-wide" style={{ color: "var(--ink-text)" }}>
            {wager.question}
          </h1>
          <p className="font-azeret text-xs mt-1" style={{ color: "rgba(138,118,109,0.45)" }}>
            {wager.wagerId}
          </p>
        </div>

        <div className="rounded p-5" style={{ background: "var(--soft-panel)", border: "1px solid var(--glass-line)" }}>
          <div className="font-exo text-xs tracking-widest mb-3" style={{ color: "var(--dim-label)" }}>POSITIONS</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-exo text-sm tracking-widest mb-1" style={{ color: "rgba(240,230,226,0.55)" }}>POSITION A</div>
              <p className="font-nunito text-base" style={{ color: "var(--ink-text)" }}>{wager.creatorSide}</p>
            </div>
            <div>
              <div className="font-exo text-sm tracking-widest mb-1" style={{ color: "rgba(138,118,109,0.70)" }}>POSITION B</div>
              <p className="font-nunito text-base" style={{ color: "var(--ink-text)" }}>{wager.counterpartySide}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StakeTestUnitBox amount={wager.stakeAmountWei} currencyMode="INTERNAL_TEST_UNITS" />
          <EventCountdown deadline={wager.eventDeadline} />
        </div>

        <div className="space-y-2">
          <h2 className="font-staatliches text-3xl tracking-wide" style={{ color: "var(--ink-text)" }}>LOCKED TERMS</h2>
          <TermsLockPanel
            terms={terms as Parameters<typeof TermsLockPanel>[0]["terms"]}
            termsHash={termsHash}
          />
        </div>

        {/* Parties */}
        <div className="rounded p-4 space-y-2" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.40)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>PARTIES</div>
          {[
            ["CREATOR",      wager.creator],
            ["COUNTERPARTY", wager.counterparty],
          ].map(([label, addr]) => (
            <div key={label} className="flex justify-between">
              <span className="font-exo text-sm tracking-widest" style={{ color: "var(--dim-label)" }}>{label}</span>
              <span className="font-azeret text-sm" style={{ color: "rgba(203,194,192,0.60)" }}>
                {addr.slice(0, 10)}…{addr.slice(-6)}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="font-exo text-sm tracking-widest" style={{ color: "var(--dim-label)" }}>CREATED</span>
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>{formatTimestamp(wager.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        {canWrite && (
          <div className="space-y-3">
            {wager.status === "INVITED" && isCounterparty && (
              <button onClick={() => execTx(() => writeAcceptWager(provider!, address!, wager.wagerId))}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                ACCEPT CAPSULE
              </button>
            )}
            {(wager.status === "ACCEPTED" || wager.status === "CREATOR_FUNDED" || wager.status === "COUNTERPARTY_FUNDED") &&
              ((isCreator && !wager.creatorFunded) || (isCounterparty && !wager.counterpartyFunded)) && (
              <button onClick={() => execTx(() => writeFundWager(provider!, address!, wager.wagerId, BigInt(wager.stakeAmountWei)))}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                FUND CAPSULE ({wager.stakeAmountWei} wei)
              </button>
            )}
            {["INVITED", "ACCEPTED"].includes(wager.status) && isCreator && (
              <button onClick={() => execTx(() => writeCancelWager(provider!, address!, wager.wagerId))}
                disabled={busy}
                className="w-full rounded py-2.5 font-exo text-sm tracking-widest transition-colors disabled:opacity-50"
                style={{ border: "1px solid rgba(226,112,112,0.30)", color: "var(--invalid-alert)" }}>
                CANCEL CAPSULE
              </button>
            )}
            {wager.status === "DISPUTED" && (
              <button onClick={() => execTx(() => writeFinalizeWager(provider!, address!, wager.wagerId))}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                FINALISE
              </button>
            )}
            {wager.status === "FINALIZED" &&
              (isCreator && !wager.claimedByCreator || isCounterparty && !wager.claimedByCounterparty) && (
              <button onClick={() => execTx(() => writeClaimWinnings(provider!, address!, wager.wagerId))}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                CLAIM VERDICT
              </button>
            )}
            {["CANCELLED", "INVALID"].includes(wager.status) &&
              (isCreator && !wager.refundedCreator || isCounterparty && !wager.refundedCounterparty) && (
              <button onClick={() => execTx(() => writeClaimRefund(provider!, address!, wager.wagerId))}
                disabled={busy}
                className="w-full rounded py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "rgba(138,118,109,0.10)", border: "1px solid rgba(138,118,109,0.25)", color: "var(--push-neutral)" }}>
                CLAIM REFUND
              </button>
            )}
          </div>
        )}

        {/* Tx status */}
        {txStatus === "signing" && (
          <div className="flex items-center gap-2 rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(200,155,60,0.06)" }}>
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--dispute-signal)" }} />
            <span className="font-azeret text-sm" style={{ color: "var(--dispute-signal)" }}>Waiting for wallet signature…</span>
          </div>
        )}
        {txStatus === "pending" && (
          <div className="space-y-1 rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(107,7,14,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
              <span className="font-azeret text-sm" style={{ color: "var(--dim-label)" }}>Submitted, awaiting GenLayer consensus…</span>
            </div>
            {txHash && explorerUrl && (
              <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 font-azeret text-sm" style={{ color: "rgba(240,230,226,0.55)" }}>
                <ExternalLink className="h-3 w-3" />
                {txHash.slice(0, 20)}…{txHash.slice(-8)}
              </a>
            )}
          </div>
        )}
        {txStatus === "done" && (
          <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(122,158,111,0.06)" }}>
            <span className="font-azeret text-sm" style={{ color: "var(--canopy)" }}>Transaction confirmed.</span>
          </div>
        )}
        {txStatus === "error" && (
          <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
            <span className="font-nunito text-base" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
          </div>
        )}

        {/* Why GenLayer sealed note */}
        <div
          className="genlayer-note rounded-lg p-5"
          style={{ borderRadius: "8px" }}
        >
          <div className="font-exo text-sm tracking-widest mb-2 uppercase" style={{ color: "var(--dim-label)" }}>
            Why GenLayer
          </div>
          <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
            OddLock uses the GenLayer intelligent network to resolve settlement capsules. GenLayer validators
            fetch real-world evidence, apply the agreed terms, and reach decentralised consensus, producing a
            tamper-proof Referee Seal without relying on any single oracle or arbiter.
          </p>
        </div>

        {/* Nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href={`/app/wagers/${id}/settle`}
            className="flex items-center justify-between rounded px-4 py-3 font-exo text-sm tracking-widest transition-colors"
            style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.10)", color: "var(--dim-label)" }}>
            <div className="flex items-center gap-2"><Scale className="h-3.5 w-3.5" />RESOLUTION ROOM</div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link href={`/app/wagers/${id}/dispute`}
            className="flex items-center justify-between rounded px-4 py-3 font-exo text-sm tracking-widest transition-colors"
            style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}>
            <div className="flex items-center gap-2"><FileWarning className="h-3.5 w-3.5" />FILE OBJECTION</div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-24 justify-center">
        <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
        <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING CAPSULE…</span>
      </div>
    );
  }

  // Local draft fallback
  if (draft) {
    const terms = draft.terms as Parameters<typeof TermsLockPanel>[0]["terms"];
    const deadline = draft.terms.eventDeadline ?? FALLBACK_DEADLINE;

    return (
      <div className="space-y-6 max-w-3xl mx-auto route-in">
        <Link href="/app/wagers" className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
          ← CAPSULES
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--push-neutral)" }} />
            <span className="font-exo text-sm tracking-widest" style={{ color: "var(--dim-label)" }}>LOCAL DRAFT</span>
          </div>
          <h1 className="font-staatliches text-3xl tracking-wide" style={{ color: "var(--ink-text)" }}>
            {draft.title || "Untitled Capsule"}
          </h1>
        </div>
        <div className="rounded p-5" style={{ background: "var(--soft-panel)", border: "1px solid var(--glass-line)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>RESOLUTION QUESTION</div>
          <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--ink-text)" }}>
            {draft.terms.question || "N/A"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StakeTestUnitBox amount="100" currencyMode="INTERNAL_TEST_UNITS" />
          <EventCountdown deadline={deadline} />
        </div>
        <div className="space-y-2">
          <h2 className="font-staatliches text-3xl tracking-wide" style={{ color: "var(--ink-text)" }}>LOCKED TERMS</h2>
          <TermsLockPanel terms={terms} termsHash={termsHash} />
        </div>
        {/* Why GenLayer sealed note */}
        <div className="genlayer-note rounded-lg p-5">
          <div className="font-exo text-sm tracking-widest mb-2 uppercase" style={{ color: "var(--dim-label)" }}>
            Why GenLayer
          </div>
          <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
            OddLock uses the GenLayer intelligent network to resolve settlement capsules. GenLayer validators
            fetch real-world evidence, apply the agreed terms, and reach decentralised consensus, producing a
            tamper-proof Referee Seal without relying on any single oracle or arbiter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href={`/app/wagers/${id}/settle`}
            className="flex items-center justify-between rounded px-4 py-3 font-exo text-sm tracking-widest"
            style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.10)", color: "var(--dim-label)" }}>
            <div className="flex items-center gap-2"><Scale className="h-3.5 w-3.5" />RESOLUTION ROOM</div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link href={`/app/wagers/${id}/dispute`}
            className="flex items-center justify-between rounded px-4 py-3 font-exo text-sm tracking-widest"
            style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}>
            <div className="flex items-center gap-2"><FileWarning className="h-3.5 w-3.5" />FILE OBJECTION</div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded p-4" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.40)" }}>
          <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
            Local draft. Configure NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable on-chain capsules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Layers className="h-12 w-12 mb-4" style={{ color: "rgba(107,7,14,0.30)" }} />
      <h1 className="font-staatliches text-3xl tracking-wide mb-2" style={{ color: "rgba(203,194,192,0.45)" }}>
        CAPSULE NOT FOUND
      </h1>
      <p className="font-nunito text-base mb-6" style={{ color: "var(--dim-label)" }}>
        This capsule does not exist locally or on-chain.
      </p>
      <Link href="/app/wagers" className="font-exo text-sm tracking-widest hover:underline" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULES
      </Link>
    </div>
  );
}
