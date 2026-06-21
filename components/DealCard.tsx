import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Coins,
  FileLock2,
  ShieldAlert,
} from "lucide-react";
import type { Deal, Role } from "@/lib/mockData";
import { formatAmount, formatDate, formatWallet, proofPath } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

interface DealCardProps {
  deal: Deal;
  activeRole?: Role;
}

function nextActionLabel(deal: Deal, activeRole?: Role) {
  if (activeRole === "Client") {
    if (deal.status === "Created") return "Ready to lock payment";
    if (deal.status === "Work Submitted") return "Review proof";
    if (deal.status === "Payment Released") return "Payment released";
    return "Monitor escrow";
  }

  if (activeRole === "Freelancer") {
    if (deal.status === "Payment Locked") return "Submit work proof";
    if (deal.status === "Work Submitted") return "Awaiting approval";
    return "Track delivery";
  }

  if (activeRole === "Admin/Judge") {
    return deal.status === "Disputed" ? "Resolve dispute" : "Audit timeline";
  }

  return "Open deal";
}

export default function DealCard({ deal, activeRole }: DealCardProps) {
  return (
    <article className="soft-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-emerald-200/35 hover:bg-white/85">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[#7c3aed]/80">
            {deal.id}
          </p>
          <h3 className="mt-2 text-xl font-black tracking-normal text-[#1e1233]">
            {deal.title}
          </h3>
        </div>
        <StatusBadge status={deal.status} compact />
      </div>

      <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[#53606a]">
        {deal.description}
      </p>

      <div className="mt-5 grid gap-3 text-sm text-[#43474b] sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-emerald-700" />
          {formatAmount(deal.amount)}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-[#7c3aed]" />
          {formatDate(deal.deadline)}
        </div>
        <div className="flex items-center gap-2">
          <FileLock2 className="size-4 text-violet-300" />
          {deal.deliverableType}
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-300" />
          {deal.risk.level}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[#101d25]/10 bg-white/70 p-3 text-xs text-[#53606a]">
        <div className="flex items-center justify-between gap-3">
          <span>Client</span>
          <span className="font-mono text-[#101d25]">
            {formatWallet(deal.clientWallet)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span>Freelancer</span>
          <span className="font-mono text-[#101d25]">
            {formatWallet(deal.freelancerWallet)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-[#43474b]">
          {nextActionLabel(deal, activeRole)}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={proofPath(deal.id)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#101d25]/10 bg-white/70 text-[#43474b] transition hover:border-violet-300/50 hover:text-[#6d28d9]"
            aria-label={`Open public proof for ${deal.id}`}
          >
            <FileLock2 className="size-4" />
          </Link>
          <Link
            href={`/deal/${deal.id}`}
            className="primary-button px-4 py-2 text-sm"
          >
            Open
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
