import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "./config";

export function getGenLayerClient() {
  return createClient({
    chain: studionet,
    endpoint: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api",
  });
}

export { CONTRACT_ADDRESS };
