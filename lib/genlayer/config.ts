export const GENLAYER_STUDIONET = {
  name: "GenLayer Studionet",
  chainId: 61999,
  rpcUrl: "https://studio.genlayer.com/api",
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com",
};

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? "";

export const CURRENCY_MODE =
  (process.env.NEXT_PUBLIC_CURRENCY_MODE as "TESTNET_GEN" | "INTERNAL_TEST_UNITS") ??
  "INTERNAL_TEST_UNITS";

export const isContractConfigured = (): boolean =>
  Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS.length > 0);
