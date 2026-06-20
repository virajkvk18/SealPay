"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileKey2,
  Fingerprint,
  Inbox,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ApplicationsList from "@/components/ApplicationsList";
import StatusBadge from "@/components/StatusBadge";
import { generateSealTrustScore } from "@/lib/aiEngine";
import {
  setDashboardMode,
  useDashboardMode,
  type DashboardMode,
} from "@/lib/dashboardMode";
import type { Deal } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/lib/wallet";
import {
  cn,
  formatAmount,
  formatDate,
  formatDateTime,
  formatWallet,
} from "@/lib/utils";

type SupabaseDeal = Record<string, unknown>;

function mapSupabaseDeal(row: SupabaseDeal): Deal {
  const risk = row.risk;

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Untitled deal"),
    description: String(row.description ?? "No description provided."),
    clientName: String(row.client_name ?? "Client"),
    freelancerName: String(row.freelancer_name ?? "Unassigned"),
    clientWallet: String(row.client_wallet ?? ""),
    freelancerWallet: String(row.freelancer_wallet ?? ""),
    selectedFreelancerWallet: row.selected_freelancer_wallet
      ? String(row.selected_freelancer_wallet)
      : undefined,
    applications: Array.isArray(row.applications)
      ? (row.applications as Deal["applications"])
      : [],
    amount: Number(row.amount ?? 0),
    deadline: String(row.deadline ?? new Date().toISOString()),
    deliverableType:
      (row.deliverable_type as Deal["deliverableType"]) ?? "Other",
    status: (row.status as Deal["status"]) ?? "Created",
    risk:
      risk && typeof risk === "object"
        ? (risk as Deal["risk"])
        : { score: 0, level: "Low Risk", reasons: ["Risk review pending."] },
    createdTxHash: String(row.created_tx_hash ?? ""),
    timeline: Array.isArray(row.timeline)
      ? (row.timeline as Deal["timeline"])
      : [],
    previewUrl: row.preview_url ? String(row.preview_url) : undefined,
    finalFileName: row.final_file_name
      ? String(row.final_file_name)
      : undefined,
    proof: row.proof as Deal["proof"],
    aiProofReview: row.ai_proof_review as Deal["aiProofReview"],
    disputeReason: row.dispute_reason ? String(row.dispute_reason) : undefined,
    disputeEvidence: row.dispute_evidence
      ? String(row.dispute_evidence)
      : undefined,
    aiDisputeSummary: row.ai_dispute_summary
      ? String(row.ai_dispute_summary)
      : undefined,
    resolution: row.resolution as Deal["resolution"],
  };
}

function MetricCard({
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
    <article className="dashboard-panel rounded-3xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-violet-400/10 text-violet-200 ring-1 ring-violet-300/10">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  );
}

function ActionCard({
  href,
  title,
  detail,
  icon,
}: {
  href: string;
  title: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="dashboard-action-card group rounded-3xl p-5">
      <span className="grid size-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
        {icon}
      </span>
      <h3 className="mt-5 text-base font-black text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-cyan-300">
        Open{" "}
        <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function DealList({
  title,
  helper,
  deals,
  emptyMessage,
}: {
  title: string;
  helper: string;
  deals: Deal[];
  emptyMessage: string;
}) {
  return (
    <section className="dashboard-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-white/8 px-6 py-5">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      </div>
      {deals.length ? (
        <div className="divide-y divide-white/6">
          {deals.slice(0, 5).map((deal) => (
            <Link
              key={deal.id}
              href={`/deal/${deal.id}`}
              className="grid gap-4 px-6 py-5 transition hover:bg-white/[0.035] md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-black text-white">{deal.title}</p>
                  <StatusBadge status={deal.status} compact />
                </div>
                <p className="mt-2 font-mono text-xs text-slate-500">
                  {deal.id} ·{" "}
                  {formatWallet(deal.freelancerWallet || deal.clientWallet)}
                </p>
              </div>
              <div className="flex items-center gap-5 md:text-right">
                <div>
                  <p className="font-black text-white">
                    {formatAmount(deal.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Due {formatDate(deal.deadline)}
                  </p>
                </div>
                <ArrowRight className="size-4 text-cyan-300" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <Inbox className="mx-auto size-8 text-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-400">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { deals: localDeals } = useSealPay();
  const { address } = useWallet();
  const mode = useDashboardMode();
  const [remoteDeals, setRemoteDeals] = useState<Deal[] | null>(null);
  const deals = remoteDeals ?? localDeals;

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    void client
      .from("deals")
      .select("*")
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.length) {
          setRemoteDeals(data.map((row) => mapSupabaseDeal(row)));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedWallet = address.toLowerCase();
  const clientDeals = useMemo(
    () =>
      deals.filter(
        (deal) => deal.clientWallet.toLowerCase() === normalizedWallet,
      ),
    [deals, normalizedWallet],
  );
  const freelancerDeals = useMemo(
    () =>
      deals.filter(
        (deal) => deal.freelancerWallet.toLowerCase() === normalizedWallet,
      ),
    [deals, normalizedWallet],
  );
  const openDeals = useMemo(
    () =>
      deals.filter(
        (deal) =>
          deal.dealKind === "Public" &&
          deal.status === "Created" &&
          !deal.freelancerWallet,
      ),
    [deals],
  );
  const activeDeals = mode === "client" ? clientDeals : freelancerDeals;
  const receivedApplications = clientDeals.flatMap(
    (deal) => deal.applications ?? [],
  );
  const pendingApprovals = clientDeals.filter(
    (deal) => deal.status === "Work Submitted",
  );
  const submittedProofs = freelancerDeals.filter((deal) => Boolean(deal.proof));
  const earnings = freelancerDeals
    .filter((deal) =>
      ["Approved", "Payment Released", "Resolved"].includes(deal.status),
    )
    .reduce((sum, deal) => sum + deal.amount, 0);
  const trust = generateSealTrustScore(address, deals);
  const recentActivity = activeDeals
    .flatMap((deal) =>
      deal.timeline.map((event) => ({
        ...event,
        dealId: deal.id,
        dealTitle: deal.title,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 5);

  const clientMetrics = [
    {
      label: "Active Escrows",
      value: String(
        clientDeals.filter((deal) =>
          ["Payment Locked", "Work Submitted"].includes(deal.status),
        ).length,
      ),
      helper: "Deals with protected payment",
      icon: <ShieldCheck className="size-5" />,
    },
    {
      label: "Applications Received",
      value: String(
        receivedApplications.filter((item) => item.status === "pending").length,
      ),
      helper: "Applications awaiting selection",
      icon: <Inbox className="size-5" />,
    },
    {
      label: "Pending Approvals",
      value: String(pendingApprovals.length),
      helper: "Proof submissions to review",
      icon: <Clock3 className="size-5" />,
    },
    {
      label: "Trust Score",
      value: String(trust.score),
      helper: trust.trustLabel,
      icon: <BadgeCheck className="size-5" />,
    },
  ];
  const freelancerMetrics = [
    {
      label: "Assigned Deals",
      value: String(freelancerDeals.length),
      helper: "Direct and selected work",
      icon: <BriefcaseBusiness className="size-5" />,
    },
    {
      label: "Proofs Submitted",
      value: String(submittedProofs.length),
      helper: "Protected submissions",
      icon: <FileCheck2 className="size-5" />,
    },
    {
      label: "Earnings",
      value: formatAmount(earnings),
      helper: "Approved and released value",
      icon: <CircleDollarSign className="size-5" />,
    },
    {
      label: "Trust Score",
      value: String(trust.score),
      helper: trust.trustLabel,
      icon: <BadgeCheck className="size-5" />,
    },
  ];
  const metrics = mode === "client" ? clientMetrics : freelancerMetrics;

  const clientActions = [
    {
      href: "/create-deal?type=direct",
      title: "Create Direct Deal",
      detail: "Assign work to a freelancer wallet.",
      icon: <Plus className="size-5" />,
    },
    {
      href: "/create-deal?type=public",
      title: "Post Public Deal",
      detail: "Publish an opportunity for applications.",
      icon: <Search className="size-5" />,
    },
    {
      href: "/dashboard?mode=client#applications",
      title: "Review Applications",
      detail: "Compare interested freelancer wallets.",
      icon: <UserRoundCheck className="size-5" />,
    },
    {
      href: "/proof/SP-1001",
      title: "View Proof Timeline",
      detail: "Verify deal and payment history.",
      icon: <Fingerprint className="size-5" />,
    },
  ];
  const freelancerActions = [
    {
      href: "/open-deals",
      title: "Browse Open Deals",
      detail: "Find public opportunities to apply for.",
      icon: <Search className="size-5" />,
    },
    {
      href: "/dashboard?mode=freelancer#assigned",
      title: "View Assigned Deals",
      detail: "Review direct wallet assignments.",
      icon: <BriefcaseBusiness className="size-5" />,
    },
    {
      href: freelancerDeals[0]
        ? `/deal/${freelancerDeals[0].id}`
        : "/dashboard?mode=freelancer#assigned",
      title: "Submit Proof",
      detail: "Share protected work evidence.",
      icon: <FileKey2 className="size-5" />,
    },
    {
      href: "/reputation",
      title: "View Earnings",
      detail: "Review releases and trust history.",
      icon: <CircleDollarSign className="size-5" />,
    },
  ];
  const actions = mode === "client" ? clientActions : freelancerActions;

  function chooseMode(nextMode: DashboardMode) {
    setDashboardMode(nextMode);
  }

  return (
    <main className="dashboard-shell min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="chain-chip inline-flex">
              <Wallet className="size-3.5" />
              {address ? formatWallet(address) : "Wallet not connected"}
            </div>
            <h1 className="brand-font mt-5 text-4xl font-black text-white sm:text-5xl">
              Welcome, {mode === "client" ? "Client" : "Freelancer"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              {mode === "client"
                ? "Create deals, protect payment, and approve work with confidence."
                : "Find work, submit proof, and get paid securely."}
            </p>
          </div>
          <div className="dashboard-mode-switch">
            <button
              type="button"
              onClick={() => chooseMode("client")}
              className={cn(mode === "client" && "active")}
            >
              <BriefcaseBusiness className="size-4" />
              Client
            </button>
            <button
              type="button"
              onClick={() => chooseMode("freelancer")}
              className={cn(mode === "freelancer" && "active")}
            >
              <Search className="size-4" />
              Freelancer
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Quick actions
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              What would you like to do?
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <ActionCard key={action.title} {...action} />
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <div className="space-y-6">
            {mode === "client" ? (
              <>
                <DealList
                  title="My Created Deals"
                  helper="Deals created by your connected wallet"
                  deals={clientDeals}
                  emptyMessage="No created deals yet. Create a direct or public deal to begin."
                />
                <ApplicationsList deals={clientDeals} dark />
                <DealList
                  title="Pending Proof Reviews"
                  helper="Proof submissions waiting for your decision"
                  deals={pendingApprovals}
                  emptyMessage="No proof submissions are waiting for approval."
                />
              </>
            ) : (
              <>
                <div id="open-deals">
                  <DealList
                    title="Open Public Deals"
                    helper="Opportunities available for applications"
                    deals={openDeals}
                    emptyMessage="No open public deals are available right now."
                  />
                </div>
                <div id="assigned">
                  <DealList
                    title="Assigned Work"
                    helper="Deals assigned to your connected wallet"
                    deals={freelancerDeals}
                    emptyMessage="No direct deals have been assigned to this wallet."
                  />
                </div>
              </>
            )}
          </div>
          <aside className="dashboard-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Fingerprint className="size-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  On-chain activity
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Recent events
                </h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {recentActivity.length ? (
                recentActivity.map((event) => (
                  <Link
                    key={`${event.dealId}-${event.id}`}
                    href={`/deal/${event.dealId}`}
                    className="block rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-white">
                        {event.title}
                      </p>
                      <StatusBadge status={event.status} compact />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {event.dealTitle}
                    </p>
                    <p className="mt-3 text-xs font-bold text-cyan-300">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                  Wallet activity will appear here.
                </p>
              )}
            </div>
            <Link
              href="/proof/SP-1001"
              className="secondary-button mt-5 w-full border-white/10 bg-white/5 text-white"
            >
              Public Proof Timeline <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
