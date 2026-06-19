import type { DealStatus, RiskLevel } from "@/lib/mockData";
import { cn, riskTone, statusTone } from "@/lib/utils";

interface StatusBadgeProps {
  status?: DealStatus;
  risk?: RiskLevel;
  compact?: boolean;
}

export default function StatusBadge({
  status,
  risk,
  compact = false,
}: StatusBadgeProps) {
  const label = status ?? risk;
  const tone = status ? statusTone(status) : risk ? riskTone(risk) : "";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-bold shadow-sm",
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        tone,
      )}
    >
      {label}
    </span>
  );
}
