import { ResponsibleUsePanel } from "@/components/responsible/ResponsibleUsePanel";
import { ShieldCheck } from "lucide-react";

export default function ResponsiblePage() {
  return (
    <div className="space-y-6 route-in">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5" style={{ color: "var(--canopy)" }} />
        <h1
          className="font-staatliches tracking-wide"
          style={{ fontSize: "2.5rem", color: "var(--ink-text)" }}
        >
          RESPONSIBLE USE
        </h1>
      </div>
      <ResponsibleUsePanel />
    </div>
  );
}
