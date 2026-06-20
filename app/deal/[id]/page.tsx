"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileLock2,
  FileUp,
  Fingerprint,
  ListChecks,
  LockKeyhole,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  TriangleAlert,
  UnlockKeyhole,
} from "lucide-react";
import DisputeModal, {
  type DisputeFormValues,
} from "@/components/DisputeModal";
import ApplicationsList from "@/components/ApplicationsList";
import ApplyDealButton from "@/components/ApplyDealButton";
import DealStatusTracker from "@/components/DealStatusTracker";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import StatusBadge from "@/components/StatusBadge";
import SubmitProofModal, {
  type ProofFormValues,
} from "@/components/SubmitProofModal";
import Timeline from "@/components/Timeline";
import Toast from "@/components/Toast";
import TransactionPending, {
  type TransactionUiPhase,
} from "@/components/TransactionPending";
import TransactionSuccess from "@/components/TransactionSuccess";
import {
  approveWork as approveWorkOnChain,
  lockPayment,
  submitProofCID,
} from "@/lib/blockchain";
import { useDashboardMode } from "@/lib/dashboardMode";
import { type Deal, type Role } from "@/lib/mockData";
import { saveProofToSupabase } from "@/lib/proofs";
import { useSealPay } from "@/lib/store";
import { useWallet } from "@/lib/wallet";
import {
  cn,
  formatAmount,
  formatDate,
  formatWallet,
  makeFileHash,
  makeTimelineEvent,
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

type DealViewerRole = Role | "Public Viewer";

function getActionHelper(deal: Deal, activeRole: DealViewerRole) {
  if (activeRole === "Public Viewer") {
    return "This wallet is not a participant in the deal. The proof timeline remains available as a read-only public record.";
  }

  if (activeRole === "Client") {
    if (deal.status === "Created")
      return "Lock payment first so the freelancer can submit work.";
    if (deal.status !== "Work Submitted")
      return "Submit proof before client can approve.";
    return "Review the proof and AI notes before approving release.";
  }

  if (activeRole === "Freelancer") {
    if (deal.status !== "Payment Locked")
      return "Lock payment first before freelancer can submit work.";
    return "Submit proof with a note, file name, and preview URL for AI-assisted review.";
  }

  if (deal.status !== "Disputed")
    return "Only disputed deals can be resolved by Admin/Judge.";
  return "AI assists the review. Final decision stays with human admin/judge.";
}

function getFinalFileName(deal: Deal) {
  return (
    deal.finalFileName ??
    deal.proof?.finalFileName ??
    deal.proof?.fileName ??
    "final-deliverable.zip"
  );
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

async function requestProofReview(
  deal: Deal,
  values: ProofFormValues,
  proofCid: string,
) {
  const response = await fetch("/api/ai/proof-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dealTitle: deal.title,
      dealDescription: deal.description,
      deliverableType: values.deliverableType,
      proofTitle: values.title,
      proofNote: values.note,
      fileName: values.finalFileName,
      previewUrl: values.previewUrl,
      proofCid,
      proofUrl: values.proofGatewayUrl,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.details
        ? `AI proof review failed: ${result.error ?? "Groq request failed."} ${result.details}`
        : (result.error ??
            "AI proof review failed. Check GROQ_API_KEY and try again."),
    );
  }

  return result;
}

async function requestDisputeSummary(
  deal: Deal,
  values: DisputeFormValues,
  timeline: Deal["timeline"],
) {
  const response = await fetch("/api/ai/dispute-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dealTitle: deal.title,
      dealDescription: deal.description,
      clientName: deal.clientName,
      freelancerName: deal.freelancerName,
      reason: values.reason,
      evidence: values.evidence,
      proofCid: deal.proof?.fileHash,
      proofUrl: deal.proof?.gatewayUrl,
      timeline: timeline.map(({ title, status, actor, timestamp }) => ({
        title,
        status,
        actor,
        timestamp,
      })),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.details
        ? `AI dispute summary failed: ${result.error ?? "Groq request failed."} ${result.details}`
        : (result.error ??
            "AI dispute summary failed. Check GROQ_API_KEY and try again."),
    );
  }

  return result as {
    title: "AI Dispute Summary";
    summary: string;
    recommendation: string;
  };
}

export default function DealDetailsPage() {
  const params = useParams();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dealId = routeId ? decodeURIComponent(routeId) : "";
  const { deals, updateDeal } = useSealPay();
  const { address } = useWallet();
  const sessionMode = useDashboardMode();
  const [proofOpen, setProofOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [isLockingPayment, setIsLockingPayment] = useState(false);
  const [lockPaymentError, setLockPaymentError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [transactionResult, setTransactionResult] = useState<{
    type: "locked" | "released";
    txHash?: string;
  } | null>(null);
  const [transactionProgress, setTransactionProgress] = useState<{
    action: string;
    phase: TransactionUiPhase;
    txHash?: string;
  } | null>(null);
  const deal = deals.find((candidate) => candidate.id === dealId);
  const normalizedWallet = address.toLowerCase();
  const arbitratorWallet = (
    process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS ?? ""
  ).toLowerCase();
  const activeRole: DealViewerRole =
    !deal || !normalizedWallet
      ? "Public Viewer"
      : sessionMode === "client" &&
          deal.clientWallet.toLowerCase() === normalizedWallet
        ? "Client"
        : sessionMode === "freelancer" &&
            deal.freelancerWallet.toLowerCase() === normalizedWallet
          ? "Freelancer"
          : arbitratorWallet && arbitratorWallet === normalizedWallet
            ? "Admin/Judge"
            : "Public Viewer";

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("submit") === "work" &&
      activeRole === "Freelancer" &&
      deal?.status === "Payment Locked"
    ) {
      const timer = window.setTimeout(() => setProofOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeRole, deal?.status]);

  const isDeliverableUnlocked = useMemo(() => {
    if (!deal) return false;
    return (
      deal.status === "Payment Released" ||
      (deal.status === "Resolved" &&
        deal.resolution === "Released to freelancer")
    );
  }, [deal]);

  function appendStatusEvent(
    nextStatus: Deal["status"],
    title: string,
    description: string,
    actor: Role,
    txHash?: string,
    onChainDealId?: string,
  ) {
    if (!deal) return;
    updateDeal(deal.id, (current) => ({
      ...current,
      status: nextStatus,
      onChainDealId: onChainDealId ?? current.onChainDealId,
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

  async function handleLockPayment() {
    if (!deal) return;

    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
      setLockPaymentError(
        "Smart contract is not configured. Payment locking will be available after deployment configuration.",
      );
      return;
    }

    setIsLockingPayment(true);
    setLockPaymentError("");
    setTransactionProgress({ action: "Lock Payment", phase: "wallet" });

    try {
      const result = await lockPayment(
        deal.freelancerWallet,
        deal.amount,
        (phase, txHash) =>
          setTransactionProgress({
            action: "Lock Payment",
            phase: phase === "wallet" ? "wallet" : "confirming",
            txHash,
          }),
      );
      appendStatusEvent(
        "Payment Locked",
        "Payment locked",
        `${formatAmount(deal.amount)} locked in smart contract escrow.`,
        "Client",
        result.txHash,
        result.onChainDealId,
      );
      setTransactionResult({ type: "locked", txHash: result.txHash });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Payment could not be locked. Please try again.";
      setLockPaymentError(message);
    } finally {
      setTransactionProgress(null);
      setIsLockingPayment(false);
    }
  }

  async function handleApproveWork() {
    if (!deal) return;
    setActionError("");

    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || !deal.onChainDealId) {
      setActionError(
        "Blockchain deal record is not available yet. Approve and release will be enabled after the lock transaction is confirmed.",
      );
      return;
    }

    setTransactionProgress({
      action: "Approve & Release",
      phase: "wallet",
    });

    try {
      const result = await approveWorkOnChain(
        deal.onChainDealId,
        (phase, txHash) =>
          setTransactionProgress({
            action: "Approve & Release",
            phase: phase === "wallet" ? "wallet" : "confirming",
            txHash,
          }),
      );
      updateDeal(deal.id, (current) => ({
        ...current,
        status: "Payment Released",
        timeline: [
          ...current.timeline,
          makeTimelineEvent({
            title: "Work approved",
            description:
              "Client approved the submitted proof and authorized release.",
            status: "Approved",
            actor: "Client",
            txHash: result.txHash,
          }),
          makeTimelineEvent({
            title: "Payment released",
            description: `${formatAmount(current.amount)} released to the freelancer wallet.`,
            status: "Payment Released",
            actor: "System",
            txHash: result.txHash,
          }),
        ],
      }));
      setTransactionResult({ type: "released", txHash: result.txHash });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Payment release failed. Please try again.",
      );
    } finally {
      setTransactionProgress(null);
    }
  }

  function handleRejectDeal() {
    if (!deal) return;

    updateDeal(deal.id, (current) => ({
      ...current,
      freelancerName: "Unassigned",
      freelancerWallet: "",
      timeline: [
        ...current.timeline,
        makeTimelineEvent({
          title: "Assignment rejected",
          description: "Freelancer declined the wallet assignment.",
          status: current.status,
          actor: "Freelancer",
        }),
      ],
    }));
  }

  async function handleSubmitProof(values: ProofFormValues) {
    if (!deal) return;
    const fileHash = values.proofCid || makeFileHash();
    const aiProofReview = await requestProofReview(deal, values, fileHash);
    let txHash: string | undefined;

    if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && deal.onChainDealId) {
      setTransactionProgress({ action: "Submit Work", phase: "wallet" });
      try {
        const result = await submitProofCID(
          deal.onChainDealId,
          fileHash,
          (phase, submittedHash) =>
            setTransactionProgress({
              action: "Submit Work",
              phase: phase === "wallet" ? "wallet" : "confirming",
              txHash: submittedHash,
            }),
        );
        txHash = result.txHash;
      } finally {
        setTransactionProgress(null);
      }
    }

    await saveProofToSupabase({
      dealId: deal.id,
      proofCid: fileHash,
      proofUrl: values.proofGatewayUrl,
      fileName: values.uploadedFileName,
      aiReview: aiProofReview,
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
      aiProofReview,
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
    setActionMessage("Work submitted successfully.");
  }

  async function handleRaiseDispute(values: DisputeFormValues) {
    if (!deal) return;
    const nextTimeline = [
      ...deal.timeline,
      makeTimelineEvent({
        title: "Dispute raised",
        description: values.reason,
        status: "Disputed",
        actor: "Client",
      }),
    ];
    const aiDispute = await requestDisputeSummary(deal, values, nextTimeline);

    updateDeal(deal.id, (current) => {
      return {
        ...current,
        status: "Disputed",
        disputeReason: values.reason,
        disputeEvidence: values.evidence,
        aiDisputeSummary: aiDispute.summary,
        aiDisputeRecommendation: aiDispute.recommendation,
        timeline: nextTimeline,
      };
    });
  }

  function handleResolveDispute(
    resolution: "Released to freelancer" | "Refunded client",
  ) {
    if (!deal) return;
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
        }),
      ],
    }));
  }

  if (!deal) {
    return (
      <RoleGuard allow={["client", "freelancer"]}>
        <main className="page-shell grid-bg">
          <Navbar />
          <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h1 className="text-4xl font-black text-[#010b13]">
              Deal not found
            </h1>
            <p className="mt-4 text-[#53606a]">
              The local demo store does not have a deal with ID {dealId}.
            </p>
            <Link href="/dashboard" className="primary-button mt-8">
              Back to Dashboard
            </Link>
          </section>
        </main>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allow={["client", "freelancer"]}>
      <main className="page-shell grid-bg">
        <Navbar />
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="secondary-button px-4 py-2 text-sm"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <Link
              href={proofPath(deal.id)}
              className="secondary-button px-4 py-2 text-sm"
            >
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
                      <span className="font-black text-[#010b13]">
                        {deal.title}
                      </span>{" "}
                      - {deal.description}
                    </p>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>

                <div className="mt-8 rounded-3xl border border-[#101d25]/10 bg-white/65 p-5">
                  <DealStatusTracker deal={deal} dark />
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                    <p className="text-sm font-bold text-emerald-800">
                      Amount locked
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#010b13]">
                      {formatAmount(deal.amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                    <p className="text-sm font-bold text-[#00566a]">
                      Risk score
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#010b13]">
                      {deal.risk.score}/100
                    </p>
                  </div>
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
                    <p className="text-sm font-bold text-[#6e208c]">
                      Escrow hash
                    </p>
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

              {activeRole === "Client" && deal.dealKind === "Public" ? (
                <ApplicationsList deals={[deal]} dark />
              ) : null}

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
                      No platform can fully prevent screenshots, but SealPay
                      reduces misuse through watermarked previews, locked final
                      files, blockchain proof, and reputation penalties.
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
                        style={{
                          backgroundImage: `url("${getPreviewUrl(deal)}")`,
                        }}
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
                            {deal.proof?.title ??
                              "Submit proof to show a protected preview."}
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
                    <p className="text-sm font-black text-[#00677f]">
                      Final file
                    </p>
                    <p className="mt-2 break-all font-mono text-sm font-black text-[#010b13]">
                      {getFinalFileName(deal)}
                    </p>
                    <div className="mt-5 grid gap-3 text-sm text-[#43474b]">
                      <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                        <p className="font-bold">Deliverable type</p>
                        <p className="mt-1">
                          {deal.proof?.deliverableType ?? deal.deliverableType}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                        <p className="font-bold">Proof hash</p>
                        <p className="mt-1 font-mono">
                          {deal.proof
                            ? formatWallet(deal.proof.fileHash)
                            : "pending"}
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
                            Open pinned proof
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
                <article className="glass-panel overflow-hidden rounded-3xl">
                  <div className="border-b border-cyan-100/10 bg-white/[0.025] p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                          <Fingerprint className="size-4" />
                          AI Trust Engine
                        </p>
                        <h2 className="mt-4 text-3xl font-black text-white">
                          AI Proof Review
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                          Groq checks proof metadata against the deal scope. AI assists
                          the review; payment decisions stay with the client or judge.
                        </p>
                      </div>
                      <div className="min-w-48 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.08] p-5 text-right shadow-2xl shadow-cyan-950/20">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                          SealTrust Score
                        </p>
                        <p className="mt-2 text-5xl font-black text-white">
                          {deal.aiProofReview.score}
                          <span className="text-xl text-slate-400">/100</span>
                        </p>
                        <p className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
                          {deal.aiProofReview.verdict ?? deal.aiProofReview.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-[1fr_0.85fr]">
                    <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.055] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                        Review Summary
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                        {deal.aiProofReview.summary ??
                          "AI reviewed the uploaded proof for relevance to the deal."}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Status
                      </p>
                      <p className="mt-3 text-lg font-black text-cyan-200">
                        {deal.aiProofReview.status}
                      </p>
                      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Proof CID
                      </p>
                      <p className="mt-2 break-all font-mono text-xs font-bold text-slate-300">
                        {deal.proof?.fileHash ?? "pending"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 px-6 pb-6 sm:px-8 sm:pb-8 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-2 text-sm font-black text-white">
                        <ListChecks className="size-4 text-cyan-300" />
                        Reasons
                      </div>
                      <div className="mt-4 grid gap-3">
                        {deal.aiProofReview.reasons.map((reason) => (
                          <p
                            key={reason}
                            className="rounded-2xl border border-white/8 bg-black/15 p-3 text-sm font-semibold leading-6 text-slate-300"
                          >
                            {reason}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.06] p-5">
                      <div className="flex items-center gap-2 text-sm font-black text-amber-100">
                        <TriangleAlert className="size-4" />
                        Issues To Check
                      </div>
                      <div className="mt-4 grid gap-3">
                        {deal.aiProofReview.issues?.length ? (
                          deal.aiProofReview.issues.map((issue) => (
                            <p
                              key={issue}
                              className="rounded-2xl border border-amber-200/10 bg-black/15 p-3 text-sm font-semibold leading-6 text-amber-100"
                            >
                              {issue}
                            </p>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-amber-200/10 bg-black/15 p-3 text-sm font-semibold leading-6 text-amber-100">
                            No major issues returned by AI. The client should still verify the proof manually.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}

              <article className="glass-panel rounded-3xl p-6 sm:p-8">
                <h2 className="text-3xl font-black text-[#010b13]">
                  On-chain Proof Trail
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#53606a]">
                  Deal events, proof records, and transaction references remain
                  visible for independent verification.
                </p>
                <div className="mt-6">
                  <Timeline events={deal.timeline} />
                </div>
              </article>
            </section>

            <aside className="space-y-5">
              <div className="glass-panel rounded-[2rem] p-5">
                <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                  Wallet role
                </p>
                <div className="mt-4 rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
                  <p className="text-sm font-black text-[#010b13]">
                    {activeRole === "Admin/Judge" ? "Arbitrator" : activeRole}
                  </p>
                  <p className="mt-2 font-mono text-xs text-[#74777b]">
                    {address
                      ? formatWallet(address)
                      : "Connect a wallet to detect your role"}
                  </p>
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
                      onClick={handleLockPayment}
                      disabled={deal.status !== "Created" || isLockingPayment}
                      className="primary-button"
                    >
                      <LockKeyhole className="size-4" />
                      {isLockingPayment ? "Locking..." : "Lock Payment"}
                    </button>
                    {lockPaymentError && deal.status === "Created" ? (
                      <div className="rounded-2xl border border-red-300/30 bg-red-400/10 p-3">
                        <p className="text-sm font-bold leading-6 text-red-100">
                          {lockPaymentError}
                        </p>
                      </div>
                    ) : null}
                    {actionError ? (
                      <p className="rounded-2xl border border-red-300/30 bg-red-400/10 p-3 text-sm font-bold leading-6 text-red-100">
                        {actionError}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleApproveWork()}
                      disabled={deal.status !== "Work Submitted"}
                      className="primary-button"
                    >
                      <CheckCircle2 className="size-4" />
                      Approve & Release
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
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          appendStatusEvent(
                            deal.status,
                            "Deal accepted",
                            "Freelancer accepted the wallet assignment.",
                            "Freelancer",
                          )
                        }
                        disabled={
                          !(
                            [
                              "Created",
                              "Assigned",
                              "Payment Locked",
                            ] as Deal["status"][]
                          ).includes(deal.status)
                        }
                        className="secondary-button"
                      >
                        <CheckCircle2 className="size-4" />
                        Accept Deal
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectDeal}
                        disabled={
                          !(
                            [
                              "Created",
                              "Assigned",
                              "Payment Locked",
                            ] as Deal["status"][]
                          ).includes(deal.status)
                        }
                        className="danger-button"
                      >
                        <RotateCcw className="size-4" />
                        Reject Deal
                      </button>
                      <button
                        type="button"
                        onClick={() => setProofOpen(true)}
                        disabled={deal.status !== "Payment Locked"}
                        className="primary-button"
                      >
                        <FileUp className="size-4" />
                        Submit Work
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisputeOpen(true)}
                        disabled={["Payment Released", "Resolved"].includes(
                          deal.status,
                        )}
                        className="danger-button"
                      >
                        <Scale className="size-4" />
                        Raise Dispute
                      </button>
                    </>
                  ) : null}

                  {activeRole === "Admin/Judge" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveDispute("Released to freelancer")
                        }
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

                  {activeRole === "Public Viewer" ? (
                    deal.dealKind === "Public" && deal.status === "Created" ? (
                      <ApplyDealButton deal={deal} wallet={address} />
                    ) : (
                      <Link
                        href={`/proof/${deal.id}`}
                        className="secondary-button border-white/15 bg-white/5 text-white"
                      >
                        <Fingerprint className="size-4" />
                        View Proof Timeline
                      </Link>
                    )
                  ) : null}
                </div>
                <p className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm leading-6 text-white/70">
                  {getActionHelper(deal, activeRole)}
                </p>
              </div>

              <div className="soft-panel rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-sm font-black ${riskTone(deal.risk.level)}`}
                  >
                    {deal.risk.level}
                  </span>
                  <span className="text-2xl font-black text-[#010b13]">
                    {deal.risk.score}
                  </span>
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
                  <h2 className="text-xl font-black text-[#010b13]">
                    Dispute notes
                  </h2>
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
                        AI assists the review. Final decision stays with human
                        admin/judge.
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
                <h2 className="text-xl font-black text-[#010b13]">
                  Public proof
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#53606a]">
                  Share the proof route to show the deal timeline like a
                  lightweight block explorer.
                </p>
                <Link
                  href={proofPath(deal.id)}
                  className="secondary-button mt-4 w-full"
                >
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
        {transactionProgress ? (
          <TransactionPending
            action={transactionProgress.action}
            phase={transactionProgress.phase}
            txHash={transactionProgress.txHash}
          />
        ) : null}
        {transactionResult ? (
          <TransactionSuccess
            type={transactionResult.type}
            amount={deal.amount}
            dealTitle={deal.title}
            freelancerWallet={deal.freelancerWallet}
            txHash={transactionResult.txHash}
            onClose={() => setTransactionResult(null)}
          />
        ) : null}
        <Toast message={actionMessage} onClose={() => setActionMessage("")} />
      </main>
    </RoleGuard>
  );
}
