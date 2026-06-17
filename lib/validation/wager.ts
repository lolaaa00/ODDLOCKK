import { z } from "zod";

export const BLOCKED_KEYWORDS = [
  "death", "murder", "kill", "injury", "injured", "violence", "terrorism",
  "terror", "crime", "criminal", "doxx", "harass", "self-harm", "suicide",
  "sexual", "private life", "insider", "manipulation", "manipulate",
];

export const ALLOWED_CATEGORIES = [
  "SPORTS", "GAME", "AWARD", "LAUNCH_DATE", "WEATHER",
  "PUBLIC_VOTE", "ON_CHAIN", "CEREMONY", "OTHER",
] as const;

export const wagerTermsSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  resolvesForCreatorIf: z.string().min(5, "Creator win condition required"),
  resolvesForCounterpartyIf: z.string().min(5, "Counterparty win condition required"),
  invalidIf: z.string().min(5, "Invalid condition required"),
  eventDeadline: z.number().int().positive("Event deadline must be a future timestamp"),
  timezone: z.string().min(1, "Timezone required"),
  primarySource: z.string().url("Primary source must be a valid URL"),
  fallbackSource: z.string().url("Fallback source must be a valid URL"),
  conflictRule: z.string().min(5, "Conflict rule required"),
  cancellationRule: z.string().min(5, "Cancellation rule required"),
  postponementRule: z.string().min(5, "Postponement rule required"),
  disputeWindowHours: z
    .number()
    .int()
    .min(1)
    .max(168, "Dispute window max 168 hours (7 days)"),
});

export const createWagerSchema = z.object({
  title: z.string().min(5, "Title required"),
  category: z.enum(ALLOWED_CATEGORIES),
  counterparty: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  stakeAmount: z.string().min(1, "Stake amount required"),
  terms: wagerTermsSchema,
});

export function checkBlockedContent(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw)) {
      return `Wager contains blocked content: "${kw}". This category is not permitted.`;
    }
  }
  return null;
}

export function isVague(text: string): boolean {
  const vaguePatterns = [
    /\bsomething\b/i,
    /\bmaybe\b/i,
    /\bpossibly\b/i,
    /\bsometime\b/i,
    /\bsomeone\b/i,
  ];
  return vaguePatterns.some((p) => p.test(text));
}

export const settlementReportSchema = z.object({
  outcome: z.enum([
    "CREATOR_WINS",
    "COUNTERPARTY_WINS",
    "PUSH_REFUND",
    "INVALID",
    "MORE_EVIDENCE_REQUIRED",
  ]),
  confidence: z.number().min(0).max(100),
  winningSide: z.string().min(1),
  summary: z.string().min(1),
  fetchedSourceEvidence: z.array(z.object({
    sourceTier: z.enum(["PRIMARY", "FALLBACK"]),
    sourceUrl: z.string(),
    content: z.string(),
    fetchStatus: z.enum(["OK", "FETCH_FAILED"]),
    fetchError: z.string(),
  })),
  evidenceTrace: z.array(z.object({
    sourceTitle: z.string(),
    sourceUrl: z.string(),
    sourceTier: z.enum(["PRIMARY", "FALLBACK", "TERTIARY"]),
    finding: z.string(),
    supportsOutcome: z.string(),
  })),
  ruleApplication: z.array(z.object({
    rule: z.string(),
    finding: z.string(),
    reason: z.string(),
  })),
  sourceAssessment: z.array(z.object({
    sourceUrl: z.string(),
    reliability: z.string(),
    manipulationRisk: z.string(),
    notes: z.string(),
  })),
  ambiguityNotes: z.array(z.string()),
  manipulationWarnings: z.array(z.string()),
  responsibleUseNote: z.string().min(1),
});
