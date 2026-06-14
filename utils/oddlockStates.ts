/**
 * OddLock wager state machine.
 * Maps every contract status to allowed transitions, display info, and role checks.
 */

export const WAGER_STATUSES = [
  "INVITED",
  "ACCEPTED",
  "CREATOR_FUNDED",
  "COUNTERPARTY_FUNDED",
  "LOCKED",
  "SETTLEMENT_OPEN",
  "RESOLVED",
  "DISPUTED",
  "INVALID",
  "FINALIZED",
  "CANCELLED",
] as const;

export type WagerStatus = (typeof WAGER_STATUSES)[number];

export const SETTLEMENT_OUTCOMES = [
  "CREATOR_WINS",
  "COUNTERPARTY_WINS",
  "PUSH_REFUND",
  "INVALID",
  "MORE_EVIDENCE_REQUIRED",
] as const;

export type SettlementOutcome = (typeof SETTLEMENT_OUTCOMES)[number];

export const DISPUTE_OUTCOMES = [
  "UPHOLD",
  "REVERSE",
  "PUSH_REFUND",
  "INVALIDATE",
  "REOPEN_REVIEW",
  "MORE_EVIDENCE_REQUIRED",
] as const;

export type DisputeOutcome = (typeof DISPUTE_OUTCOMES)[number];

export const DISPUTE_GROUNDS = [
  "SOURCE_ERROR",
  "DEADLINE_ERROR",
  "TERMS_MISAPPLIED",
  "CANCELLATION_RULE_ERROR",
  "POSTPONEMENT_RULE_ERROR",
  "SOURCE_MANIPULATION",
  "AMBIGUOUS_TERMS",
] as const;

export type DisputeGround = (typeof DISPUTE_GROUNDS)[number];

/** Which actions are allowed from each status */
export const STATUS_TRANSITIONS: Record<WagerStatus, string[]> = {
  INVITED: ["accept", "cancel"],
  ACCEPTED: ["fund"],
  CREATOR_FUNDED: ["fund"],
  COUNTERPARTY_FUNDED: ["fund"],
  LOCKED: ["openSettlement", "requestSettlement"],
  SETTLEMENT_OPEN: ["requestSettlement"],
  RESOLVED: ["dispute", "finalize"],
  DISPUTED: [],
  INVALID: ["claimRefund"],
  FINALIZED: ["claimWinnings", "claimRefund"],
  CANCELLED: [],
};

/** Status display styling */
export const STATUS_STYLES: Record<
  WagerStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  INVITED: {
    color: "#DDD0CC",
    bg: "rgba(240,230,226,0.08)",
    border: "rgba(240,230,226,0.15)",
    label: "Invited",
  },
  ACCEPTED: {
    color: "#C8B8B0",
    bg: "rgba(240,230,226,0.06)",
    border: "rgba(240,230,226,0.15)",
    label: "Accepted",
  },
  CREATOR_FUNDED: {
    color: "#DDD0CC",
    bg: "rgba(240,230,226,0.08)",
    border: "rgba(240,230,226,0.15)",
    label: "Creator Funded",
  },
  COUNTERPARTY_FUNDED: {
    color: "#DDD0CC",
    bg: "rgba(240,230,226,0.08)",
    border: "rgba(240,230,226,0.15)",
    label: "Counterparty Funded",
  },
  LOCKED: {
    color: "#DDD0CC",
    bg: "rgba(107,7,14,0.18)",
    border: "rgba(240,230,226,0.18)",
    label: "Locked",
  },
  SETTLEMENT_OPEN: {
    color: "#DDD0CC",
    bg: "rgba(139,10,20,0.55)",
    border: "rgba(240,230,226,0.22)",
    label: "Settlement Open",
  },
  RESOLVED: {
    color: "#C8B8B0",
    bg: "rgba(240,230,226,0.06)",
    border: "rgba(240,230,226,0.15)",
    label: "Resolved",
  },
  DISPUTED: {
    color: "#DDD0CC",
    bg: "rgba(240,230,226,0.08)",
    border: "rgba(240,230,226,0.15)",
    label: "Disputed",
  },
  INVALID: {
    color: "#E27070",
    bg: "rgba(226,112,112,0.08)",
    border: "rgba(226,112,112,0.25)",
    label: "Invalid",
  },
  FINALIZED: {
    color: "#C8B8B0",
    bg: "rgba(240,230,226,0.06)",
    border: "rgba(240,230,226,0.18)",
    label: "Finalized",
  },
  CANCELLED: {
    color: "#8A766D",
    bg: "rgba(138,118,109,0.08)",
    border: "rgba(138,118,109,0.20)",
    label: "Cancelled",
  },
};

export function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status as WagerStatus] ?? STATUS_STYLES.CANCELLED
  );
}

/** Check if deadline has passed */
export function isDeadlinePassed(deadlineMs: number): boolean {
  return Date.now() >= deadlineMs;
}

/** Check if dispute window is still open */
export function isDisputeWindowOpen(
  resolvedAt: number,
  disputeWindowHours: number
): boolean {
  if (!resolvedAt || resolvedAt === 0) return false;
  const windowEnd = resolvedAt + disputeWindowHours * 3600 * 1000;
  return Date.now() <= windowEnd;
}

/** Check if dispute window has closed */
export function isDisputeWindowClosed(
  resolvedAt: number,
  disputeWindowHours: number
): boolean {
  if (!resolvedAt || resolvedAt === 0) return false;
  const windowEnd = resolvedAt + disputeWindowHours * 3600 * 1000;
  return Date.now() >= windowEnd;
}
