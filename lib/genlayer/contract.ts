"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "./config";
import type { Address } from "@/types/wager";

// ── Client factory ────────────────────────────────────────────────────────────

function makeClient(provider?: unknown) {
  return createClient({
    chain: studionet,
    endpoint: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api",
    ...(provider ? { provider } : {}),
  });
}

// ── Types matching the updated contract ───────────────────────────────────────

export type OnChainWager = {
  wagerId: string;
  creator: string;
  counterparty: string;
  question: string;
  creatorSide: string;
  counterpartySide: string;
  stakeAmountWei: string;
  totalEscrowedWei: string;
  currencyMode: string;
  creatorFunded: boolean;
  counterpartyFunded: boolean;
  eventDeadline: number;
  settlementOpensAt: number;
  sourcePolicyId: string;
  status: string;
  termsHash: string;
  terms: Record<string, unknown>;
  settlementReportId: string;
  disputeReportId: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number;
  finalizedAt: number;
  claimedByCreator: boolean;
  claimedByCounterparty: boolean;
  refundedCreator: boolean;
  refundedCounterparty: boolean;
};

export type OnChainSettlement = {
  reportId: string;
  wagerId: string;
  outcome: string;
  confidence: number;
  winningSide: string;
  summary: string;
  evidenceTrace: unknown[];
  ruleApplication: unknown[];
  sourceAssessment: unknown[];
  ambiguityNotes: string[];
  manipulationWarnings: string[];
  responsibleUseNote: string;
  createdAt: number;
};

export type OnChainDispute = {
  reportId: string;
  wagerId: string;
  ground: string;
  outcome: string;
  confidence: number;
  summary: string;
  evidenceTrace: unknown[];
  ruleApplication: unknown[];
  responsibleUseNote: string;
  createdAt: number;
};

// ── Read helpers (no wallet needed) ──────────────────────────────────────────

export async function readGetWager(wagerId: string): Promise<OnChainWager> {
  const client = makeClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_wager",
    args: [wagerId],
  });
  return JSON.parse(raw as string) as OnChainWager;
}

export async function readGetUserWagers(user: string): Promise<string[]> {
  const client = makeClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_user_wagers",
    args: [user.toLowerCase()],
  });
  return JSON.parse(raw as string) as string[];
}

export async function readGetMyWagers(user: string): Promise<string[]> {
  const client = makeClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_my_wagers",
    args: [user],
  });
  return JSON.parse(raw as string) as string[];
}

export async function readGetSettlement(reportId: string): Promise<OnChainSettlement> {
  const client = makeClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_settlement",
    args: [reportId],
  });
  return JSON.parse(raw as string) as OnChainSettlement;
}

export async function readGetDispute(reportId: string): Promise<OnChainDispute> {
  const client = makeClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_dispute",
    args: [reportId],
  });
  return JSON.parse(raw as string) as OnChainDispute;
}

export async function readGetProtocolStats(): Promise<Record<string, unknown>> {
  const client = makeClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_protocol_stats",
    args: [],
  });
  return JSON.parse(raw as string) as Record<string, unknown>;
}

// ── Write helpers (need injected wallet provider + connected account) ─────────

export async function writeCreateWager(
  provider: unknown,
  account: Address,
  termsJson: string,
  counterparty: Address,
  stakeAmountWei: bigint
): Promise<{ hash: string; wagerId?: string }> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "create_wager",
    args: [termsJson, counterparty, Number(stakeAmountWei)],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return { hash: hash as string };
}

export async function writeAcceptWager(
  provider: unknown,
  account: Address,
  wagerId: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "accept_wager",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeFundWager(
  provider: unknown,
  account: Address,
  wagerId: string,
  stakeAmountWei: bigint
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "fund_wager",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: stakeAmountWei,
  });
  return hash as string;
}

export async function writeCancelWager(
  provider: unknown,
  account: Address,
  wagerId: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "cancel_unaccepted_wager",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeOpenSettlement(
  provider: unknown,
  account: Address,
  wagerId: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "open_settlement",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeRequestSettlement(
  provider: unknown,
  account: Address,
  wagerId: string,
  settlementPacketJson: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "request_settlement",
    args: [wagerId, settlementPacketJson],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeDisputeSettlement(
  provider: unknown,
  account: Address,
  wagerId: string,
  disputePacketJson: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "dispute_settlement",
    args: [wagerId, disputePacketJson],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeFinalizeWager(
  provider: unknown,
  account: Address,
  wagerId: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "finalize_wager",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeClaimWinnings(
  provider: unknown,
  account: Address,
  wagerId: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "claim_winnings",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

export async function writeClaimRefund(
  provider: unknown,
  account: Address,
  wagerId: string
): Promise<string> {
  const client = makeClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "claim_refund",
    args: [wagerId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value: 0n,
  });
  return hash as string;
}

// ── Wait for transaction receipt ──────────────────────────────────────────────

export async function waitForTx(hash: string): Promise<unknown> {
  const client = makeClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.waitForTransactionReceipt({ hash: hash as any });
}
