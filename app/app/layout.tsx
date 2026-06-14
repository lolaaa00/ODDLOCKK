import { SealedLedgerRail } from "@/components/layout/SealedLedgerRail";
import { LockedTicketShell } from "@/components/layout/LockedTicketShell";
import { ResponsibleUseLock } from "@/components/layout/ResponsibleUseLock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LockedTicketShell>
      <ResponsibleUseLock />
      <SealedLedgerRail />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
    </LockedTicketShell>
  );
}
