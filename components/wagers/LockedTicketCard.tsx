"use client";

import Link from "next/link";
import { Lock, Clock, ChevronRight } from "lucide-react";
import { formatTimestamp, formatWeiToGen } from "@/lib/utils";
import type { Wager } from "@/types/wager";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:               { label: "DRAFT",      color: "#B8C0CC", bg: "rgba(184,192,204,0.1)" },
  INVITED:             { label: "INVITED",    color: "#EEC044", bg: "rgba(212,160,23,0.10)" },
  ACCEPTED:            { label: "ACCEPTED",   color: "#EEC044", bg: "rgba(212,160,23,0.10)" },
  FUNDED:              { label: "FUNDED",     color: "#D4A017", bg: "rgba(212,160,23,0.10)" },
  LOCKED:              { label: "LOCKED",     color: "#D4A017", bg: "rgba(212,160,23,0.12)" },
  SETTLEMENT_OPEN:     { label: "SETTLE NOW", color: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  RESOLUTION_REQUESTED:{ label: "PENDING",   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  RESOLVED:            { label: "RESOLVED",   color: "#4ADE80", bg: "rgba(74,222,128,0.1)" },
  DISPUTED:            { label: "DISPUTED",   color: "#D4152A", bg: "rgba(255,107,74,0.12)" },
  FINALIZED:           { label: "FINAL",      color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:           { label: "CANCELLED",  color: "#B8C0CC", bg: "rgba(184,192,204,0.08)" },
  INVALID:             { label: "INVALID",    color: "#E11D48", bg: "rgba(225,29,72,0.1)" },
};

interface Props {
  wager: Wager;
}

export function LockedTicketCard({ wager }: Props) {
  const style = STATUS_STYLES[wager.status] ?? STATUS_STYLES.DRAFT;

  return (
    <Link
      href={`/app/wagers/${wager.wagerId}`}
      className="group block rounded-sm border border-[rgba(240,230,226,0.10)] bg-[#3D1A16] p-5 transition-all hover:border-[#D4A017]/40 hover:shadow-[0_0_20px_rgba(242,183,5,0.15)]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#D4A017]/60" />
          <span className="font-exo text-sm tracking-widest text-[rgba(240,230,226,0.45)]">
            {wager.wagerId.slice(0, 16)}…
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-exo text-xs font-600 tracking-widest"
          style={{ color: style.color, background: style.bg }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: style.color }}
          />
          {style.label}
        </div>
      </div>

      {/* Question */}
      <h3 className="font-staatliches text-xl tracking-wide text-[#F0E6E2] line-clamp-2 mb-3">
        {wager.question}
      </h3>

      {/* Sides */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="parchment-surface rounded-sm p-2.5">
          <div className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)] mb-1">
            CREATOR SIDE
          </div>
          <div className="font-nunito text-sm text-[rgba(255,240,200,0.85)] line-clamp-2">
            {wager.creatorSide}
          </div>
        </div>
        <div className="parchment-surface rounded-sm p-2.5">
          <div className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)] mb-1">
            COUNTERPARTY
          </div>
          <div className="font-nunito text-sm text-[rgba(255,240,200,0.85)] line-clamp-2">
            {wager.counterpartySide}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-azeret text-sm text-[#D4A017]">
            <Lock className="h-3 w-3" />
            {formatWeiToGen(wager.stakeAmount)} GEN
          </div>
          <div className="flex items-center gap-1 font-azeret text-sm text-[rgba(240,230,226,0.40)]">
            <Clock className="h-3 w-3" />
            {formatTimestamp(wager.eventDeadline)}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[rgba(240,230,226,0.30)] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
