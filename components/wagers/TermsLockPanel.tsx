"use client";

import { Shield, Link2 } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import type { WagerTerms } from "@/types/wager";

interface Props {
  terms: WagerTerms;
  termsHash?: string;
}

export function TermsLockPanel({ terms, termsHash }: Props) {
  return (
    <div className="space-y-4">
      {/* Hash */}
      {termsHash && (
        <div className="flex items-center gap-2 rounded-sm border border-[#D4A017]/30 bg-[#D4A017]/5 px-4 py-2.5">
          <Shield className="h-4 w-4 shrink-0 text-[#D4A017]" />
          <div>
            <div className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)]">
              TERMS HASH
            </div>
            <div className="font-azeret text-xs text-[#D4A017] break-all">
              {termsHash}
            </div>
          </div>
        </div>
      )}

      {/* Source Chain */}
      <div className="space-y-2">
        <div className="font-exo text-xs tracking-widest text-[#EEC044]">
          SOURCE CHAIN
        </div>
        <div className="space-y-1.5">
          <SourceLine tier="PRIMARY" url={terms.primarySource} />
          <SourceLine tier="FALLBACK" url={terms.fallbackSource} />
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-2">
        <div className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)]">
          LOCKED RULES
        </div>
        <div className="grid gap-2">
          <RuleRow label="CONFLICT" value={terms.conflictRule} />
          <RuleRow label="CANCELLATION" value={terms.cancellationRule} />
          <RuleRow label="POSTPONEMENT" value={terms.postponementRule} />
          <RuleRow label="INVALID IF" value={terms.invalidIf} color="crimson" />
          <RuleRow
            label="DISPUTE WINDOW"
            value={`${terms.disputeWindowHours}h after settlement`}
          />
          <RuleRow
            label="EVENT DEADLINE"
            value={formatTimestamp(terms.eventDeadline)}
          />
          <RuleRow label="TIMEZONE" value={terms.timezone} />
        </div>
      </div>

      {/* Outcomes */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <OutcomeBox
          label="CREATOR WINS IF"
          text={terms.resolvesForCreatorIf}
          color="gold"
        />
        <OutcomeBox
          label="COUNTERPARTY WINS IF"
          text={terms.resolvesForCounterpartyIf}
          color="cyan"
        />
      </div>
    </div>
  );
}

function SourceLine({ tier, url }: { tier: string; url: string }) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-[#EEC044]/20 bg-[#EEC044]/5 px-3 py-2">
      <Link2 className="h-3.5 w-3.5 shrink-0 text-[#EEC044]" />
      <div className="min-w-0">
        <div className="font-exo text-xs tracking-widest text-[#EEC044]/60">{tier}</div>
        <div className="font-azeret text-xs text-[#F0E6E2] truncate">{url}</div>
      </div>
    </div>
  );
}

function RuleRow({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: string;
  color?: "default" | "crimson";
}) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-[rgba(240,230,226,0.07)] bg-[rgba(240,230,226,0.03)] px-3 py-2">
      <span className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.35)] shrink-0 mt-0.5 min-w-[80px]">
        {label}
      </span>
      <span
        className={`font-nunito text-sm ${color === "crimson" ? "text-[#E11D48]" : "text-[rgba(240,230,226,0.75)]"}`}
      >
        {value}
      </span>
    </div>
  );
}

function OutcomeBox({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color: "gold" | "cyan";
}) {
  const c = color === "gold" ? "#D4A017" : "#EEC044";
  return (
    <div
      className="rounded-sm p-3"
      style={{ border: `1px solid ${c}30`, background: `${c}08` }}
    >
      <div
        className="font-exo text-xs tracking-widest mb-1.5"
        style={{ color: `${c}99` }}
      >
        {label}
      </div>
      <div className="font-nunito text-sm" style={{ color: `${c}CC` }}>
        {text}
      </div>
    </div>
  );
}
