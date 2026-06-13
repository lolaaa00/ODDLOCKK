"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface Props {
  deadline: number;
  label?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function EventCountdown({ deadline, label = "EVENT DEADLINE" }: Props) {
  const [remaining, setRemaining] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setPassed(true);
        setRemaining(0);
      } else {
        setRemaining(diff);
        setPassed(false);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hrs = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  return (
    <div className="parchment-surface rounded-sm p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="h-3 w-3 text-[rgba(240,230,226,0.40)]" />
        <span className="font-exo text-xs tracking-widest text-[rgba(240,230,226,0.40)]">
          {label}
        </span>
      </div>
      {passed ? (
        <div className="font-staatliches text-xl tracking-widest text-[#4ADE80]">
          DEADLINE PASSED
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {[
            { val: days, unit: "D" },
            { val: hrs, unit: "H" },
            { val: mins, unit: "M" },
            { val: secs, unit: "S" },
          ].map(({ val, unit }) => (
            <div key={unit} className="flex items-baseline gap-0.5">
              <span className="font-changa text-2xl text-[#D4A017]">{pad(val)}</span>
              <span className="font-exo text-xs text-[rgba(240,230,226,0.40)]">{unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
