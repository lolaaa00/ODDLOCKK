"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, BookOpen, ShieldCheck, Beaker, Settings, Layers } from "lucide-react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { shortAddress, cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/app",             label: "TRIBUNAL",    icon: Scale },
  { href: "/app/wagers",      label: "CAPSULES",    icon: Layers },
  { href: "/app/sources",     label: "SOURCES",     icon: BookOpen },
  { href: "/app/playground",  label: "PLAYGROUND",  icon: Beaker },
  { href: "/app/responsible", label: "RESPONSIBLE", icon: ShieldCheck },
  { href: "/app/settings",    label: "SETTINGS",    icon: Settings },
];

export function SealedLedgerRail() {
  const pathname = usePathname();
  const { address, isConnected, connect, disconnect } = useGenLayer();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  async function handleConnect() {
    setConnectError("");
    setConnecting(true);
    try {
      await connect();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        borderBottom: "1px solid rgba(203,194,192,0.10)",
        background: "rgba(30,14,12,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
      }}
    >
      {/* Gradient bottom line */}
      <div style={{
        position: "absolute",
        bottom: -1, left: 0, right: 0,
        height: 1,
        background: "linear-gradient(90deg, transparent 0%, rgba(107,7,14,0.6) 30%, rgba(200,155,60,0.4) 65%, transparent 100%)",
        opacity: 0.7,
        pointerEvents: "none",
      }} />

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5">

        {/* Logo ember/gold seal mark */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div style={{
            width: 22, height: 22,
            background: "linear-gradient(135deg, #6B070E, #DDD0CC)",
            borderRadius: "50%",
            position: "relative",
            boxShadow: "0 0 0 2px rgba(107,7,14,0.45), 0 0 14px rgba(107,7,14,0.4)",
            flexShrink: 0,
          }}>
            <div style={{ position: "absolute", inset: 4, background: "#1E0E0C", borderRadius: "50%" }} />
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 5, height: 5,
              background: "linear-gradient(135deg, #8C0A12, #E8C96A)",
              clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
            }} />
          </div>
          <span
            className="font-staatliches text-2xl tracking-widest"
            style={{ color: "#CBC2C0" }}
          >
            ODDLOCK
          </span>
        </Link>

        <div className="h-5 w-px" style={{ background: "rgba(203,194,192,0.13)" }} />

        {/* Nav */}
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/app" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 font-exo text-sm tracking-wide transition-colors",
                  active
                    ? "text-[#F0E6E2]"
                    : "text-[#A8917F] hover:text-[#DDD0CC]"
                )}
                style={active ? { background: "rgba(139,10,20,0.22)", border: "1px solid rgba(240,230,226,0.12)" } : {}}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Studionet badge */}
        <div
          className="hidden items-center gap-1.5 rounded px-3 py-1.5 sm:flex"
          style={{ border: "1px solid rgba(240,230,226,0.15)", background: "rgba(61,26,22,0.50)" }}
        >
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#C8B8B0" }} />
          <span className="font-exo text-sm tracking-widest" style={{ color: "#DDD0CC" }}>
            STUDIONET
          </span>
        </div>

        {/* Wallet */}
        {isConnected && address ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 rounded px-3 py-1.5 font-azeret text-sm transition-colors"
            style={{
              border: "1px solid rgba(240,230,226,0.13)",
              background: "rgba(139,10,20,0.15)",
              color: "#DDD0CC",
            }}
          >
            <div className="h-2 w-2 rounded-full" style={{ background: "#D4152A" }} />
            {shortAddress(address)}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn-tribunal flex items-center gap-2 rounded px-4 py-1.5 font-exo text-sm tracking-wide font-semibold disabled:opacity-60"
            title={connectError || undefined}
          >
            {connecting ? "CONNECTING…" : "CONNECT WALLET"}
          </button>
        )}
      </div>
    </header>
  );
}
