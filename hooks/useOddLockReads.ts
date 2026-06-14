"use client";

import { useState, useEffect, useCallback } from "react";
import { isContractConfigured } from "@/lib/genlayerClient";
import {
  readGetWager,
  readGetUserWagers,
  readGetSettlement,
  readGetDispute,
  readGetProtocolStats,
  type OnChainWager,
  type OnChainSettlement,
  type OnChainDispute,
  type ProtocolStats,
} from "@/lib/oddlockContract";

// ── Generic fetch hook ───────────────────────────────────────────────────────

function useContractRead<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const refetch = useCallback(async () => {
    if (!fetcher || !isContractConfigured()) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("404") ||
        msg.includes("fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("ECONNREFUSED")
      ) {
        setError("GenLayer backend is currently unreachable.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ── Specific hooks ───────────────────────────────────────────────────────────

export function useWager(wagerId: string | undefined) {
  return useContractRead<OnChainWager>(
    wagerId ? () => readGetWager(wagerId) : null,
    [wagerId]
  );
}

export function useUserWagers(address: string | undefined) {
  const {
    data: ids,
    loading: idsLoading,
    error: idsError,
    refetch: refetchIds,
  } = useContractRead<string[]>(
    address ? () => readGetUserWagers(address) : null,
    [address]
  );

  const [wagers, setWagers] = useState<OnChainWager[]>([]);
  const [wagersLoading, setWagersLoading] = useState(false);

  useEffect(() => {
    if (!ids || ids.length === 0) {
      setWagers([]);
      return;
    }
    let cancelled = false;
    setWagersLoading(true);
    Promise.all(ids.map((id) => readGetWager(id)))
      .then((results) => {
        if (!cancelled) setWagers(results);
      })
      .catch(() => {
        if (!cancelled) setWagers([]);
      })
      .finally(() => {
        if (!cancelled) setWagersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return {
    wagers,
    loading: idsLoading || wagersLoading,
    error: idsError,
    refetch: refetchIds,
  };
}

export function useSettlement(reportId: string | undefined) {
  return useContractRead<OnChainSettlement>(
    reportId && reportId.length > 0
      ? () => readGetSettlement(reportId)
      : null,
    [reportId]
  );
}

export function useDispute(reportId: string | undefined) {
  return useContractRead<OnChainDispute>(
    reportId && reportId.length > 0
      ? () => readGetDispute(reportId)
      : null,
    [reportId]
  );
}

export function useProtocolStats() {
  return useContractRead<ProtocolStats>(
    () => readGetProtocolStats(),
    []
  );
}
