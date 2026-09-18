# Milestone: Verifiable Source Settlement

**Project:** OddLock  
**Network:** GenLayer Studionet (Chain ID 61999)  
**Contract:** `OddLockReferee v0.3.0`  
**Address:** `0x91Bf4968f87942154CAb2b6ccc3e5C5169033f69`  
**Deploy TX:** `0x80dd395ef2a29f7a173c9bcded9ec3307cd1e0b3181d6987dcfd6371da0bf7a9`  
**Status:** ACCEPTED (3/5 validators AGREE)

---

## What Changed

### 1. Exact GenLayer Web-Fetch API

Replaced guessed helper discovery (`get_webpage`, `fetch_webpage`, etc.) with the exact documented API:

```python
response = gl.nondet.web.get(url)
# Returns Response(status:int, headers:dict, body:bytes)
```

Every validator independently fetches locked-source URLs. The contract never falls back to user-submitted claims as primary evidence.

### 2. Proof-Carrying Source Records

Each fetched source record now includes:

| Field | Description |
|-------|-------------|
| `contentDigest` | SHA-256 of the full fetched body |
| `fetchMethod` | Always `gl.nondet.web.get` |
| `httpStatus` | HTTP status code from the fetch |
| `contentLength` | Full body length before truncation |
| `truncated` | Whether content was clipped to 4000 chars |

These fields let anyone independently verify that the verdict was grounded in real source content.

### 3. Fail-Closed Settlement

If the **primary** source fetch fails (network error, non-2xx HTTP, URL validation failure), the contract returns `MORE_EVIDENCE_REQUIRED` without calling the LLM. No winner verdict is ever committed when the source fetch fails.

### 4. HTTPS-Only URL Validation

Source URLs must be:
- HTTPS (HTTP rejected)
- No `localhost`, `127.0.0.1`, `0.0.0.0`, `[::1]`
- No RFC 1918 private ranges (`10.x`, `172.16-31.x`, `192.168.x`)
- No embedded credentials (`user:pass@`)

Validation runs at wager creation time AND at fetch time.

### 5. Superseding Settlement Reports

Dispute outcomes (REVERSE, PUSH_REFUND, INVALIDATE) now create a new **superseding** settlement report instead of mutating the original. The superseding report includes:
- `reportType: "SUPERSEDING_SETTLEMENT"`
- `supersedesReportId` (links to original)
- `triggeredByDisputeId` (links to the dispute that caused it)

The original report is preserved immutably on-chain.

### 6. Escrow Lock on MORE_EVIDENCE_REQUIRED Dispute

When a dispute returns `MORE_EVIDENCE_REQUIRED`, the wager status is set to `DISPUTED` (not `RESOLVED`), which **blocks finalization and payout**. The escrow remains locked until the dispute is resolved.

### 7. Strengthened Equivalence Principles

Both settlement and dispute equivalence principles now require:
- Validators must ground verdicts in the **same fetched source content** (matching `contentDigest`)
- Validators must return `MORE_EVIDENCE_REQUIRED` when primary source fetch fails
- Material agreement on outcome, winning side, and rule application

### 8. Updated Prompt Grounding Rules

Settlement and dispute prompts now:
- Reference `gl.nondet.web.get(url)` (exact API name)
- Mention SHA-256 `contentDigest` for content integrity
- Mandate `MORE_EVIDENCE_REQUIRED` when fetches fail
- Remove `NO_FETCHER` status (contract always has the fetcher)

### 9. Public Proof Verification Page

New page at `/app/wagers/[id]/proof` showing:
- Source verification status (passed/failed)
- SHA-256 content digests
- HTTP status codes
- Fetch method used
- On-chain explorer links

### 10. Frontend Updates

- `FetchedSourceEvidence` component shows `contentDigest`, `httpStatus`, `fetchMethod`
- API label updated to `gl.nondet.web.get()`
- `waitForTx` accepts `status`, `interval`, `retries` parameters
- Settlement types include `supersedesReportId` and `triggeredByDisputeId`

### 11. Regression Tests

29 Python tests covering:
- URL validation (HTTPS-only, private IP rejection, credential rejection)
- String clipping, confidence normalization
- Enum normalization
- Hash determinism
- JSON extraction and fence stripping

---

## Specification Compliance

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Use exact `gl.nondet.web.get(url)` API | Done |
| 2 | Proof-carrying source records with SHA-256 digests | Done |
| 3 | Fail-closed: fetch failure -> MORE_EVIDENCE_REQUIRED | Done |
| 4 | User findings as untrusted secondary claims | Done |
| 5 | HTTPS-only URL validation, no private IPs | Done |
| 6 | Superseding reports instead of mutation | Done |
| 7 | MORE_EVIDENCE_REQUIRED dispute blocks finalization | Done |
| 8 | Strengthened equivalence principles | Done |
| 9 | Updated prompts with correct API name | Done |
| 10 | Public proof verification page | Done |
| 11 | Frontend proof display with digests | Done |
| 12 | Transaction handling with status/interval/retries | Done |
| 13 | Regression test suite | Done |

---

## Verification

```bash
# Run tests
python3 -m pytest tests/test_contract_helpers.py -v -p no:gltest

# Build frontend
npx next build

# Contract syntax check
python3 -c "import ast; ast.parse(open('contracts/OddLockReferee.py').read()); print('OK')"
```

## Network

- **Chain:** GenLayer Studionet (61999)
- **RPC:** `https://studio.genlayer.com/api`
- **Explorer:** `https://explorer-studio.genlayer.com`
