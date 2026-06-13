"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage/drafts";

function initialShowState() {
  if (typeof window === "undefined") return false;
  return !getSettings().testnetAcknowledged;
}

export function ResponsibleUseLock() {
  const [show, setShow] = useState(initialShowState);
  const [acknowledged, setAcknowledged] = useState(() =>
    typeof window !== "undefined" ? getSettings().testnetAcknowledged : false
  );

  function acknowledge() {
    saveSettings({ testnetAcknowledged: true, ageAcknowledged: true });
    setAcknowledged(true);
    setShow(false);
  }

  if (!show && acknowledged) return null;
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A0A08]/95 backdrop-blur-md p-4">
      <div className="glass-panel max-w-lg w-full rounded-lg p-8 border-[#E11D48]/40 shadow-[0_0_40px_rgba(225,29,72,0.2)]">
        <div className="flex items-center gap-3 mb-5">
          <ShieldAlert className="h-7 w-7 text-[#E11D48] shrink-0" />
          <h2 className="font-staatliches text-3xl tracking-widest text-[#F0E6E2]">
            IMPORTANT NOTICE
          </h2>
        </div>

        <div className="space-y-3 font-nunito text-base text-[rgba(240,230,226,0.80)] leading-relaxed">
          <p className="font-semibold text-[#F0E6E2]">
            OddLock is a Studionet/testnet outcome settlement demo.
          </p>
          <p>
            It is <strong className="text-[#E11D48]">not</strong> a real-money gambling
            product, sportsbook, casino, licensed wagering service, or financial product.
          </p>
          <p>
            All stakes are <strong>testnet/internal test units only</strong>. No real
            monetary value is involved.
          </p>
          <p>
            Real-value deployment would require legal, compliance, responsible-gambling,
            age, identity, AML, and jurisdictional review.
          </p>
          <p className="text-[rgba(240,230,226,0.60)] text-xs pt-1">
            By continuing, you confirm you are of legal age in your jurisdiction and
            understand this is a testnet demo.
          </p>
        </div>

        <button
          onClick={acknowledge}
          className="btn-tribunal mt-6 w-full py-3 font-staatliches text-xl tracking-widest hover:opacity-90 transition-opacity"
        >
          I UNDERSTAND, ENTER DEMO
        </button>
      </div>
    </div>
  );
}
