"use client";

import { Lock } from "lucide-react";
import type { CurrencyMode } from "@/types/wager";

interface Props {
  amount: bigint | string;
  currencyMode: CurrencyMode;
  label?: string;
}

export function StakeTestUnitBox({ amount, currencyMode, label = "STAKE" }: Props) {
  const displayAmount = typeof amount === "bigint" ? amount.toString() : amount;
  const unitLabel = currencyMode === "TESTNET_GEN" ? "GEN (testnet)" : "Test Units";

  return (
    <div className="rounded-sm border border-[#D4A017]/30 bg-[#D4A017]/6 p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Lock className="h-3 w-3 text-[#D4A017]/60" />
        <span className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)]">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-changa text-base md:text-xl text-[#D4A017]">{displayAmount}</span>
        <span className="font-exo text-sm tracking-wider text-[rgba(240,230,226,0.45)]">
          {unitLabel}
        </span>
      </div>
      <div className="mt-2 font-exo text-xs tracking-widest text-[rgba(240,230,226,0.30)]">
        TESTNET ONLY, NO REAL-MONEY VALUE
      </div>
    </div>
  );
}
