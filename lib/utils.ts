import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashTerms(terms: object): string {
  const json = JSON.stringify(terms, Object.keys(terms).sort());
  // browser-safe hash using Web Crypto API
  return btoa(json).slice(0, 64);
}

export async function sha256Hex(text: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const enc = new TextEncoder();
    const buf = await window.crypto.subtle.digest("SHA-256", enc.encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return createHash("sha256").update(text).digest("hex");
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatWeiToGen(value: bigint | string, maxDecimals = 4): string {
  let raw: bigint;
  try {
    raw = typeof value === "bigint" ? value : BigInt(String(value));
  } catch {
    return String(value);
  }
  const negative = raw < 0n;
  const wei = negative ? -raw : raw;
  const base = 10n ** 18n;
  const whole = wei / base;
  const fraction = wei % base;

  let frac = fraction.toString().padStart(18, "0").slice(0, Math.max(0, maxDecimals));
  frac = frac.replace(/0+$/, "");
  const formatted = frac ? `${whole.toString()}.${frac}` : whole.toString();
  return negative ? `-${formatted}` : formatted;
}

export function isDeadlinePassed(ts: number): boolean {
  return Date.now() > ts;
}

export function generateId(): string {
  return `wager_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
