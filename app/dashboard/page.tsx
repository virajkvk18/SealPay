"use client";

import Link from "next/link";
import {
  Activity,
  CircleDollarSign,
  FilePlus2,
  Gauge,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import DealCard from "@/components/DealCard";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { demoModeNotice, roles } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { cn, formatAmount, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const { deals, totals, activeRole, setActiveRole, resetDemo } = useSealPay();
  const recentActivity = deals
    .flatMap((deal) =>
      deal.timeline.map((event) => ({
        ...event,
        dealId: deal.id,
        dealTitle: deal.title,
      })),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <main className="page-shell">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.26em] text-[#00677f]">
              SealPay MVP
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
              Escrow dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
              {demoModeNotice}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetDemo} className="secondary-button">
              <RotateCcw className="size-4" />
              Reset Demo
            </button>
            <Link href="/create-deal" className="primary-button">
              <FilePlus2 className="size-4" />
              Create New Deal
            </Link>
          </div>
        </div>

        <div className="mt-8 glass-panel rounded-3xl p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#53606a]">
                Role switcher
              </p>
              <p className="mt-1 text-sm text-[#43474b]">
                Current role controls which action buttons appear on deal pages.
              </p>
            </div>
            <div className="grid gap-2 rounded-2xl border border-[#101d25]/10 bg-white/70 p-1 sm:grid-cols-3">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-black transition",
                    activeRole === role
                      ? "bg-cyan-300 text-slate-950"
                      : "text-[#43474b] hover:bg-[#f2f4f6] hover:text-[#010b13]",
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total deals"
            value={String(totals.total)}
            helper="Seeded and locally created deals"
            icon={<Activity className="size-5" />}
          />
          <StatCard
            label="Active deals"
            value={String(totals.active)}
            helper="Created, locked, or submitted"
            icon={<Gauge className="size-5" />}
          />
          <StatCard
            label="Completed"
            value={String(totals.completed)}
            helper="Released or resolved"
            icon={<ShieldCheck className="size-5" />}
          />
          <StatCard
            label="Disputed"
            value={String(totals.disputed)}
            helper="Awaiting admin review"
            icon={<Scale className="size-5" />}
          />
          <StatCard
            label="Locked amount"
            value={formatAmount(totals.lockedAmount)}
            helper="Mock funds currently held"
            icon={<CircleDollarSign className="size-5" />}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-[#010b13]">Deals</h2>
              <span className="text-sm font-bold text-[#53606a]">{activeRole} view</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} activeRole={activeRole} />
              ))}
            </div>
          </section>

          <aside className="glass-panel h-fit rounded-3xl p-5">
            <h2 className="text-2xl font-black text-[#010b13]">Recent deal activity</h2>
            <div className="mt-5 space-y-4">
              {recentActivity.map((event) => (
                <Link
                  key={`${event.dealId}-${event.id}`}
                  href={`/deal/${event.dealId}`}
                  className="block rounded-2xl border border-[#101d25]/10 bg-white/70 p-4 transition hover:border-cyan-300/35 hover:bg-white/90"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[#010b13]">{event.title}</p>
                    <span className="font-mono text-xs text-[#00677f]">{event.dealId}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#53606a]">{event.dealTitle}</p>
                  <p className="mt-3 text-xs font-bold text-[#74777b]">
                    {formatDateTime(event.timestamp)}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
