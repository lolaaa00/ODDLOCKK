"use client";

import Link from "next/link";
import { Scale, Beaker, ShieldCheck, Layers, Plus } from "lucide-react";
import { isContractConfigured } from "@/lib/genlayerClient";

export default function AppDashboard() {
  const contractReady = isContractConfigured();

  return (
    <div className="space-y-8 route-in">
      {!contractReady && (
        <div className="rounded-lg px-5 py-4 flex items-start gap-3" style={{ border: "1px solid rgba(226,112,112,0.25)", background: "rgba(226,112,112,0.06)" }}>
          <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: "var(--invalid-alert)" }} />
          <div>
            <div className="font-exo text-sm tracking-widest mb-1" style={{ color: "var(--invalid-alert)" }}>CONTRACT NOT CONFIGURED</div>
            <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
              Deploy <span className="font-azeret" style={{ color: "var(--dim-label)" }}>OddLockReferee</span> and add{" "}
              <span className="font-azeret" style={{ color: "var(--dim-label)" }}>NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS</span> to enable live settlement.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-staatliches tracking-wide mb-2" style={{ fontSize: "2.75rem", color: "var(--ink-text)" }}>
          TRIBUNAL DESK
        </h1>
        <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
          OddLock does not ask GenLayer to predict outcomes. It asks GenLayer to apply
          locked rules to public evidence and return a structured verdict.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickCard
          href="/app/create"
          iconColor="#DDD0CC"
          bgColor="rgba(107,7,14,0.20)"
          cta_color="var(--bio-glow)"
          title="CREATE CAPSULE"
          desc="Lock a two-party settlement capsule with explicit terms, trusted sources, and resolution rules."
          cta="Create capsule →"
          icon={Plus}
        />
        <QuickCard
          href="/app/wagers"
          iconColor="#C8B8B0"
          bgColor="rgba(62,34,32,0.60)"
          cta_color="var(--canopy)"
          title="MY CAPSULES"
          desc="View active capsules, accept invitations, and open the resolution room."
          cta="View capsules →"
          icon={Layers}
        />
        <QuickCard
          href="/app/playground"
          iconColor="#DDD0CC"
          bgColor="rgba(62,34,32,0.60)"
          cta_color="var(--dispute-signal)"
          title="PLAYGROUND"
          desc="Test GenLayer settlement packets and explore the referee output schema."
          cta="Open playground →"
          icon={Beaker}
        />
      </div>

      {/* Why GenLayer */}
      <div className="rounded-lg p-6" style={{ border: "1px solid rgba(203,194,192,0.12)", background: "rgba(62,34,32,0.55)" }}>
        <h2 className="font-staatliches tracking-wide mb-3" style={{ fontSize: "1.875rem", color: "var(--ink-text)" }}>
          WHY THIS PROTOCOL NEEDS GENLAYER
        </h2>
        <p className="font-nunito text-base leading-relaxed mb-5" style={{ color: "var(--dim-label)" }}>
          Deterministic contracts can lock terms and stakes, but cannot interpret source
          conflicts, late updates, cancellation rules, postponement rules, ambiguous wording,
          or public evidence. GenLayer acts as a source-aware referee.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { problem: "Source conflicts",  solution: "GenLayer checks both and applies conflict rule" },
            { problem: "Ambiguous wording", solution: "GenLayer flags ambiguity in verdict" },
            { problem: "Cancellation",      solution: "GenLayer applies locked cancellation rule" },
            { problem: "Postponement",      solution: "GenLayer checks deadline and postponement rule" },
            { problem: "Manipulation",      solution: "GenLayer assesses source manipulation risk" },
            { problem: "Late updates",      solution: "GenLayer checks evidence at settlement time" },
          ].map(({ problem, solution }) => (
            <div key={problem} className="rounded-lg p-3" style={{ background: "rgba(107,7,14,0.15)", border: "1px solid rgba(203,194,192,0.10)" }}>
              <div className="font-exo text-sm tracking-widest mb-1.5" style={{ color: "#DDD0CC" }}>{problem}</div>
              <div className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>{solution}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsible use strip */}
      <div className="flex items-center gap-3 rounded-lg px-5 py-3.5" style={{ border: "1px solid rgba(122,158,111,0.22)", background: "rgba(122,158,111,0.07)" }}>
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "var(--canopy)" }} />
        <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
          Studionet/testnet only. No real monetary value.{" "}
          <Link href="/app/responsible" className="hover:underline" style={{ color: "var(--canopy)" }}>
            Responsible use →
          </Link>
        </p>
      </div>
    </div>
  );
}

function QuickCard({
  href, icon: Icon, iconColor, bgColor, cta_color, title, desc, cta,
}: {
  href: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  iconColor: string;
  bgColor: string;
  cta_color: string;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link href={href} className="capsule-card group block rounded-lg" style={{ padding: "1.5rem" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 44, width: 44, borderRadius: 6, marginBottom: "1.25rem",
        background: bgColor,
        border: "1px solid rgba(203,194,192,0.12)",
      }}>
        <Icon style={{ height: 20, width: 20, color: iconColor }} />
      </div>
      <div className="font-staatliches tracking-wide mb-2" style={{ fontSize: "1.375rem", color: "var(--ink-text)" }}>{title}</div>
      <p className="font-nunito text-base leading-relaxed mb-4" style={{ color: "var(--dim-label)" }}>{desc}</p>
      <div className="font-exo text-sm tracking-widest" style={{ color: cta_color }}>
        {cta.toUpperCase()}
      </div>
    </Link>
  );
}
