import {
  isAddress,
  parseEther,
  parseUnits,
  toUtf8Bytes,
  type ContractTransactionReceipt,
} from "ethers";
import { keccak256 } from "ethers";
import { getContract } from "@/lib/contract";
import { switchToAmoy } from "@/lib/wallet";

const AMOY_GAS_OVERRIDES = {
  maxPriorityFeePerGas: parseUnits("30", "gwei"),
  maxFeePerGas: parseUnits("40", "gwei"),
};

export type TransactionPhaseHandler = (
  phase: "wallet" | "submitted",
  txHash?: string,
) => void;

function getDealIdFromReceipt(receipt: ContractTransactionReceipt | null) {
  const event = receipt?.logs
    .map((log) => {
      try {
        return "fragment" in log && log.fragment?.name === "DealCreated" ? log : null;
      } catch {
        return null;
      }
    })
    .find(Boolean);

  const dealId = event && "args" in event ? event.args?.dealId : undefined;
  return dealId ? dealId.toString() : "";
}

function getDeadlineSeconds(deadline?: string) {
  const deadlineTime = deadline ? new Date(deadline).getTime() : NaN;
  const fallback = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return Math.floor((Number.isFinite(deadlineTime) ? deadlineTime : fallback) / 1000);
}

function makeRequirementsHash(input?: string) {
  const normalized = input?.trim() || "SealPay rule-based escrow terms";
  return keccak256(toUtf8Bytes(normalized));
}

export async function lockPayment(
  freelancerAddress: string,
  amount: string | number,
  rulesOrOnPhase?:
    | {
        deadline?: string;
        reviewPeriodSeconds?: number;
        requirements?: string;
        autoReleaseEnabled?: boolean;
        refundOnMissedDeadline?: boolean;
      }
    | TransactionPhaseHandler,
  onPhase?: TransactionPhaseHandler,
) {
  if (!isAddress(freelancerAddress)) {
    throw new Error("Invalid freelancer wallet address.");
  }

  const numericAmount = typeof amount === "number" ? String(amount) : amount.trim();
  if (!numericAmount || Number(numericAmount) <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  await switchToAmoy();

  const rules =
    typeof rulesOrOnPhase === "function" ? undefined : rulesOrOnPhase;
  const phaseHandler =
    typeof rulesOrOnPhase === "function" ? rulesOrOnPhase : onPhase;

  const contract = await getContract();
  const escrowAmount = parseEther(numericAmount);
  const totalRequired = await contract.getTotalRequired(escrowAmount);
  const deadline = BigInt(getDeadlineSeconds(rules?.deadline));
  const reviewPeriod = BigInt(rules?.reviewPeriodSeconds ?? 24 * 60 * 60);
  const requirementsHash = makeRequirementsHash(rules?.requirements);

  phaseHandler?.("wallet");
  const tx = await contract.createDeal(
    freelancerAddress,
    deadline,
    reviewPeriod,
    requirementsHash,
    rules?.autoReleaseEnabled ?? true,
    rules?.refundOnMissedDeadline ?? true,
    {
      value: totalRequired,
      ...AMOY_GAS_OVERRIDES,
    },
  );
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    onChainDealId: getDealIdFromReceipt(receipt),
    receipt,
  };
}

export async function acceptDealOnChain(
  dealId: string | number | bigint,
  onPhase?: TransactionPhaseHandler,
) {
  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.acceptDeal(BigInt(dealId), AMOY_GAS_OVERRIDES);
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function applyToDealOnChain(
  dealId: string | number | bigint,
  onPhase?: TransactionPhaseHandler,
) {
  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.applyToDeal(BigInt(dealId), AMOY_GAS_OVERRIDES);
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function assignFreelancerOnChain(
  dealId: string | number | bigint,
  freelancerAddress: string,
  onPhase?: TransactionPhaseHandler,
) {
  if (!isAddress(freelancerAddress)) {
    throw new Error("Invalid freelancer wallet address.");
  }

  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.assignFreelancer(
    BigInt(dealId),
    freelancerAddress,
    AMOY_GAS_OVERRIDES,
  );
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function submitProofCID(
  dealId: string | number | bigint,
  cid: string,
  onPhase?: TransactionPhaseHandler,
) {
  const normalizedCid = cid.trim();

  if (!normalizedCid) {
    throw new Error("Proof CID is required.");
  }

  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.submitWork(
    BigInt(dealId),
    normalizedCid,
    AMOY_GAS_OVERRIDES,
  );
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function approveWork(
  dealId: string | number | bigint,
  onPhase?: TransactionPhaseHandler,
) {
  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.approveWork(BigInt(dealId), AMOY_GAS_OVERRIDES);
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function autoReleasePayment(
  dealId: string | number | bigint,
  onPhase?: TransactionPhaseHandler,
) {
  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.autoRelease(BigInt(dealId), AMOY_GAS_OVERRIDES);
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function claimRefundAfterMissedDeadline(
  dealId: string | number | bigint,
  onPhase?: TransactionPhaseHandler,
) {
  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.claimRefundAfterMissedDeadline(
    BigInt(dealId),
    AMOY_GAS_OVERRIDES,
  );
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function cancelBeforeAcceptance(
  dealId: string | number | bigint,
  onPhase?: TransactionPhaseHandler,
) {
  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.cancelBeforeAcceptance(
    BigInt(dealId),
    AMOY_GAS_OVERRIDES,
  );
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}

export async function raiseDisputeOnChain(
  dealId: string | number | bigint,
  reason: string,
  onPhase?: TransactionPhaseHandler,
) {
  const normalizedReason = reason.trim();

  if (!normalizedReason) {
    throw new Error("Dispute reason is required.");
  }

  await switchToAmoy();

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.raiseDispute(
    BigInt(dealId),
    normalizedReason,
    AMOY_GAS_OVERRIDES,
  );
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    receipt,
  };
}
