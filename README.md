# OddLock

**Two-party wagers locked by rules, settled by GenLayer.**

**[Live Demo](https://oddlock.vercel.app/)**

> **TESTNET/STUDIONET ONLY. NOT REAL-MONEY GAMBLING.**
>
> OddLock is a Studionet/testnet outcome settlement demo. It is not a real-money gambling product, sportsbook, casino, licensed wagering service, or financial product. Real-value deployment would require legal, compliance, responsible-gambling, age, identity, AML, and jurisdictional review.

---

## What OddLock Is

OddLock is a GenLayer-native P2P outcome wager settlement dApp. Two users lock event terms, trusted sources, and testnet stakes before an outcome happens. GenLayer acts as a source-aware referee when it is time to settle.

```
QUESTION → SIDE SEALS → SOURCE CHAIN → LOCKED TICKET → GENLAYER REFEREE → DISPUTE WINDOW → FINAL SEAL
```

OddLock does **not** ask GenLayer to create bets. It asks GenLayer to referee locked terms using trusted public evidence.

### Real Source-Evidence Path

When settlement is requested, the contract:

1. Requires user-submitted evidence findings for each locked source URL
2. Fetches the locked PRIMARY and FALLBACK source URLs via `gl.nondet.get_webpage()` (GenLayer nondeterministic web API)
3. Passes both the user-submitted and contract-fetched source content to the GenLayer LLM referee
4. Stores the fetched source records with the settlement/dispute report
5. The referee cross-checks user claims against fetched content, applies locked rules, and returns a structured verdict

Settlement and dispute packets are rejected unless their evidence URLs match the locked primary/fallback sources. The resolution room displays the fetched source records, source assessments, rule application, and evidence trace so the source path is visible after the verdict.

OddLock uses coarse wall-clock timestamps for lifecycle windows because the current Studionet contract runtime used here does not expose a consensus block timestamp. Those checks are limited to hour/day-sized windows; verdicts are grounded in locked terms and fetched source evidence.

---

## Why GenLayer

A normal smart contract can lock stakes and release them after a deterministic answer. It cannot reliably interpret:

- Conflicting sources
- Late source updates
- Ambiguous event wording
- Cancellation rules
- Postponement rules
- Manipulation concerns
- Source priority

GenLayer consensus reviews the locked terms and public evidence to return a structured, verifiable verdict that the contract can act on.

---

## Stack

- **Next.js 16** (App Router, TypeScript strict mode)
- **Tailwind CSS** (custom Sealed Ledger Neon palette)
- **wagmi + viem** (injected wallet, GenLayer Studionet chain)
- **genlayer-js 1.1.8** (GenLayer JS SDK)
- **Framer Motion** (animation)
- **Lucide React** (icons)
- **Zod** (validation)
- **date-fns** (date utilities)
- **localStorage** (local drafts and responsible-use settings)

No Privy. No Firebase. No Supabase. No OpenAI. No external AI. No real-money payment rails.

---

## Contract

Contract name: `OddLockReferee`  
File: `contracts/OddLockReferee.py`

Current deployed address: `0xC2DBe9C792717A89c1BFA6F532d5105b13A4E755`

Deploy to GenLayer Studionet, then set `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` in `.env.local`.

---

## Setup

```bash
npm install
cp .env.local.example .env.local   # edit NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS
npm run dev
```

A working `.env.local.example` is included in the repo and is prefilled with the current contract address. Deploy `OddLockReferee.py` to GenLayer Studionet, then keep your local `.env.local` in sync with the deployed address.

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/app` | Settlement desk dashboard |
| `/app/create` | Create locked ticket (6-step wizard) |
| `/app/wagers` | My locked tickets |
| `/app/wagers/[id]` | Ticket detail |
| `/app/wagers/[id]/terms` | Locked terms view |
| `/app/wagers/[id]/settle` | Request GenLayer referee |
| `/app/wagers/[id]/dispute` | File objection slip |
| `/app/sources` | Source reference guide |
| `/app/responsible` | Responsible use controls |
| `/app/playground` | Referee playground (schema test) |
| `/app/settings` | Studionet configuration |

---

## Responsible Use

OddLock includes visible responsible-use controls:

- Testnet-only and age acknowledgement gates
- Cooling-off toggle
- Session reminder
- Wager limit setting
- Self-exclusion simulation (30 days)
- No chasing-losses copy
- No VIP tiers
- No stake-size leaderboards
- No dark patterns

Blocked wager categories: death, injury, violence, terrorism, crime, doxxing, harassment, self-harm, private individuals, sexual/private-life outcomes, insider information, manipulable events.

---

## Build & Lint

```bash
npm run build   # must pass
npm run lint    # must pass
```

---

## Settlement Output Schema

GenLayer returns structured JSON:

```json
{
  "outcome": "CREATOR_WINS | COUNTERPARTY_WINS | PUSH_REFUND | INVALID | MORE_EVIDENCE_REQUIRED",
  "confidence": 0-100,
  "winningSide": "string",
  "summary": "string",
  "evidenceTrace": [...],
  "ruleApplication": [...],
  "sourceAssessment": [...],
  "ambiguityNotes": [...],
  "manipulationWarnings": [...],
  "responsibleUseNote": "This is a testnet P2P wager settlement demo, not real-money gambling."
}
```

---

*OddLock is a responsible Studionet P2P outcome-settlement demo with the Locked Ticket Tribunal UI.*
