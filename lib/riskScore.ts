import type { RiskScore } from "@/lib/mockData";

export interface RiskInput {
  amount: number;
  deadline: string;
  description: string;
  freelancerWallet: string;
  knownFreelancerWallets?: string[];
}

export function calculateRiskScore(input: RiskInput): RiskScore {
  let score = 18;
  const reasons: string[] = [];
  const amount = Number.isFinite(input.amount) ? input.amount : 0;
  const normalizedWallet = input.freelancerWallet.trim().toLowerCase();
  const knownWallets = (input.knownFreelancerWallets ?? []).map((wallet) =>
    wallet.toLowerCase(),
  );

  if (amount >= 2) {
    score += 35;
    reasons.push("High amount locked");
  } else if (amount >= 1) {
    score += 22;
    reasons.push("Moderate-high amount");
  } else {
    reasons.push("Small demo amount");
  }

  const deadlineTime = new Date(input.deadline).getTime();
  const daysUntilDeadline = Number.isFinite(deadlineTime)
    ? Math.ceil((deadlineTime - Date.now()) / 86_400_000)
    : 0;

  if (daysUntilDeadline <= 2) {
    score += 28;
    reasons.push("Very short deadline");
  } else if (daysUntilDeadline <= 5) {
    score += 15;
    reasons.push("Short deadline");
  } else {
    reasons.push("Comfortable deadline");
  }

  if (input.description.trim().length < 24) {
    score += 22;
    reasons.push("Missing or thin description");
  } else if (input.description.trim().length < 80) {
    score += 10;
    reasons.push("Scope could be more detailed");
  } else {
    reasons.push("Detailed work description");
  }

  if (normalizedWallet && !knownWallets.includes(normalizedWallet)) {
    score += 14;
    reasons.push("New freelancer wallet");
  } else {
    reasons.push("Known freelancer wallet");
  }

  const boundedScore = Math.min(100, Math.max(0, score));
  const level =
    boundedScore >= 68
      ? "High Risk"
      : boundedScore >= 38
        ? "Medium Risk"
        : "Low Risk";

  return {
    score: boundedScore,
    level,
    reasons: reasons.slice(0, 4),
  };
}
