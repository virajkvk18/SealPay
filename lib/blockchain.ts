import {
  isAddress,
  parseEther,
  parseUnits,
  type ContractTransactionReceipt,
} from "ethers";
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

export async function lockPayment(
  freelancerAddress: string,
  amount: string | number,
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

  const contract = await getContract();
  onPhase?.("wallet");
  const tx = await contract.createDeal(freelancerAddress, {
    value: parseEther(numericAmount),
    ...AMOY_GAS_OVERRIDES,
  });
  onPhase?.("submitted", tx.hash);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    onChainDealId: getDealIdFromReceipt(receipt),
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
