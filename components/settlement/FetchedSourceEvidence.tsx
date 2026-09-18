"use client";

import { AlertTriangle, FileSearch, Globe, CheckCircle } from "lucide-react";
import type { FetchedSourceEvidence as FetchedSourceEvidenceType } from "@/types/wager";

interface Props {
  sources: FetchedSourceEvidenceType[];
}

const STATUS_STYLES: Record<string, { color: string; label: string; icon: "ok" | "fail" | "none" }> = {
  OK: { color: "var(--canopy)", label: "FETCHED BY CONTRACT", icon: "ok" },
  FETCH_FAILED: { color: "var(--invalid-alert)", label: "FETCH FAILED", icon: "fail" },
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

  const fetched = sources.filter((s) => s.fetchStatus === "OK" && s.content);
  const failed = sources.filter((s) => s.fetchStatus !== "OK");

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div
        className="flex items-center gap-3 rounded px-4 py-2.5"
        style={{
          border: `1px solid ${fetched.length > 0 ? "rgba(122,158,111,0.30)" : "rgba(226,112,112,0.30)"}`,
          background: fetched.length > 0 ? "rgba(122,158,111,0.06)" : "rgba(226,112,112,0.06)",
        }}
      >
        <Globe className="h-4 w-4 shrink-0" style={{ color: fetched.length > 0 ? "var(--canopy)" : "var(--invalid-alert)" }} />
        <span className="font-exo text-xs tracking-widest" style={{ color: fetched.length > 0 ? "var(--canopy)" : "var(--invalid-alert)" }}>
          {fetched.length}/{sources.length} SOURCES FETCHED BY CONTRACT VIA gl.nondet.web.get()
        </span>
        {failed.length > 0 && (
          <span className="font-azeret text-xs" style={{ color: "var(--invalid-alert)" }}>
            {failed.length} failed
          </span>
        )}
      </div>

      {sources.map((source, i) => {
        const style = STATUS_STYLES[source.fetchStatus] ?? STATUS_STYLES.FETCH_FAILED;
        return (
          <div
            key={`${source.sourceTier}-${source.sourceUrl}-${i}`}
            className="rounded overflow-hidden"
            style={{ border: "1px solid var(--glass-line)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: source.fetchStatus === "OK" ? "rgba(122,158,111,0.08)" : "rgba(107,7,14,0.12)" }}
            >
              <div className="flex items-center gap-2.5">
                {style.icon === "ok" ? (
                  <CheckCircle className="h-3.5 w-3.5" style={{ color: style.color }} />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: style.color }} />
                )}
                <span className="font-exo text-xs tracking-widest" style={{ color: style.color }}>
                  {style.label}
                </span>
                <span
                  className="font-exo text-xs tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(240,230,226,0.08)", color: "var(--dim-label)" }}
                >
                  {source.sourceTier}
                </span>
              </div>
              {source.contentLength != null && source.contentLength > 0 && (
                <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
                  {source.contentLength.toLocaleString()} chars
                  {source.truncated ? " (truncated to 4000)" : ""}
                </span>
              )}
            </div>

            {/* URL + proof metadata */}
            <div className="px-4 py-2 space-y-1" style={{ borderTop: "1px solid rgba(240,230,226,0.06)" }}>
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-azeret text-sm hover:underline"
                style={{ color: "var(--dim-label)" }}
              >
                {source.sourceUrl}
              </a>
              <div className="flex flex-wrap gap-3">
                {source.httpStatus != null && source.httpStatus > 0 && (
                  <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
                    HTTP {source.httpStatus}
                  </span>
                )}
                {source.fetchMethod && (
                  <span className="font-azeret text-xs" style={{ color: "var(--dim-label)" }}>
                    via {source.fetchMethod}
                  </span>
                )}
                {source.contentDigest && (
                  <span className="font-azeret text-xs" style={{ color: "var(--canopy)" }} title={`SHA-256: ${source.contentDigest}`}>
                    SHA-256: {source.contentDigest.slice(0, 16)}…
                  </span>
                )}
              </div>
            </div>

            {/* Content or error */}
            <div className="px-4 pb-4 pt-1">
              {source.fetchStatus !== "OK" ? (
                <div className="flex items-start gap-2 rounded p-3" style={{ background: "rgba(226,112,112,0.06)" }}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--invalid-alert)" }} />
                  <p className="font-nunito text-sm" style={{ color: "rgba(226,112,112,0.85)" }}>
                    {source.fetchError || "Source fetch failed — verdict relies on user-submitted evidence for this source."}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="h-3 w-3" style={{ color: "var(--dim-label)" }} />
                    <span className="font-exo text-xs tracking-widest" style={{ color: "var(--dim-label)" }}>
                      CONTENT FETCHED ON-CHAIN
                    </span>
                  </div>
                  <pre
                    className="max-h-64 overflow-auto whitespace-pre-wrap rounded p-3 font-azeret text-xs leading-relaxed"
                    style={{
                      border: "1px solid rgba(122,158,111,0.15)",
                      background: "rgba(22,18,18,0.45)",
                      color: "var(--dim-label)",
                    }}
                  >
                    {source.content || "(empty response)"}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
