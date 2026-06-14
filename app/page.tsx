import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.875rem 1.25rem",
        background: "rgba(20,6,4,0.88)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
      }}>
        <div style={{
          position: "absolute", bottom: -1, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent 0%, #B01020 30%, #D4A017 65%, transparent 100%)",
          pointerEvents: "none",
        }} />

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <div style={{
            width: 26, height: 26,
            background: "linear-gradient(135deg, #B01020, #D4A017)",
            borderRadius: "50%", position: "relative",
            boxShadow: "0 0 18px rgba(176,16,32,0.6)",
            flexShrink: 0,
          }}>
            <div style={{ position: "absolute", inset: 5, background: "#1A0A08", borderRadius: "50%" }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", width: 7, height: 7,
              background: "linear-gradient(135deg, #D4152A, #EEC044)",
              clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
            }} />
          </div>
          <span style={{ fontFamily: "var(--font-staatliches), sans-serif", fontSize: "1.25rem", letterSpacing: "0.1em", color: "#F0E6E2" }}>
            OddLock
          </span>
        </Link>

        <ul style={{ display: "flex", gap: "2.25rem", listStyle: "none" }} className="hidden md:flex">
          {["Product", "How It Works", "Responsible Use"].map((l) => (
            <li key={l}>
              <a href="#" className="nav-link-landing">{l}</a>
            </li>
          ))}
        </ul>

        <Link href="/app" className="btn-tribunal" style={{
          padding: "0.5rem 1.25rem",
          fontFamily: "var(--font-exo-2), sans-serif",
          fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", textDecoration: "none",
          display: "inline-block", borderRadius: 4,
        }}>
          Launch App
        </Link>
      </nav>

      {/* HERO */}
      <section style={{
        position: "relative", zIndex: 2,
        minHeight: "85vh",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        textAlign: "center",
        padding: "4rem 1.25rem 2.5rem",
        overflow: "hidden",
      }}>
        {/* Halo */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(176,16,32,0.18) 0%, rgba(212,160,23,0.07) 42%, transparent 68%)",
          pointerEvents: "none",
        }} />

        {/* Badge */}
        <div style={{
          fontFamily: "var(--font-exo-2), sans-serif",
          fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#EEC044",
          padding: "0.5rem 1.25rem",
          border: "1px solid rgba(212,160,23,0.3)",
          borderRadius: 3, background: "rgba(212,160,23,0.08)",
          marginBottom: "1.75rem",
          display: "inline-flex", alignItems: "center", gap: "0.625rem",
          position: "relative", zIndex: 1,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#D4152A", boxShadow: "0 0 10px #D4152A",
            display: "inline-block", flexShrink: 0,
          }} />
          Built on GenLayer Intelligent Contracts
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-staatliches), sans-serif",
          fontSize: "clamp(1.75rem, 6vw, 3.5rem)",
          letterSpacing: "0.06em", textTransform: "uppercase",
          lineHeight: 0.92, marginBottom: "1.5rem",
          maxWidth: 800, position: "relative", zIndex: 1,
          color: "#F0E6E2",
        }}>
          <span style={{ display: "block" }}>Lock the</span>
          <span style={{
            display: "block",
            background: "linear-gradient(110deg, #F0E6E2 0%, #D4152A 22%, #EEC044 48%, #B01020 74%, #F0E6E2 100%)",
            backgroundSize: "280% auto",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Terms.</span>
          <span style={{ display: "block" }}>
            Let{" "}
            <span style={{
              background: "linear-gradient(110deg, #F0E6E2 0%, #D4152A 22%, #EEC044 48%, #B01020 74%, #F0E6E2 100%)",
              backgroundSize: "280% auto",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>GenLayer</span>
          </span>
          <span style={{ display: "block" }}>Decide.</span>
        </h1>

        <p style={{
          fontFamily: "var(--font-nunito-sans), sans-serif",
          fontSize: "0.875rem", lineHeight: 1.6,
          color: "#DDD0CC",
          maxWidth: 520, marginBottom: "2rem",
          position: "relative", zIndex: 1,
        }}>
          Two parties. One sealed wager. GenLayer intelligent consensus reviews your locked
          rules and public evidence, then delivers an explainable verdict.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <Link href="/app/create" className="btn-tribunal" style={{
            padding: "0.75rem 1.5rem",
            fontFamily: "var(--font-exo-2), sans-serif",
            fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
          }}>
            Create Wager →
          </Link>
          <Link href="#how" className="btn-ghost" style={{
            padding: "0.75rem 1.5rem",
            fontFamily: "var(--font-exo-2), sans-serif",
            fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.06em",
            textTransform: "uppercase", textDecoration: "none",
          }}>
            See How It Works
          </Link>
        </div>
      </section>

      {/* RESPONSIBLE STRIP */}
      <div style={{
        position: "relative", zIndex: 2,
        background: "linear-gradient(90deg, rgba(42,16,12,0.95), rgba(61,26,22,0.95), rgba(42,16,12,0.95))",
        borderTop: "1px solid rgba(212,160,23,0.2)",
        borderBottom: "1px solid rgba(212,160,23,0.2)",
        padding: "1.25rem 2rem", textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-azeret-mono), monospace",
          fontSize: "0.8125rem", color: "#EEC044",
          lineHeight: 1.55, maxWidth: 820, margin: "0 auto",
        }}>
          ⚠ OddLock is a Studionet/testnet outcome settlement demo. Not a real-money gambling product,
          sportsbook, casino, licensed wagering service, or financial product. All stakes are internal test units only.
        </p>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{
        position: "relative", zIndex: 2,
        maxWidth: 1080, margin: "0 auto", padding: "3rem 1.25rem",
        width: "100%",
      }}>
        <div style={{
          fontFamily: "var(--font-exo-2), sans-serif",
          fontSize: "0.75rem", fontWeight: 700,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "#D4152A",
          marginBottom: "0.875rem",
          display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <span style={{ width: 24, height: 2, background: "linear-gradient(90deg, #D4152A, #D4A017)", display: "inline-block" }} />
          How It Works
        </div>

        <h2 style={{
          fontFamily: "var(--font-staatliches), sans-serif",
          fontSize: "clamp(1.25rem, 4vw, 2rem)",
          letterSpacing: "0.05em", textTransform: "uppercase",
          color: "#F0E6E2", lineHeight: 0.95, marginBottom: "1rem",
        }}>
          From Lock to Verdict
        </h2>
        <p style={{
          fontFamily: "var(--font-nunito-sans), sans-serif",
          color: "#DDD0CC", fontSize: "0.875rem", lineHeight: 1.65,
          maxWidth: 540, marginBottom: "3.5rem",
        }}>
          No ambiguity. No late-rule changes. Terms sealed before the event. GenLayer decides after.
        </p>

        {/* Steps grid */}
        <div className="steps-grid" style={{
          border: "1px solid rgba(240,230,226,0.1)",
          borderRadius: 6, overflow: "hidden",
          background: "rgba(240,230,226,0.06)",
        }}>
          {[
            { num: "01", title: "Lock Terms",      desc: "Two parties agree on event, sides, deadline, and source rules. All terms are sealed on-chain before the event." },
            { num: "02", title: "Both Fund",        desc: "Counterparty reviews and accepts. Both sides fund their stake into the smart contract escrow." },
            { num: "03", title: "Tribunal Reviews", desc: "After deadline, GenLayer validators fetch trusted sources, apply locked rules, and reach decentralised consensus." },
            { num: "04", title: "Verdict Sealed",   desc: "Winner claims stakes or a refund is issued. Either party may file an objection within the dispute window." },
          ].map(({ num, title, desc }, i) => (
            <div key={num} style={{
              background: "#3D1A16", padding: "1.5rem 1.25rem",
              borderLeft: i > 0 ? "1px solid rgba(240,230,226,0.1)" : "none",
            }}
            className="step-card"
            >
              <div style={{
                fontFamily: "var(--font-changa-one), sans-serif",
                fontSize: "1.5rem", lineHeight: 1, marginBottom: "0.75rem",
                background: "linear-gradient(135deg, #B01020 0%, #D4A017 100%)",
                WebkitBackgroundClip: "text", backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>{num}</div>
              <div style={{
                fontFamily: "var(--font-staatliches), sans-serif",
                fontSize: "1rem", letterSpacing: "0.06em",
                textTransform: "uppercase", color: "#F0E6E2", marginBottom: "0.625rem",
              }}>{title}</div>
              <p style={{
                fontFamily: "var(--font-nunito-sans), sans-serif",
                fontSize: "0.8125rem", color: "#DDD0CC", lineHeight: 1.55,
              }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Why GenLayer sealed note */}
        <div className="genlayer-note" style={{ marginTop: "3.5rem", padding: "1.75rem 2rem" }}>
          <div style={{
            fontFamily: "var(--font-exo-2), sans-serif",
            fontSize: "0.8125rem", fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#D4152A", marginBottom: "0.75rem",
          }}>
            Why This Needed GenLayer
          </div>
          <p style={{
            fontFamily: "var(--font-nunito-sans), sans-serif",
            fontSize: "0.875rem", color: "#DDD0CC", lineHeight: 1.6,
          }}>
            Deterministic smart contracts can lock terms and stakes, but they cannot interpret source
            conflicts, late result updates, cancellation rules, postponement clauses, ambiguous wording,
            or public evidence. GenLayer intelligent consensus does what no conventional contract can.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: "relative", zIndex: 2,
        padding: "2.5rem 2rem", textAlign: "center",
        borderTop: "1px solid rgba(240,230,226,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <ShieldCheck style={{ width: 15, height: 15, color: "#C8B8B0" }} />
          <span style={{
            fontFamily: "var(--font-exo-2), sans-serif", fontSize: "0.75rem",
            letterSpacing: "0.12em", textTransform: "uppercase", color: "#A8917F",
          }}>Responsible Use</span>
        </div>
        <p style={{
          fontFamily: "var(--font-azeret-mono), monospace",
          fontSize: "0.8125rem", color: "#A8917F", opacity: 0.5, letterSpacing: "0.06em",
        }}>
          OddLock · Studionet P2P Settlement Demo · Not a real-money gambling product · Built on GenLayer
        </p>
      </footer>
    </div>
  );
}
