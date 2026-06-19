
"use client";

import Link from "next/link";
import type { Deal } from "@/lib/mockData";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CircleDollarSign,
  FileText,
  Fingerprint,
  Gauge,
  Plus,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { generateSealTrustScore } from "@/lib/aiEngine";
import { roles } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { cn, formatAmount, formatDate, formatDateTime, formatWallet } from "@/lib/utils";

const processSteps = [
  "Invoice created",
  "Payment locked",
  "Proof hash stored",
  "Approval or dispute",
];

const demoFlowSteps = [
  "Create a deal",
  "AI checks risk",
  "Client locks payment",
  "Freelancer submits proof",
  "AI reviews proof",
  "Client approves",
  "Payment releases",
  "Public proof timeline verifies everything",
];

const demoLinks = [
  { href: "/create-deal", label: "Create Deal" },
  { href: "/deal/SP-1002", label: "Open sample work-submitted deal" },
  { href: "/deal/SP-1003", label: "Open sample disputed deal" },
  { href: "/proof/SP-1001", label: "Open public proof page" },
];

function MetricPanel({
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
    <article className="glass-panel rounded-[1.6rem] p-6 transition hover:-translate-y-1 hover:bg-white/85">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#53606a]">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-normal text-[#010b13]">{value}</p>
        </div>
        <span className="grid size-12 place-items-center rounded-2xl bg-cyan-100 text-[#00677f]">
          {icon}
        </span>
      </div>
      <p className="mt-5 text-sm leading-6 text-[#74777b]">{helper}</p>
    </article>
  );
}

export default function DashboardPage() {
  const {
  deals: localDeals,
  totals,
  activeRole,
  setActiveRole,
  resetDemo,
} = useSealPay();

const [deals, setDeals] = useState(localDeals);

  useEffect(() => {
  async function fetchDeals() {
    const { data, error } = await supabase
      .from("deals")
      .select("*");

    console.log("SUPABASE DEALS:", data);
    console.log("SUPABASE ERROR:", error);

    if (!error && data) {
  const mappedDeals: Deal[] = data.map((deal) => ({
    id: deal.id,
    title: deal.title,
    description: deal.description,

    clientName: deal.client_name,
    freelancerName: deal.freelancer_name,

    clientWallet: deal.client_wallet ?? "",
    freelancerWallet: deal.freelancer_wallet ?? "",

    amount: Number(deal.amount ?? 0),

    deadline:
      deal.deadline ??
      new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),

    deliverableType: deal.deliverable_type ?? "Website",
    status: deal.status ?? "Created",
    risk: deal.risk ?? "Low",
    createdTxHash: deal.created_tx_hash ?? "",
    timeline: deal.timeline ?? [],

    previewUrl: deal.preview_url,
    finalFileName: deal.final_file_name,

    proof: deal.proof,
    aiProofReview: deal.ai_proof_review,
    disputeReason: deal.dispute_reason,
    disputeEvidence: deal.dispute_evidence,
    aiDisputeSummary: deal.ai_dispute_summary,
    resolution: deal.resolution,
  }));

  setDeals(mappedDeals);
}
  }

  fetchDeals();
}, []);

  const activeWallet =
    activeRole === "Freelancer"
      ? deals[0]?.freelancerWallet ?? ""
      : activeRole === "Admin/Judge"
        ? deals.find((deal) => deal.status === "Disputed")?.freelancerWallet ??
          deals[0]?.freelancerWallet ??
          ""
        : deals[0]?.clientWallet ?? "";
  const sealTrust = generateSealTrustScore(activeWallet, deals);
  const releasedAmount = deals
    .filter(
      (deal) =>
        deal.status === "Payment Released" ||
        (deal.status === "Resolved" && deal.resolution === "Released to freelancer"),
    )
    .reduce((sum, deal) => sum + deal.amount, 0);
  const recentActivity = deals
  .flatMap((deal) =>
    (deal.timeline ?? []).map((event) => ({
      ...event,
      dealId: deal.id,
      dealTitle: deal.title,
    })),
  )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  return (
    <main className="page-shell grid-bg">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-[#00566a]">
              <ShieldCheck className="size-4" />
              Web3 Escrow Operations
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
              Workspace Overview
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
              Manage secured invoices, proof hashes, dispute evidence, and release
              actions from one SealPay control room.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetDemo} className="secondary-button">
              <RotateCcw className="size-4" />
              Reset Demo
            </button>
            <Link href="/create-deal" className="primary-button">
              <Plus className="size-4" />
              Create Invoice
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricPanel
            label="Total Locked"
            value={formatAmount(totals.lockedAmount)}
            helper="Funds currently sitting in escrow vaults"
            icon={<CircleDollarSign className="size-5" />}
          />
          <MetricPanel
            label="Released Payments"
            value={formatAmount(releasedAmount)}
            helper="Freelancer payouts cleared through approval"
            icon={<BadgeCheck className="size-5" />}
          />
          <MetricPanel
            label="Active Invoices"
            value={String(totals.active)}
            helper="Created, locked, or awaiting approval"
            icon={<FileText className="size-5" />}
          />
          <MetricPanel
            label="SealPay Score"
            value="92"
            helper="Workspace reputation from mock escrow history"
            icon={<Gauge className="size-5" />}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#101d25]/10 px-6 py-5">
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                  Escrow Ledger
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#010b13]">
                  Recent Invoices
                </h2>
              </div>
              <Link href="/create-deal" className="secondary-button px-4 py-2 text-sm">
                New Invoice
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="text-xs font-black uppercase tracking-normal text-[#74777b]">
                  <tr className="border-b border-[#101d25]/10">
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="border-b border-[#101d25]/10 bg-white/35 transition last:border-b-0 hover:bg-white/70"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black text-[#010b13]">{deal.title}</p>
                        <p className="mt-1 font-mono text-xs font-bold text-[#00677f]">
                          {deal.id}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-semibold text-[#43474b]">{deal.clientName}</p>
                        <p className="mt-1 font-mono text-xs text-[#74777b]">
                          {formatWallet(deal.clientWallet)}
                        </p>
                      </td>
                      <td className="px-6 py-5 font-black text-[#010b13]">
                        {formatAmount(deal.amount)}
                      </td>
                      <td className="px-6 py-5 font-semibold text-[#43474b]">
                        {formatDate(deal.deadline)}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={deal.status} compact />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/deal/${deal.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-black text-white transition hover:bg-[#00677f]"
                        >
                          Open
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                Process Status
              </p>
              <div className="mt-5 space-y-4">
                {processSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-cyan-100 text-xs font-black text-[#00677f]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-[#43474b]">{step}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                Current Role
              </p>
              <div className="mt-5 grid gap-2 rounded-2xl border border-[#101d25]/10 bg-white/60 p-1">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-left text-sm font-black transition",
                      activeRole === role
                        ? "bg-black text-white"
                        : "text-[#43474b] hover:bg-white hover:text-[#010b13]",
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-cyan-100 text-[#00677f]">
                  <Award className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#53606a]">SealTrust Score</p>
                  <p className="text-3xl font-black text-[#010b13]">
                    {sealTrust.score}/100
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
                <p className="text-xs font-black uppercase tracking-normal text-[#74777b]">
                  Wallet checked
                </p>
                <p className="mt-2 break-all font-mono text-sm font-bold text-[#010b13]">
                  {formatWallet(activeWallet)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white/60 p-3">
                  <p className="text-lg font-black text-[#010b13]">
                    {sealTrust.completedDeals}
                  </p>
                  <p className="text-xs font-bold text-[#74777b]">Completed</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  <p className="text-lg font-black text-[#010b13]">
                    {sealTrust.disputesCount}
                  </p>
                  <p className="text-xs font-bold text-[#74777b]">Disputes</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  <p className="text-sm font-black text-[#010b13]">
                    {sealTrust.trustLabel}
                  </p>
                  <p className="text-xs font-bold text-[#74777b]">Label</p>
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                3-Minute Demo Flow
              </p>
              <div className="mt-5 space-y-3">
                {demoFlowSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-black text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-[#43474b]">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2">
                {demoLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-[#101d25]/10 bg-white/65 px-4 py-2 text-sm font-black text-[#010b13] transition hover:bg-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#010b13] p-6 text-white shadow-2xl shadow-cyan-950/20">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                  <Fingerprint className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-cyan-100">Protocol Verified</p>
                  <p className="text-xs text-white/60">Mock chain health is stable</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/70">
                Every SealPay action writes a visible hash to the local proof trail for
                fast hackathon demos.
              </p>
            </section>

            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                Latest Activity
              </p>
              <div className="mt-5 space-y-3">
                {recentActivity.map((event) => (
                  <Link
                    key={`${event.dealId}-${event.id}`}
                    href={`/deal/${event.dealId}`}
                    className="block rounded-2xl border border-[#101d25]/10 bg-white/55 p-4 transition hover:bg-white"
                  >
                    <p className="text-sm font-black text-[#010b13]">{event.title}</p>
                    <p className="mt-1 text-xs font-semibold text-[#74777b]">
                      {event.dealTitle}
                    </p>
                    <p className="mt-3 text-xs font-bold text-[#00677f]">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
