"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FileSearch,
  Fingerprint,
  Search,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import DealStatusTracker from "@/components/DealStatusTracker";
import Toast from "@/components/Toast";
import {
  getLatestProofFromSupabase,
  type ProofRecord,
} from "@/lib/proofs";
import { useSealPay } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  formatAmount,
  formatWallet,
  getExplorerTxUrl,
} from "@/lib/utils";

export default function ProofPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dealId = routeId ? decodeURIComponent(routeId) : "";
  const { deals } = useSealPay();
  const [lookup, setLookup] = useState(dealId);
  const [remoteProof, setRemoteProof] = useState<ProofRecord | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const deal = deals.find((candidate) => candidate.id === dealId);
  const currentRemoteProof =
    remoteProof?.deal_id === dealId ? remoteProof : null;
  const proofReview = deal?.aiProofReview ?? currentRemoteProof?.ai_review ?? null;
  const latestTxHash = deal?.timeline
    .filter((event) => event.txHash)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0]?.txHash;

  useEffect(() => {
    let active = true;

    if (!dealId) return;

    void getLatestProofFromSupabase(dealId).then((proof) => {
      if (active) setRemoteProof(proof);
    });

    const client = supabase;
    if (!client) {
      return () => {
        active = false;
      };
    }

    const channel = client
      .channel(`proofs-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proofs",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          const nextProof = payload.new as ProofRecord | null;
          if (nextProof) setRemoteProof(nextProof);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [dealId]);

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
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-4 py-2 text-sm font-black text-[#6d28d9]">
                <FileSearch className="size-4" />
                Public Proof Timeline
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-normal text-[#1e1233] sm:text-5xl">
                Verify the complete deal record
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
                Review escrow activity, decentralized proof references, and
                blockchain records in one transparent timeline.
              </p>
            </div>
            <form
              onSubmit={handleLookup}
              className="flex w-full gap-2 rounded-full border border-[#101d25]/10 bg-white/70 p-1 lg:max-w-md"
            >
              <input
                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-[#1e1233] placeholder:text-[#74777b]"
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

        {!deal && currentRemoteProof ? (
          <article className="mt-6 glass-panel rounded-3xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-[#7c3aed]">
                  Blockchain Proof
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#1e1233]">
                  Proof found for {currentRemoteProof.deal_id}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#53606a]">
                  This shared proof record can be independently reviewed from
                  any device using its decentralized storage reference.
                </p>
              </div>
              <StatusBadge status="Work Submitted" compact />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                  Proof CID
                </p>
                <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                  {currentRemoteProof.proof_cid}
                </p>
              </div>
              <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                  File name
                </p>
                <p className="mt-2 text-sm font-bold text-[#101d25]">
                  {currentRemoteProof.file_name ?? "Proof file"}
                </p>
              </div>
              <a
                href={currentRemoteProof.proof_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-violet-300/25 bg-violet-300/[0.08] p-4 text-sm font-black text-[#7c3aed] underline md:col-span-2"
              >
                Open pinned proof
              </a>
            </div>

            {currentRemoteProof.ai_review ? (
              <div className="mt-6 rounded-3xl border border-violet-300/20 bg-[#241642] p-5 text-white">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">
                  AI Proof Review
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      SealTrust Score
                    </p>
                    <p className="mt-2 text-4xl font-black text-white">
                      {currentRemoteProof.ai_review.score}/100
                    </p>
                    <p className="mt-2 text-sm font-bold text-violet-100">
                      {currentRemoteProof.ai_review.verdict ??
                        currentRemoteProof.ai_review.status}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-black text-white">
                      {currentRemoteProof.ai_review.status}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {currentRemoteProof.ai_review.summary ??
                        "AI reviewed the uploaded proof for relevance."}
                    </p>
                    {currentRemoteProof.ai_review.reasons.length ? (
                      <ul className="mt-4 grid gap-2 text-sm text-slate-200">
                        {currentRemoteProof.ai_review.reasons.map((reason) => (
                          <li key={reason}>- {reason}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        ) : !deal ? (
          <article className="mt-6 glass-panel rounded-3xl p-6 text-center">
            <h2 className="text-2xl font-black text-[#1e1233]">
              No public proof found
            </h2>
            <p className="mt-3 text-[#53606a]">
              Enter a deal ID from your dashboard after a deal has been created.
            </p>
          </article>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="glass-panel h-fit rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-[#7c3aed]">
                    Deal ID
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-[#1e1233]">
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
                  <p className="mt-2 text-2xl font-black text-[#1e1233]">
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
                    On-chain Record
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {deal.createdTxHash
                      ? formatWallet(deal.createdTxHash)
                      : "Blockchain record will appear after confirmation."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Proof CID
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {deal.proof ? deal.proof.fileHash : "Pending proof"}
                  </p>
                </div>
                {deal.proof?.gatewayUrl ? (
                  <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Decentralized Storage
                    </p>
                    <a
                      href={deal.proof.gatewayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-sm font-bold text-[#7c3aed] underline"
                    >
                      Open pinned proof
                    </a>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
                    Latest On-chain Record
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#101d25]">
                    {latestTxHash
                      ? formatWallet(latestTxHash)
                      : "Blockchain record will appear after confirmation."}
                  </p>
                  {latestTxHash ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(latestTxHash);
                          setCopyMessage("Transaction hash copied.");
                        }}
                        className="secondary-button px-3 py-2 text-xs"
                      >
                        <Copy className="size-3.5" />
                        Copy Transaction Hash
                      </button>
                      <a
                        href={getExplorerTxUrl(latestTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="primary-button px-3 py-2 text-xs"
                      >
                        View Blockchain Record
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#6d28d9]">
                  <ShieldCheck className="size-4" />
                  Smart Contract Escrow
                </div>
                <p className="mt-2 text-sm leading-6 text-[#43474b]">
                  Deal events include transaction references for independent
                  verification.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#6d28d9]">
                  <Fingerprint className="size-4" />
                  AI explorer signals
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[#43474b]">
                  <p>
                    AI risk score:{" "}
                    <span className="font-black text-[#1e1233]">
                      {deal.risk.score}/100
                    </span>
                  </p>
                  <p>
                    AI proof review:{" "}
                    <span className="font-black text-[#1e1233]">
                      {proofReview?.status ?? "Pending proof submission"}
                    </span>
                  </p>
                  {proofReview ? (
                    <>
                      <p>
                        AI review score:{" "}
                        <span className="font-black text-[#1e1233]">
                          {proofReview.score}/100
                        </span>
                      </p>
                      <p>
                        AI verdict:{" "}
                        <span className="font-black text-[#1e1233]">
                          {proofReview.verdict ?? proofReview.status}
                        </span>
                      </p>
                      {proofReview.summary ? (
                        <p>
                          AI summary:{" "}
                          <span className="font-semibold">
                            {proofReview.summary}
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
                <p className="mb-5 text-sm font-black uppercase tracking-normal text-[#7c3aed]">
                  Deal status
                </p>
                <DealStatusTracker deal={deal} dark />
              </div>
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-normal text-emerald-700">
                  Timeline
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#1e1233]">
                  Blockchain Proof Trail
                </h2>
              </div>
              <Timeline events={deal.timeline} explorerMode />
            </section>
          </div>
        )}
      </section>
      <Toast message={copyMessage} onClose={() => setCopyMessage("")} />
    </main>
  );
}
