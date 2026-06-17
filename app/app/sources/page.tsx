import { BookOpen, Link2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function SourcesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5" style={{ color: "var(--dim-label)" }} />
        <h1 className="font-staatliches text-base md:text-xl tracking-wide" style={{ color: "var(--ink-text)" }}>
          SOURCE REFERENCE
        </h1>
      </div>

      <p className="font-nunito text-base leading-relaxed" style={{ color: "var(--dim-label)" }}>
        OddLock requires that every wager defines a primary and fallback source before
        locking. Settlement and objection evidence must reference those locked URLs,
        and GenLayer fetches their page content before rendering a verdict. Sources
        must be public, authoritative, and not controllable by either party.
      </p>

      {/* Source tier guide */}
      <div className="space-y-3">
        <div className="font-exo text-sm tracking-widest" style={{ color: "var(--dim-label)" }}>
          SOURCE TIERS
        </div>
        {[
          {
            tier: "PRIMARY",
            color: "var(--dim-label)",
            borderColor: "rgba(238,192,68,0.25)",
            bg: "rgba(238,192,68,0.06)",
            desc: "Official authoritative source for the event. GenLayer checks this first.",
            examples: [
              "Official league website result pages",
              "Official organisation announcement pages",
              "Government official results portals",
            ],
          },
          {
            tier: "FALLBACK",
            color: "var(--dim-label)",
            borderColor: "rgba(240,230,226,0.12)",
            bg: "rgba(240,230,226,0.04)",
            desc: "Reliable backup source. Used if the primary source is unavailable or conflicts with the conflict rule.",
            examples: [
              "Established news organisations",
              "Official statistical aggregators",
              "Secondary official sources",
            ],
          },
        ].map(({ tier, color, borderColor, bg, desc, examples }) => (
          <div
            key={tier}
            className="rounded p-5"
            style={{ border: `1px solid ${borderColor}`, background: bg }}
          >
            <div className="font-exo text-sm tracking-widest mb-2" style={{ color }}>
              {tier}
            </div>
            <p className="font-nunito text-base mb-3" style={{ color: "var(--dim-label)" }}>{desc}</p>
            <div className="space-y-1">
              {examples.map((ex) => (
                <div key={ex} className="flex items-center gap-2">
                  <Link2 className="h-3 w-3 shrink-0" style={{ color: "var(--mauve)" }} />
                  <span className="font-nunito text-sm" style={{ color: "var(--dim-label)" }}>{ex}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Good source checklist */}
      <div className="space-y-3">
        <div className="font-exo text-sm tracking-widest" style={{ color: "var(--dim-label)" }}>
          GOOD SOURCE CHECKLIST
        </div>
        {[
          { ok: true,  text: "Publicly accessible without login" },
          { ok: true,  text: "Controlled by an authoritative body, not a party to the wager" },
          { ok: true,  text: "Updates after event outcomes" },
          { ok: true,  text: "Has a stable URL for the specific result" },
          { ok: false, text: "Social media (too volatile, easily manipulated)" },
          { ok: false, text: "Pages controlled by either party" },
          { ok: false, text: "Paywalled or login-required pages" },
          { ok: false, text: "Aggregators with inconsistent update times" },
        ].map(({ ok, text }) => (
          <div key={text} className="flex items-center gap-2">
            {ok ? (
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "var(--source-confirm)" }} />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--invalid-alert)" }} />
            )}
            <span className="font-nunito text-base" style={{ color: "var(--dim-label)" }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="rounded p-4" style={{ border: "1px solid var(--glass-line)", background: "var(--soft-panel)" }}>
        <p className="font-nunito text-sm leading-relaxed" style={{ color: "var(--dim-label)" }}>
          OddLock validates public source URLs before locking. During settlement and
          objection review, the contract fetches those locked URLs, stores the fetch
          record with the report, and includes reliability and manipulation-risk
          assessment in the referee verdict.
        </p>
      </div>
    </div>
  );
}
