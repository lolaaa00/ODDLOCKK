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

Deploy to GenLayer Studionet, then set `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` in `.env.local`.

---

## Setup

```bash
npm install
cp .env.local.example .env.local   # edit NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS
npm run dev
```

### Environment variables

```env
NEXT_PUBLIC_APP_NAME=OddLock
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=   # deploy OddLockReferee and add address here
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
NEXT_PUBLIC_CURRENCY_MODE=INTERNAL_TEST_UNITS
NEXT_PUBLIC_USE_LOCAL_DRAFTS=true
```

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
