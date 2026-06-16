# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import hashlib
from datetime import datetime, timezone


ALLOWED_WAGER_STATUS = (
    "INVITED", "ACCEPTED", "CREATOR_FUNDED", "COUNTERPARTY_FUNDED", "LOCKED",
    "SETTLEMENT_OPEN", "RESOLVED", "DISPUTED", "INVALID", "FINALIZED", "CANCELLED",
)
ALLOWED_SETTLEMENT_OUTCOMES = (
    "CREATOR_WINS", "COUNTERPARTY_WINS", "PUSH_REFUND", "INVALID", "MORE_EVIDENCE_REQUIRED",
)
ALLOWED_DISPUTE_OUTCOMES = (
    "UPHOLD", "REVERSE", "PUSH_REFUND", "INVALIDATE", "REOPEN_REVIEW", "MORE_EVIDENCE_REQUIRED",
)
ALLOWED_SOURCE_TIER = ("PRIMARY", "FALLBACK", "TERTIARY")
ALLOWED_RELIABILITY = ("HIGH", "MEDIUM", "LOW", "UNKNOWN")
ALLOWED_RISK = ("LOW", "MEDIUM", "HIGH")
ALLOWED_RULE_FINDING = ("Satisfied", "Not satisfied", "N/A")

RESPONSIBLE_USE_NOTE = "This is a testnet P2P wager settlement demo, not real-money gambling."
BLOCKED_CATEGORY_NOTE = (
    "The wager must be invalidated or escalated if it involves death, injury, violence, "
    "terrorism, crime, harassment, self-harm, private individuals, age-restricted activity, "
    "or any real-money gambling/compliance-sensitive use."
)

SETTLEMENT_PROMPT = """
You are OddLockReferee, a GenLayer referee for a two-party testnet P2P wager.

This is NOT real-money gambling. This is a Studionet/testnet demo using native GEN escrow only.

Your task:
Apply only the locked wager terms, source policy, evidence packet, and responsible-use limits.
Do not invent source facts. Do not settle using rules that were not locked before the event.
If evidence is insufficient, return MORE_EVIDENCE_REQUIRED.
If the wager is unsafe, illegal-looking, age-restricted, real-money, harmful, or compliance-sensitive, return INVALID.
If sources conflict, apply the locked conflict rule.
If cancellation or postponement applies, apply the locked cancellation/postponement rule.
Return strict JSON only. No markdown. No text outside JSON.

IMPORTANT — SOURCE EVIDENCE:
The settlement packet includes "fetchedSourceEvidence", which contains the actual page
content fetched from the locked PRIMARY and FALLBACK source URLs via GenLayer web API.
You MUST base your findings on this fetched content. If a source fetch failed
(fetchStatus="FETCH_FAILED"), note this in ambiguityNotes. If both sources failed
to fetch, return MORE_EVIDENCE_REQUIRED unless the user-submitted evidence items
contain concrete, verifiable findings tied to the locked source URLs.
Cross-check user-submitted evidence against the fetched source content where possible.

Responsible-use blocked category rule:
{blocked_category_note}

LOCKED WAGER:
{wager_json}

SETTLEMENT PACKET:
{packet_json}

Required JSON schema:
{{
  "outcome": "CREATOR_WINS | COUNTERPARTY_WINS | PUSH_REFUND | INVALID | MORE_EVIDENCE_REQUIRED",
  "confidence": integer 0..100,
  "winningSide": "CREATOR | COUNTERPARTY | BOTH_REFUND | NONE | N/A",
  "summary": "short neutral settlement summary",
  "evidenceTrace": [
    {{
      "sourceTitle": "string",
      "sourceUrl": "string",
      "sourceTier": "PRIMARY | FALLBACK | TERTIARY",
      "finding": "string",
      "supportsOutcome": "CREATOR_WINS | COUNTERPARTY_WINS | PUSH_REFUND | INVALID | MORE_EVIDENCE_REQUIRED"
    }}
  ],
  "ruleApplication": [
    {{
      "rule": "string",
      "finding": "Satisfied | Not satisfied | N/A",
      "reason": "string"
    }}
  ],
  "sourceAssessment": [
    {{
      "sourceUrl": "string",
      "reliability": "HIGH | MEDIUM | LOW | UNKNOWN",
      "manipulationRisk": "LOW | MEDIUM | HIGH",
      "notes": "string"
    }}
  ],
  "ambiguityNotes": ["string"],
  "manipulationWarnings": ["string"],
  "responsibleUseNote": "This is a testnet P2P wager settlement demo, not real-money gambling."
}}
"""

DISPUTE_PROMPT = """
You are OddLockReferee reviewing a dispute for a testnet P2P wager settlement.

This is NOT real-money gambling. This is a Studionet/testnet demo using native GEN escrow only.

Your task:
Review the original settlement against the locked wager terms and the dispute packet.
Do not create new rules. Do not invent source facts.
If the dispute is weak, irrelevant, or unsupported, return UPHOLD.
If the original outcome is clearly wrong under the locked rules, return REVERSE, PUSH_REFUND, or INVALIDATE.
If more evidence is needed, return MORE_EVIDENCE_REQUIRED.
Return strict JSON only. No markdown. No text outside JSON.

IMPORTANT — SOURCE EVIDENCE:
The dispute packet includes "fetchedSourceEvidence" with actual page content fetched
from the locked PRIMARY and FALLBACK source URLs via GenLayer web API.
Use this fetched content to verify the disputant's claims and cross-check
the original settlement findings. If source content has changed since the
original settlement, note this in ambiguityNotes.

Responsible-use blocked category rule:
{blocked_category_note}

LOCKED WAGER:
{wager_json}

ORIGINAL SETTLEMENT:
{original_report_json}

DISPUTE PACKET:
{packet_json}

Required JSON schema:
{{
  "outcome": "UPHOLD | REVERSE | PUSH_REFUND | INVALIDATE | REOPEN_REVIEW | MORE_EVIDENCE_REQUIRED",
  "confidence": integer 0..100,
  "summary": "short neutral dispute review summary",
  "evidenceTrace": [
    {{
      "sourceTitle": "string",
      "sourceUrl": "string",
      "sourceTier": "PRIMARY | FALLBACK | TERTIARY",
      "finding": "string",
      "supportsOutcome": "UPHOLD | REVERSE | PUSH_REFUND | INVALIDATE | REOPEN_REVIEW | MORE_EVIDENCE_REQUIRED"
    }}
  ],
  "ruleApplication": [
    {{
      "rule": "string",
      "finding": "Satisfied | Not satisfied | N/A",
      "reason": "string"
    }}
  ],
  "ambiguityNotes": ["string"],
  "responsibleUseNote": "This is a testnet P2P wager settlement demo, not real-money gambling."
}}
"""


def _require(condition, message):
    if not condition:
        raise gl.vm.UserError(message)


def _now_ms():
    # NOTE: wall-clock time; GenLayer validators may see slightly different
    # values. Deadline checks tolerate small skew because event windows are
    # measured in hours/days. A future GenLayer API for consensus-agreed
    # block timestamps would improve determinism here.
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def _json_dumps(data):
    return json.dumps(data, separators=(",", ":"), sort_keys=True)


def _json_loads(raw, error_message):
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        raise gl.vm.UserError(error_message)


def _json_loads_object(raw, error_message):
    parsed = _json_loads(raw, error_message)
    _require(isinstance(parsed, dict), error_message)
    return parsed


def _hash(payload):
    return hashlib.sha256(str(payload).encode("utf-8")).hexdigest()


def _short_hash(payload):
    return _hash(payload)[:12]


def _addr(value):
    return str(value).lower().strip()


def _sender():
    return _addr(gl.message.sender_address)


def _is_nonempty_str(value):
    return isinstance(value, str) and bool(value.strip())


def _clip(value, limit):
    text = str(value)
    if len(text) > limit:
        return text[:limit]
    return text


def _safe_int(value, fallback):
    try:
        return int(value)
    except (ValueError, TypeError):
        return fallback


def _safe_confidence(value):
    try:
        number = int(value)
    except (ValueError, TypeError):
        number = 0
    if number < 0:
        return 0
    if number > 100:
        return 100
    return number


def _normalise_enum(value, allowed, fallback):
    text = str(value).strip().upper()
    if text in allowed:
        return text
    return fallback


def _normalise_rule_finding(value):
    text = str(value).strip()
    if text in ALLOWED_RULE_FINDING:
        return text
    upper = text.upper()
    if upper == "SATISFIED":
        return "Satisfied"
    if upper in ("NOT SATISFIED", "NOT_SATISFIED"):
        return "Not satisfied"
    return "N/A"


def _safe_list(value, max_items):
    if not isinstance(value, list):
        return []
    out = []
    for item in value[:max_items]:
        if isinstance(item, str):
            out.append(_clip(item, 280))
        else:
            try:
                out.append(json.loads(_json_dumps(item)))
            except (ValueError, TypeError):
                out.append(_clip(str(item), 280))
    return out


def _strip_json_fences(raw):
    text = str(raw).strip()
    if text.startswith("```"):
        lines = text.split("\n")
        kept = []
        for line in lines:
            if not line.strip().startswith("```"):
                kept.append(line)
        text = "\n".join(kept).strip()
    return text


def _extract_json_object(raw):
    text = _strip_json_fences(raw)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except (ValueError, TypeError):
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise gl.vm.UserError("validator_did_not_return_json_object")
    try:
        parsed = json.loads(text[start:end + 1])
    except (ValueError, TypeError):
        raise gl.vm.UserError("validator_returned_invalid_json")
    _require(isinstance(parsed, dict), "validator_json_must_be_object")
    return parsed


def _settlement_equivalence_principle():
    return (
        "Two OddLock settlement outputs are equivalent if they agree on outcome, "
        "winningSide, and the material rule application. Both must apply only the "
        "locked wager terms and must preserve the responsible-use rule that this is "
        "testnet-only and not real-money gambling. Exact wording of summary, traces, "
        "and notes does not need to match."
    )


def _dispute_equivalence_principle():
    return (
        "Two OddLock dispute-review outputs are equivalent if they agree on dispute "
        "outcome and materially agree on whether the original settlement should be "
        "upheld, reversed, refunded, invalidated, reopened, or require more evidence. "
        "Both must apply only the locked terms and preserve the testnet-only limitation. "
        "Exact wording does not need to match."
    )


def _empty_stats():
    return _json_dumps({
        "totalWagers": 0,
        "totalLocked": 0,
        "totalSettled": 0,
        "totalDisputed": 0,
        "totalFinalized": 0,
        "creatorWins": 0,
        "counterpartyWins": 0,
        "pushRefunds": 0,
        "invalid": 0,
        "moreEvidenceRequired": 0,
        "keepers": 0,
    })


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


class OddLockReferee(gl.Contract):
    """
    OddLock P2P testnet wager referee.

    It does not hold real money and does not provide legal/compliance approval.
    It stores locked wager terms, native GEN funding markers, AI settlement
    reports, disputes, user references, keeper roles, and protocol stats.
    """

    wagers: TreeMap[str, str]
    settlements: TreeMap[str, str]
    disputes: TreeMap[str, str]
    user_wagers: TreeMap[str, str]
    keepers: TreeMap[str, str]
    stats: str
    admin: str

    def __init__(self):
        self.admin = _sender()
        self.stats = _empty_stats()
        self.keepers[self.admin] = "1"

    @gl.public.write
    def add_keeper(self, keeper: str) -> str:
        self._require_admin()
        k = _addr(keeper)
        _require(k != "", "keeper_required")
        if k in self.keepers and self.keepers[k] == "1":
            raise gl.vm.UserError("keeper_already_exists")
        self.keepers[k] = "1"
        self._bump("keepers")
        return _json_dumps({"keeper": k, "active": True})

    @gl.public.write
    def remove_keeper(self, keeper: str) -> str:
        self._require_admin()
        k = _addr(keeper)
        _require(k != "", "keeper_required")
        _require(k in self.keepers and self.keepers[k] == "1", "keeper_not_found")
        self.keepers[k] = "0"
        return _json_dumps({"keeper": k, "active": False})

    @gl.public.view
    def is_keeper(self, user: str) -> bool:
        u = _addr(user)
        if u not in self.keepers:
            return False
        return self.keepers[u] == "1"

    @gl.public.view
    def get_admin(self) -> str:
        return self.admin

    @gl.public.write
    def create_wager(self, terms_json: str, counterparty: str, stake_amount_wei: int) -> str:
        _require(_is_nonempty_str(terms_json), "terms_json_required")
        caller = _sender()
        cp = _addr(counterparty)
        _require(cp != "", "counterparty_required")
        _require(cp != caller, "counterparty_must_differ_from_creator")
        stake = _safe_int(stake_amount_wei, 0)
        _require(stake > 0, "stake_amount_wei_must_be_positive")
        _require(stake <= 10**30, "stake_amount_wei_too_large")
        terms = _json_loads_object(terms_json, "terms_json_must_be_valid_object")
        self._validate_terms(terms)
        normalised_terms_json = _json_dumps(terms)
        terms_hash = _hash(normalised_terms_json)
        wager_id = "wager_" + _short_hash(caller + ":" + cp + ":" + terms_hash + ":" + str(_now_ms()))
        _require(wager_id not in self.wagers, "wager_already_exists")
        now = _now_ms()
        wager = {
            "wagerId": wager_id,
            "creator": caller,
            "counterparty": cp,
            "question": _clip(terms.get("question", ""), 500),
            "creatorSide": _clip(terms.get("resolvesForCreatorIf", ""), 500),
            "counterpartySide": _clip(terms.get("resolvesForCounterpartyIf", ""), 500),
            "stakeAmountWei": str(stake),
            "totalEscrowedWei": "0",
            "currencyMode": "NATIVE_GEN_WEI",
            "creatorFunded": False,
            "counterpartyFunded": False,
            "eventDeadline": _safe_int(terms.get("eventDeadline"), 0),
            "settlementOpensAt": _safe_int(terms.get("settlementOpensAt"), _safe_int(terms.get("eventDeadline"), 0)),
            "sourcePolicyId": terms_hash,
            "status": "INVITED",
            "termsHash": terms_hash,
            "terms": terms,
            "settlementReportId": "",
            "disputeReportId": "",
            "createdAt": now,
            "updatedAt": now,
            "resolvedAt": 0,
            "finalizedAt": 0,
            "claimedByCreator": False,
            "claimedByCounterparty": False,
            "refundedCreator": False,
            "refundedCounterparty": False,
        }
        self.wagers[wager_id] = _json_dumps(wager)
        self._add_user_wager(caller, wager_id)
        self._add_user_wager(cp, wager_id)
        self._bump("totalWagers")
        return wager_id

    @gl.public.write
    def accept_wager(self, wager_id: str) -> str:
        caller = _sender()
        wager = self._load_wager(wager_id)
        _require(wager.get("counterparty", "") == caller, "only_counterparty_can_accept")
        _require(wager.get("status", "") == "INVITED", "wager_not_invited")
        wager["status"] = "ACCEPTED"
        wager["updatedAt"] = _now_ms()
        self.wagers[wager_id] = _json_dumps(wager)
        self._add_user_wager(caller, wager_id)
        return wager_id

    @gl.public.write.payable
    def fund_wager(self, wager_id: str) -> str:
        caller = _sender()
        wager = self._load_wager(wager_id)

        _require(
            wager.get("status", "") in ("ACCEPTED", "CREATOR_FUNDED", "COUNTERPARTY_FUNDED"),
            "wager_must_be_accepted_before_funding",
        )

        stake = _safe_int(wager.get("stakeAmountWei", "0"), 0)
        _require(stake > 0, "stake_amount_wei_missing")
        _require(gl.message.value == u256(stake), "must_send_exact_stake_amount_wei")

        if caller == wager.get("creator", ""):
            _require(not bool(wager.get("creatorFunded", False)), "creator_already_funded")
            wager["creatorFunded"] = True
        elif caller == wager.get("counterparty", ""):
            _require(not bool(wager.get("counterpartyFunded", False)), "counterparty_already_funded")
            wager["counterpartyFunded"] = True
        else:
            raise gl.vm.UserError("only_wager_parties_can_fund")

        current_escrow = _safe_int(wager.get("totalEscrowedWei", "0"), 0)
        wager["totalEscrowedWei"] = str(current_escrow + stake)

        if bool(wager.get("creatorFunded", False)) and bool(wager.get("counterpartyFunded", False)):
            wager["status"] = "LOCKED"
            self._bump("totalLocked")
        elif bool(wager.get("creatorFunded", False)):
            wager["status"] = "CREATOR_FUNDED"
        elif bool(wager.get("counterpartyFunded", False)):
            wager["status"] = "COUNTERPARTY_FUNDED"

        wager["updatedAt"] = _now_ms()
        self.wagers[wager_id] = _json_dumps(wager)

        return wager_id

    @gl.public.write
    def cancel_unaccepted_wager(self, wager_id: str) -> str:
        caller = _sender()
        wager = self._load_wager(wager_id)
        _require(wager.get("creator", "") == caller, "only_creator_can_cancel")
        _require(wager.get("status", "") == "INVITED", "only_invited_wagers_can_be_cancelled")
        wager["status"] = "CANCELLED"
        wager["updatedAt"] = _now_ms()
        self.wagers[wager_id] = _json_dumps(wager)
        return wager_id

    @gl.public.write
    def open_settlement(self, wager_id: str) -> str:
        wager = self._load_wager(wager_id)
        _require(wager.get("status", "") == "LOCKED", "wager_must_be_locked")
        _require(self._is_party_or_admin_or_keeper(wager), "only_party_admin_or_keeper_can_open_settlement")
        now = _now_ms()
        opens_at = _safe_int(wager.get("settlementOpensAt", 0), 0)
        _require(now >= opens_at, "settlement_not_open_yet")
        wager["status"] = "SETTLEMENT_OPEN"
        wager["updatedAt"] = now
        self.wagers[wager_id] = _json_dumps(wager)
        return wager_id

    @gl.public.write
    def finalize_wager(self, wager_id: str) -> str:
        wager = self._load_wager(wager_id)
        _require(wager.get("status", "") == "RESOLVED", "wager_must_be_resolved_to_finalize")
        terms = wager.get("terms", {})
        dispute_hours = _safe_int(terms.get("disputeWindowHours", 24), 24)
        if dispute_hours < 0:
            dispute_hours = 24
        if dispute_hours > 168:
            dispute_hours = 168
        resolved_at = _safe_int(wager.get("resolvedAt", 0), 0)
        dispute_end = resolved_at + (dispute_hours * 3600 * 1000)
        now = _now_ms()
        _require(now >= dispute_end, "dispute_window_not_closed")
        wager["status"] = "FINALIZED"
        wager["finalizedAt"] = now
        wager["updatedAt"] = now
        self.wagers[wager_id] = _json_dumps(wager)
        self._bump("totalFinalized")
        return wager_id

    @gl.public.write
    def claim_winnings(self, wager_id: str) -> str:
        caller = _sender()
        wager = self._load_wager(wager_id)

        _require(wager.get("status", "") == "FINALIZED", "wager_must_be_finalized_to_claim")

        report = self._get_latest_settlement_for_wager(wager)
        outcome = report.get("outcome", "")
        stake = _safe_int(wager.get("stakeAmountWei", "0"), 0)
        payout = stake * 2
        _require(payout > 0, "payout_missing")

        if outcome == "CREATOR_WINS":
            _require(caller == wager.get("creator", ""), "only_creator_can_claim_this_win")
            _require(not bool(wager.get("claimedByCreator", False)), "creator_already_claimed")
            wager["claimedByCreator"] = True
            self._send_gen(caller, payout)
        elif outcome == "COUNTERPARTY_WINS":
            _require(caller == wager.get("counterparty", ""), "only_counterparty_can_claim_this_win")
            _require(not bool(wager.get("claimedByCounterparty", False)), "counterparty_already_claimed")
            wager["claimedByCounterparty"] = True
            self._send_gen(caller, payout)
        else:
            raise gl.vm.UserError("outcome_is_not_winner_claimable")

        wager["updatedAt"] = _now_ms()
        self.wagers[wager_id] = _json_dumps(wager)

        return wager_id

    @gl.public.write
    def claim_refund(self, wager_id: str) -> str:
        caller = _sender()
        wager = self._load_wager(wager_id)

        _require(wager.get("status", "") in ("FINALIZED", "INVALID"), "wager_not_refundable_now")

        report = self._get_latest_settlement_for_wager(wager)
        outcome = report.get("outcome", "")
        _require(outcome in ("PUSH_REFUND", "INVALID", "MORE_EVIDENCE_REQUIRED"), "outcome_is_not_refundable")

        stake = _safe_int(wager.get("stakeAmountWei", "0"), 0)
        _require(stake > 0, "refund_amount_missing")

        if caller == wager.get("creator", ""):
            _require(not bool(wager.get("refundedCreator", False)), "creator_already_refunded")
            wager["refundedCreator"] = True
            self._send_gen(caller, stake)
        elif caller == wager.get("counterparty", ""):
            _require(not bool(wager.get("refundedCounterparty", False)), "counterparty_already_refunded")
            wager["refundedCounterparty"] = True
            self._send_gen(caller, stake)
        else:
            raise gl.vm.UserError("only_wager_parties_can_claim_refund")

        wager["updatedAt"] = _now_ms()
        self.wagers[wager_id] = _json_dumps(wager)

        return wager_id

    @gl.public.write
    def request_settlement(self, wager_id: str, settlement_packet_json: str) -> str:
        wager = self._load_wager(wager_id)
        _require(wager.get("status", "") in ("LOCKED", "SETTLEMENT_OPEN"), "wager_must_be_locked_or_settlement_open")
        _require(self._is_party_or_admin_or_keeper(wager), "only_party_admin_or_keeper_can_request_settlement")
        now = _now_ms()
        opens_at = _safe_int(wager.get("settlementOpensAt", 0), 0)
        _require(now >= opens_at, "settlement_not_open_yet")
        packet = _json_loads_object(settlement_packet_json, "settlement_packet_json_must_be_valid_object")
        self._validate_settlement_packet(packet)

        # ── Fetch locked sources via GenLayer nondeterministic web API ──
        terms = wager.get("terms", {})
        fetched_sources = self._fetch_locked_sources(terms)
        packet["fetchedSourceEvidence"] = fetched_sources

        prompt = SETTLEMENT_PROMPT.format(
            blocked_category_note=BLOCKED_CATEGORY_NOTE,
            wager_json=json.dumps(self._wager_prompt_view(wager), indent=2, sort_keys=True),
            packet_json=json.dumps(self._packet_prompt_view(packet), indent=2, sort_keys=True),
        )
        result = self._run_settlement_review(prompt)
        report_id = "report_" + _short_hash(wager_id + ":" + _json_dumps(result) + ":" + str(now))
        _require(report_id not in self.settlements, "settlement_report_already_exists")
        report = {"reportId": report_id, "wagerId": wager_id, "reportType": "SETTLEMENT", "createdAt": now, "createdBy": _sender()}
        report["fetchedSourceEvidence"] = fetched_sources
        for key in result:
            report[key] = result[key]
        self.settlements[report_id] = _json_dumps(report)
        wager["status"] = "RESOLVED"
        wager["settlementReportId"] = report_id
        wager["resolvedAt"] = now
        wager["updatedAt"] = now
        self.wagers[wager_id] = _json_dumps(wager)
        self._bump("totalSettled")
        self._bump_settlement_outcome(result.get("outcome", ""))
        return report_id

    @gl.public.write
    def dispute_settlement(self, wager_id: str, dispute_packet_json: str) -> str:
        caller = _sender()
        wager = self._load_wager(wager_id)
        _require(wager.get("status", "") == "RESOLVED", "wager_must_be_resolved_to_dispute")
        _require(caller == wager.get("creator", "") or caller == wager.get("counterparty", ""), "only_wager_parties_can_dispute")
        terms = wager.get("terms", {})
        dispute_hours = _safe_int(terms.get("disputeWindowHours", 24), 24)
        if dispute_hours < 0:
            dispute_hours = 24
        if dispute_hours > 168:
            dispute_hours = 168
        resolved_at = _safe_int(wager.get("resolvedAt", 0), 0)
        dispute_end = resolved_at + (dispute_hours * 3600 * 1000)
        now = _now_ms()
        _require(now <= dispute_end, "dispute_window_closed")
        packet = _json_loads_object(dispute_packet_json, "dispute_packet_json_must_be_valid_object")
        self._validate_dispute_packet(packet)

        # ── Fetch locked sources for dispute re-evaluation ──
        terms = wager.get("terms", {})
        fetched_sources = self._fetch_locked_sources(terms)
        packet["fetchedSourceEvidence"] = fetched_sources

        original_report = self._get_latest_settlement_for_wager(wager)
        prompt = DISPUTE_PROMPT.format(
            blocked_category_note=BLOCKED_CATEGORY_NOTE,
            wager_json=json.dumps(self._wager_prompt_view(wager), indent=2, sort_keys=True),
            original_report_json=json.dumps(original_report, indent=2, sort_keys=True),
            packet_json=json.dumps(self._packet_prompt_view(packet), indent=2, sort_keys=True),
        )
        result = self._run_dispute_review(prompt)
        dispute_report_id = "dispute_" + _short_hash(wager_id + ":" + caller + ":" + _json_dumps(result) + ":" + str(now))
        _require(dispute_report_id not in self.disputes, "dispute_report_already_exists")
        dispute_report = {"reportId": dispute_report_id, "wagerId": wager_id, "reportType": "DISPUTE", "createdAt": now, "createdBy": caller, "ground": _clip(packet.get("ground", "UNSPECIFIED"), 120)}
        for key in result:
            dispute_report[key] = result[key]
        self.disputes[dispute_report_id] = _json_dumps(dispute_report)
        wager["disputeReportId"] = dispute_report_id
        wager["updatedAt"] = now
        outcome = result.get("outcome", "")
        if outcome == "UPHOLD":
            wager["status"] = "RESOLVED"
        elif outcome == "REVERSE":
            wager["status"] = "RESOLVED"
            self._reverse_original_settlement(wager)
        elif outcome == "PUSH_REFUND":
            wager["status"] = "RESOLVED"
            self._override_original_settlement(wager, "PUSH_REFUND")
        elif outcome == "INVALIDATE":
            wager["status"] = "INVALID"
            self._override_original_settlement(wager, "INVALID")
        elif outcome == "REOPEN_REVIEW":
            wager["status"] = "SETTLEMENT_OPEN"
        elif outcome == "MORE_EVIDENCE_REQUIRED":
            wager["status"] = "RESOLVED"
        self.wagers[wager_id] = _json_dumps(wager)
        self._bump("totalDisputed")
        return dispute_report_id

    def _fetch_locked_sources(self, terms):
        """
        Fetch content from the locked primary and fallback source URLs
        using GenLayer's nondeterministic web API. Returns a list of
        source evidence objects with the fetched content or fetch errors.
        """
        sources_to_fetch = []
        primary_url = str(terms.get("primarySource", "")).strip()
        fallback_url = str(terms.get("fallbackSource", "")).strip()
        if primary_url:
            sources_to_fetch.append(("PRIMARY", primary_url))
        if fallback_url:
            sources_to_fetch.append(("FALLBACK", fallback_url))

        fetched = []
        for tier, url in sources_to_fetch:
            entry = {"sourceTier": tier, "sourceUrl": url, "content": "", "fetchStatus": "OK", "fetchError": ""}
            try:
                page_content = gl.nondet.get_webpage(url, mode="text")
                text = str(page_content).strip()
                # Truncate to avoid overloading the prompt
                if len(text) > 4000:
                    text = text[:4000] + "\n[…truncated]"
                entry["content"] = text
            except (RuntimeError, OSError) as fetch_err:
                entry["fetchStatus"] = "FETCH_FAILED"
                entry["fetchError"] = _clip(str(fetch_err), 300)
            fetched.append(entry)
        return fetched

    def _run_settlement_review(self, prompt):
        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt)
            parsed = _extract_json_object(raw)
            result = self._normalise_settlement_result(parsed)
            self._validate_settlement_result(result)
            return _json_dumps(result)
        result_json = gl.eq_principle.prompt_comparative(leader_fn, _settlement_equivalence_principle())
        result = _json_loads_object(result_json, "settlement_result_invalid_json")
        result = self._normalise_settlement_result(result)
        self._validate_settlement_result(result)
        return result

    def _run_dispute_review(self, prompt):
        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt)
            parsed = _extract_json_object(raw)
            result = self._normalise_dispute_result(parsed)
            self._validate_dispute_result(result)
            return _json_dumps(result)
        result_json = gl.eq_principle.prompt_comparative(leader_fn, _dispute_equivalence_principle())
        result = _json_loads_object(result_json, "dispute_result_invalid_json")
        result = self._normalise_dispute_result(result)
        self._validate_dispute_result(result)
        return result

    @gl.public.view
    def get_wager(self, wager_id: str) -> str:
        if wager_id not in self.wagers:
            return _json_dumps({"error": "wager_not_found"})
        return self.wagers[wager_id]

    @gl.public.view
    def get_settlement(self, report_id: str) -> str:
        if report_id not in self.settlements:
            return _json_dumps({"error": "settlement_not_found"})
        return self.settlements[report_id]

    @gl.public.view
    def get_dispute(self, report_id: str) -> str:
        if report_id not in self.disputes:
            return _json_dumps({"error": "dispute_not_found"})
        return self.disputes[report_id]

    @gl.public.view
    def get_user_wagers(self, user: str) -> str:
        account = _addr(user)
        if account not in self.user_wagers:
            return _json_dumps([])
        return self.user_wagers[account]

    @gl.public.view
    def get_my_wagers(self) -> str:
        account = _sender()
        if account not in self.user_wagers:
            return _json_dumps([])
        return self.user_wagers[account]

    @gl.public.view
    def get_protocol_stats(self) -> str:
        return self.stats

    @gl.public.view
    def get_contract_balance(self) -> str:
        return str(self.balance)

    def _validate_terms(self, terms):
        required = ("question", "resolvesForCreatorIf", "resolvesForCounterpartyIf", "invalidIf", "eventDeadline", "timezone", "primarySource", "fallbackSource", "conflictRule", "cancellationRule", "postponementRule", "disputeWindowHours")
        for field in required:
            _require(field in terms, "missing_required_term_" + field)
        _require(_is_nonempty_str(terms.get("question", "")), "question_required")
        _require(_is_nonempty_str(terms.get("resolvesForCreatorIf", "")), "creator_resolution_rule_required")
        _require(_is_nonempty_str(terms.get("resolvesForCounterpartyIf", "")), "counterparty_resolution_rule_required")
        _require(_is_nonempty_str(terms.get("invalidIf", "")), "invalid_rule_required")
        _require(_is_nonempty_str(terms.get("timezone", "")), "timezone_required")
        _require(_is_nonempty_str(terms.get("primarySource", "")), "primary_source_required")
        _require(_is_nonempty_str(terms.get("conflictRule", "")), "conflict_rule_required")
        _require(_is_nonempty_str(terms.get("cancellationRule", "")), "cancellation_rule_required")
        _require(_is_nonempty_str(terms.get("postponementRule", "")), "postponement_rule_required")
        deadline = _safe_int(terms.get("eventDeadline"), 0)
        _require(deadline > 0, "event_deadline_must_be_positive_ms")
        dispute_hours = _safe_int(terms.get("disputeWindowHours"), -1)
        _require(dispute_hours >= 1, "dispute_window_must_be_at_least_1_hour")
        _require(dispute_hours <= 168, "dispute_window_too_long")
        question_lower = str(terms.get("question", "")).lower()
        unsafe_terms = ("death", "die", "injury", "injured", "terror", "terrorism", "kill", "suicide", "self-harm", "murder", "assault", "crime", "criminal", "underage", "minor", "private person", "private individual")
        for word in unsafe_terms:
            _require(word not in question_lower, "blocked_or_unsafe_wager_category")

    def _validate_settlement_packet(self, packet):
        _require(isinstance(packet, dict), "settlement_packet_must_be_object")
        evidence = packet.get("evidence", [])
        _require(isinstance(evidence, list), "evidence_must_be_array")
        _require(len(evidence) > 0, "at_least_one_evidence_item_required")
        _require(len(evidence) <= 20, "too_many_evidence_items")
        has_concrete_finding = False
        for item in evidence:
            _require(isinstance(item, dict), "evidence_item_must_be_object")
            _require(
                _is_nonempty_str(item.get("sourceUrl", "")) or _is_nonempty_str(item.get("sourceTitle", "")),
                "evidence_item_must_include_source_url_or_title"
            )
            if _is_nonempty_str(item.get("finding", "")):
                has_concrete_finding = True
        _require(has_concrete_finding, "at_least_one_evidence_item_must_have_a_concrete_finding")

    def _validate_dispute_packet(self, packet):
        _require(isinstance(packet, dict), "dispute_packet_must_be_object")
        _require(_is_nonempty_str(packet.get("ground", "")), "dispute_ground_required")
        _require(_is_nonempty_str(packet.get("explanation", "")), "dispute_explanation_required")
        evidence = packet.get("evidence", packet.get("counterEvidence", []))
        if evidence:
            _require(isinstance(evidence, list), "dispute_evidence_must_be_array")
            _require(len(evidence) <= 20, "too_many_dispute_evidence_items")

    def _normalise_trace_item(self, item, allowed_supports):
        if not isinstance(item, dict):
            item = {}
        return {"sourceTitle": _clip(item.get("sourceTitle", ""), 180), "sourceUrl": _clip(item.get("sourceUrl", ""), 300), "sourceTier": _normalise_enum(item.get("sourceTier", "TERTIARY"), ALLOWED_SOURCE_TIER, "TERTIARY"), "finding": _clip(item.get("finding", ""), 500), "supportsOutcome": _normalise_enum(item.get("supportsOutcome", ""), allowed_supports, allowed_supports[-1])}

    def _normalise_rule_item(self, item):
        if not isinstance(item, dict):
            item = {}
        return {"rule": _clip(item.get("rule", ""), 500), "finding": _normalise_rule_finding(item.get("finding", "N/A")), "reason": _clip(item.get("reason", ""), 500)}

    def _normalise_source_item(self, item):
        if not isinstance(item, dict):
            item = {}
        return {"sourceUrl": _clip(item.get("sourceUrl", ""), 300), "reliability": _normalise_enum(item.get("reliability", "UNKNOWN"), ALLOWED_RELIABILITY, "UNKNOWN"), "manipulationRisk": _normalise_enum(item.get("manipulationRisk", "LOW"), ALLOWED_RISK, "LOW"), "notes": _clip(item.get("notes", ""), 500)}

    def _normalise_settlement_result(self, result):
        if not isinstance(result, dict):
            result = {}
        outcome = _normalise_enum(result.get("outcome", "MORE_EVIDENCE_REQUIRED"), ALLOWED_SETTLEMENT_OUTCOMES, "MORE_EVIDENCE_REQUIRED")
        winning_side = str(result.get("winningSide", "N/A")).strip().upper()
        if winning_side not in ("CREATOR", "COUNTERPARTY", "BOTH_REFUND", "NONE", "N/A"):
            if outcome == "CREATOR_WINS":
                winning_side = "CREATOR"
            elif outcome == "COUNTERPARTY_WINS":
                winning_side = "COUNTERPARTY"
            elif outcome == "PUSH_REFUND":
                winning_side = "BOTH_REFUND"
            else:
                winning_side = "N/A"
        traces = []
        for item in _safe_list(result.get("evidenceTrace", []), 12):
            traces.append(self._normalise_trace_item(item, ALLOWED_SETTLEMENT_OUTCOMES))
        rules = []
        for item in _safe_list(result.get("ruleApplication", []), 12):
            rules.append(self._normalise_rule_item(item))
        sources = []
        for item in _safe_list(result.get("sourceAssessment", []), 12):
            sources.append(self._normalise_source_item(item))
        return {"outcome": outcome, "confidence": _safe_confidence(result.get("confidence", 0)), "winningSide": winning_side, "summary": _clip(result.get("summary", ""), 1000), "evidenceTrace": traces, "ruleApplication": rules, "sourceAssessment": sources, "ambiguityNotes": [str(x)[:300] for x in _safe_list(result.get("ambiguityNotes", []), 12)], "manipulationWarnings": [str(x)[:300] for x in _safe_list(result.get("manipulationWarnings", []), 12)], "responsibleUseNote": RESPONSIBLE_USE_NOTE}

    def _validate_settlement_result(self, result):
        _require(result.get("outcome", "") in ALLOWED_SETTLEMENT_OUTCOMES, "invalid_settlement_outcome")
        _require(isinstance(result.get("confidence", None), int), "confidence_must_be_integer")
        _require(result["confidence"] >= 0 and result["confidence"] <= 100, "confidence_must_be_0_100")
        _require(_is_nonempty_str(result.get("summary", "")), "summary_required")
        _require(result.get("responsibleUseNote", "") == RESPONSIBLE_USE_NOTE, "responsible_use_note_required")
        _require(isinstance(result.get("evidenceTrace", None), list), "evidenceTrace_must_be_array")
        _require(isinstance(result.get("ruleApplication", None), list), "ruleApplication_must_be_array")
        _require(isinstance(result.get("sourceAssessment", None), list), "sourceAssessment_must_be_array")
        _require(isinstance(result.get("ambiguityNotes", None), list), "ambiguityNotes_must_be_array")
        _require(isinstance(result.get("manipulationWarnings", None), list), "manipulationWarnings_must_be_array")
        outcome = result.get("outcome", "")
        side = result.get("winningSide", "")
        if outcome == "CREATOR_WINS":
            _require(side == "CREATOR", "creator_win_must_set_creator_side")
        if outcome == "COUNTERPARTY_WINS":
            _require(side == "COUNTERPARTY", "counterparty_win_must_set_counterparty_side")
        if outcome == "PUSH_REFUND":
            _require(side == "BOTH_REFUND", "push_refund_must_set_both_refund_side")

    def _normalise_dispute_result(self, result):
        if not isinstance(result, dict):
            result = {}
        outcome = _normalise_enum(result.get("outcome", "MORE_EVIDENCE_REQUIRED"), ALLOWED_DISPUTE_OUTCOMES, "MORE_EVIDENCE_REQUIRED")
        traces = []
        for item in _safe_list(result.get("evidenceTrace", []), 12):
            traces.append(self._normalise_trace_item(item, ALLOWED_DISPUTE_OUTCOMES))
        rules = []
        for item in _safe_list(result.get("ruleApplication", []), 12):
            rules.append(self._normalise_rule_item(item))
        return {"outcome": outcome, "confidence": _safe_confidence(result.get("confidence", 0)), "summary": _clip(result.get("summary", ""), 1000), "evidenceTrace": traces, "ruleApplication": rules, "ambiguityNotes": [str(x)[:300] for x in _safe_list(result.get("ambiguityNotes", []), 12)], "responsibleUseNote": RESPONSIBLE_USE_NOTE}

    def _validate_dispute_result(self, result):
        _require(result.get("outcome", "") in ALLOWED_DISPUTE_OUTCOMES, "invalid_dispute_outcome")
        _require(isinstance(result.get("confidence", None), int), "confidence_must_be_integer")
        _require(result["confidence"] >= 0 and result["confidence"] <= 100, "confidence_must_be_0_100")
        _require(_is_nonempty_str(result.get("summary", "")), "summary_required")
        _require(result.get("responsibleUseNote", "") == RESPONSIBLE_USE_NOTE, "responsible_use_note_required")
        _require(isinstance(result.get("evidenceTrace", None), list), "evidenceTrace_must_be_array")
        _require(isinstance(result.get("ruleApplication", None), list), "ruleApplication_must_be_array")
        _require(isinstance(result.get("ambiguityNotes", None), list), "ambiguityNotes_must_be_array")

    def _load_wager(self, wager_id):
        _require(_is_nonempty_str(wager_id), "wager_id_required")
        _require(wager_id in self.wagers, "wager_not_found")
        return _json_loads_object(self.wagers[wager_id], "stored_wager_corrupted")

    def _add_user_wager(self, address, wager_id):
        account = _addr(address)
        if account == "":
            return
        if account in self.user_wagers:
            try:
                existing = json.loads(self.user_wagers[account])
                if not isinstance(existing, list):
                    existing = []
            except (ValueError, TypeError):
                existing = []
        else:
            existing = []
        if wager_id not in existing:
            existing.append(wager_id)
        self.user_wagers[account] = _json_dumps(existing)

    def _get_latest_settlement_for_wager(self, wager):
        report_id = str(wager.get("settlementReportId", ""))
        _require(report_id != "", "settlement_report_missing")
        _require(report_id in self.settlements, "settlement_report_not_found")
        return _json_loads_object(self.settlements[report_id], "stored_settlement_corrupted")

    def _override_original_settlement(self, wager, new_outcome):
        report = self._get_latest_settlement_for_wager(wager)
        report["outcome"] = new_outcome
        if new_outcome == "PUSH_REFUND":
            report["winningSide"] = "BOTH_REFUND"
        elif new_outcome == "INVALID":
            report["winningSide"] = "N/A"
        report["summary"] = _clip("Updated after dispute review: " + str(report.get("summary", "")), 1000)
        self.settlements[report["reportId"]] = _json_dumps(report)

    def _reverse_original_settlement(self, wager):
        report = self._get_latest_settlement_for_wager(wager)
        original = report.get("outcome", "")
        if original == "CREATOR_WINS":
            report["outcome"] = "COUNTERPARTY_WINS"
            report["winningSide"] = "COUNTERPARTY"
        elif original == "COUNTERPARTY_WINS":
            report["outcome"] = "CREATOR_WINS"
            report["winningSide"] = "CREATOR"
        else:
            report["outcome"] = "PUSH_REFUND"
            report["winningSide"] = "BOTH_REFUND"
        report["summary"] = _clip("Reversed after dispute review: " + str(report.get("summary", "")), 1000)
        self.settlements[report["reportId"]] = _json_dumps(report)

    def _wager_prompt_view(self, wager):
        return {"wagerId": wager.get("wagerId", ""), "creator": wager.get("creator", ""), "counterparty": wager.get("counterparty", ""), "question": wager.get("question", ""), "creatorSide": wager.get("creatorSide", ""), "counterpartySide": wager.get("counterpartySide", ""), "stakeAmountWei": wager.get("stakeAmountWei", "0"), "currencyMode": wager.get("currencyMode", "NATIVE_GEN_WEI"), "eventDeadline": wager.get("eventDeadline", 0), "settlementOpensAt": wager.get("settlementOpensAt", 0), "sourcePolicyId": wager.get("sourcePolicyId", ""), "termsHash": wager.get("termsHash", ""), "terms": wager.get("terms", {})}

    def _packet_prompt_view(self, packet):
        clean = {}
        for key in packet:
            if key in ("privateKey", "secret", "password", "token"):
                continue
            clean[key] = packet[key]
        return clean

    def _send_gen(self, recipient, amount_wei):
        _require(amount_wei > 0, "amount_must_be_positive")
        _Recipient(Address(recipient)).emit_transfer(value=u256(amount_wei))

    def _is_admin(self, user):
        return _addr(user) == _addr(self.admin)

    def _is_keeper_addr(self, user):
        account = _addr(user)
        if account not in self.keepers:
            return False
        return self.keepers[account] == "1"

    def _is_party_or_admin_or_keeper(self, wager):
        caller = _sender()
        return caller == wager.get("creator", "") or caller == wager.get("counterparty", "") or self._is_admin(caller) or self._is_keeper_addr(caller)

    def _require_admin(self):
        _require(self._is_admin(_sender()), "admin_only")

    def _bump(self, key):
        try:
            stats = json.loads(self.stats)
            if not isinstance(stats, dict):
                stats = {}
        except (ValueError, TypeError):
            stats = {}
        stats[key] = int(stats.get(key, 0)) + 1
        self.stats = _json_dumps(stats)

    def _bump_settlement_outcome(self, outcome):
        mapping = {"CREATOR_WINS": "creatorWins", "COUNTERPARTY_WINS": "counterpartyWins", "PUSH_REFUND": "pushRefunds", "INVALID": "invalid", "MORE_EVIDENCE_REQUIRED": "moreEvidenceRequired"}
        key = mapping.get(outcome, "")
        if key != "":
            self._bump(key)