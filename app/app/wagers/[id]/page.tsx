"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scale, FileWarning, ChevronRight, ExternalLink, Layers, Upload, AlertTriangle, Pencil, Trash2,
} from "lucide-react";
import { getDrafts, publishDraft, deleteDraft } from "@/lib/storage/drafts";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { useWager } from "@/hooks/useOddLockReads";
import { useOddLockWrites } from "@/hooks/useOddLockWrites";
import { useOddLockPermissions } from "@/hooks/useOddLockPermissions";
import { getStatusStyle } from "@/utils/oddlockStates";
import {
  EXPLORER_URL, CONTRACT_ADDRESS, CHAIN_ID, isContractConfigured,
} from "@/lib/genlayerClient";
import { isAddress } from "viem";
import {
  writeCreateWager, waitForTx, readGetUserWagers, readGetWager,
  type OnChainWager,
} from "@/lib/oddlockContract";
import { validateTerms } from "@/utils/oddlockArgs";
import { TermsLockPanel } from "@/components/wagers/TermsLockPanel";
import { StakeTestUnitBox } from "@/components/wagers/StakeTestUnitBox";
import { EventCountdown } from "@/components/wagers/EventCountdown";
import type { LocalDraft, WagerTerms } from "@/types/wager";
import { sha256Hex, formatTimestamp } from "@/lib/utils";

const FALLBACK_DEADLINE = Date.now() + 86400000;

export default function WagerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address, provider, isConnected, canWrite } = useGenLayer();

  // Local draft — load from localStorage after mount to avoid SSR hydration mismatch.
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);
  useEffect(() => {
    setDraft(getDrafts().find((d) => d.draftId === id) ?? null);
    setDraftChecked(true);
  }, [id]);

  // Resolve the on-chain wager ID.
  // Don't resolve until draftChecked to avoid a flash fetch with the raw URL id.
  // contractWagerId is always a real wager_* ID (never pending_*) after publish.
  const contractWagerId = draft?.contractWagerId || "";
  const onChainId = !draftChecked
    ? undefined                              // wait for localStorage check
    : contractWagerId || (draft ? undefined : id);

  // Contract reads — only fetch if we have a contractWagerId or this isn't a draft
  const { data: wager, loading, error: loadError, refetch } = useWager(onChainId);

  // Terms hash
  const [termsHash, setTermsHash] = useState("");
  useEffect(() => {
    const source = wager?.terms ?? (draft?.terms || null);
    if (!source) return;
    let cancelled = false;
    sha256Hex(JSON.stringify(source)).then((h) => {
      if (!cancelled) setTermsHash(h);
    });
    return () => { cancelled = true; };
  }, [wager, draft]);

  // Writes
  const {
    txStatus, txHash, txError,
    acceptWager, fundWager, cancelWager,
    finalizeWager, claimWinnings, claimRefund,
  } = useOddLockWrites();

  // Publish state (separate from contract write actions)
  const [publishStatus, setPublishStatus] = useState<"idle" | "signing" | "pending" | "done" | "error">("idle");
  const [publishHash, setPublishHash] = useState("");
  const [publishError, setPublishError] = useState("");

  // Permissions
  const perms = useOddLockPermissions(wager);

  const busy = txStatus === "signing" || txStatus === "pending";
  const isPublished = !!contractWagerId; // true when we have a real on-chain ID
  const isDraftLocal = draft && !contractWagerId; // no contractWagerId at all

  // ── Publish handler ──────────────────────────────────────────────────────
  async function handlePublish() {
    if (!draft) return;

    // ── Pre-flight: contract address ────────────────────────────────
    if (!CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
      setPublishError(
        `ODDLOCK_CONTRACT_ADDRESS_MISSING — Contract address is "${String(CONTRACT_ADDRESS)}". ` +
        `Set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS in .env.local.`
      );
      setPublishStatus("error");
      return;
    }

    // ── Pre-flight: wallet ──────────────────────────────────────────
    if (!provider || !address || !canWrite) {
      setPublishError("WALLET_NOT_CONNECTED — Connect your wallet before publishing.");
      setPublishStatus("error");
      return;
    }
    if (!isAddress(address)) {
      setPublishError(`WALLET_NOT_CONNECTED — Wallet address "${address}" is not a valid address.`);
      setPublishStatus("error");
      return;
    }

    // ── Pre-flight: terms ───────────────────────────────────────────
    const terms = draft.terms as WagerTerms;
    const termsValidation = validateTerms(terms);
    if (termsValidation) {
      setPublishError(termsValidation);
      setPublishStatus("error");
      return;
    }

    // ── Pre-flight: counterparty ────────────────────────────────────
    const counterparty = draft.counterparty;
    if (!counterparty || !isAddress(counterparty)) {
      setPublishError(
        `COUNTERPARTY_ADDRESS_REQUIRED — Counterparty is "${String(counterparty ?? "missing")}". ` +
        `Edit the draft to add a valid counterparty wallet address.`
      );
      setPublishStatus("error");
      return;
    }

    // ── Pre-flight: stake ───────────────────────────────────────────
    const stakeWei = Math.floor(Number(draft.stakeAmount || "100") * 1e18);
    if (stakeWei <= 0 || !Number.isFinite(stakeWei)) {
      setPublishError("Invalid stake amount.");
      setPublishStatus("error");
      return;
    }

    // ── All pre-flight checks passed — log everything ───────────────
    const publishPayload = {
      contractAddress: CONTRACT_ADDRESS,
      connectedWallet: address,
      counterparty,
      stakeWei,
      termsJson: JSON.stringify(terms).slice(0, 200) + "…",
      draftId: draft.draftId,
    };
    console.log("[OddLock:PUBLISH] Pre-flight passed ✓", publishPayload);

    setPublishStatus("signing");
    setPublishError("");
    setPublishHash("");

    try {
      const hash = await writeCreateWager(
        provider,
        address,
        JSON.stringify(terms),
        counterparty,
        stakeWei
      );
      setPublishHash(hash);
      setPublishStatus("pending");

      // Wait for tx receipt
      const receipt = await waitForTx(hash);
      console.log("[OddLock:PUBLISH] Receipt:", receipt);

      // ── Discover real wager ID ─────────────────────────────────────
      // GenLayer may return the wager_id in the receipt, or we discover
      // it by fetching the user's wager list and matching by properties.
      let contractWagerId = "";

      // Attempt 1: extract from receipt fields
      if (receipt && typeof receipt === "object") {
        const r = receipt as Record<string, unknown>;
        if (typeof r.result === "string" && r.result.startsWith("wager_")) {
          contractWagerId = r.result;
        } else if (typeof r.data === "string" && r.data.startsWith("wager_")) {
          contractWagerId = r.data;
        }
      }
      if (typeof receipt === "string" && receipt.startsWith("wager_")) {
        contractWagerId = receipt;
      }

      // Attempt 2: discover via get_user_wagers + matching
      if (!contractWagerId) {
        console.log("[OddLock:PUBLISH] Discovering wager ID via get_user_wagers…");
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            if (attempt > 1) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY));
            }
            const userWagerIds = await readGetUserWagers(address);
            console.log(`[OddLock:PUBLISH] Attempt ${attempt}: user has ${userWagerIds.length} wagers`);

            // Check each wager to find the one matching our draft
            for (const wid of userWagerIds.reverse()) { // newest first
              try {
                const w = await readGetWager(wid);
                const match =
                  w.creator?.toLowerCase() === address.toLowerCase() &&
                  w.counterparty?.toLowerCase() === counterparty.toLowerCase() &&
                  w.stakeAmountWei === String(stakeWei) &&
                  w.question === (terms.question || "").slice(0, 500);

                if (match) {
                  contractWagerId = wid;
                  console.log("[OddLock:PUBLISH] Matched wager:", {
                    wagerId: wid,
                    creator: w.creator,
                    counterparty: w.counterparty,
                    stake: w.stakeAmountWei,
                    status: w.status,
                  });
                  break;
                }
              } catch {
                // individual wager fetch failed, skip
              }
            }
            if (contractWagerId) break;
          } catch (err) {
            console.warn(`[OddLock:PUBLISH] Discovery attempt ${attempt} failed:`, err);
          }
        }
      }

      if (!contractWagerId) {
        console.error("[OddLock:PUBLISH] Could not discover wager ID after tx. The tx may still be processing.");
        setPublishError(
          "Transaction submitted but wager ID could not be discovered. " +
          "The transaction may still be in consensus. Check the debug panel below or reload the page."
        );
        // Still save the tx hash so the user can track it
        publishDraft(draft.draftId, "", hash, CONTRACT_ADDRESS, CHAIN_ID);
        setDraft(getDrafts().find((d) => d.draftId === id) ?? null);
        setPublishStatus("error");
        return;
      }

      // ── Save the real wager ID ─────────────────────────────────────
      console.log("[OddLock:PUBLISH] Storing real contractWagerId:", contractWagerId);
      publishDraft(draft.draftId, contractWagerId, hash, CONTRACT_ADDRESS, CHAIN_ID);

      // Refresh the local draft state
      setDraft(getDrafts().find((d) => d.draftId === id) ?? null);
      setPublishStatus("done");

      // Refetch the on-chain wager data
      setTimeout(() => refetch(), 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      console.error("[OddLock:PUBLISH_ERROR]", err);
      setPublishError(msg);
      setPublishStatus("error");
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading && !draft) {
    return (
      <div className="flex items-center gap-2 py-24 justify-center">
        <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
        <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOADING CAPSULE…</span>
      </div>
    );
  }

  // ── On-chain capsule view (either direct ID or published draft) ────────
  if (wager) {
    const s = getStatusStyle(wager.status);
    const terms = wager.terms as Record<string, unknown>;

    return (
      <div className="space-y-6 max-w-3xl mx-auto route-in">
        <Link href="/app/wagers" className="font-exo text-xs tracking-widest transition-colors" style={{ color: "var(--dim-label)" }}>
          ← CAPSULES
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-exo text-xs tracking-widest px-2 py-0.5 rounded"
              style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
            >
              {s.label}
            </span>
            {isPublished && (
              <span className="font-exo text-xs tracking-widest px-2 py-0.5 rounded"
                style={{ color: "var(--canopy)", background: "rgba(122,158,111,0.10)", border: "1px solid rgba(122,158,111,0.25)" }}>
                ON-CHAIN
              </span>
            )}
          </div>
          <h1 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>
            {wager.question}
          </h1>
          <p className="font-azeret text-xs mt-1" style={{ color: "rgba(138,118,109,0.45)" }}>
            {wager.wagerId}
          </p>
        </div>

        {/* Positions */}
        <div className="rounded p-5" style={{ background: "var(--soft-panel)", border: "1px solid var(--glass-line)" }}>
          <div className="font-exo text-xs tracking-widest mb-3" style={{ color: "var(--dim-label)" }}>POSITIONS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-exo text-xs tracking-widest mb-1" style={{ color: "rgba(240,230,226,0.55)" }}>POSITION A (CREATOR)</div>
              <p className="font-nunito text-sm" style={{ color: "var(--ink-text)" }}>{wager.creatorSide}</p>
            </div>
            <div>
              <div className="font-exo text-xs tracking-widest mb-1" style={{ color: "rgba(138,118,109,0.70)" }}>POSITION B (COUNTERPARTY)</div>
              <p className="font-nunito text-sm" style={{ color: "var(--ink-text)" }}>{wager.counterpartySide}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StakeTestUnitBox amount={wager.stakeAmountWei} currencyMode="INTERNAL_TEST_UNITS" />
          <EventCountdown deadline={wager.eventDeadline} />
        </div>

        {/* Locked Terms */}
        <div className="space-y-2">
          <h2 className="font-staatliches text-base md:text-lg tracking-wide" style={{ color: "var(--ink-text)" }}>LOCKED TERMS</h2>
          <TermsLockPanel
            terms={terms as Parameters<typeof TermsLockPanel>[0]["terms"]}
            termsHash={termsHash}
          />
        </div>

        {/* Parties */}
        <div className="rounded p-4 space-y-2" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.40)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>PARTIES</div>
          {[
            ["CREATOR", wager.creator, perms.isMaker],
            ["COUNTERPARTY", wager.counterparty, perms.isOpponent],
          ].map(([label, addr, isYou]) => (
            <div key={label as string} className="flex justify-between items-center">
              <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
                {label as string} {isYou ? "(YOU)" : ""}
              </span>
              <span className="font-azeret text-xs" style={{ color: "rgba(203,194,192,0.60)" }}>
                {addr ? `${(addr as string).slice(0, 10)}…${(addr as string).slice(-6)}` : "—"}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>FUNDING</span>
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
              Creator: {wager.creatorFunded ? "✓" : "—"} · Counterparty: {wager.counterpartyFunded ? "✓" : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>CREATED</span>
            <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>{formatTimestamp(wager.createdAt)}</span>
          </div>
          {wager.totalEscrowedWei && wager.totalEscrowedWei !== "0" && (
            <div className="flex justify-between">
              <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>ESCROWED</span>
              <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>{wager.totalEscrowedWei} wei</span>
            </div>
          )}
        </div>

        {/* ── Actions (permission-gated, requires on-chain wager) ──────── */}
        {isConnected && (
          <div className="space-y-3">
            {perms.canAcceptWager && (
              <button onClick={() => acceptWager(wager.wagerId, refetch)}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                ACCEPT CAPSULE
              </button>
            )}
            {perms.canFundWager && (
              <button onClick={() => fundWager(wager.wagerId, BigInt(wager.stakeAmountWei), refetch)}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                FUND CAPSULE ({wager.stakeAmountWei} wei)
              </button>
            )}
            {perms.canCancelWager && (
              <button onClick={() => cancelWager(wager.wagerId, refetch)}
                disabled={busy}
                className="w-full rounded py-2.5 font-exo text-xs tracking-widest transition-colors disabled:opacity-50"
                style={{ border: "1px solid rgba(226,112,112,0.30)", color: "var(--invalid-alert)" }}>
                CANCEL CAPSULE
              </button>
            )}
            {perms.canOpenSettlement && (
              <Link href={`/app/wagers/${wager.wagerId}/settle`}
                className="btn-tribunal block text-center w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity">
                OPEN SETTLEMENT
              </Link>
            )}
            {perms.canTriggerResolution && (
              <Link href={`/app/wagers/${wager.wagerId}/settle`}
                className="btn-tribunal block text-center w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity">
                TRIGGER RESOLUTION
              </Link>
            )}
            {perms.canDispute && (
              <Link href={`/app/wagers/${wager.wagerId}/dispute`}
                className="block text-center w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity"
                style={{ border: "1px solid rgba(240,230,226,0.15)", color: "var(--dim-label)" }}>
                FILE OBJECTION
              </Link>
            )}
            {perms.canFinalize && (
              <button onClick={() => finalizeWager(wager.wagerId, refetch)}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                FINALISE CAPSULE
              </button>
            )}
            {perms.canClaimWinnings && (
              <button onClick={() => claimWinnings(wager.wagerId, refetch)}
                disabled={busy}
                className="btn-tribunal w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                CLAIM VERDICT
              </button>
            )}
            {perms.canClaimRefund && (
              <button onClick={() => claimRefund(wager.wagerId, refetch)}
                disabled={busy}
                className="w-full rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "rgba(138,118,109,0.10)", border: "1px solid rgba(138,118,109,0.25)", color: "var(--push-neutral)" }}>
                CLAIM REFUND
              </button>
            )}
          </div>
        )}

        {/* Tx status */}
        <TxStatusDisplay txStatus={txStatus} txHash={txHash} txError={txError} />

        {/* Debug panel */}
        <DebugPanel
          connectedWallet={address}
          publishTxHash={draft?.publishTxHash}
          contractWagerId={wager.wagerId}
          wager={wager}
          draft={draft}
        />

        {/* Nav links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href={`/app/wagers/${wager.wagerId}/settle`}
            className="flex items-center justify-between rounded px-4 py-3 font-exo text-xs tracking-widest transition-colors"
            style={{ border: "1px solid var(--glass-line)", background: "rgba(107,7,14,0.10)", color: "var(--dim-label)" }}>
            <div className="flex items-center gap-2"><Scale className="h-3.5 w-3.5" />RESOLUTION ROOM</div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link href={`/app/wagers/${wager.wagerId}/dispute`}
            className="flex items-center justify-between rounded px-4 py-3 font-exo text-xs tracking-widest transition-colors"
            style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}>
            <div className="flex items-center gap-2"><FileWarning className="h-3.5 w-3.5" />FILE OBJECTION</div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Local draft view (not yet published) ────────────────────────────────
  if (draft) {
    const terms = draft.terms as Parameters<typeof TermsLockPanel>[0]["terms"];
    const deadline = draft.terms.eventDeadline ?? FALLBACK_DEADLINE;
    const contractReady = isContractConfigured();
    const publishBusy = publishStatus === "signing" || publishStatus === "pending";
    const hasValidCounterparty = !!draft.counterparty && isAddress(draft.counterparty);
    const canPublish = contractReady && canWrite && hasValidCounterparty && !publishBusy && !isPublished;

    return (
      <div className="space-y-6 max-w-3xl mx-auto route-in">
        <Link href="/app/wagers" className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
          ← CAPSULES
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--push-neutral)" }} />
            <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOCAL DRAFT — NOT ON CHAIN</span>
          </div>
          <h1 className="font-staatliches text-base md:text-lg tracking-wide" style={{ color: "var(--ink-text)" }}>
            {draft.title || "Untitled Capsule"}
          </h1>
          <p className="font-azeret text-xs mt-1" style={{ color: "rgba(138,118,109,0.35)" }}>
            Draft ID: {draft.draftId}
          </p>
        </div>

        <div className="rounded p-5" style={{ background: "var(--soft-panel)", border: "1px solid var(--glass-line)" }}>
          <div className="font-exo text-xs tracking-widest mb-2" style={{ color: "var(--dim-label)" }}>RESOLUTION QUESTION</div>
          <p className="font-nunito text-sm leading-relaxed" style={{ color: "var(--ink-text)" }}>
            {draft.terms.question || "N/A"}
          </p>
        </div>

        {/* Draft details */}
        {(draft.counterparty || draft.stakeAmount) && (
          <div className="rounded p-4 space-y-2" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.40)" }}>
            {draft.counterparty && (
              <div className="flex justify-between items-center">
                <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>COUNTERPARTY</span>
                <span className="font-azeret text-xs" style={{ color: "rgba(203,194,192,0.60)" }}>
                  {draft.counterparty.slice(0, 10)}…{draft.counterparty.slice(-6)}
                </span>
              </div>
            )}
            {draft.stakeAmount && (
              <div className="flex justify-between items-center">
                <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>STAKE</span>
                <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
                  {draft.stakeAmount} test units
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <StakeTestUnitBox amount={draft.stakeAmount || "—"} currencyMode="INTERNAL_TEST_UNITS" />
          <EventCountdown deadline={deadline} />
        </div>

        <div className="space-y-2">
          <h2 className="font-staatliches text-base md:text-lg tracking-wide" style={{ color: "var(--ink-text)" }}>TERMS PREVIEW</h2>
          <TermsLockPanel terms={terms} termsHash={termsHash} />
        </div>

        {/* ── EDIT / DELETE (draft only) ─────────────────────────────── */}
        <div className="flex gap-3">
          <Link
            href={`/app/wagers/${id}/edit`}
            className="flex-1 flex items-center justify-center gap-2 rounded py-2.5 font-exo text-xs tracking-widest transition-colors"
            style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
          >
            <Pencil className="h-3.5 w-3.5" />
            EDIT DRAFT
          </Link>
          <button
            onClick={() => {
              if (confirm("Delete this draft? This cannot be undone.")) {
                deleteDraft(id);
                router.push("/app/wagers");
              }
            }}
            className="flex items-center justify-center gap-2 rounded px-5 py-2.5 font-exo text-xs tracking-widest transition-colors"
            style={{ border: "1px solid rgba(226,112,112,0.30)", color: "var(--invalid-alert)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            DELETE
          </button>
        </div>

        {/* ── PUBLISH BUTTON ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {!contractReady && (
            <div className="flex items-start gap-2 rounded p-4" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--invalid-alert)" }} />
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                Contract not configured. Set <span className="font-azeret">NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS</span> to publish.
              </p>
            </div>
          )}

          {contractReady && !isConnected && (
            <div className="rounded p-4" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                Connect your wallet to publish this capsule to GenLayer Studionet.
              </p>
            </div>
          )}

          {contractReady && isConnected && !hasValidCounterparty && (
            <div className="flex items-start gap-2 rounded p-4" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--dispute-signal)" }} />
              <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>
                Add a valid counterparty wallet address before publishing.
                Only that address can accept the locked capsule.{" "}
                <Link href={`/app/wagers/${id}/edit`} className="underline" style={{ color: "var(--dispute-signal)" }}>
                  Edit draft →
                </Link>
              </p>
            </div>
          )}

          {contractReady && canWrite && (
            <button
              onClick={handlePublish}
              disabled={!canPublish}
              className="btn-tribunal w-full flex items-center justify-center gap-2 rounded py-3 font-staatliches text-sm tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {publishBusy
                ? publishStatus === "signing" ? "AWAITING SIGNATURE…" : "PUBLISHING…"
                : "PUBLISH TO GENLAYER"}
            </button>
          )}

          {/* Publish tx status */}
          {publishStatus === "signing" && (
            <div className="flex items-center gap-2 rounded px-4 py-3" style={{ border: "1px solid rgba(200,155,60,0.25)", background: "rgba(200,155,60,0.06)" }}>
              <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--dispute-signal)" }} />
              <span className="font-azeret text-xs" style={{ color: "var(--dispute-signal)" }}>Waiting for wallet signature…</span>
            </div>
          )}
          {publishStatus === "pending" && (
            <div className="space-y-1 rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(107,7,14,0.08)" }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bio-glow)" }} />
                <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>Submitted, awaiting GenLayer consensus…</span>
              </div>
              {publishHash && (
                <a href={`${EXPLORER_URL}/tx/${publishHash}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 font-azeret text-xs" style={{ color: "rgba(240,230,226,0.55)" }}>
                  <ExternalLink className="h-3 w-3" />
                  {publishHash.slice(0, 20)}…{publishHash.slice(-8)}
                </a>
              )}
            </div>
          )}
          {publishStatus === "done" && (
            <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(122,158,111,0.25)", background: "rgba(122,158,111,0.06)" }}>
              <span className="font-azeret text-xs" style={{ color: "var(--canopy)" }}>
                Published to GenLayer! Contract wager ID: {draft.contractWagerId}
              </span>
            </div>
          )}
          {publishStatus === "error" && (
            <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
              <span className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{publishError}</span>
            </div>
          )}
        </div>

        {/* Debug panel */}
        <DebugPanel
          connectedWallet={address}
          publishTxHash={publishHash || draft.publishTxHash}
          contractWagerId={draft.contractWagerId}
          wager={wager}
          draft={draft}
        />

        {/* Status notice */}
        {!isPublished && (
          <div className="rounded p-4" style={{ border: "1px solid rgba(212,160,23,0.25)", background: "rgba(212,160,23,0.06)" }}>
            <p className="font-nunito text-sm leading-relaxed" style={{ color: "var(--dim-label)" }}>
              This is a local draft. Publish it to GenLayer first before the counterparty can accept,
              fund, or trigger settlement. Contract actions are blocked until published.
              {loadError && !isDraftLocal && <><br /><span style={{ color: "var(--invalid-alert)" }}>Backend: {loadError}</span></>}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Layers className="h-12 w-12 mb-4" style={{ color: "rgba(107,7,14,0.30)" }} />
      <h1 className="font-staatliches text-base md:text-lg tracking-wide mb-2" style={{ color: "rgba(203,194,192,0.45)" }}>
        CAPSULE NOT FOUND
      </h1>
      <p className="font-nunito text-sm mb-6" style={{ color: "var(--dim-label)" }}>
        This capsule does not exist locally or on-chain.
      </p>
      <Link href="/app/wagers" className="font-exo text-xs tracking-widest hover:underline" style={{ color: "var(--dim-label)" }}>
        ← BACK TO CAPSULES
      </Link>
    </div>
  );
}

function TxStatusDisplay({ txStatus, txHash, txError }: { txStatus: string; txHash: string; txError: string }) {
  if (txStatus === "idle") return null;
  return (
    <>
      {txStatus === "signing" && (
        <div className="flex items-center gap-2 rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(200,155,60,0.06)" }}>
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
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(122,158,111,0.06)" }}>
          <span className="font-azeret text-xs" style={{ color: "var(--canopy)" }}>Transaction confirmed. Contract state refreshed.</span>
        </div>
      )}
      {txStatus === "error" && (
        <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <span className="font-nunito text-sm" style={{ color: "var(--invalid-alert)" }}>{txError}</span>
        </div>
      )}
    </>
  );
}

function DebugPanel({
  connectedWallet,
  publishTxHash,
  contractWagerId,
  wager,
  draft,
}: {
  connectedWallet?: string;
  publishTxHash?: string;
  contractWagerId?: string;
  wager?: OnChainWager | null;
  draft?: LocalDraft | null;
}) {
  const [open, setOpen] = useState(false);
  const rows: [string, string][] = [
    ["Connected Wallet", connectedWallet || "—"],
    ["Publish Tx Hash", publishTxHash || "—"],
    ["Contract Wager ID", contractWagerId || "— (not yet discovered)"],
    ["On-Chain Status", wager?.status || "— (not loaded)"],
    ["Creator", wager?.creator || "—"],
    ["Counterparty", wager?.counterparty || draft?.counterparty || "—"],
    ["Creator Funded", wager ? (wager.creatorFunded ? "Yes" : "No") : "—"],
    ["Counterparty Funded", wager ? (wager.counterpartyFunded ? "Yes" : "No") : "—"],
    ["Stake (wei)", wager?.stakeAmountWei || "—"],
    ["Total Escrowed (wei)", wager?.totalEscrowedWei || "—"],
    ["Event Deadline", wager?.eventDeadline ? formatTimestamp(wager.eventDeadline) : "—"],
    ["Settlement Opens At", wager?.settlementOpensAt ? formatTimestamp(wager.settlementOpensAt) : "—"],
    ["Settlement Report ID", wager?.settlementReportId || "—"],
    ["Dispute Report ID", wager?.disputeReportId || "—"],
    ["Draft ID", draft?.draftId || "—"],
    ["Draft Status", draft?.status || "—"],
  ];

  return (
    <div className="rounded" style={{ border: "1px solid rgba(138,118,109,0.20)", background: "rgba(30,18,16,0.60)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 font-exo text-xs tracking-widest"
        style={{ color: "var(--dim-label)" }}
      >
        <span>DEBUG PANEL</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="font-exo text-xs tracking-widest shrink-0" style={{ color: "rgba(138,118,109,0.55)" }}>
                {label}
              </span>
              <span
                className="font-azeret text-xs text-right truncate"
                style={{ color: "rgba(203,194,192,0.60)", maxWidth: "60%" }}
                title={value}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
