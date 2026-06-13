export type Address = `0x${string}`;

export type WagerStatus =
  | "DRAFT"
  | "INVITED"
  | "ACCEPTED"
  | "FUNDED"
  | "LOCKED"
  | "SETTLEMENT_OPEN"
  | "RESOLUTION_REQUESTED"
  | "RESOLVED"
  | "DISPUTED"
  | "FINALIZED"
  | "CANCELLED"
  | "INVALID";

export type WagerCategory =
  | "SPORTS"
  | "GAME"
  | "AWARD"
  | "LAUNCH_DATE"
  | "WEATHER"
  | "PUBLIC_VOTE"
  | "ON_CHAIN"
  | "CEREMONY"
  | "OTHER";

export type CurrencyMode = "TESTNET_GEN" | "INTERNAL_TEST_UNITS";

export type Wager = {
  wagerId: string;
  creator: Address;
  counterparty: Address;
  title: string;
  category: WagerCategory;
  question: string;
  creatorSide: string;
  counterpartySide: string;
  stakeAmount: bigint;
  currencyMode: CurrencyMode;
  eventDeadline: number;
  settlementOpensAt: number;
  sourcePolicyId: string;
  status: WagerStatus;
  termsHash: string;
  createdAt: number;
  updatedAt: number;
};

export type WagerTerms = {
  question: string;
  resolvesForCreatorIf: string;
  resolvesForCounterpartyIf: string;
  invalidIf: string;
  eventDeadline: number;
  settlementOpensAt?: number;
  timezone: string;
  primarySource: string;
  fallbackSource: string;
  conflictRule: string;
  cancellationRule: string;
  postponementRule: string;
  disputeWindowHours: number;
};

export type SettlementOutcome =
  | "CREATOR_WINS"
  | "COUNTERPARTY_WINS"
  | "PUSH_REFUND"
  | "INVALID"
  | "MORE_EVIDENCE_REQUIRED";

export type DisputeOutcome =
  | "UPHOLD"
  | "REVERSE"
  | "PUSH_REFUND"
  | "INVALIDATE"
  | "REOPEN_REVIEW"
  | "MORE_EVIDENCE_REQUIRED";

export type DisputeGround =
  | "SOURCE_ERROR"
  | "DEADLINE_ERROR"
  | "TERMS_MISAPPLIED"
  | "CANCELLATION_RULE_ERROR"
  | "POSTPONEMENT_RULE_ERROR"
  | "SOURCE_MANIPULATION"
  | "AMBIGUOUS_TERMS";

export type EvidenceTrace = {
  sourceTitle: string;
  sourceUrl: string;
  sourceTier: "PRIMARY" | "FALLBACK" | "TERTIARY";
  finding: string;
  supportsOutcome: SettlementOutcome;
};

export type RuleApplication = {
  rule: string;
  finding: string;
  reason: string;
};

export type SourceAssessment = {
  sourceUrl: string;
  reliability: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  manipulationRisk: "LOW" | "MEDIUM" | "HIGH";
  notes: string;
};

export type SettlementReport = {
  reportId: string;
  wagerId: string;
  outcome: SettlementOutcome;
  confidence: number;
  winningSide: string;
  summary: string;
  evidenceTrace: EvidenceTrace[];
  ruleApplication: RuleApplication[];
  sourceAssessment: SourceAssessment[];
  ambiguityNotes: string[];
  manipulationWarnings: string[];
  responsibleUseNote: string;
  createdAt: number;
};

export type DisputeReport = {
  reportId: string;
  wagerId: string;
  ground: DisputeGround;
  outcome: DisputeOutcome;
  confidence: number;
  summary: string;
  evidenceTrace: EvidenceTrace[];
  ruleApplication: RuleApplication[];
  responsibleUseNote: string;
  createdAt: number;
};

export type LocalDraft = {
  draftId: string;
  title: string;
  terms: Partial<WagerTerms>;
  createdAt: number;
  updatedAt: number;
};
