"use client";

import type { LocalDraft, WagerTerms } from "@/types/wager";

const DRAFTS_KEY = "oddlock_drafts";
const SETTINGS_KEY = "oddlock_settings";

export type ResponsibleUseSettings = {
  coolingOffEnabled: boolean;
  coolingOffUntil: number | null;
  sessionReminderMinutes: number;
  wagerlimitEnabled: boolean;
  wagerLimitAmount: number;
  selfExcluded: boolean;
  selfExclusionUntil: number | null;
  ageAcknowledged: boolean;
  testnetAcknowledged: boolean;
};

const DEFAULT_SETTINGS: ResponsibleUseSettings = {
  coolingOffEnabled: false,
  coolingOffUntil: null,
  sessionReminderMinutes: 60,
  wagerlimitEnabled: false,
  wagerLimitAmount: 1000,
  selfExcluded: false,
  selfExclusionUntil: null,
  ageAcknowledged: false,
  testnetAcknowledged: false,
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be full
  }
}

export function getDrafts(): LocalDraft[] {
  return safeRead<LocalDraft[]>(DRAFTS_KEY, []);
}

export function saveDraft(
  draftId: string,
  title: string,
  terms: Partial<WagerTerms>
): LocalDraft {
  const drafts = getDrafts();
  const now = Date.now();
  const existing = drafts.findIndex((d) => d.draftId === draftId);
  const draft: LocalDraft = {
    draftId,
    title,
    terms,
    createdAt: existing >= 0 ? drafts[existing].createdAt : now,
    updatedAt: now,
  };
  if (existing >= 0) {
    drafts[existing] = draft;
  } else {
    drafts.push(draft);
  }
  safeWrite(DRAFTS_KEY, drafts);
  return draft;
}

export function deleteDraft(draftId: string): void {
  const drafts = getDrafts().filter((d) => d.draftId !== draftId);
  safeWrite(DRAFTS_KEY, drafts);
}

export function getSettings(): ResponsibleUseSettings {
  return { ...DEFAULT_SETTINGS, ...safeRead<Partial<ResponsibleUseSettings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: Partial<ResponsibleUseSettings>): void {
  const current = getSettings();
  safeWrite(SETTINGS_KEY, { ...current, ...settings });
}

export function isSelfExcluded(): boolean {
  const s = getSettings();
  if (!s.selfExcluded) return false;
  if (s.selfExclusionUntil && Date.now() > s.selfExclusionUntil) {
    saveSettings({ selfExcluded: false, selfExclusionUntil: null });
    return false;
  }
  return true;
}

export function isCoolingOff(): boolean {
  const s = getSettings();
  if (!s.coolingOffEnabled) return false;
  if (s.coolingOffUntil && Date.now() > s.coolingOffUntil) {
    saveSettings({ coolingOffEnabled: false, coolingOffUntil: null });
    return false;
  }
  return Boolean(s.coolingOffUntil);
}
