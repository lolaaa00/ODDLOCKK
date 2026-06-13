import { WagerCreateWizard } from "@/components/wagers/WagerCreateWizard";
import { Lock } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 36, width: 36, borderRadius: 4,
          border: "1px solid rgba(200,155,60,0.35)",
          background: "rgba(107,7,14,0.20)",
        }}>
          <Lock style={{ height: 16, width: 16, color: "#DDD0CC" }} />
        </div>
        <div>
          <h1 className="font-staatliches tracking-wide" style={{ fontSize: "2.25rem", color: "#E8E2DF" }}>
            CREATE SETTLEMENT CAPSULE
          </h1>
          <p className="font-nunito text-base" style={{ color: "rgba(203,194,192,0.65)" }}>
            Lock event terms, sources, and rules before the outcome happens
          </p>
        </div>
      </div>
      <WagerCreateWizard />
    </div>
  );
}
