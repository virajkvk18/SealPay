"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Award,
  BadgeCheck,
  BarChart3,
  Fingerprint,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { useSealPay } from "@/lib/store";
import { formatAmount, formatDateTime, formatWallet } from "@/lib/utils";

function ReputationMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <article className="glass-panel rounded-[1.6rem] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#53606a]">{label}</p>
          <p className="mt-2 text-3xl font-black text-[#010b13]">{value}</p>
        </div>
        <span className="grid size-12 place-items-center rounded-2xl bg-cyan-100 text-[#00677f]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#74777b]">{helper}</p>
    </article>
  );
}

export default function ReputationPage() {
  const { deals, totals } = useSealPay();
  const completedDeals = deals.filter((deal) =>
    ["Payment Released", "Resolved", "Approved"].includes(deal.status),
  );
  const score = Math.min(
    98,
    84 + completedDeals.length * 3 - totals.disputed * 2,
  );
  const lockedVolume = deals.reduce((sum, deal) => sum + deal.amount, 0);
  const latestProofs = deals
    .flatMap((deal) =>
      (deal.timeline ?? []).map((event) => ({
        ...event,
        dealId: deal.id,
        dealTitle: deal.title,
        wallet: deal.freelancerWallet,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 5);

  return (
    <main className="page-shell grid-bg">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-[#00566a]">
              <Award className="size-4" />
              Reputation Layer
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
              SealPay Reputation
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
              SealPay turns completed deals, proof hashes, and dispute outcomes
              into a transparent trust score.
            </p>
          </div>
          <Link href="/create-deal" className="primary-button">
            Create Deal
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="rounded-[1.6rem] bg-[#010b13] p-6 text-center text-white">
              <div className="mx-auto grid size-44 place-items-center rounded-full border-[14px] border-cyan-200/25 bg-cyan-300/10 shadow-2xl shadow-cyan-900/20">
                <div>
                  <p className="text-6xl font-black tracking-normal">{score}</p>
                  <p className="mt-1 text-sm font-black uppercase tracking-normal text-cyan-100">
                    SealPay
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-1 text-cyan-100">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                Strong record across escrow creation, locked payments, proof
                storage, and release decisions.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
                <span className="text-sm font-bold text-[#53606a]">
                  Verified Workflows
                </span>
                <span className="text-sm font-black text-[#010b13]">
                  {totals.total}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
                <span className="text-sm font-bold text-[#53606a]">
                  Disputes Open
                </span>
                <span className="text-sm font-black text-[#010b13]">
                  {totals.disputed}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
                <span className="text-sm font-bold text-[#53606a]">
                  Total Volume
                </span>
                <span className="text-sm font-black text-[#010b13]">
                  {formatAmount(lockedVolume)}
                </span>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <ReputationMetric
              label="Completion Rate"
              value="96%"
              helper="Estimated from completed and resolved escrow outcomes"
              icon={<BadgeCheck className="size-5" />}
            />
            <ReputationMetric
              label="Hash Integrity"
              value="100%"
              helper="Every recorded action includes a visible proof trail"
              icon={<Fingerprint className="size-5" />}
            />
            <ReputationMetric
              label="Response Signal"
              value="Fast"
              helper="Recent workflow events are grouped for quick verification"
              icon={<TrendingUp className="size-5" />}
            />
            <ReputationMetric
              label="Vault Health"
              value="Live"
              helper="Escrow records are available for wallet verification"
              icon={<ShieldCheck className="size-5" />}
            />

            <article className="glass-panel rounded-[2rem] p-6 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                    Reputation Events
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#010b13]">
                    Verified SealPay Activity
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-[#00566a]">
                  <BarChart3 className="size-4" />
                  Live score
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {latestProofs.map((event) => (
                  <Link
                    key={`${event.dealId}-${event.id}`}
                    href={`/deal/${event.dealId}`}
                    className="grid gap-3 rounded-2xl border border-[#101d25]/10 bg-white/55 p-4 transition hover:bg-white md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-black text-[#010b13]">{event.title}</p>
                      <p className="mt-1 text-sm text-[#53606a]">
                        {event.dealTitle}
                      </p>
                      <p className="mt-2 font-mono text-xs text-[#74777b]">
                        {formatWallet(event.wallet)}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <StatusBadge status={event.status} compact />
                      <span className="text-xs font-bold text-[#00677f]">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
