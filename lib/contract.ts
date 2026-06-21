import { Contract } from "ethers";
import { getBrowserProvider } from "@/lib/wallet";

export const SEALPAY_ESCROW_ABI = [
  "function createDeal(address payable freelancer, uint256 deadline, uint256 reviewPeriod, string requirementsHash, bool autoReleaseEnabled, bool refundOnMissedDeadline) external payable returns (uint256)",
  "function createPublicDeal(uint256 deadline, uint256 reviewPeriod, string requirementsHash, bool autoReleaseEnabled, bool refundOnMissedDeadline) external payable returns (uint256)",
  "function createTokenDeal(address paymentToken, address payable freelancer, uint256 escrowAmount, uint256 deadline, uint256 reviewPeriod, string requirementsHash, bool autoReleaseEnabled, bool refundOnMissedDeadline) external returns (uint256)",
  "function applyToDeal(uint256 dealId) external",
  "function assignFreelancer(uint256 dealId, address payable freelancer) external",
  "function acceptDeal(uint256 dealId) external",
  "function submitWork(uint256 dealId, string proofCid) external",
  "function approveWork(uint256 dealId) external",
  "function autoRelease(uint256 dealId) external",
  "function claimRefundAfterMissedDeadline(uint256 dealId) external",
  "function cancelBeforeAcceptance(uint256 dealId) external",
  "function raiseDispute(uint256 dealId, string reason) external",
  "function resolveDispute(uint256 dealId, bool releaseToFreelancer) external",
  "function pause() external",
  "function unpause() external",
  "function getTotalRequired(uint256 escrowAmount) external view returns (uint256)",
  "function platformFeeBps() external view returns (uint256)",
  "function platformFeeWallet() external view returns (address)",
  "function resolver() external view returns (address)",
  "function paused() external view returns (bool)",
  "function applications(uint256 dealId, address freelancer) external view returns (bool)",
  "function getDealParties(uint256 dealId) external view returns (address client, address freelancer, address paymentToken, uint8 status, bool isPublic)",
  "function getDealAmounts(uint256 dealId) external view returns (uint256 escrowAmount, uint256 platformFee)",
  "function getDealRules(uint256 dealId) external view returns (uint256 deadline, uint256 reviewPeriod, string requirementsHash, bool autoReleaseEnabled, bool refundOnMissedDeadline)",
  "function getDealProof(uint256 dealId) external view returns (string proofCid, string disputeReason, uint256 submittedAt, uint256 releasedAt, bool clientApprovedRelease, bool freelancerAccepted)",
  "function nextDealId() external view returns (uint256)",
  "event DealCreated(uint256 indexed dealId, address indexed client, address indexed freelancer, address paymentToken, uint256 escrowAmount, uint256 platformFee, uint256 deadline, uint256 reviewPeriod, string requirementsHash, bool isPublic)",
  "event PaymentLocked(uint256 indexed dealId, uint256 escrowAmount, uint256 platformFee)",
  "event FreelancerApplied(uint256 indexed dealId, address indexed freelancer)",
  "event FreelancerAssigned(uint256 indexed dealId, address indexed freelancer)",
  "event DealAccepted(uint256 indexed dealId, address indexed freelancer)",
  "event WorkSubmitted(uint256 indexed dealId, string proofCid)",
  "event ClientApprovedRelease(uint256 indexed dealId)",
  "event PaymentReleased(uint256 indexed dealId, address indexed freelancer, uint256 freelancerAmount, address indexed feeWallet, uint256 platformFee)",
  "event ClientRefunded(uint256 indexed dealId, address indexed client, uint256 amount)",
  "event Refunded(uint256 indexed dealId, address indexed client, uint256 amount)",
  "event DisputeRaised(uint256 indexed dealId, address indexed raisedBy, string reason)",
  "event DisputeResolved(uint256 indexed dealId, bool releaseToFreelancer)",
  "event DealCancelled(uint256 indexed dealId)",
] as const;

export function getContractAddress() {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!address) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
  }

  return address;
}

export async function getContract() {
  const provider = getBrowserProvider();
  const signer = await provider.getSigner();

  return new Contract(getContractAddress(), SEALPAY_ESCROW_ABI, signer);
}
