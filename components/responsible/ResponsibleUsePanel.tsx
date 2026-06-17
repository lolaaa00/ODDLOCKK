"use client";

import { useState } from "react";
import { ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { getSettings, saveSettings, type ResponsibleUseSettings } from "@/lib/storage/drafts";

export function ResponsibleUsePanel() {
  const [settings, setSettings] = useState<ResponsibleUseSettings | null>(() =>
    typeof window !== "undefined" ? getSettings() : null
  );

  function update(patch: Partial<ResponsibleUseSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(patch);
  }

  if (!settings) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Primary notice */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "var(--chamber)",
          border: "1px solid var(--glass-line)",
          borderLeft: "3px solid var(--bio-glow)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: "var(--canopy)" }} />
          <h2
            className="font-staatliches tracking-widest"
            style={{ fontSize: "1.75rem", color: "var(--ink-text)" }}
          >
            RESPONSIBLE USE
          </h2>
        </div>
        <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
          OddLock is a Studionet/testnet outcome settlement demo. It is not a
          real-money gambling product, sportsbook, casino, licensed wagering
          service, or financial product. Real-value deployment would require
          legal, compliance, responsible-gambling, age, identity, AML, and
          jurisdictional review.
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="font-exo text-xs tracking-widest uppercase" style={{ color: "var(--dim-label)" }}>
          Controls
        </div>

        <Toggle
          label="Cooling-Off Period"
          description="Enable a 24-hour break from creating new settlement capsules"
          active={settings.coolingOffEnabled}
          onChange={(v) =>
            update({ coolingOffEnabled: v, coolingOffUntil: v ? Date.now() + 86400000 : null })
          }
        />

        <Toggle
          label="Session Reminder"
          description="Get notified after 60 minutes of active use"
          active={settings.sessionReminderMinutes > 0}
          onChange={(v) => update({ sessionReminderMinutes: v ? 60 : 0 })}
        />

        <Toggle
          label="Capsule Limit"
          description="Limit total stake to 1000 GEN per session"
          active={settings.wagerlimitEnabled}
          onChange={(v) => update({ wagerlimitEnabled: v })}
        />

        <Toggle
          label="Self-Exclusion (30 days)"
          description="Block access to capsule creation for 30 days"
          active={settings.selfExcluded}
          onChange={(v) =>
            update({ selfExcluded: v, selfExclusionUntil: v ? Date.now() + 30 * 86400000 : null })
          }
        />
      </div>

      {/* What OddLock is not */}
      <div className="space-y-2">
        <div className="font-exo text-xs tracking-widest uppercase" style={{ color: "var(--dim-label)" }}>
          What OddLock is not
        </div>
        {[
          "Not a casino",
          "Not a sportsbook",
          "Not a real-money gambling product",
          "Not a licensed wagering service",
          "Not a financial product or investment",
          "Not a public prediction market",
          "Studionet / testnet only, no real value",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            {/* Amber triangle */}
            <div
              className="h-1.5 w-1.5 shrink-0 rounded-sm"
              style={{ background: "var(--dispute-signal)" }}
            />
            <span className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* Support resources */}
      <div
        className="rounded-lg p-4"
        style={{
          border: "1px solid rgba(200,155,60,0.35)",
          background: "rgba(200,155,60,0.35)",
        }}
      >
        <div
          className="font-exo text-xs tracking-widest uppercase mb-2"
          style={{ color: "var(--dispute-signal)" }}
        >
          If you have a gambling problem
        </div>
        <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
          OddLock is a testnet demo with no real money involved. If you are experiencing
          issues with gambling, contact the National Problem Gambling Helpline
          or a local support organisation in your jurisdiction.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  active,
  onChange,
}: {
  label: string;
  description: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg px-4 py-3"
      style={{
        border: "1px solid var(--glass-line)",
        background: "rgba(62,34,32,0.35)",
      }}
    >
      <div>
        <div className="font-nunito text-base" style={{ color: "var(--ink-text)" }}>
          {label}
        </div>
        <div className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
          {description}
        </div>
      </div>
      <button onClick={() => onChange(!active)} className="shrink-0 transition-colors">
        {active ? (
          <ToggleRight className="h-6 w-6" style={{ color: "var(--canopy)" }} />
        ) : (
          <ToggleLeft className="h-6 w-6" style={{ color: "var(--dim-label)" }} />
        )}
      </button>
    </div>
  );
}
