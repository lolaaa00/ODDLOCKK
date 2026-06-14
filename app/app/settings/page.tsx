"use client";

import { useState } from "react";
import { Settings, Copy, Check } from "lucide-react";
import { CONTRACT_ADDRESS, CHAIN_ID, EXPLORER_URL } from "@/lib/genlayerClient";

const GENLAYER_STUDIONET = {
  name: "GenLayer Studionet",
  chainId: CHAIN_ID,
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api",
  currency: "GEN",
  explorerUrl: EXPLORER_URL,
};
const CURRENCY_MODE = process.env.NEXT_PUBLIC_CURRENCY_MODE ?? "INTERNAL_TEST_UNITS";

export default function SettingsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 route-in">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1
          className="font-staatliches tracking-wide"
          style={{ fontSize: "2.5rem", color: "var(--ink-text)" }}
        >
          SETTINGS
        </h1>
      </div>

      {/* Studionet config */}
      <Section title="STUDIONET CONFIGURATION">
        {[
          { label: "CHAIN NAME",        value: GENLAYER_STUDIONET.name },
          { label: "CHAIN ID",          value: String(GENLAYER_STUDIONET.chainId) },
          { label: "RPC URL",           value: GENLAYER_STUDIONET.rpcUrl },
          { label: "EXPLORER",          value: GENLAYER_STUDIONET.explorerUrl },
          { label: "CURRENCY",          value: GENLAYER_STUDIONET.currency },
          { label: "CONTRACT ADDRESS",  value: CONTRACT_ADDRESS || "(not configured)", warn: !CONTRACT_ADDRESS },
          { label: "CURRENCY MODE",     value: CURRENCY_MODE },
        ].map(({ label, value, warn }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-lg px-4 py-2.5"
            style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.35)" }}
          >
            <span
              className="font-exo text-sm tracking-widest min-w-[130px]"
              style={{ color: "var(--dim-label)" }}
            >
              {label}
            </span>
            <span
              className="font-azeret text-xs flex-1 truncate"
              style={{ color: warn ? "var(--dispute-signal)" : "var(--dim-label)" }}
            >
              {value}
            </span>
            {value !== "(not configured)" && (
              <button
                onClick={() => copy(value, label)}
                className="shrink-0 transition-colors"
                style={{ color: "var(--dim-label)" }}
              >
                {copied === label ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "var(--canopy)" }} />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        ))}
      </Section>

      {/* .env template */}
      <Section title=".ENV.LOCAL TEMPLATE">
        <div
          className="rounded-lg p-4"
          style={{ border: "1px solid var(--glass-line)", background: "var(--abyss)" }}
        >
          <pre
            className="font-azeret text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--dim-label)" }}
          >
{`NEXT_PUBLIC_APP_NAME=OddLock
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=<deploy OddLockReferee here>
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
NEXT_PUBLIC_CURRENCY_MODE=INTERNAL_TEST_UNITS
NEXT_PUBLIC_USE_LOCAL_DRAFTS=true`}
          </pre>
        </div>
      </Section>

      {/* About */}
      <Section title="ABOUT">
        <div
          className="rounded-lg p-4 space-y-2"
          style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.35)" }}
        >
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
            <span style={{ color: "var(--dim-label)" }}>OddLock</span> GenLayer P2P Outcome Settlement Protocol
          </p>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
            Contract: <span className="font-azeret" style={{ color: "var(--dim-label)" }}>OddLockReferee</span>
          </p>
          <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
            Stack: Next.js 16, TypeScript, Tailwind CSS, genlayer-js 1.1.8
          </p>
          <p className="font-nunito text-base" style={{ color: "rgba(138,118,109,0.35)" }}>
            Studionet/testnet only. Not real-money gambling.
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div
        className="font-exo text-xs tracking-widest uppercase"
        style={{ color: "var(--dim-label)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
