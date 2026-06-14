"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const ENDPOINT =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? "";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ??
  "https://explorer-studio.genlayer.com";

export const CHAIN_ID = 61999;

export function isContractConfigured(): boolean {
  return Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS.length > 0);
}

/**
 * Read-only client (no wallet needed).
 */
export function getReadClient() {
  return createClient({
    chain: studionet,
    endpoint: ENDPOINT,
  });
}

/**
 * Write client (needs injected wallet provider).
 */
export function getWriteClient(provider: unknown) {
  if (!provider) throw new Error("No wallet provider supplied");
  return createClient({
    chain: studionet,
    endpoint: ENDPOINT,
    provider,
  });
}
