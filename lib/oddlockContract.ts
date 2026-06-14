"use client";

import { isAddress } from "viem";
import {
  getReadClient,
  getWriteClient,
  CONTRACT_ADDRESS,
  isContractConfigured,
} from "./genlayerClient";

// ── Types ────────────────────────────────────────────────────────────────────

export type Address = `0x${string}`;

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
  reportType: string;
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
  createdBy: string;
};

export type OnChainDispute = {
  reportId: string;
  wagerId: string;
  reportType: string;
  ground: string;
  outcome: string;
  confidence: number;
  summary: string;
  evidenceTrace: unknown[];
  ruleApplication: unknown[];
  ambiguityNotes: string[];
  responsibleUseNote: string;
  createdAt: number;
  createdBy: string;
};

export type ProtocolStats = {
  totalWagers: number;
  totalLocked: number;
  totalSettled: number;
  totalDisputed: number;
  totalFinalized: number;
  creatorWins: number;
  counterpartyWins: number;
  pushRefunds: number;
  invalid: number;
  moreEvidenceRequired: number;
  keepers: number;
};

// ── Debug logger ─────────────────────────────────────────────────────────────

function logContract(
  action: "READ" | "WRITE",
  method: string,
  data: Record<string, unknown>
) {
  console.log(
    `[OddLock:${action}] ${method}`,
    {
      contract: CONTRACT_ADDRESS,
      ...data,
      timestamp: new Date().toISOString(),
    }
  );
}

// ── Preflight checks ─────────────────────────────────────────────────────────

function requireContract() {
  if (!isContractConfigured()) {
    throw new Error(
      "OddLock contract not configured. Set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS."
    );
  }
}

function requireAddress(value: unknown, label: string): asserts value is string {
  if (!value || typeof value !== "string" || !isAddress(value)) {
    throw new Error(
      `${label}: "${String(value)}" is not a valid address. ` +
      `Expected a 0x-prefixed hex string of 20 bytes.`
    );
  }
}

function requireWrite(provider: unknown, account: string) {
  requireContract();
  if (!provider) throw new Error("No wallet provider. Connect your wallet first.");
  requireAddress(account, "WALLET_NOT_CONNECTED");
  requireAddress(CONTRACT_ADDRESS, "ODDLOCK_CONTRACT_ADDRESS_MISSING");
}

// ── Parse helper ─────────────────────────────────────────────────────────────

function parseJson<T>(raw: unknown, label: string): T {
  const str = raw as string;
  try {
    const parsed = JSON.parse(str);
    // Contract returns {error: "..."} for not-found cases
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      throw new Error(`Contract error: ${parsed.error}`);
    }
    return parsed as T;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Contract error:")) throw e;
    throw new Error(`Failed to parse ${label}: ${str}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ METHODS
// ═══════════════════════════════════════════════════════════════════════════════

export async function readGetWager(wagerId: string): Promise<OnChainWager> {
  requireContract();
  logContract("READ", "get_wager", { wagerId });
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_wager",
    args: [wagerId],
  });
  return parseJson<OnChainWager>(raw, "wager");
}

export async function readGetUserWagers(user: string): Promise<string[]> {
  requireContract();
  logContract("READ", "get_user_wagers", { user });
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_user_wagers",
    args: [user.toLowerCase()],
  });
  return parseJson<string[]>(raw, "user_wagers");
}

export async function readGetMyWagers(): Promise<string[]> {
  requireContract();
  logContract("READ", "get_my_wagers", {});
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_my_wagers",
    args: [],
  });
  return parseJson<string[]>(raw, "my_wagers");
}

export async function readGetSettlement(
  reportId: string
): Promise<OnChainSettlement> {
  requireContract();
  logContract("READ", "get_settlement", { reportId });
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_settlement",
    args: [reportId],
  });
  return parseJson<OnChainSettlement>(raw, "settlement");
}

export async function readGetDispute(
  reportId: string
): Promise<OnChainDispute> {
  requireContract();
  logContract("READ", "get_dispute", { reportId });
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_dispute",
    args: [reportId],
  });
  return parseJson<OnChainDispute>(raw, "dispute");
}

export async function readGetProtocolStats(): Promise<ProtocolStats> {
  requireContract();
  logContract("READ", "get_protocol_stats", {});
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_protocol_stats",
    args: [],
  });
  return parseJson<ProtocolStats>(raw, "protocol_stats");
}

export async function readIsKeeper(user: string): Promise<boolean> {
  requireContract();
  logContract("READ", "is_keeper", { user });
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "is_keeper",
    args: [user.toLowerCase()],
  });
  return raw as boolean;
}

export async function readGetAdmin(): Promise<string> {
  requireContract();
  logContract("READ", "get_admin", {});
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_admin",
    args: [],
  });
  return raw as string;
}

export async function readGetContractBalance(): Promise<string> {
  requireContract();
  logContract("READ", "get_contract_balance", {});
  const client = getReadClient();
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: "get_contract_balance",
    args: [],
  });
  return raw as string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

async function execWrite(
  provider: unknown,
  account: string,
  method: string,
  args: (string | number | bigint | boolean)[],
  value: bigint = 0n
): Promise<string> {
  requireWrite(provider, account);
  logContract("WRITE", method, {
    account,
    args,
    value: value.toString(),
  });

  const client = getWriteClient(provider);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: method,
    args,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: account as any,
    value,
  });

  const txHash = hash as string;
  logContract("WRITE", method, { result: "tx_submitted", txHash });
  return txHash;
}

export async function writeCreateWager(
  provider: unknown,
  account: string,
  termsJson: string,
  counterparty: string,
  stakeAmountWei: number
): Promise<string> {
  requireAddress(counterparty, "COUNTERPARTY_ADDRESS_REQUIRED");
  return execWrite(provider, account, "create_wager", [
    termsJson,
    counterparty,
    stakeAmountWei,
  ]);
}

export async function writeAcceptWager(
  provider: unknown,
  account: string,
  wagerId: string
): Promise<string> {
  return execWrite(provider, account, "accept_wager", [wagerId]);
}

export async function writeFundWager(
  provider: unknown,
  account: string,
  wagerId: string,
  stakeAmountWei: bigint
): Promise<string> {
  return execWrite(
    provider,
    account,
    "fund_wager",
    [wagerId],
    stakeAmountWei
  );
}

export async function writeCancelWager(
  provider: unknown,
  account: string,
  wagerId: string
): Promise<string> {
  return execWrite(provider, account, "cancel_unaccepted_wager", [wagerId]);
}

export async function writeOpenSettlement(
  provider: unknown,
  account: string,
  wagerId: string
): Promise<string> {
  return execWrite(provider, account, "open_settlement", [wagerId]);
}

export async function writeRequestSettlement(
  provider: unknown,
  account: string,
  wagerId: string,
  settlementPacketJson: string
): Promise<string> {
  return execWrite(provider, account, "request_settlement", [
    wagerId,
    settlementPacketJson,
  ]);
}

export async function writeDisputeSettlement(
  provider: unknown,
  account: string,
  wagerId: string,
  disputePacketJson: string
): Promise<string> {
  return execWrite(provider, account, "dispute_settlement", [
    wagerId,
    disputePacketJson,
  ]);
}

export async function writeFinalizeWager(
  provider: unknown,
  account: string,
  wagerId: string
): Promise<string> {
  return execWrite(provider, account, "finalize_wager", [wagerId]);
}

export async function writeClaimWinnings(
  provider: unknown,
  account: string,
  wagerId: string
): Promise<string> {
  return execWrite(provider, account, "claim_winnings", [wagerId]);
}

export async function writeClaimRefund(
  provider: unknown,
  account: string,
  wagerId: string
): Promise<string> {
  return execWrite(provider, account, "claim_refund", [wagerId]);
}

export async function writeAddKeeper(
  provider: unknown,
  account: string,
  keeper: string
): Promise<string> {
  return execWrite(provider, account, "add_keeper", [
    keeper.toLowerCase().trim(),
  ]);
}

export async function writeRemoveKeeper(
  provider: unknown,
  account: string,
  keeper: string
): Promise<string> {
  return execWrite(provider, account, "remove_keeper", [
    keeper.toLowerCase().trim(),
  ]);
}

// ── Wait for tx ──────────────────────────────────────────────────────────────

export async function waitForTx(hash: string): Promise<unknown> {
  logContract("READ", "waitForTransactionReceipt", { hash });
  const client = getReadClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.waitForTransactionReceipt({ hash: hash as any });
}
