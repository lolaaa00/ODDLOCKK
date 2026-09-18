# OddLock

**Two-party wagers locked by rules, settled by GenLayer.**

**[Live Demo](https://oddlock.vercel.app/)**

> **TESTNET/STUDIONET ONLY. NOT REAL-MONEY GAMBLING.**
>
> OddLock is a Studionet/testnet outcome settlement demo. It is not a real-money gambling product, sportsbook, casino, licensed wagering service, or financial product. Real-value deployment would require legal, compliance, responsible-gambling, age, identity, AML, and jurisdictional review.

---

## What OddLock Is

OddLock is a GenLayer-native P2P outcome wager settlement dApp. Two users lock event terms, trusted sources, and testnet stakes before an outcome happens. GenLayer acts as a source-aware referee when it is time to settle.

All user-facing stake amounts are shown as `GEN` on the frontend, while the contract still receives the exact on-chain value it needs internally.

```
QUESTION → SIDE SEALS → SOURCE CHAIN → LOCKED TICKET → GENLAYER REFEREE → DISPUTE WINDOW → FINAL SEAL
```

OddLock does **not** ask GenLayer to create bets. It asks GenLayer to referee locked terms using trusted public evidence.

### Source-Fetch Evidence Path

The core of OddLock is that validators ground their verdicts in source content fetched on-chain by the contract, not in user claims alone. Here is exactly how it works:

1. **User submits per-source evidence.** The settle page pre-populates evidence rows for each locked source URL. The user describes what each source shows about the outcome. Evidence URLs must match the locked PRIMARY/FALLBACK sources or the contract rejects the packet.

2. **Contract fetches locked sources on-chain.** Inside `request_settlement` and `dispute_settlement`, the contract calls `_fetch_locked_sources()` which uses `gl.nondet.get_webpage()` to fetch the content of each locked source URL. This runs inside the leader validator's nondeterministic execution — the content is real, fetched at settlement time.

3. **Fetched content is the primary basis for the verdict.** The settlement prompt instructs the referee: *"This fetched content is the PRIMARY basis for your verdict. User-submitted evidence items are SECONDARY."* If fetched content contradicts user claims, the contract trusts the fetched content. The referee must cite specific passages from the fetched content in the evidenceTrace.

4. **Fetched content is stored in the settlement report.** Each fetched source record includes: `sourceTier`, `sourceUrl`, `content` (up to 4000 chars), `fetchStatus` (OK / FETCH_FAILED / NO_FETCHER), `contentLength`, and `truncated` flag. This is persisted on-chain alongside the verdict.

5. **Frontend displays the fetched content prominently.** The settlement view shows a "FETCHED SOURCES" section with a summary bar ("2/2 SOURCES FETCHED BY CONTRACT VIA gl.nondet.get_webpage()"), fetch status badges, content length, and the actual fetched text. This is the first section shown after the verdict seal.

6. **Same path for disputes.** When a dispute is filed, the contract fetches the same locked sources again. If content has changed since the original settlement, the referee notes this in ambiguityNotes.

### Consensus Lifecycle Display

Settlement writes show the real GenLayer consensus stages instead of a generic spinner:

```
PENDING → PROPOSING → COMMITTING → REVEALING → ACCEPTED
```

Each stage updates live via `client.getTransaction()` polling. An elapsed timer runs throughout. UNDETERMINED outcomes are explained plainly ("Validators did not reach consensus — nothing was written") with a retry button. Explorer links are shown during consensus.

### Timestamp Approach

OddLock uses `datetime.now(timezone.utc)` for lifecycle windows (deadline checks, dispute window expiry). These are coarse hour/day-sized checks. Settlement verdicts are grounded in locked terms and fetched source content, not in validator-local timestamps.

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

GenLayer consensus reviews the locked terms and public evidence to return a structured, verifiable verdict that the contract can act on. The counterfactual: without GenLayer, one party would decide the outcome and the other must trust them.

### What Is Deterministic

Everything except the settlement/dispute verdict is deterministic: wager creation, acceptance, funding, status transitions, access control, escrow arithmetic, keeper roles, stats tracking, and all validation. GenLayer consensus is used only for the irreducibly semantic question of what the locked sources say about the event outcome.

### Equivalence Principles

Settlement: *"Two OddLock settlement outputs are equivalent if they agree on outcome, winningSide, and the material rule application. Both must apply only the locked wager terms and must preserve the responsible-use rule that this is testnet-only and not real-money gambling. Exact wording of summary, traces, and notes does not need to match."*

Dispute: *"Two OddLock dispute-review outputs are equivalent if they agree on dispute outcome and materially agree on whether the original settlement should be upheld, reversed, refunded, invalidated, reopened, or require more evidence."*

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

Current deployed address: `0x91Bf4968f87942154CAb2b6ccc3e5C5169033f69`
Explorer: [View on Studionet Explorer](https://explorer-studio.genlayer.com/contracts/0x91Bf4968f87942154CAb2b6ccc3e5C5169033f69)

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

The settlement report also includes `fetchedSourceEvidence` — an array of source records fetched on-chain by the contract:

```json
{
  "sourceTier": "PRIMARY",
  "sourceUrl": "https://...",
  "content": "...fetched page text...",
  "fetchStatus": "OK",
  "fetchError": "",
  "contentLength": 2847,
  "truncated": false
}
```

---

## Honest Limits

- **Consensus writes take 2–4 minutes** on Studionet. The UI shows real consensus stages but the wait is inherent.
- **UNDETERMINED outcomes happen.** When validators disagree, nothing is written and the user must retry. The UI explains this and offers a retry button.
- **Studionet balances are simulated.** There is no real EVM layer, so value flows (escrow, claim, refund) are not proven the way they would be on mainnet.
- **Source content can change between settlement and dispute.** The contract fetches sources again during dispute, and the referee notes if content has changed.
- **Fetched content is truncated to 4000 characters.** Very long pages lose content beyond that limit.
- **Wall-clock timestamps** are used for lifecycle windows (deadline, dispute expiry) because Studionet does not expose a consensus block timestamp. These are hour/day-sized checks and do not affect verdict accuracy.

---

## Milestone: Source-Fetch Evidence Path (September 2026)

Changes since the original 520-point submission:

1. **Contract: Source-fetch grounding rule.** Updated settlement and dispute prompts to explicitly instruct the referee that fetched content is the PRIMARY basis for verdicts, with user-submitted evidence as SECONDARY. The referee must cite specific passages from fetched content.

2. **Contract: Fetch metadata.** `_fetch_locked_sources()` now returns `contentLength` and `truncated` fields alongside content, and reports `NO_FETCHER` status when no web helper is available instead of silently returning an empty array.

3. **Frontend: Consensus lifecycle tracker.** New `ConsensusTracker` component replaces the generic spinner on the settle page. Shows real PENDING → PROPOSING → COMMITTING → REVEALING → ACCEPTED stages via `client.getTransaction()` polling, with elapsed timer, explorer link, and UNDETERMINED retry.

4. **Frontend: Enhanced fetched source display.** The `FetchedSourceEvidence` component now shows a summary bar ("2/2 SOURCES FETCHED BY CONTRACT"), per-source fetch status badges (FETCHED BY CONTRACT / FETCH FAILED / NO WEB HELPER), content length, truncation indicators, and "CONTENT FETCHED ON-CHAIN" labels. The section defaults to open in the settlement view.

5. **README: Honest limits and measured details.** Added equivalence principles in full prose, the deterministic/nondeterministic split, timestamp approach documentation, and an honest limits section including UNDETERMINED behavior and Studionet simulation caveats.

---

*OddLock is a responsible Studionet P2P outcome-settlement demo with the Locked Ticket Tribunal UI.*
