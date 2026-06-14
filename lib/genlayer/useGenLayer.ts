"use client";

import { useState, useEffect, useCallback } from "react";
import { isContractConfigured } from "@/lib/genlayerClient";
import type { Address } from "@/types/wager";

type WalletState = {
  address: Address | undefined;
  isConnected: boolean;
  provider: unknown;
};

const initial: WalletState = { address: undefined, isConnected: false, provider: undefined };

export function useGenLayer() {
  const [state, setState] = useState<WalletState>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts[0]) {
        setState({ address: accounts[0] as Address, isConnected: true, provider: eth });
      }
    });

    const onAccountsChanged = (accounts: string[]) => {
      setState({
        address: accounts[0] as Address | undefined,
        isConnected: !!accounts[0],
        provider: accounts[0] ? eth : undefined,
      });
    };
    eth.on("accountsChanged", onAccountsChanged);
    return () => eth.removeListener("accountsChanged", onAccountsChanged);
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("No injected wallet found. Install MetaMask or a compatible wallet.");
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
    setState({ address: accounts[0] as Address, isConnected: true, provider: eth });
  }, []);

  const disconnect = useCallback(() => {
    setState(initial);
  }, []);

  return {
    address: state.address,
    isConnected: state.isConnected,
    provider: state.provider,
    contractReady: isContractConfigured(),
    canWrite: state.isConnected && !!state.provider && isContractConfigured(),
    connect,
    disconnect,
  };
}
