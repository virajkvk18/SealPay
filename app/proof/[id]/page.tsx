"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileSearch,
  Fingerprint,
  Search,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import DealStatusTracker from "@/components/DealStatusTracker";
import { demoModeNotice } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { formatAmount, formatWallet } from "@/lib/utils";

export default function ProofPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dealId = routeId ? decodeURIComponent(routeId) : "";
  const { deals } = useSealPay();
  const [lookup, setLookup] = useState(dealId);
  const deal = deals.find((candidate) => candidate.id === dealId);
  const latestTxHash = deal?.timeline
    .filter((event) => event.txHash)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0]?.txHash;

  function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextId = lookup.trim();
    if (nextId) router.push(`/proof/${encodeURIComponent(nextId)}`);
  }

  return (
    <main className="page-shell grid-bg">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="secondary-button px-4 py-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          {deal ? (
            <Link
              href={`/deal/${deal.id}`}
              className="secondary-button px-4 py-2 text-sm"
            >
              Open Deal
            </Link>
          ) : null}
        </div>

        <article className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-[#00566a]">
                <FileSearch className="size-4" />
                Public proof explorer
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
                Verify SealPay timeline
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
                {demoModeNotice}
              </p>
            </div>
            <form
              onSubmit={handleLookup}
              className="flex w-full gap-2 rounded-full border border-[#101d25]/10 bg-white/70 p-1 lg:max-w-md"
            >
              <input
                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-[#010b13] placeholder:text-[#74777b]"
                value={lookup}
                onChange={(event) => setLookup(event.target.value)}
                placeholder="Enter Deal ID"
              />
              <button
                type="submit"
                className="primary-button px-4 py-2 text-sm"
              >
                <Search className="size-4" />
                Verify
              </button>
            </form>
          </div>
        </article>

        {!deal ? (
          <article className="mt-6 glass-panel rounded-3xl p-6 text-center">
            <h2 className="text-2xl font-black text-[#010b13]">
              No public proof found
            </h2>
            <p className="mt-3 text-[#53606a]">
              Try one of the seeded demo IDs: SP-1001, SP-1002, or SP-1003.
            </p>
          </article>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="glass-panel h-fit rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-[#00677f]">
                    Deal ID
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-[#010b13]">
                    {deal.id}
                  </h2>
                </div>
                <StatusBadge status={deal.status} compact />
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
                  <p className="text-sm font-bold text-emerald-800">
                    Amount locked
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#010b13]">
                    {formatAmount(deal.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Client wallet
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {formatWallet(deal.clientWallet)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Freelancer wallet
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {formatWallet(deal.freelancerWallet)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Created transaction
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {formatWallet(deal.createdTxHash)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Proof hash
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {deal.proof ? deal.proof.fileHash : "Pending proof"}
                  </p>
                </div>
                {deal.proof?.gatewayUrl ? (
                  <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                      IPFS proof
                    </p>
                    <a
                      href={deal.proof.gatewayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-sm font-bold text-[#00677f] underline"
                    >
                      Open pinned proof
                    </a>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Latest transaction
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {latestTxHash
                      ? formatWallet(latestTxHash)
                      : "No transaction yet"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#00566a]">
                  <ShieldCheck className="size-4" />
                  Blockchain verification
                </div>
                <p className="mt-2 text-sm leading-6 text-[#43474b]">
                  Deal events include transaction references for independent
                  verification.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#00566a]">
                  <Fingerprint className="size-4" />
                  AI explorer signals
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[#43474b]">
                  <p>
                    AI risk score:{" "}
                    <span className="font-black text-[#010b13]">
                      {deal.risk.score}/100
                    </span>
                  </p>
                  <p>
                    AI proof review:{" "}
                    <span className="font-black text-[#010b13]">
                      {deal.aiProofReview?.status ?? "Pending proof submission"}
                    </span>
                  </p>
                  {deal.aiProofReview ? (
                    <>
                      <p>
                        AI review score:{" "}
                        <span className="font-black text-[#010b13]">
                          {deal.aiProofReview.score}/100
                        </span>
                      </p>
                      <p>
                        AI verdict:{" "}
                        <span className="font-black text-[#010b13]">
                          {deal.aiProofReview.verdict ??
                            deal.aiProofReview.status}
                        </span>
                      </p>
                      {deal.aiProofReview.summary ? (
                        <p>
                          AI summary:{" "}
                          <span className="font-semibold">
                            {deal.aiProofReview.summary}
                          </span>
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {deal.aiDisputeSummary ? (
                    <p>
                      Dispute summary:{" "}
                      <span className="font-semibold">
                        {deal.aiDisputeSummary}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </aside>

            <section className="glass-panel rounded-3xl p-5 sm:p-7">
              <div className="mb-8 rounded-3xl border border-[#101d25]/10 bg-white/65 p-5">
                <p className="mb-5 text-sm font-black uppercase tracking-normal text-[#00677f]">
                  Deal status
                </p>
                <DealStatusTracker deal={deal} />
              </div>
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-normal text-emerald-700">
                  Timeline
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#010b13]">
                  Blockchain-style proof trail
                </h2>
              </div>
              <Timeline events={deal.timeline} explorerMode />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
