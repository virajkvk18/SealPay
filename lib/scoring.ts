import type { Deal } from "@/lib/mockData";
import {
  calculateRiskScore as calculateBaseRiskScore,
  type RiskInput,
} from "@/lib/riskScore";

export interface MilestoneSuggestion {
  structure: string[];
  reason: string;
  warning?: string;
}

export interface WalletTrustScore {
  score: number;
  completedDeals: number;
  disputesCount: number;
  trustLabel: "New" | "Reliable" | "Trusted" | "High Risk";
}

export function calculateRiskScore(input: RiskInput) {
  return calculateBaseRiskScore(input);
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

export function generateWalletTrustScore(
  userWallet: string,
  allDeals: Deal[],
): WalletTrustScore {
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
    const isFreelancer =
      deal.freelancerWallet.toLowerCase() === normalizedWallet;

    if (["Approved", "Payment Released", "Resolved"].includes(deal.status)) {
      completedDeals += 1;
      score += 10;
    }

    if (
      deal.status === "Payment Released" ||
      deal.resolution === "Released to freelancer"
    ) {
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
  const trustLabel: WalletTrustScore["trustLabel"] =
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
