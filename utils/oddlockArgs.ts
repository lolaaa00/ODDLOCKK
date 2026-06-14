/**
 * Argument builders for every OddLock contract method.
 * Ensures args are in the exact order the contract expects.
 */

import type { DisputeGround } from "./oddlockStates";

// ── Terms (required by create_wager) ─────────────────────────────────────────

export interface WagerTermsInput {
  question: string;
  resolvesForCreatorIf: string;
  resolvesForCounterpartyIf: string;
  invalidIf: string;
  eventDeadline: number; // ms since epoch
  settlementOpensAt?: number;
  timezone: string;
  primarySource: string;
  fallbackSource: string;
  conflictRule: string;
  cancellationRule: string;
  postponementRule: string;
  disputeWindowHours: number;
}

export function validateTerms(terms: WagerTermsInput): string | null {
  if (!terms.question?.trim()) return "Question is required";
  if (!terms.resolvesForCreatorIf?.trim()) return "Creator resolution rule is required";
  if (!terms.resolvesForCounterpartyIf?.trim()) return "Counterparty resolution rule is required";
  if (!terms.invalidIf?.trim()) return "Invalid condition is required";
  if (!terms.timezone?.trim()) return "Timezone is required";
  if (!terms.primarySource?.trim()) return "Primary source is required";
  if (!terms.conflictRule?.trim()) return "Conflict rule is required";
  if (!terms.cancellationRule?.trim()) return "Cancellation rule is required";
  if (!terms.postponementRule?.trim()) return "Postponement rule is required";
  if (!terms.eventDeadline || terms.eventDeadline <= 0) return "Event deadline must be a positive timestamp";
  if (!terms.disputeWindowHours || terms.disputeWindowHours < 1) return "Dispute window must be at least 1 hour";
  if (terms.disputeWindowHours > 168) return "Dispute window cannot exceed 168 hours";
  return null;
}

// ── create_wager args ────────────────────────────────────────────────────────

export function buildCreateWagerArgs(
  terms: WagerTermsInput,
  counterparty: string,
  stakeAmountWei: number
): [string, string, number] {
  const termsJson = JSON.stringify(terms);
  return [termsJson, counterparty.toLowerCase().trim(), stakeAmountWei];
}

// ── accept_wager args ────────────────────────────────────────────────────────

export function buildAcceptWagerArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── fund_wager args ──────────────────────────────────────────────────────────

export function buildFundWagerArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── cancel_unaccepted_wager args ─────────────────────────────────────────────

export function buildCancelWagerArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── open_settlement args ─────────────────────────────────────────────────────

export function buildOpenSettlementArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── request_settlement args ──────────────────────────────────────────────────

export interface EvidenceItem {
  sourceTitle: string;
  sourceUrl: string;
  finding: string;
}

export interface SettlementPacketInput {
  evidence: EvidenceItem[];
  notes?: string;
}

export function validateSettlementPacket(packet: SettlementPacketInput): string | null {
  if (!packet.evidence || packet.evidence.length === 0) return "At least one evidence item is required";
  if (packet.evidence.length > 20) return "Maximum 20 evidence items allowed";
  for (const item of packet.evidence) {
    if (!item.sourceUrl?.trim() && !item.sourceTitle?.trim() && !item.finding?.trim()) {
      return "Each evidence item must have a source URL, title, or finding";
    }
  }
  return null;
}

export function buildRequestSettlementArgs(
  wagerId: string,
  packet: SettlementPacketInput
): [string, string] {
  return [wagerId, JSON.stringify(packet)];
}

// ── dispute_settlement args ──────────────────────────────────────────────────

export interface DisputePacketInput {
  ground: DisputeGround;
  explanation: string;
  evidence?: EvidenceItem[];
}

export function validateDisputePacket(packet: DisputePacketInput): string | null {
  if (!packet.ground?.trim()) return "Dispute ground is required";
  if (!packet.explanation?.trim()) return "Dispute explanation is required";
  if (packet.evidence && packet.evidence.length > 20) return "Maximum 20 evidence items";
  return null;
}

export function buildDisputeSettlementArgs(
  wagerId: string,
  packet: DisputePacketInput
): [string, string] {
  return [wagerId, JSON.stringify(packet)];
}

// ── finalize_wager args ──────────────────────────────────────────────────────

export function buildFinalizeWagerArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── claim_winnings args ──────────────────────────────────────────────────────

export function buildClaimWinningsArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── claim_refund args ────────────────────────────────────────────────────────

export function buildClaimRefundArgs(wagerId: string): [string] {
  return [wagerId];
}

// ── add_keeper args ──────────────────────────────────────────────────────────

export function buildAddKeeperArgs(keeper: string): [string] {
  return [keeper.toLowerCase().trim()];
}

// ── remove_keeper args ───────────────────────────────────────────────────────

export function buildRemoveKeeperArgs(keeper: string): [string] {
  return [keeper.toLowerCase().trim()];
}
