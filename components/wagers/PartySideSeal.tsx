"use client";

import { User } from "lucide-react";
import { shortAddress } from "@/lib/utils";
import type { Address } from "@/types/wager";

interface Props {
  role: "CREATOR" | "COUNTERPARTY";
  address: Address;
  side: string;
  winner?: boolean;
}

const COLORS = {
  CREATOR: { border: "#D4A017", bg: "#D4A017" },
  COUNTERPARTY: { border: "#EEC044", bg: "#EEC044" },
};

export function PartySideSeal({ role, address, side, winner }: Props) {
  const c = COLORS[role];
  return (
    <div
      className="relative rounded-sm p-4 transition-all"
      style={{
        border: `1px solid ${winner ? c.border : c.border + "40"}`,
        background: winner ? `${c.bg}12` : `${c.bg}05`,
        boxShadow: winner ? `0 0 20px ${c.bg}30` : "none",
      }}
    >
      {winner && (
        <div
          className="absolute -top-2 left-3 font-exo text-xs tracking-widest px-2 py-0.5 rounded-sm"
          style={{ background: c.bg, color: "#1A0A08" }}
        >
          WINNER
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-sm"
          style={{ background: `${c.bg}20`, border: `1px solid ${c.bg}40` }}
        >
          <User className="h-3 w-3" style={{ color: c.bg }} />
        </div>
        <div>
          <div
            className="font-exo text-xs tracking-widest"
            style={{ color: `${c.bg}80` }}
          >
            {role === "CREATOR" ? "CREATOR SEAL" : "COUNTERPARTY SEAL"}
          </div>
          <div className="font-azeret text-sm" style={{ color: `${c.bg}CC` }}>
            {shortAddress(address)}
          </div>
        </div>
      </div>
      <div className="font-nunito text-base" style={{ color: `${c.bg}DD` }}>
        {side}
      </div>
    </div>
  );
}
