"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileLock2,
  FileUp,
  LockKeyhole,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  UnlockKeyhole,
} from "lucide-react";
import DisputeModal, { type DisputeFormValues } from "@/components/DisputeModal";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import SubmitProofModal, { type ProofFormValues } from "@/components/SubmitProofModal";
import Timeline from "@/components/Timeline";
import { demoModeNotice, roles, type Deal, type Role } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import {
  cn,
  formatAmount,
  formatDate,
  formatWallet,
  makeFileHash,
  makeTimelineEvent,
  makeTxHash,
  proofPath,
  riskTone,
} from "@/lib/utils";

function detailRows(deal: Deal) {
  return [
    ["Client", deal.clientName],
    ["Client wallet", formatWallet(deal.clientWallet)],
    ["Freelancer", deal.freelancerName],
    ["Freelancer wallet", formatWallet(deal.freelancerWallet)],
    ["Deadline", formatDate(deal.deadline)],
    ["Deliverable", deal.deliverableType],
  ];
}

export default function DealDetailsPage() {
  const params = useParams();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dealId = routeId ? decodeURIComponent(routeId) : "";
  const { deals, activeRole, setActiveRole, updateDeal } = useSealPay();
  const [proofOpen, setProofOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const deal = deals.find((candidate) => candidate.id === dealId);

  const isDeliverableUnlocked = useMemo(() => {
    if (!deal) return false;
    return (
      deal.status === "Payment Released" ||
      (deal.status === "Resolved" && deal.resolution === "Released to freelancer")
    );
  }, [deal]);

  function appendStatusEvent(
    nextStatus: Deal["status"],
    title: string,
    description: string,
    actor: Role,
  ) {
    if (!deal) return;
    const txHash = makeTxHash();
    updateDeal(deal.id, (current) => ({
      ...current,
      status: nextStatus,
      timeline: [
        ...current.timeline,
        makeTimelineEvent({
          title,
          description,
          status: nextStatus,
          actor,
          txHash,
        }),
      ],
    }));
  }

  function handleApproveWork() {
    if (!deal) return;
    const approvalTx = makeTxHash();
    const releaseTx = makeTxHash();
    updateDeal(deal.id, (current) => ({
      ...current,
      status: "Payment Released",
      timeline: [
        ...current.timeline,
        makeTimelineEvent({
          title: "Work approved",
          description: "Client approved the submitted proof and authorized release.",
          status: "Approved",
          actor: "Client",
          txHash: approvalTx,
        }),
        makeTimelineEvent({
          title: "Payment released",
          description: `${formatAmount(current.amount)} released to the freelancer wallet.`,
          status: "Payment Released",
          actor: "System",
          txHash: releaseTx,
        }),
      ],
    }));
  }

  function handleSubmitProof(values: ProofFormValues) {
    if (!deal) return;
    const txHash = makeTxHash();
    const fileHash = makeFileHash();
    updateDeal(deal.id, (current) => ({
      ...current,
      status: "Work Submitted",
      proof: {
        title: values.title,
        note: values.note,
        fileName: values.fileName,
        previewUrl: values.previewUrl,
        fileHash,
        txHash,
        submittedAt: new Date().toISOString(),
      },
      timeline: [
        ...current.timeline,
        makeTimelineEvent({
          title: "Work proof submitted",
          description: `${values.title} submitted with file hash ${fileHash}.`,
          status: "Work Submitted",
          actor: "Freelancer",
          txHash,
        }),
      ],
    }));
  }

  function handleRaiseDispute(values: DisputeFormValues) {
    if (!deal) return;
    appendStatusEvent(
      "Disputed",
      "Dispute raised",
      values.reason,
      "Client",
    );
    updateDeal(deal.id, (current) => ({
      ...current,
      disputeReason: values.reason,
      disputeEvidence: values.evidence,
    }));
  }

  function handleResolveDispute(resolution: "Released to freelancer" | "Refunded client") {
    if (!deal) return;
    const txHash = makeTxHash();
    updateDeal(deal.id, (current) => ({
      ...current,
      status: "Resolved",
      resolution,
      timeline: [
        ...current.timeline,
        makeTimelineEvent({
          title: "Dispute resolved",
          description:
            resolution === "Released to freelancer"
              ? "Admin judge resolved the dispute and released payment to the freelancer."
              : "Admin judge resolved the dispute and marked funds as refunded to client.",
          status: "Resolved",
          actor: "Admin/Judge",
          txHash,
        }),
      ],
    }));
  }

  if (!deal) {
    return (
      <main className="page-shell">
        <Navbar />
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-black text-[#010b13]">Deal not found</h1>
          <p className="mt-4 text-[#53606a]">
            The local demo store does not have a deal with ID {dealId}.
          </p>
          <Link href="/dashboard" className="primary-button mt-8">
            Back to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="secondary-button px-4 py-2 text-sm">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <Link href={proofPath(deal.id)} className="secondary-button px-4 py-2 text-sm">
            Public Proof
            <ExternalLink className="size-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <section className="space-y-6">
            <article className="glass-panel rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.26em] text-[#00677f]">
                    {deal.id}
                  </p>
                  <h1 className="mt-3 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
                    {deal.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
                    {deal.description}
                  </p>
                </div>
                <StatusBadge status={deal.status} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                  <p className="text-sm font-bold text-emerald-800">Amount locked</p>
                  <p className="mt-2 text-3xl font-black text-[#010b13]">
                    {formatAmount(deal.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                  <p className="text-sm font-bold text-[#00566a]">Risk score</p>
                  <p className="mt-2 text-3xl font-black text-[#010b13]">{deal.risk.score}/100</p>
                </div>
                <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
                  <p className="text-sm font-bold text-[#6e208c]">Created tx</p>
                  <p className="mt-2 font-mono text-sm font-black text-[#010b13]">
                    {formatWallet(deal.createdTxHash)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {detailRows(deal).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#74777b]">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-[#101d25]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-panel rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.26em] text-emerald-700">
                    Deliverable Lock Demo
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-[#010b13]">
                    {isDeliverableUnlocked
                      ? "Full deliverable unlocked after payment release"
                      : "Full deliverable locked until payment release"}
                  </h2>
                </div>
                {isDeliverableUnlocked ? (
                  <UnlockKeyhole className="size-8 text-emerald-700" />
                ) : (
                  <FileLock2 className="size-8 text-[#00677f]" />
                )}
              </div>

              <div className="relative mt-6 overflow-hidden rounded-3xl border border-[#101d25]/10 bg-white/80">
                <div
                  className={cn(
                    "relative min-h-72 bg-[linear-gradient(135deg,#ffffff,#dffdf5,#e7f8ff,#f9d8ff)] p-6 transition",
                    !isDeliverableUnlocked && "blur-[1.5px]",
                  )}
                >
                  <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-2xl border border-white/70 bg-white/55 p-4 shadow-inner">
                      <div className="h-36 rounded-xl border border-cyan-200/25 bg-cyan-200/10" />
                      <p className="mt-4 font-black text-[#010b13]">
                        {deal.proof?.title ?? "Awaiting freelancer proof"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#101d25]/15 bg-white/60 p-5">
                      <p className="text-sm font-bold text-[#43474b]">Delivery note</p>
                      <p className="mt-3 leading-7 text-[#010b13]">
                        {deal.proof?.note ??
                          "Once work proof is submitted, this card shows a protected preview before release."}
                      </p>
                      <div className="mt-5 grid gap-3 text-sm text-[#43474b]">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2">
                          <span>File</span>
                          <span className="font-mono">
                            {deal.proof?.fileName ?? "locked-deliverable.zip"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2">
                          <span>Hash</span>
                          <span className="font-mono">
                            {deal.proof ? formatWallet(deal.proof.fileHash) : "pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {!isDeliverableUnlocked ? (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#010b13]/20">
                    <span className="rounded-full border border-white/30 bg-[#010b13]/82 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl">
                      Locked until release
                    </span>
                  </div>
                ) : null}
                <div className="border-t border-[#101d25]/10 bg-white/88 p-4">
                  <p className="text-sm font-bold text-[#43474b]">
                    {isDeliverableUnlocked
                      ? "Full deliverable unlocked after payment release"
                      : "Full deliverable locked until payment release"}
                  </p>
                </div>
              </div>
            </article>

            <article className="glass-panel rounded-3xl p-6 sm:p-8">
              <h2 className="text-3xl font-black text-[#010b13]">Proof timeline</h2>
              <p className="mt-2 text-sm leading-6 text-[#53606a]">{demoModeNotice}</p>
              <div className="mt-6">
                <Timeline events={deal.timeline} />
              </div>
            </article>
          </section>

          <aside className="space-y-5">
            <div className="glass-panel rounded-3xl p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#53606a]">
                Active role
              </p>
              <div className="mt-4 grid gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-black transition",
                      activeRole === role
                        ? "border-cyan-300/55 bg-cyan-300 text-slate-950"
                        : "border-[#101d25]/10 bg-white/70 text-[#43474b] hover:bg-[#f2f4f6]",
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-5">
              <h2 className="text-2xl font-black text-[#010b13]">Actions</h2>
              <div className="mt-5 grid gap-3">
                {activeRole === "Client" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        appendStatusEvent(
                          "Payment Locked",
                          "Payment locked",
                          `${formatAmount(deal.amount)} locked in mock escrow.`,
                          "Client",
                        )
                      }
                      disabled={deal.status !== "Created"}
                      className="primary-button"
                    >
                      <LockKeyhole className="size-4" />
                      Lock Payment
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveWork}
                      disabled={deal.status !== "Work Submitted"}
                      className="primary-button"
                    >
                      <CheckCircle2 className="size-4" />
                      Approve Work
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisputeOpen(true)}
                      disabled={["Payment Released", "Resolved"].includes(deal.status)}
                      className="danger-button"
                    >
                      <Scale className="size-4" />
                      Raise Dispute
                    </button>
                  </>
                ) : null}

                {activeRole === "Freelancer" ? (
                  <button
                    type="button"
                    onClick={() => setProofOpen(true)}
                    disabled={deal.status !== "Payment Locked"}
                    className="primary-button"
                  >
                    <FileUp className="size-4" />
                    Submit Work Proof
                  </button>
                ) : null}

                {activeRole === "Admin/Judge" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResolveDispute("Released to freelancer")}
                      disabled={deal.status !== "Disputed"}
                      className="primary-button"
                    >
                      <ShieldCheck className="size-4" />
                      Release Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveDispute("Refunded client")}
                      disabled={deal.status !== "Disputed"}
                      className="secondary-button"
                    >
                      <RotateCcw className="size-4" />
                      Refund Client
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="soft-panel rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full border px-3 py-1.5 text-sm font-black ${riskTone(deal.risk.level)}`}>
                  {deal.risk.level}
                </span>
                <span className="text-2xl font-black text-[#010b13]">{deal.risk.score}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-[#53606a]">
                {deal.risk.reasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-300" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {deal.disputeReason ? (
              <div className="soft-panel rounded-3xl p-5">
                <h2 className="text-xl font-black text-[#010b13]">Dispute notes</h2>
                <p className="mt-3 text-sm leading-6 text-amber-800">
                  {deal.disputeReason}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#53606a]">
                  {deal.disputeEvidence}
                </p>
                {deal.resolution ? (
                  <p className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm font-bold text-emerald-800">
                    Resolution: {deal.resolution}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="soft-panel rounded-3xl p-5">
              <h2 className="text-xl font-black text-[#010b13]">Public proof</h2>
              <p className="mt-2 text-sm leading-6 text-[#53606a]">
                Share the proof route to show the deal timeline like a lightweight block
                explorer.
              </p>
              <Link href={proofPath(deal.id)} className="secondary-button mt-4 w-full">
                <Send className="size-4" />
                Open Proof Page
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <SubmitProofModal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        onSubmit={handleSubmitProof}
      />
      <DisputeModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSubmit={handleRaiseDispute}
      />
    </main>
  );
}
