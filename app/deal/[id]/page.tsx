"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
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
import {
  analyzeWorkProof,
  generateDisputeSummary,
  reviewProof,
  summarizeDispute,
} from "@/lib/aiEngine";
import { demoModeNotice, roles, type Deal, type Role } from "@/lib/mockData";
import { saveProofToSupabase } from "@/lib/proofs";
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

function getActionHelper(deal: Deal, activeRole: Role) {
  if (activeRole === "Client") {
    if (deal.status === "Created") return "Lock payment first so the freelancer can submit work.";
    if (deal.status !== "Work Submitted") return "Submit proof before client can approve.";
    return "Review the proof and AI notes before approving release.";
  }

  if (activeRole === "Freelancer") {
    if (deal.status !== "Payment Locked") return "Lock payment first before freelancer can submit work.";
    return "Submit proof with a note, file name, and preview URL for AI-assisted review.";
  }

  if (deal.status !== "Disputed") return "Only disputed deals can be resolved by Admin/Judge.";
  return "AI assists the review. Final decision stays with human admin/judge.";
}

function getFinalFileName(deal: Deal) {
  return deal.finalFileName ?? deal.proof?.finalFileName ?? deal.proof?.fileName ?? "final-deliverable.zip";
}

function getPreviewUrl(deal: Deal) {
  return deal.previewUrl ?? deal.proof?.previewUrl ?? "";
}

function isVisualPreview(deal: Deal) {
  const fileName = getFinalFileName(deal).toLowerCase();
  return (
    deal.deliverableType === "Design" ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].some((extension) =>
      fileName.endsWith(extension),
    )
  );
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

  async function handleSubmitProof(values: ProofFormValues) {
    if (!deal) return;
    const txHash = makeTxHash();
    const fileHash = values.proofCid || makeFileHash();
    const aiProofReview = analyzeWorkProof({
      originalDescription: deal.description,
      deliverableType: values.deliverableType,
      proofTitle: values.title,
      proofNote: values.note,
      fileName: values.finalFileName,
      previewUrl: values.previewUrl,
    });
    const fileReview = reviewProof(values.finalFileName, deal.title);

    const mergedAiReview = {
      ...aiProofReview,
      score: Math.round((aiProofReview.score + fileReview.score) / 2),
      verdict: fileReview.verdict,
      issues: fileReview.issues,
      summary: fileReview.summary,
    };

    await saveProofToSupabase({
      dealId: deal.id,
      proofCid: fileHash,
      proofUrl: values.proofGatewayUrl,
      fileName: values.uploadedFileName,
      aiReview: mergedAiReview,
    });

    updateDeal(deal.id, (current) => ({
      ...current,
      status: "Work Submitted",
      deliverableType: values.deliverableType,
      previewUrl: values.previewUrl,
      finalFileName: values.finalFileName,
      proof: {
        title: values.title,
        note: values.note,
        fileName: values.finalFileName,
        finalFileName: values.finalFileName,
        deliverableType: values.deliverableType,
        previewUrl: values.previewUrl,
        fileHash,
        gatewayUrl: values.proofGatewayUrl,
        storageProvider: values.storageProvider,
        txHash,
        submittedAt: new Date().toISOString(),
      },
      aiProofReview: mergedAiReview,
      timeline: [
        ...current.timeline,
        makeTimelineEvent({
          title: "Proof uploaded to IPFS",
          description: `${values.title} uploaded to Pinata IPFS with proof CID ${fileHash}.`,
          status: "Work Submitted",
          actor: "Freelancer",
          txHash,
        }),
      ],
    }));
  }

  function handleRaiseDispute(values: DisputeFormValues) {
    if (!deal) return;
    updateDeal(deal.id, (current) => {
      const aiDispute = generateDisputeSummary(values.reason, current.proof?.fileHash);
      const nextTimeline = [
        ...current.timeline,
        makeTimelineEvent({
          title: "Dispute raised",
          description: values.reason,
          status: "Disputed",
          actor: "Client",
          txHash: makeTxHash(),
        }),
      ];

      return {
        ...current,
        status: "Disputed",
        disputeReason: values.reason,
        disputeEvidence: values.evidence,
        aiDisputeSummary: `${aiDispute.summary} ${summarizeDispute({
          deal: current,
          disputeReason: values.reason,
          disputeEvidence: values.evidence,
          timeline: nextTimeline,
        })}`,
        aiDisputeRecommendation: aiDispute.recommendation,
        timeline: nextTimeline,
      };
    });
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
      <main className="page-shell grid-bg">
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
    <main className="page-shell grid-bg">
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
                  <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                    Approval Evidence Vault - {deal.id}
                  </p>
                  <h1 className="mt-3 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
                    Evidence Vault
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
                    <span className="font-black text-[#010b13]">{deal.title}</span> -{" "}
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
                  <p className="text-sm font-bold text-[#6e208c]">Escrow hash</p>
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
                    <p className="text-xs font-bold uppercase tracking-normal text-[#74777b]">
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
                  <p className="text-sm font-black uppercase tracking-normal text-emerald-700">
                    Deliverable Lock
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-[#010b13]">
                    {isDeliverableUnlocked
                      ? "Payment released. Full deliverable unlocked."
                      : "Full deliverable is locked until payment release."}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#53606a]">
                    No platform can fully prevent screenshots, but SealPay reduces misuse
                    through watermarked previews, locked final files, blockchain proof,
                    and reputation penalties.
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black",
                    isDeliverableUnlocked
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#010b13] text-white",
                  )}
                >
                  {isDeliverableUnlocked ? (
                    <UnlockKeyhole className="size-4" />
                  ) : (
                    <FileLock2 className="size-4" />
                  )}
                  {isDeliverableUnlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="relative min-h-80 overflow-hidden rounded-3xl border border-[#101d25]/10 bg-[#eaf6fa]">
                  {getPreviewUrl(deal) && isVisualPreview(deal) ? (
                    <div
                      className={cn(
                        "absolute inset-0 bg-cover bg-center transition",
                        !isDeliverableUnlocked && "blur-[2px] saturate-75",
                      )}
                      style={{ backgroundImage: `url("${getPreviewUrl(deal)}")` }}
                    />
                  ) : (
                    <div
                      className={cn(
                        "absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#ffffff,#dffdf5,#e7f8ff,#f9d8ff)] p-8 text-center transition",
                        !isDeliverableUnlocked && "blur-[1px]",
                      )}
                    >
                      <div>
                        <FileLock2 className="mx-auto size-12 text-[#00677f]" />
                        <p className="mt-4 text-xl font-black text-[#010b13]">
                          Protected preview only
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#53606a]">
                          {deal.proof?.title ?? "Submit proof to show a protected preview."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(1,11,19,0.08)_0,rgba(1,11,19,0.08)_1px,transparent_1px,transparent_18px)]" />
                  {!isDeliverableUnlocked ? (
                    <div className="absolute inset-0 bg-white/20" />
                  ) : null}
                  <div className="absolute inset-0 grid place-items-center p-5">
                    <div className="rounded-2xl border border-white/60 bg-white/72 p-5 text-center shadow-xl backdrop-blur-md">
                      <p className="text-lg font-black text-[#010b13]">
                        SealPay Protected Preview
                      </p>
                      <p className="mt-2 font-mono text-sm font-black text-[#00677f]">
                        Deal ID: {deal.id}
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-[#43474b]">
                        Client: {formatWallet(deal.clientWallet)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#101d25]/10 bg-white/70 p-5">
                  <p className="text-sm font-black text-[#00677f]">Final file</p>
                  <p className="mt-2 break-all font-mono text-sm font-black text-[#010b13]">
                    {getFinalFileName(deal)}
                  </p>
                  <div className="mt-5 grid gap-3 text-sm text-[#43474b]">
                    <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                      <p className="font-bold">Deliverable type</p>
                      <p className="mt-1">{deal.proof?.deliverableType ?? deal.deliverableType}</p>
                    </div>
                    <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                      <p className="font-bold">Proof hash</p>
                      <p className="mt-1 font-mono">
                        {deal.proof ? formatWallet(deal.proof.fileHash) : "pending"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                      <p className="font-bold">IPFS gateway</p>
                      {deal.proof?.gatewayUrl ? (
                        <a
                          href={deal.proof.gatewayUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-[#00677f] underline"
                        >
                          {deal.proof.storageProvider === "mock-pinata"
                            ? "Mock CID preview"
                            : "Open pinned proof"}
                        </a>
                      ) : (
                        <p className="mt-1">pending</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isDeliverableUnlocked}
                    className={cn(
                      "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition",
                      isDeliverableUnlocked
                        ? "bg-black text-white hover:bg-[#00677f]"
                        : "cursor-not-allowed border border-[#101d25]/10 bg-[#f2f4f6] text-[#74777b]",
                    )}
                  >
                    <Download className="size-4" />
                    Download Final Deliverable
                  </button>
                  <p className="mt-4 text-sm font-bold leading-6 text-[#53606a]">
                    {isDeliverableUnlocked
                      ? "Payment released. Full deliverable unlocked."
                      : "Full deliverable is locked until payment release."}
                  </p>
                </div>
              </div>
            </article>

            {deal.aiProofReview ? (
              <article className="glass-panel rounded-3xl p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                      AI Trust Engine
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-[#010b13]">
                      AI Proof Review
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#53606a]">
                      AI assists the review. Final decision stays with human admin/judge.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-5 py-4 text-right">
                    <p className="text-sm font-black text-[#00566a]">
                      {deal.aiProofReview.status}
                    </p>
                    <p className="mt-1 text-3xl font-black text-[#010b13]">
                      {deal.aiProofReview.score}/100
                    </p>
                    {deal.aiProofReview.verdict ? (
                      <p className="mt-1 text-xs font-black text-[#43474b]">
                        {deal.aiProofReview.verdict}
                      </p>
                    ) : null}
                  </div>
                </div>
                {deal.aiProofReview.summary ? (
                  <p className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-50 p-4 text-sm font-bold leading-6 text-[#43474b]">
                    {deal.aiProofReview.summary}
                  </p>
                ) : null}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {deal.aiProofReview.reasons.map((reason) => (
                    <div
                      key={reason}
                      className="rounded-2xl border border-[#101d25]/10 bg-white/65 p-4 text-sm font-bold leading-6 text-[#43474b]"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            <article className="glass-panel rounded-3xl p-6 sm:p-8">
              <h2 className="text-3xl font-black text-[#010b13]">
                On-chain Proof Trail
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#53606a]">{demoModeNotice}</p>
              <div className="mt-6">
                <Timeline events={deal.timeline} />
              </div>
            </article>
          </section>

          <aside className="space-y-5">
            <div className="glass-panel rounded-[2rem] p-5">
              <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
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
                        ? "border-black bg-black text-white"
                        : "border-[#101d25]/10 bg-white/70 text-[#43474b] hover:bg-[#f2f4f6]",
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#010b13] p-5 text-white shadow-2xl shadow-cyan-950/20">
              <p className="text-sm font-black uppercase tracking-normal text-cyan-100">
                Smart Contract
              </p>
              <h2 className="mt-2 text-2xl font-black">Escrow Actions</h2>
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
              <p className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm leading-6 text-white/70">
                {getActionHelper(deal, activeRole)}
              </p>
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
                {deal.aiDisputeSummary ? (
                  <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-50 p-4">
                    <p className="text-sm font-black text-[#00566a]">
                      AI Dispute Summary
                    </p>
                    <p className="mt-2 text-xs font-bold text-[#43474b]">
                      AI assists the review. Final decision stays with human admin/judge.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#43474b]">
                      {deal.aiDisputeSummary}
                    </p>
                    {deal.aiDisputeRecommendation ? (
                      <p className="mt-3 text-sm font-black leading-6 text-[#010b13]">
                        Recommendation: {deal.aiDisputeRecommendation}
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
        defaultDeliverableType={deal.deliverableType}
        dealId={deal.id}
      />
      <DisputeModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSubmit={handleRaiseDispute}
      />
    </main>
  );
}
