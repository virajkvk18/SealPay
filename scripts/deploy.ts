import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying SealPayEscrow with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "POL");

  const SealPayEscrow = await ethers.getContractFactory("SealPayEscrow");
  const escrow = await SealPayEscrow.deploy();

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const deploymentTx = escrow.deploymentTransaction();

  console.log("SealPayEscrow deployed to:", address);
  console.log("Deployment tx:", deploymentTx?.hash ?? "unknown");
  console.log("Add this to .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
