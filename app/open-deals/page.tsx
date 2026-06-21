"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Clock3, Coins } from "lucide-react";
import ApplyDealButton from "@/components/ApplyDealButton";
import DealStatusTracker from "@/components/DealStatusTracker";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import StatusBadge from "@/components/StatusBadge";
import {
  attachApplicationsToDeals,
  getApplicationsForDeals,
  getOpenDeals,
} from "@/lib/deals";
import type { Deal } from "@/lib/mockData";
import { formatAmount, formatDate, formatWallet } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";

export default function OpenDealsPage() {
  const { address } = useWallet();
  const [openDeals, setOpenDeals] = useState<Deal[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadOpenDeals() {
      try {
        const mappedDeals = await getOpenDeals();
        const applications = await getApplicationsForDeals(
          mappedDeals.map((deal) => deal.id),
        );

        if (!cancelled) {
          setOpenDeals(attachApplicationsToDeals(mappedDeals, applications));
        }
      } catch {
        if (!cancelled) setOpenDeals([]);
      }
    }

    void loadOpenDeals();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RoleGuard allow={["freelancer"]}>
      <main className="dashboard-shell min-h-screen">
        <Navbar />
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="secondary-button border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          >
            <ArrowLeft className="size-4" />
            Freelancer Dashboard
          </Link>
          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Public opportunities
            </p>
            <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Open Deals
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">
              Review public scopes and submit a wallet-linked proposal.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {openDeals.length ? (
              openDeals.map((deal) => (
                <article
                  key={deal.id}
                  className="dashboard-panel rounded-[2rem] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-violet-300">
                        {deal.id}
                      </p>
                      <h2 className="mt-2 text-xl font-black text-white">
                        {deal.title}
                      </h2>
                    </div>
                    <BriefcaseBusiness className="size-6 text-violet-300" />
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                    {deal.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <StatusBadge status={deal.status} compact />
                    <span className="font-mono text-xs text-slate-500">
                      Client {formatWallet(deal.clientWallet)}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-slate-300">
                    <span className="flex items-center gap-2">
                      <Coins className="size-4 text-emerald-300" />
                      {formatAmount(deal.amount)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock3 className="size-4 text-violet-300" />
                      {formatDate(deal.deadline)}
                    </span>
                  </div>
                  <div className="mt-6">
                    <DealStatusTracker deal={deal} dark />
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/deal/${deal.id}`}
                      className="secondary-button border-white/10 bg-white/5 text-white"
                    >
                      View Details
                    </Link>
                    <ApplyDealButton deal={deal} wallet={address} />
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-panel rounded-[2rem] p-10 text-center lg:col-span-2">
                <p className="font-bold text-slate-400">
                  No open deals available right now.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
