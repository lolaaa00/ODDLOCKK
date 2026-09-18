"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getReadClient } from "@/lib/genlayerClient";

export type ConsensusStage =
  | "idle"
  | "signing"
  | "PENDING"
  | "PROPOSING"
  | "COMMITTING"
  | "REVEALING"
  | "ACCEPTED"
  | "FINALIZED"
  | "UNDETERMINED"
  | "CANCELED"
  | "error";

const POLL_INTERVAL = 4000;
const MAX_POLLS = 120;

export function useConsensusStage() {
  const [stage, setStage] = useState<ConsensusStage>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [hash, setHash] = useState("");
  const pollingRef = useRef(false);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    pollingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  const startTracking = useCallback((txHash: string) => {
    cleanup();
    setHash(txHash);
    setStage("PENDING");
    setElapsed(0);
    startTimeRef.current = Date.now();
    pollingRef.current = true;

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    let polls = 0;
    const poll = async () => {
      if (!pollingRef.current || polls >= MAX_POLLS) {
        cleanup();
        return;
      }
      polls++;
      try {
        const client = getReadClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tx = await client.getTransaction({ hash: txHash as any });
        const status = tx?.statusName ?? tx?.status;
        if (typeof status === "string") {
          const s = status.toUpperCase();
          if (["PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED", "FINALIZED", "UNDETERMINED", "CANCELED", "APPEAL_COMMITTING", "APPEAL_REVEALING", "READY_TO_FINALIZE", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"].includes(s)) {
            setStage(s as ConsensusStage);
          }
          if (["ACCEPTED", "FINALIZED", "CANCELED"].includes(s)) {
            cleanup();
            return;
          }
          if (s === "UNDETERMINED") {
            cleanup();
            return;
          }
        }
      } catch {
        // poll failures are expected during early submission
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);
  }, [cleanup]);

  const markSigning = useCallback(() => {
    setStage("signing");
    setElapsed(0);
    setHash("");
  }, []);

  const markError = useCallback(() => {
    cleanup();
    setStage("error");
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStage("idle");
    setElapsed(0);
    setHash("");
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { stage, elapsed, hash, startTracking, markSigning, markError, reset };
}
