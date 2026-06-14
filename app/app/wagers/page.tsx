"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, RefreshCw, AlertTriangle, Layers } from "lucide-react";
import { getDrafts } from "@/lib/storage/drafts";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { useUserWagers } from "@/hooks/useOddLockReads";
import { getStatusStyle } from "@/utils/oddlockStates";
import type { OnChainWager } from "@/lib/oddlockContract";
import type { LocalDraft } from "@/types/wager";
import { formatTimestamp } from "@/lib/utils";

export default function WagersPage() {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const { address, isConnected } = useGenLayer();

  useEffect(() => { setDrafts(getDrafts()); }, []);

  const { wagers: chainWagers, loading, error: loadError, refetch } = useUserWagers(address);

  return (
    <div className="space-y-6 route-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-staatliches text-lg md:text-2xl tracking-wide" style={{ color: "var(--ink-text)" }}>
            SETTLEMENT CAPSULES
          </h1>
          <p className="font-nunito text-sm mt-0.5" style={{ color: "var(--dim-label)" }}>
            {isConnected
              ? `Connected: ${address?.slice(0, 6)}…${address?.slice(-4)}`
              : "Connect wallet to load on-chain capsules"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-exo text-xs tracking-widest transition-colors disabled:opacity-40"
              style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              REFRESH
            </button>
          )}
          <Link
            href="/app/create"
            className="btn-tribunal flex items-center gap-2 rounded px-5 py-2 font-staatliches tracking-widest transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            NEW CAPSULE
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded px-4 py-3" style={{ border: "1px solid rgba(225,29,72,0.30)", background: "rgba(225,29,72,0.06)" }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--invalid-alert)" }} />
          <div className="flex-1">
            <p className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>{loadError}</p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 rounded px-3 py-1 font-exo text-xs tracking-widest shrink-0 transition-colors disabled:opacity-40"
            style={{ border: "1px solid var(--glass-line)", color: "var(--dim-label)" }}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            RETRY
          </button>
        </div>
      )}

      {/* On-chain capsules */}
      {chainWagers.length > 0 && (
        <div className="space-y-3">
          <div className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
            ON-CHAIN CAPSULES
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chainWagers.map((w) => (
              <ChainCapsuleCard key={w.wagerId} wager={w} />
            ))}
          </div>
        </div>
      )}

      {/* Local drafts (unpublished only) */}
      {drafts.filter((d) => !d.contractWagerId).length > 0 && (
        <div className="space-y-3">
          <div className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOCAL DRAFTS</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.filter((d) => !d.contractWagerId).map((draft) => <DraftCard key={draft.draftId} draft={draft} />)}
          </div>
        </div>
      )}

      {chainWagers.length === 0 && drafts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded py-20 text-center" style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.35)" }}>
          <Layers className="h-12 w-12 mb-4" style={{ color: "rgba(107,7,14,0.40)" }} />
          <h2 className="font-staatliches text-base md:text-xl tracking-wide mb-2" style={{ color: "rgba(203,194,192,0.40)" }}>
            NO CAPSULES
          </h2>
          <p className="font-nunito text-sm mb-6" style={{ color: "var(--dim-label)" }}>
            Create your first settlement capsule to begin.
          </p>
          <Link
            href="/app/create"
            className="btn-tribunal flex items-center gap-2 rounded px-6 py-2.5 font-staatliches tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            CREATE CAPSULE
          </Link>
        </div>
      )}
    </div>
  );
}

function ChainCapsuleCard({ wager }: { wager: OnChainWager }) {
  const s = getStatusStyle(wager.status);
  return (
    <Link
      href={`/app/wagers/${wager.wagerId}`}
      className="capsule-card group block rounded p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-exo text-xs tracking-widest px-2 py-0.5 rounded"
          style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
        >
          {s.label}
        </span>
        <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
          {wager.wagerId.slice(0, 12)}…
        </span>
      </div>
      <h3 className="font-staatliches text-base tracking-wide mb-3 line-clamp-2" style={{ color: "var(--ink-text)" }}>
        {wager.question}
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded p-2" style={{ background: "rgba(107,7,14,0.12)", border: "1px solid rgba(203,194,192,0.12)" }}>
          <div className="font-exo text-xs tracking-widest mb-0.5" style={{ color: "rgba(240,230,226,0.55)" }}>POSITION A</div>
          <div className="font-nunito text-sm line-clamp-1" style={{ color: "var(--ink-text)" }}>{wager.creatorSide}</div>
        </div>
        <div className="rounded p-2" style={{ background: "rgba(62,34,32,0.50)", border: "1px solid rgba(203,194,192,0.12)" }}>
          <div className="font-exo text-xs tracking-widest mb-0.5" style={{ color: "rgba(138,118,109,0.70)" }}>POSITION B</div>
          <div className="font-nunito text-sm line-clamp-1" style={{ color: "var(--ink-text)" }}>{wager.counterpartySide}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-changa text-sm" style={{ color: "var(--dim-label)" }}>
          {wager.stakeAmountWei} wei
        </span>
        <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
          {formatTimestamp(wager.eventDeadline)}
        </span>
      </div>
    </Link>
  );
}

function DraftCard({ draft }: { draft: LocalDraft }) {
  return (
    <Link
      href={`/app/wagers/${draft.draftId}`}
      className="capsule-card group block rounded p-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-3.5 w-3.5" style={{ color: "var(--dim-label)" }} />
        <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>LOCAL DRAFT</span>
      </div>
      <h3 className="font-staatliches text-base md:text-lg tracking-wide mb-2" style={{ color: "rgba(203,194,192,0.70)" }}>
        {draft.title || "Untitled Capsule"}
      </h3>
      {draft.terms.question && (
        <p className="font-nunito text-sm line-clamp-2 mb-3" style={{ color: "var(--dim-label)" }}>
          {draft.terms.question}
        </p>
      )}
      <div className="font-azeret text-xs" style={{ color: "rgba(138,118,109,0.45)" }}>
        {formatTimestamp(draft.updatedAt)}
      </div>
    </Link>
  );
}
