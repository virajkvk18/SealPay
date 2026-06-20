import { Contract } from "ethers";
import { getBrowserProvider } from "@/lib/wallet";

export const SEALPAY_ESCROW_ABI = [
  "function createDeal(address payable freelancer) external payable returns (uint256)",
  "function submitWork(uint256 dealId, string proofHash) external",
  "function approveWork(uint256 dealId) external",
  "function raiseDispute(uint256 dealId, string reason) external",
  "function resolveDispute(uint256 dealId, bool releaseToFreelancer) external",
  "function deals(uint256 dealId) external view returns (uint256 id, address client, address freelancer, uint256 amount, uint8 status, string proofHash, string disputeReason, uint256 createdAt)",
  "function nextDealId() external view returns (uint256)",
  "event DealCreated(uint256 indexed dealId, address indexed client, address indexed freelancer, uint256 amount)",
  "event WorkSubmitted(uint256 indexed dealId, string proofHash)",
  "event WorkApproved(uint256 indexed dealId)",
  "event PaymentReleased(uint256 indexed dealId, address indexed freelancer, uint256 amount)",
  "event DisputeRaised(uint256 indexed dealId, string reason)",
  "event DisputeResolved(uint256 indexed dealId, bool releaseToFreelancer)",
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
