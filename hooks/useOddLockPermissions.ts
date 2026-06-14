"use client";

import { useState, useEffect } from "react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { readIsKeeper, readGetAdmin, type OnChainWager } from "@/lib/oddlockContract";
import {
  isDeadlinePassed,
  isDisputeWindowOpen,
  isDisputeWindowClosed,
} from "@/utils/oddlockStates";

export interface OddLockPermissions {
  // Identity
  isConnected: boolean;
  isMaker: boolean;
  isOpponent: boolean;
  isParticipant: boolean;
  isKeeper: boolean;
  isAdmin: boolean;

  // Wager-level permissions
  canAcceptWager: boolean;
  canCancelWager: boolean;
  canFundWager: boolean;
  canOpenSettlement: boolean;
  canTriggerResolution: boolean;
  canDispute: boolean;
  canFinalize: boolean;
  canClaimWinnings: boolean;
  canClaimRefund: boolean;

  // Global permissions
  canCreateWager: boolean;
  canAccessResolvePanel: boolean;
}

const EMPTY_PERMISSIONS: OddLockPermissions = {
  isConnected: false,
  isMaker: false,
  isOpponent: false,
  isParticipant: false,
  isKeeper: false,
  isAdmin: false,
  canAcceptWager: false,
  canCancelWager: false,
  canFundWager: false,
  canOpenSettlement: false,
  canTriggerResolution: false,
  canDispute: false,
  canFinalize: false,
  canClaimWinnings: false,
  canClaimRefund: false,
  canCreateWager: false,
  canAccessResolvePanel: false,
};

/**
 * Compute permissions for the connected wallet against an optional wager.
 */
export function useOddLockPermissions(
  wager?: OnChainWager | null
): OddLockPermissions {
  const { address, isConnected, canWrite } = useGenLayer();
  const [isKeeper, setIsKeeper] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch keeper/admin status when address changes
  useEffect(() => {
    if (!address) {
      setIsKeeper(false);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;

    readIsKeeper(address)
      .then((result) => {
        if (!cancelled) setIsKeeper(result);
      })
      .catch(() => {
        if (!cancelled) setIsKeeper(false);
      });

    readGetAdmin()
      .then((adminAddr) => {
        if (!cancelled)
          setIsAdmin(
            adminAddr?.toLowerCase() === address?.toLowerCase()
          );
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!isConnected || !address) {
    return { ...EMPTY_PERMISSIONS };
  }

  const lowerAddress = address.toLowerCase();

  // Global permissions (no wager needed)
  const canCreateWager = canWrite;
  const canAccessResolvePanel = isKeeper || isAdmin;

  if (!wager) {
    return {
      ...EMPTY_PERMISSIONS,
      isConnected: true,
      isKeeper,
      isAdmin,
      canCreateWager,
      canAccessResolvePanel,
    };
  }

  // Wager-level identity
  const isMaker = wager.creator?.toLowerCase() === lowerAddress;
  const isOpponent = wager.counterparty?.toLowerCase() === lowerAddress;
  const isParticipant = isMaker || isOpponent;
  const status = wager.status;
  const terms = wager.terms as Record<string, unknown>;
  const disputeHours = Number(terms?.disputeWindowHours ?? 24);

  // Accept: only counterparty, only INVITED, deadline not passed
  const canAcceptWager =
    isOpponent &&
    status === "INVITED" &&
    !isDeadlinePassed(wager.eventDeadline);

  // Cancel: only creator, only INVITED
  const canCancelWager = isMaker && status === "INVITED";

  // Fund: participant, status is ACCEPTED/CREATOR_FUNDED/COUNTERPARTY_FUNDED, haven't funded yet
  const canFundWager =
    isParticipant &&
    ["ACCEPTED", "CREATOR_FUNDED", "COUNTERPARTY_FUNDED"].includes(status) &&
    ((isMaker && !wager.creatorFunded) ||
      (isOpponent && !wager.counterpartyFunded));

  // Open settlement: party/admin/keeper, LOCKED, settlement time reached
  const canOpenSettlement =
    (isParticipant || isAdmin || isKeeper) &&
    status === "LOCKED" &&
    isDeadlinePassed(wager.settlementOpensAt);

  // Trigger resolution: party/admin/keeper, LOCKED or SETTLEMENT_OPEN, settlement time reached
  const canTriggerResolution =
    (isParticipant || isAdmin || isKeeper) &&
    (status === "LOCKED" || status === "SETTLEMENT_OPEN") &&
    isDeadlinePassed(wager.settlementOpensAt);

  // Dispute: party only, RESOLVED, dispute window open
  const canDispute =
    isParticipant &&
    status === "RESOLVED" &&
    isDisputeWindowOpen(wager.resolvedAt, disputeHours);

  // Finalize: anyone (contract checks dispute window), RESOLVED, window closed
  const canFinalize =
    status === "RESOLVED" &&
    isDisputeWindowClosed(wager.resolvedAt, disputeHours);

  // Claim winnings: winner, FINALIZED
  const canClaimWinnings =
    status === "FINALIZED" &&
    isParticipant &&
    ((isMaker && !wager.claimedByCreator) ||
      (isOpponent && !wager.claimedByCounterparty));

  // Claim refund: party, FINALIZED or INVALID, outcome is refundable
  const canClaimRefund =
    isParticipant &&
    (status === "FINALIZED" || status === "INVALID") &&
    ((isMaker && !wager.refundedCreator) ||
      (isOpponent && !wager.refundedCounterparty));

  return {
    isConnected: true,
    isMaker,
    isOpponent,
    isParticipant,
    isKeeper,
    isAdmin,
    canAcceptWager,
    canCancelWager,
    canFundWager,
    canOpenSettlement,
    canTriggerResolution,
    canDispute,
    canFinalize,
    canClaimWinnings,
    canClaimRefund,
    canCreateWager,
    canAccessResolvePanel,
  };
}
