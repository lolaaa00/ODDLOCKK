"use client";

import { useState, useCallback } from "react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import {
  writeCreateWager,
  writeAcceptWager,
  writeFundWager,
  writeCancelWager,
  writeOpenSettlement,
  writeRequestSettlement,
  writeDisputeSettlement,
  writeFinalizeWager,
  writeClaimWinnings,
  writeClaimRefund,
  writeAddKeeper,
  writeRemoveKeeper,
  waitForTx,
} from "@/lib/oddlockContract";

export type TxStatus = "idle" | "signing" | "pending" | "done" | "error";

export function useOddLockWrites() {
  const { address, provider, canWrite } = useGenLayer();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");

  const resetTx = useCallback(() => {
    setTxStatus("idle");
    setTxHash("");
    setTxError("");
  }, []);

  async function execTx(
    fn: () => Promise<string>,
    onSuccess?: () => void | Promise<void>
  ) {
    if (!canWrite || !provider || !address) {
      setTxError("Wallet not connected or contract not configured.");
      setTxStatus("error");
      return;
    }
    resetTx();
    setTxStatus("signing");
    try {
      const hash = await fn();
      setTxHash(hash);
      setTxStatus("pending");
      await waitForTx(hash);
      setTxStatus("done");
      if (onSuccess) await onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      console.error("[OddLock:TX_ERROR]", { method: fn.name, error: err });
      setTxError(msg);
      setTxStatus("error");
    }
  }

  // ── Create ───────────────────────────────────────────────────────────────

  const createWager = useCallback(
    (
      termsJson: string,
      counterparty: string,
      stakeAmountWei: number,
      onSuccess?: () => void | Promise<void>
    ) =>
      execTx(
        () =>
          writeCreateWager(
            provider,
            address!,
            termsJson,
            counterparty,
            stakeAmountWei
          ),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Accept ───────────────────────────────────────────────────────────────

  const acceptWager = useCallback(
    (wagerId: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeAcceptWager(provider, address!, wagerId),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Fund ─────────────────────────────────────────────────────────────────

  const fundWager = useCallback(
    (
      wagerId: string,
      stakeAmountWei: bigint,
      onSuccess?: () => void | Promise<void>
    ) =>
      execTx(
        () =>
          writeFundWager(provider, address!, wagerId, stakeAmountWei),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Cancel ───────────────────────────────────────────────────────────────

  const cancelWager = useCallback(
    (wagerId: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeCancelWager(provider, address!, wagerId),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Open Settlement ──────────────────────────────────────────────────────

  const openSettlement = useCallback(
    (wagerId: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeOpenSettlement(provider, address!, wagerId),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Request Settlement ───────────────────────────────────────────────────

  const requestSettlement = useCallback(
    (
      wagerId: string,
      packetJson: string,
      onSuccess?: () => void | Promise<void>
    ) =>
      execTx(
        () =>
          writeRequestSettlement(
            provider,
            address!,
            wagerId,
            packetJson
          ),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Dispute ──────────────────────────────────────────────────────────────

  const disputeSettlement = useCallback(
    (
      wagerId: string,
      packetJson: string,
      onSuccess?: () => void | Promise<void>
    ) =>
      execTx(
        () =>
          writeDisputeSettlement(
            provider,
            address!,
            wagerId,
            packetJson
          ),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Finalize ─────────────────────────────────────────────────────────────

  const finalizeWager = useCallback(
    (wagerId: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeFinalizeWager(provider, address!, wagerId),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Claim Winnings ───────────────────────────────────────────────────────

  const claimWinnings = useCallback(
    (wagerId: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeClaimWinnings(provider, address!, wagerId),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Claim Refund ─────────────────────────────────────────────────────────

  const claimRefund = useCallback(
    (wagerId: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeClaimRefund(provider, address!, wagerId),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  // ── Keeper management ────────────────────────────────────────────────────

  const addKeeper = useCallback(
    (keeper: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeAddKeeper(provider, address!, keeper),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  const removeKeeper = useCallback(
    (keeper: string, onSuccess?: () => void | Promise<void>) =>
      execTx(
        () => writeRemoveKeeper(provider, address!, keeper),
        onSuccess
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, address, canWrite]
  );

  return {
    // State
    txStatus,
    txHash,
    txError,
    resetTx,
    canWrite,

    // Actions
    createWager,
    acceptWager,
    fundWager,
    cancelWager,
    openSettlement,
    requestSettlement,
    disputeSettlement,
    finalizeWager,
    claimWinnings,
    claimRefund,
    addKeeper,
    removeKeeper,
  };
}
