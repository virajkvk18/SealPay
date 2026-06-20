import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import type { Deal } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const steps = [
  "Open",
  "Assigned",
  "Locked",
  "Submitted",
  "Approved",
  "Released",
];

function statusIndex(deal: Deal) {
  const status = deal.status.toLowerCase();
  if (
    status.includes("released") ||
    (status === "resolved" && deal.resolution === "Released to freelancer")
  )
    return 5;
  if (status === "approved") return 4;
  if (
    status.includes("submitted") ||
    status === "disputed" ||
    status === "resolved"
  )
    return 3;
  if (status.includes("locked")) return 2;
  if (status === "assigned" || Boolean(deal.freelancerWallet)) return 1;
  return 0;
}

export default function DealStatusTracker({
  deal,
  dark = false,
}: {
  deal: Deal;
  dark?: boolean;
}) {
  const current = statusIndex(deal);
  const alert =
    deal.status === "Disputed"
      ? "This deal is under dispute review."
      : deal.status === "Resolved"
        ? `This dispute is resolved${deal.resolution ? `: ${deal.resolution.toLowerCase()}.` : "."}`
        : null;
  const refunded =
    deal.status === "Resolved" && deal.resolution === "Refunded client";

  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-6 sm:gap-0">
        {steps.map((step, index) => {
          const complete = index < current;
          const active = index === current;
          return (
            <li
              key={step}
              className="relative flex items-center gap-3 sm:flex-col sm:gap-2"
            >
              {index > 0 ? (
                <span
                  className={cn(
                    "absolute hidden h-0.5 w-full -translate-x-1/2 sm:block",
                    index <= current
                      ? "bg-cyan-400"
                      : dark
                        ? "bg-white/10"
                        : "bg-slate-200",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-black transition",
                  complete || active
                    ? "border-cyan-300 bg-cyan-400 text-[#010b13] shadow-[0_0_18px_rgba(34,211,238,0.32)]"
                    : dark
                      ? "border-white/10 bg-[#081823] text-slate-600"
                      : "border-slate-200 bg-white text-slate-400",
                )}
              >
                {complete ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-bold",
                  active
                    ? dark
                      ? "text-cyan-300"
                      : "text-[#00677f]"
                    : complete
                      ? dark
                        ? "text-white"
                        : "text-[#101d25]"
                      : dark
                        ? "text-slate-600"
                        : "text-slate-400",
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
      {alert ? (
        <div
          className={cn(
            "mt-5 flex items-start gap-2 rounded-2xl border p-3 text-sm font-bold",
            deal.status === "Disputed"
              ? "border-red-300/30 bg-red-500/10 text-red-300"
              : refunded
                ? "border-amber-300/30 bg-amber-500/10 text-amber-200"
              : "border-violet-300/30 bg-violet-500/10 text-violet-200",
          )}
        >
          {refunded ? (
            <RotateCcw className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          )}
          {alert}
        </div>
      ) : null}
    </div>
  );
}
