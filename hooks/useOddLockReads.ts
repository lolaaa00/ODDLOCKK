"use client";

import { useReducer, useEffect, useCallback } from "react";
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

type ReadState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

type ReadAction<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: string };

function readReducer<T>(state: ReadState<T>, action: ReadAction<T>): ReadState<T> {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: "" };
    case "success":
      return { data: action.data, loading: false, error: "" };
    case "error":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

function useContractRead<T>(fetcher: (() => Promise<T>) | null) {
  const [state, dispatch] = useReducer(readReducer<T>, {
    data: null,
    loading: false,
    error: "",
  });

  const refetch = useCallback(async () => {
    if (!fetcher || !isContractConfigured()) return;
    dispatch({ type: "start" });
    try {
      const result = await fetcher();
      dispatch({ type: "success", data: result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("404") ||
        msg.includes("fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("ECONNREFUSED")
      ) {
        dispatch({ type: "error", error: "GenLayer backend is currently unreachable." });
      } else {
        dispatch({ type: "error", error: msg });
      }
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data: state.data, loading: state.loading, error: state.error, refetch };
}

// ── Specific hooks ───────────────────────────────────────────────────────────

export function useWager(wagerId: string | undefined) {
  return useContractRead<OnChainWager>(
    wagerId ? () => readGetWager(wagerId) : null
  );
}

export function useUserWagers(address: string | undefined) {
  const {
    data: ids,
    loading: idsLoading,
    error: idsError,
    refetch: refetchIds,
  } = useContractRead<string[]>(
    address ? () => readGetUserWagers(address) : null
  );

  const [fetchedWagers, dispatchWagers] = useReducer(
    (
      state: { wagers: OnChainWager[]; loading: boolean },
      action:
        | { type: "start" }
        | { type: "success"; wagers: OnChainWager[] }
        | { type: "error" }
    ) => {
      switch (action.type) {
        case "start":
          return { ...state, loading: true };
        case "success":
          return { wagers: action.wagers, loading: false };
        case "error":
          return { ...state, loading: false, wagers: [] };
        default:
          return state;
      }
    },
    { wagers: [], loading: false }
  );

  useEffect(() => {
    if (!ids || ids.length === 0) return;
    let cancelled = false;
    dispatchWagers({ type: "start" });
    Promise.all(ids.map((id) => readGetWager(id)))
      .then((results) => {
        if (!cancelled) dispatchWagers({ type: "success", wagers: results });
      })
      .catch(() => {
        if (!cancelled) dispatchWagers({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const wagers = ids && ids.length > 0 ? fetchedWagers.wagers : [];

  return {
    wagers,
    loading: idsLoading || (ids && ids.length > 0 ? fetchedWagers.loading : false),
    error: idsError,
    refetch: refetchIds,
  };
}

export function useSettlement(reportId: string | undefined) {
  return useContractRead<OnChainSettlement>(
    reportId && reportId.length > 0
      ? () => readGetSettlement(reportId)
      : null
  );
}

export function useDispute(reportId: string | undefined) {
  return useContractRead<OnChainDispute>(
    reportId && reportId.length > 0
      ? () => readGetDispute(reportId)
      : null
  );
}

export function useProtocolStats() {
  return useContractRead<ProtocolStats>(() => readGetProtocolStats());
}
