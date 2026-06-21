import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying SealPayEscrow with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "POL");

  const feeWallet = process.env.PLATFORM_FEE_WALLET || deployer.address;
  const resolver = process.env.RESOLVER_ADDRESS || deployer.address;
  const feeBps = Number(process.env.PLATFORM_FEE_BPS || 2500);

  console.log("Platform fee wallet:", feeWallet);
  console.log("Resolver wallet:", resolver);
  console.log("Platform fee bps:", feeBps);

  const SealPayEscrow = await ethers.getContractFactory("SealPayEscrow");
  const escrow = await SealPayEscrow.deploy(feeWallet, resolver, feeBps);

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const deploymentTx = escrow.deploymentTransaction();

  console.log("SealPayEscrow deployed to:", address);
  console.log("Deployment tx:", deploymentTx?.hash ?? "unknown");
  console.log("Add this to .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_PLATFORM_FEE_BPS=${feeBps}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
