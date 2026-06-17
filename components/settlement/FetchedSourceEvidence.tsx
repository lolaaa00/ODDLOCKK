"use client";

import { AlertTriangle, FileSearch } from "lucide-react";
import type { FetchedSourceEvidence as FetchedSourceEvidenceType } from "@/types/wager";

interface Props {
  sources: FetchedSourceEvidenceType[];
}

const STATUS_COLOR = {
  OK: "var(--canopy)",
  FETCH_FAILED: "var(--invalid-alert)",
};

export function FetchedSourceEvidence({ sources }: Props) {
  if (!sources.length) {
    return (
      <div className="soft-panel rounded p-6 text-center">
        <p className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>
          No fetched source record available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map((source, i) => {
        const statusColor = STATUS_COLOR[source.fetchStatus] ?? "var(--dim-label)";
        return (
          <div
            key={`${source.sourceTier}-${source.sourceUrl}-${i}`}
            className="rounded p-4"
            style={{ border: "1px solid var(--glass-line)", background: "rgba(62,34,32,0.50)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileSearch className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dim-label)" }} />
                  <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
                    {source.sourceTier}
                  </span>
                  <span className="font-azeret text-xs" style={{ color: statusColor }}>
                    {source.fetchStatus}
                  </span>
                </div>
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-azeret text-sm hover:underline"
                  style={{ color: "var(--dim-label)" }}
                >
                  {source.sourceUrl}
                </a>
              </div>
            </div>

            {source.fetchStatus === "FETCH_FAILED" ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--invalid-alert)" }} />
                <p className="font-nunito text-sm" style={{ color: "rgba(226,112,112,0.85)" }}>
                  {source.fetchError || "Source fetch failed."}
                </p>
              </div>
            ) : (
              <pre
                className="max-h-56 overflow-auto whitespace-pre-wrap rounded p-3 font-azeret text-xs leading-relaxed"
                style={{
                  border: "1px solid rgba(240,230,226,0.08)",
                  background: "rgba(22,18,18,0.45)",
                  color: "var(--dim-label)",
                }}
              >
                {source.content || "(empty response)"}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
