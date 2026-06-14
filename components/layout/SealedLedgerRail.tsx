"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, BookOpen, ShieldCheck, Beaker, Settings, Layers, Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
        borderBottom: "1px solid rgba(240,230,226,0.08)",
        background: "rgba(20,6,4,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
      }}
    >
      {/* Gradient bottom line */}
      <div style={{
        position: "absolute", bottom: -1, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent 0%, #B01020 30%, #D4A017 65%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Main bar */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:px-5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div style={{
            width: 22, height: 22,
            background: "linear-gradient(135deg, #B01020, #D4A017)",
            borderRadius: "50%", position: "relative",
            boxShadow: "0 0 14px rgba(176,16,32,0.55)",
            flexShrink: 0,
          }}>
            <div style={{ position: "absolute", inset: 4, background: "#1A0A08", borderRadius: "50%" }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", width: 5, height: 5,
              background: "linear-gradient(135deg, #D4152A, #EEC044)",
              clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
            }} />
          </div>
          <span className="font-staatliches text-xl tracking-widest" style={{ color: "#F0E6E2" }}>
            ODDLOCK
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 mx-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/app" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 font-exo text-xs tracking-wide transition-colors whitespace-nowrap",
                  active ? "text-[#F0E6E2]" : "text-[#A8917F] hover:text-[#DDD0CC]"
                )}
                style={active ? { background: "rgba(139,10,20,0.25)", border: "1px solid rgba(240,230,226,0.10)" } : {}}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded px-2.5 py-1.5"
            style={{ border: "1px solid rgba(240,230,226,0.12)", background: "rgba(61,26,22,0.50)" }}>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#C8B8B0" }} />
            <span className="font-exo text-xs tracking-widest" style={{ color: "#DDD0CC" }}>STUDIONET</span>
          </div>

          {isConnected && address ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 rounded px-3 py-1.5 font-azeret text-xs transition-colors"
              style={{ border: "1px solid rgba(240,230,226,0.13)", background: "rgba(139,10,20,0.15)", color: "#DDD0CC" }}
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#D4152A" }} />
              {shortAddress(address)}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="btn-tribunal flex items-center gap-2 rounded px-3 py-1.5 font-exo text-xs tracking-wide font-semibold disabled:opacity-60"
              title={connectError || undefined}
            >
              {connecting ? "CONNECTING…" : "CONNECT WALLET"}
            </button>
          )}
        </div>

        {/* Mobile right: wallet indicator + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {isConnected && address && (
            <div className="flex items-center gap-1.5 rounded px-2 py-1"
              style={{ border: "1px solid rgba(240,230,226,0.10)", background: "rgba(139,10,20,0.15)" }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#D4152A" }} />
              <span className="font-azeret text-xs" style={{ color: "#DDD0CC" }}>{shortAddress(address)}</span>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded p-1.5 transition-colors"
            style={{ color: "#DDD0CC", background: mobileOpen ? "rgba(139,10,20,0.25)" : "transparent" }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ borderTop: "1px solid rgba(240,230,226,0.08)", background: "rgba(20,6,4,0.97)" }}>
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/app" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded px-3 py-2.5 font-exo text-sm tracking-wide transition-colors",
                    active ? "text-[#F0E6E2]" : "text-[#A8917F]"
                  )}
                  style={active ? { background: "rgba(139,10,20,0.25)", borderLeft: "3px solid #D4152A" } : {}}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile wallet + studionet */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(240,230,226,0.06)" }}>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#C8B8B0" }} />
              <span className="font-exo text-xs tracking-widest" style={{ color: "#A8917F" }}>STUDIONET</span>
            </div>
            {isConnected && address ? (
              <button
                onClick={() => { disconnect(); setMobileOpen(false); }}
                className="font-azeret text-xs rounded px-3 py-1.5"
                style={{ border: "1px solid rgba(240,230,226,0.12)", color: "#DDD0CC", background: "rgba(139,10,20,0.15)" }}
              >
                {shortAddress(address)} (disconnect)
              </button>
            ) : (
              <button
                onClick={() => { handleConnect(); setMobileOpen(false); }}
                disabled={connecting}
                className="btn-tribunal rounded px-3 py-1.5 font-exo text-xs tracking-wide font-semibold disabled:opacity-60"
              >
                {connecting ? "CONNECTING…" : "CONNECT WALLET"}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
