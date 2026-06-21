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
import RoleGuard from "@/components/RoleGuard";
import ApplicationsList from "@/components/ApplicationsList";
import StatusBadge from "@/components/StatusBadge";
import { generateWalletTrustScore } from "@/lib/scoring";
import { useDashboardMode } from "@/lib/dashboardMode";
import {
  attachApplicationsToDeals,
  getApplicationsForDeals,
  mapSupabaseDeal,
} from "@/lib/deals";
import type { Deal } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/lib/wallet";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatWallet,
} from "@/lib/utils";

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
    <article className="dashboard-panel dashboard-glass-card dashboard-metric-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-violet-400/10 text-violet-200 ring-1 ring-violet-300/10">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
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
    <Link href={href} className="dashboard-action-card dashboard-glow-card group flex min-h-24 items-center gap-3 rounded-2xl p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-violet-200">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-white">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-violet-300 transition group-hover:translate-x-1" />
    </Link>
  );
}

function DealList({
  title,
  helper,
  deals,
  emptyMessage,
  emptyHref,
  emptyAction,
  submitWork = false,
}: {
  title: string;
  helper: string;
  deals: Deal[];
  emptyMessage: string;
  emptyHref?: string;
  emptyAction?: string;
  submitWork?: boolean;
}) {
  return (
    <section className="dashboard-panel dashboard-glass-card overflow-hidden rounded-[2rem]">
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
                {submitWork && deal.status === "Payment Locked" ? (
                  <span className="primary-button px-4 py-2 text-xs">
                    Submit Work
                  </span>
                ) : null}
                <ArrowRight className="size-4 text-violet-300" />
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
          {emptyHref && emptyAction ? (
            <Link href={emptyHref} className="secondary-button mt-5 px-4 py-2 text-xs">
              {emptyAction}
            </Link>
          ) : null}
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
  const deals = useMemo(() => {
    if (!remoteDeals) return localDeals;
    const localIds = new Set(localDeals.map((deal) => deal.id));
    return [
      ...localDeals,
      ...remoteDeals.filter((deal) => !localIds.has(deal.id)),
    ];
  }, [localDeals, remoteDeals]);

  useEffect(() => {
    const supabaseClient = supabase;
    if (!supabaseClient || !/^0x[a-fA-F0-9]{40}$/.test(address)) return;
    const client = supabaseClient;
    let cancelled = false;
    const wallet = address.toLowerCase();

    async function loadDashboardDeals() {
      const { data, error } = await client
        .from("deals")
        .select("*")
        .order("deadline", { ascending: true });

      if (cancelled || error) return;

      const mappedDeals = (data ?? [])
        .map((row) => mapSupabaseDeal(row))
        .filter(
          (deal) =>
            deal.clientWallet.toLowerCase() === wallet ||
            deal.freelancerWallet.toLowerCase() === wallet ||
            (deal.dealKind === "Public" && deal.status === "Created"),
        );
      const applications = await getApplicationsForDeals(
        mappedDeals.map((deal) => deal.id),
      );

      if (!cancelled) {
        setRemoteDeals(attachApplicationsToDeals(mappedDeals, applications));
      }
    }

    void loadDashboardDeals();

    const channel = client
      .channel(`dashboard-marketplace-${wallet}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals" },
        () => void loadDashboardDeals(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => void loadDashboardDeals(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [address]);

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
  const applicationsSent = deals
    .flatMap((deal) => deal.applications ?? [])
    .filter(
      (application) =>
        application.freelancerWallet.toLowerCase() === normalizedWallet,
    );
  const readyToSubmit = freelancerDeals.find(
    (deal) => deal.status === "Payment Locked",
  );
  const proofTimelineDeal =
    submittedProofs[0] ?? pendingApprovals[0] ?? activeDeals[0];
  const proofTimelineHref = proofTimelineDeal
    ? `/proof/${encodeURIComponent(proofTimelineDeal.id)}`
    : "/dashboard#my-deals";
  const earnings = freelancerDeals
    .filter((deal) =>
      ["Approved", "Payment Released", "Resolved"].includes(deal.status),
    )
    .reduce((sum, deal) => sum + deal.amount, 0);
  const trust = generateWalletTrustScore(address, deals);
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
      label: "Applications Sent",
      value: String(applicationsSent.length),
      helper: "Public deal proposals",
      icon: <Inbox className="size-5" />,
    },
    {
      label: "Earnings",
      value: formatAmount(earnings),
      helper: "Approved and released value",
      icon: <CircleDollarSign className="size-5" />,
    },
    {
      label: "Proofs Submitted",
      value: String(submittedProofs.length),
      helper: "Protected submissions",
      icon: <FileCheck2 className="size-5" />,
    },
  ];
  const metrics = mode === "client" ? clientMetrics : freelancerMetrics;

  const clientActions = [
    {
      href: "/create-deal",
      title: "Create Deal",
      detail: "Start a direct or public escrow.",
      icon: <Plus className="size-5" />,
    },
    {
      href: "/dashboard#applications",
      title: "Applications",
      detail: "Review and select a freelancer.",
      icon: <UserRoundCheck className="size-5" />,
    },
    {
      href: "/dashboard#pending-approvals",
      title: "Pending Approvals",
      detail: "Review submitted work and release payment.",
      icon: <Clock3 className="size-5" />,
    },
    {
      href: proofTimelineHref,
      title: "Proof Timeline",
      detail: proofTimelineDeal
        ? `Verify ${proofTimelineDeal.id} history.`
        : "Create a deal first to verify its history.",
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
      href: "/dashboard#assigned",
      title: "View Assigned Deals",
      detail: "Review direct wallet assignments.",
      icon: <BriefcaseBusiness className="size-5" />,
    },
    {
      href: readyToSubmit
        ? `/deal/${readyToSubmit.id}?submit=work`
        : "/dashboard#assigned",
      title: "Submit Work",
      detail: "Share protected work evidence.",
      icon: <FileKey2 className="size-5" />,
    },
    {
      href: "/dashboard#submitted-proofs",
      title: "Submitted Proofs",
      detail: "Review your protected submissions.",
      icon: <FileCheck2 className="size-5" />,
    },
  ];
  const actions = mode === "client" ? clientActions : freelancerActions;

  return (
    <RoleGuard allow={["client", "freelancer"]}>
      <main className="dashboard-shell internal-workspace min-h-screen">
        <Navbar />
        <section className="dashboard-workspace mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="dashboard-hero-panel dashboard-glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="dashboard-rings-bg" aria-hidden="true" />
            <div className="dashboard-strands-bg" aria-hidden="true" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="chain-chip inline-flex">
                  <Wallet className="size-3.5" />
                  {address ? formatWallet(address) : "Wallet not connected"}
                </div>
                <h1 className="brand-font mt-5 text-3xl font-black text-white sm:text-4xl">
                  {mode === "client" ? "Client Dashboard" : "Freelancer Dashboard"}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                  {mode === "client"
                    ? "Create deals, lock payment, and approve work securely."
                    : "Find work, submit proof, and get paid securely."}
                </p>
              </div>
              <div className="dashboard-role-badge">
                <BadgeCheck className="size-4" />
                {mode === "client" ? "Client workspace" : "Freelancer workspace"}
              </div>
            </div>
          </div>

          <section className="mt-7" aria-label="Primary actions">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {actions.map((action) => (
                <ActionCard key={action.title} {...action} />
              ))}
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
            <div className="space-y-6">
              {mode === "client" ? (
                <>
                  <div id="my-deals">
                    <DealList
                      title="My Created Deals"
                      helper="Deals created by your connected wallet"
                      deals={clientDeals}
                      emptyMessage="No created deals yet. Create a direct or public deal to begin."
                      emptyHref="/create-deal"
                      emptyAction="Create Deal"
                    />
                  </div>
                  <ApplicationsList deals={clientDeals} dark />
                  <div id="pending-approvals">
                    <DealList
                      title="Pending Proof Reviews"
                      helper="Proof submissions waiting for your decision"
                      deals={pendingApprovals}
                      emptyMessage="No proof submissions are waiting for approval."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div id="open-deals">
                    <DealList
                      title="Open Public Deals"
                      helper="Opportunities available for applications"
                      deals={openDeals}
                      emptyMessage="No open public deals are available right now."
                      emptyHref="/open-deals"
                      emptyAction="Browse Open Deals"
                    />
                  </div>
                  <div id="assigned">
                    <DealList
                      title="Assigned Work"
                      helper="Deals assigned to your connected wallet"
                      deals={freelancerDeals}
                      emptyMessage="No direct deals have been assigned to this wallet."
                      emptyHref="/open-deals"
                      emptyAction="Browse Open Deals"
                      submitWork
                    />
                  </div>
                  <div
                    id="submit-work"
                    className="dashboard-panel dashboard-glass-card rounded-[2rem] p-6"
                  >
                    <h2 className="text-xl font-black text-white">
                      Submit Work
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Open a payment-locked assignment to upload proof and your
                      final deliverable.
                    </p>
                    {readyToSubmit ? (
                      <Link
                        href={`/deal/${readyToSubmit.id}?submit=work`}
                        className="primary-button mt-5"
                      >
                        Submit Work for {readyToSubmit.title}
                        <ArrowRight className="size-4" />
                      </Link>
                    ) : (
                      <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm font-bold text-slate-500">
                        No assigned work ready for submission.
                      </p>
                    )}
                  </div>
                  <div id="submitted-proofs">
                    <DealList
                      title="Submitted Proofs"
                      helper="Work already sent for client review"
                      deals={submittedProofs}
                      emptyMessage="No work has been submitted yet."
                      emptyHref="/dashboard#assigned"
                      emptyAction="View Assigned Work"
                    />
                  </div>
                </>
              )}
            </div>
            <aside id="timeline" className="dashboard-panel dashboard-glass-card dashboard-timeline-panel rounded-[2rem] p-6">
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
                      <p className="mt-3 text-xs font-bold text-violet-300">
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
                href={proofTimelineHref}
                className="secondary-button mt-5 w-full border-white/10 bg-white/5 text-white"
              >
                Public Proof Timeline <ArrowRight className="size-4" />
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
