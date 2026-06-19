import type { Deal, DeliverableType, TimelineEvent } from "@/lib/mockData";
import {
  calculateRiskScore as calculateBaseRiskScore,
  type RiskInput,
} from "@/lib/riskScore";

export type ProofReviewStatus =
  | "Proof looks valid"
  | "Proof may be incomplete"
  | "Proof mismatch detected";

export interface MilestoneSuggestion {
  structure: string[];
  reason: string;
  warning?: string;
}

export interface ProofReview {
  status: ProofReviewStatus;
  score: number;
  reasons: string[];
  verdict?: "Looks valid" | "Needs manual review";
  issues?: string[];
  summary?: string;
}

export interface DisputeSummary {
  title: "AI Dispute Summary";
  summary: string;
  recommendation: string;
}

export interface SealTrustScore {
  score: number;
  completedDeals: number;
  disputesCount: number;
  trustLabel: "New" | "Reliable" | "Trusted" | "High Risk";
}

export function calculateRiskScore(input: RiskInput) {
  return calculateBaseRiskScore(input);
}

export function reviewProof(fileName: string, dealTitle: string) {
  const lowerFile = fileName.toLowerCase();
  const lowerDeal = dealTitle.toLowerCase();

  let score = 70;
  const issues: string[] = [];

  if (
    lowerFile.includes("final") ||
    lowerFile.includes("proof") ||
    lowerFile.includes("work")
  ) {
    score += 15;
  } else {
    issues.push("File name does not clearly indicate proof/final work.");
  }

  if (lowerDeal.includes("logo") && !lowerFile.includes("logo")) {
    score -= 15;
    issues.push("Uploaded file may not match logo-related deal.");
  }

  if (lowerDeal.includes("thumbnail") && !lowerFile.includes("thumbnail")) {
    score -= 10;
    issues.push("Uploaded file may not match thumbnail-related deal.");
  }

  const boundedScore = Math.min(100, Math.max(0, score));

  return {
    score: boundedScore,
    verdict: boundedScore >= 75 ? "Looks valid" : "Needs manual review",
    issues,
    summary:
      boundedScore >= 75
        ? "AI found the uploaded proof relevant and ready for client review."
        : "AI found possible mismatch. Client should manually verify before approval.",
  };
}

export function generateDisputeSummary(
  reason: string,
  proofCid?: string,
): DisputeSummary {
  return {
    title: "AI Dispute Summary",
    summary: `A dispute was raised because: ${reason}. ${
      proofCid
        ? `The submitted proof CID is ${proofCid}.`
        : "No proof CID is attached."
    } AI recommends human review before releasing payment.`,
    recommendation:
      "Compare deal requirements, submitted proof, and timeline before making final decision.",
  };
}

export function suggestMilestones({
  amount,
  deadline,
  description,
}: {
  amount: number;
  deadline: string;
  description: string;
}): MilestoneSuggestion {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const deadlineTime = new Date(deadline).getTime();
  const daysUntilDeadline = Number.isFinite(deadlineTime)
    ? Math.ceil((deadlineTime - Date.now()) / 86_400_000)
    : 0;
  const hasDetailedScope = description.trim().length >= 80;

  const structure =
    normalizedAmount < 0.75
      ? ["Single payment release after final proof approval"]
      : [
          "30% advance lock",
          "40% after draft/progress proof",
          "30% after final delivery",
        ];

  return {
    structure,
    reason:
      normalizedAmount < 0.75
        ? "For a small demo amount, one escrow release keeps the review simple."
        : hasDetailedScope
          ? "This deal has enough scope detail and value for milestone-based release."
          : "This value is high enough for milestones, but the scope should be clearer before locking funds.",
    warning:
      daysUntilDeadline > 0 && daysUntilDeadline <= 3
        ? "Deadline is short, so milestone review may be difficult."
        : undefined,
  };
}

function extractKeywords(text: string) {
  const stopWords = new Set([
    "after",
    "and",
    "before",
    "build",
    "create",
    "deal",
    "demo",
    "final",
    "for",
    "from",
    "into",
    "the",
    "this",
    "with",
    "work",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
}

function extensionMatchesType(fileName: string, deliverableType: DeliverableType) {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  const allowed: Record<DeliverableType, string[]> = {
    Design: ["fig", "sketch", "png", "jpg", "jpeg", "svg", "pdf", "zip"],
    Code: ["zip", "js", "jsx", "ts", "tsx", "html", "css", "json", "md"],
    Document: ["pdf", "doc", "docx", "md", "txt"],
    Video: ["mp4", "mov", "webm", "mkv"],
    Other: [],
  };

  return deliverableType === "Other" || allowed[deliverableType].includes(extension);
}

export function analyzeWorkProof({
  originalDescription,
  deliverableType,
  proofTitle,
  proofNote,
  fileName,
  previewUrl,
}: {
  originalDescription: string;
  deliverableType: DeliverableType;
  proofTitle: string;
  proofNote: string;
  fileName: string;
  previewUrl: string;
}): ProofReview {
  let score = 62;
  const reasons: string[] = [];
  const note = proofNote.trim();
  const title = proofTitle.trim();
  const file = fileName.trim();
  const preview = previewUrl.trim();

  if (!note || note.length < 24) {
    score -= 18;
    reasons.push("Delivery note is missing or too short.");
  } else {
    score += 8;
    reasons.push("Delivery note explains the submitted proof.");
  }

  if (!file) {
    score -= 18;
    reasons.push("File name is missing.");
  } else if (extensionMatchesType(file, deliverableType)) {
    score += 12;
    reasons.push("File type matches the expected deliverable.");
  } else {
    score -= 10;
    reasons.push("File type does not clearly match the deliverable type.");
  }

  if (!preview) {
    score -= 12;
    reasons.push("Preview URL is missing.");
  } else {
    score += 6;
    reasons.push("Preview link is attached for review.");
  }

  const descriptionKeywords = new Set(extractKeywords(originalDescription));
  const proofKeywords = extractKeywords(`${title} ${note} ${file}`);
  const overlap = proofKeywords.filter((word) => descriptionKeywords.has(word));

  if (overlap.length >= 2) {
    score += 12;
    reasons.push("Proof wording matches the original work description.");
  } else if (overlap.length === 1) {
    score += 5;
    reasons.push("Proof has a partial match with the work description.");
  } else {
    score -= 16;
    reasons.push("Proof content does not clearly match the original description.");
  }

  const boundedScore = Math.min(100, Math.max(0, score));
  const status: ProofReviewStatus =
    boundedScore >= 75
      ? "Proof looks valid"
      : boundedScore >= 45
        ? "Proof may be incomplete"
        : "Proof mismatch detected";

  return {
    status,
    score: boundedScore,
    verdict: boundedScore >= 75 ? "Looks valid" : "Needs manual review",
    issues: reasons.filter((reason) => /missing|does not|mismatch|short/i.test(reason)),
    summary:
      boundedScore >= 75
        ? "AI found the uploaded proof relevant and ready for client review."
        : "AI found possible mismatch. Client should manually verify before approval.",
    reasons: reasons.slice(0, 4),
  };
}

export function summarizeDispute({
  deal,
  disputeReason,
  disputeEvidence,
  timeline,
}: {
  deal: Deal;
  disputeReason: string;
  disputeEvidence: string;
  timeline: TimelineEvent[];
}) {
  const latestEvent = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0];
  const evidenceText = disputeEvidence.trim()
    ? `Evidence available: ${disputeEvidence.trim()}`
    : "Evidence available: no detailed evidence was attached.";

  return `Buyer/Seller issue: ${deal.clientName} raised a review issue against ${deal.freelancerName}: ${disputeReason.trim()}. ${evidenceText}. Timeline observation: latest event is "${latestEvent?.title ?? "No event"}" with status ${latestEvent?.status ?? deal.status}. Suggested admin action: review the submitted proof, compare it with acceptance criteria, then either release to freelancer or refund the client.`;
}

export function generateSealTrustScore(userWallet: string, allDeals: Deal[]): SealTrustScore {
  const normalizedWallet = userWallet.trim().toLowerCase();
  const relatedDeals = normalizedWallet
    ? allDeals.filter(
        (deal) =>
          deal.clientWallet.toLowerCase() === normalizedWallet ||
          deal.freelancerWallet.toLowerCase() === normalizedWallet,
      )
    : [];

  let score = 60;
  let completedDeals = 0;
  let disputesCount = 0;

  for (const deal of relatedDeals) {
    const isClient = deal.clientWallet.toLowerCase() === normalizedWallet;
    const isFreelancer = deal.freelancerWallet.toLowerCase() === normalizedWallet;

    if (["Approved", "Payment Released", "Resolved"].includes(deal.status)) {
      completedDeals += 1;
      score += 10;
    }

    if (deal.status === "Payment Released" || deal.resolution === "Released to freelancer") {
      score += 10;
    }

    if (deal.status === "Disputed" || deal.disputeReason) {
      disputesCount += 1;
      score -= 10;
    }

    if (
      (isFreelancer && deal.resolution === "Refunded client") ||
      (isClient && deal.resolution === "Released to freelancer")
    ) {
      score -= 15;
    }

    if (isFreelancer && (deal.status === "Work Submitted" || deal.proof)) {
      score += 5;
    }
  }

  const boundedScore = Math.min(100, Math.max(0, score));
  const trustLabel: SealTrustScore["trustLabel"] =
    boundedScore < 45
      ? "High Risk"
      : completedDeals === 0
        ? "New"
        : boundedScore >= 85
          ? "Trusted"
          : "Reliable";

  return {
    score: boundedScore,
    completedDeals,
    disputesCount,
    trustLabel,
  };
}
