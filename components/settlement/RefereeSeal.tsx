"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import type { SettlementReport } from "@/types/wager";

interface Props {
  report: SettlementReport;
}

const OUTCOME_CONFIG = {
  CREATOR_WINS: {
    color: "#DDD0CC",
    secondary: "#C8B8B0",
    bg: "rgba(107,7,14,0.10)",
    border: "rgba(200,155,60,0.35)",
    label: "CREATOR WINS",
    icon: CheckCircle2,
  },
  COUNTERPARTY_WINS: {
    color: "#C8B8B0",
    secondary: "#DDD0CC",
    bg: "rgba(122,158,111,0.08)",
    border: "rgba(240,230,226,0.18)",
    label: "COUNTERPARTY WINS",
    icon: CheckCircle2,
  },
  PUSH_REFUND: {
    color: "#8A766D",
    secondary: "#8A766D",
    bg: "rgba(138,118,109,0.08)",
    border: "rgba(138,118,109,0.25)",
    label: "PUSH REFUND",
    icon: RefreshCw,
  },
  INVALID: {
    color: "#E27070",
    secondary: "#E27070",
    bg: "rgba(226,112,112,0.06)",
    border: "rgba(226,112,112,0.25)",
    label: "INVALID",
    icon: XCircle,
  },
  MORE_EVIDENCE_REQUIRED: {
    color: "#DDD0CC",
    secondary: "#DDD0CC",
    bg: "rgba(200,155,60,0.06)",
    border: "rgba(240,230,226,0.15)",
    label: "MORE EVIDENCE REQUIRED",
    icon: AlertCircle,
  },
};

export function RefereeSeal({ report }: Props) {
  const cfg = OUTCOME_CONFIG[report.outcome] ?? OUTCOME_CONFIG.INVALID;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="verdict-stamp"
    >
      {/* Halo ring wrapper */}
      <div
        className="bio-pulse-ring"
        style={{ borderRadius: 10, display: "inline-block", width: "100%", position: "relative" }}
      >
        {/* Gradient top edge */}
        <div className="desk-gradient-edge" style={{ borderRadius: "10px 10px 0 0" }} />

        <div
          style={{
            borderRadius: 10,
            padding: "1.5rem",
            marginBottom: "1rem",
            border: `1px solid ${cfg.border}`,
            background: cfg.bg,
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            {/* Concentric ring seal symbol */}
            <div style={{
              position: "relative",
              display: "flex",
              height: 56, width: 56,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(107,7,14,0.30) 0%, rgba(30,14,12,0.60) 100%)",
              border: "1px solid rgba(107,7,14,0.50)",
            }}>
              <div style={{
                height: 28, width: 28, borderRadius: "50%",
                border: `1.5px solid ${cfg.color}`,
              }} />
              <div style={{
                position: "absolute",
                height: 10, width: 10, borderRadius: "50%",
                background: "linear-gradient(135deg, #6B070E, #DDD0CC)",
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-exo" style={{ fontSize: "0.5625rem", letterSpacing: "0.2em", marginBottom: 2, textTransform: "uppercase", color: "#8A766D" }}>
                GenLayer Referee Seal
              </div>
              <div className="font-staatliches" style={{ fontSize: "2rem", letterSpacing: "0.08em", lineHeight: 1, color: cfg.color }}>
                {cfg.label}
              </div>
            </div>

            <Icon style={{ height: 20, width: 20, flexShrink: 0, color: cfg.color }} />
          </div>

          {/* Confidence bar */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="font-exo" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A766D" }}>
                Confidence
              </span>
              <span className="font-changa" style={{ fontSize: "1.125rem", color: cfg.color }}>
                {report.confidence}%
              </span>
            </div>
            <div style={{ height: 4, width: "100%", borderRadius: 9999, background: "rgba(138,118,109,0.15)" }}>
              <div style={{
                height: "100%", borderRadius: 9999,
                width: `${report.confidence}%`,
                background: `linear-gradient(90deg, #6B070E, ${cfg.color})`,
              }} />
            </div>
          </div>

          {/* Verdict summary */}
          <p className="font-nunito" style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "#CBC2C0" }}>
            {report.summary}
          </p>

          {/* Winning side */}
          {report.winningSide && (
            <div style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(203,194,192,0.12)",
            }}>
              <span className="font-exo" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A766D" }}>
                Winning side:
              </span>
              <span className="font-azeret" style={{ fontSize: "0.8125rem", color: cfg.color }}>
                {report.winningSide}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Responsible use note */}
      <div style={{
        borderRadius: 8, padding: "0.75rem 1rem",
        display: "flex", alignItems: "flex-start", gap: "0.625rem",
        background: "rgba(122,158,111,0.07)",
        border: "1px solid rgba(122,158,111,0.20)",
      }}>
        <div style={{ height: 6, width: 6, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: "#C8B8B0" }} />
        <p className="font-nunito" style={{ fontSize: "1.125rem", lineHeight: 1.55, color: "#8A766D" }}>
          {report.responsibleUseNote}
        </p>
      </div>
    </motion.div>
  );
}
