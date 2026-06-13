"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getDrafts } from "@/lib/storage/drafts";
import { TermsLockPanel } from "@/components/wagers/TermsLockPanel";
import { sha256Hex } from "@/lib/utils";
import type { LocalDraft } from "@/types/wager";

export default function TermsPage() {
  const { id } = useParams<{ id: string }>();
  const draft: LocalDraft | null =
    typeof window !== "undefined"
      ? (getDrafts().find((d) => d.draftId === id) ?? null)
      : null;
  const [termsHash, setTermsHash] = useState("");

  useEffect(() => {
    if (!draft?.terms) return;
    let cancelled = false;
    sha256Hex(JSON.stringify(draft.terms)).then((h) => {
      if (!cancelled) setTermsHash(h);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!draft) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/app/wagers/${id}`} className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)] hover:text-[rgba(240,230,226,0.72)]">
        ← BACK TO TICKET
      </Link>

      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-[#D4A017]" />
        <h1 className="font-staatliches text-3xl tracking-wide text-[#F0E6E2]">LOCKED TERMS</h1>
      </div>

      <div className="parchment-surface rounded-sm p-5">
        <div className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)] mb-2">QUESTION</div>
        <p className="font-nunito text-base text-[#F0E6E2]">{draft.terms.question}</p>
      </div>

      <TermsLockPanel terms={draft.terms as Parameters<typeof TermsLockPanel>[0]["terms"]} termsHash={termsHash} />

      <div className="rounded-sm border border-[rgba(240,230,226,0.06)] p-4">
        <div className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.30)] mb-1">FULL TERMS JSON</div>
        <pre className="font-azeret text-sm text-[rgba(240,230,226,0.50)] overflow-auto max-h-64">
          {JSON.stringify(draft.terms, null, 2)}
        </pre>
      </div>
    </div>
  );
}
