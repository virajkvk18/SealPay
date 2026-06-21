/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

const feeBps = 2500n;
const escrowAmount = ethers.parseEther("0.001");
const totalRequired = escrowAmount + (escrowAmount * feeBps) / 10_000n;
const reviewPeriod = 24 * 60 * 60;
const requirementsHash = ethers.keccak256(
  ethers.toUtf8Bytes("SealPay acceptance checklist"),
);

const Status = {
  Open: 0n,
  Created: 1n,
  Assigned: 2n,
  Accepted: 3n,
  WorkSubmitted: 4n,
  PaymentReleased: 5n,
  Refunded: 6n,
  Disputed: 7n,
  Resolved: 8n,
  Cancelled: 9n,
};

async function latestTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  assert.ok(block);
  return block.timestamp;
}

async function deployEscrow() {
  const [client, freelancer, feeWallet, resolver, stranger] =
    await ethers.getSigners();
  const SealPayEscrow = await ethers.getContractFactory("SealPayEscrow");
  const escrow = await SealPayEscrow.deploy(
    feeWallet.address,
    resolver.address,
    feeBps,
  );
  await escrow.waitForDeployment();

  return { escrow, client, freelancer, feeWallet, resolver, stranger };
}

async function createDeal() {
  const context = await deployEscrow();
  const deadline = (await latestTimestamp()) + 7 * 24 * 60 * 60;

  await context.escrow.connect(context.client).createDeal(
    context.freelancer.address,
    deadline,
    reviewPeriod,
    requirementsHash,
    true,
    true,
    { value: totalRequired },
  );

  return { ...context, deadline, dealId: 1n };
}

describe("SealPayEscrow", function () {
  it("locks escrow amount plus platform fee in the contract", async function () {
    const { escrow, dealId } = await createDeal();
    const amounts = await escrow.getDealAmounts(dealId);
    const parties = await escrow.getDealParties(dealId);

    assert.equal(amounts.escrowAmount, escrowAmount);
    assert.equal(amounts.platformFee, totalRequired - escrowAmount);
    assert.equal(parties.status, Status.Created);
    assert.equal(
      await ethers.provider.getBalance(await escrow.getAddress()),
      totalRequired,
    );
  });

  it("rejects invalid deal setup", async function () {
    const { escrow, client } = await deployEscrow();
    const deadline = (await latestTimestamp()) + 3600;

    await assert.rejects(
      escrow.connect(client).createDeal(
        client.address,
        deadline,
        reviewPeriod,
        requirementsHash,
        true,
        true,
        { value: totalRequired },
      ),
    );
  });

  it("requires freelancer acceptance and proof before client release", async function () {
    const { escrow, client, freelancer, dealId } = await createDeal();

    await assert.rejects(escrow.connect(client).approveWork(dealId));

    await escrow.connect(freelancer).acceptDeal(dealId);
    await assert.rejects(escrow.connect(client).approveWork(dealId));

    await escrow.connect(freelancer).submitWork(dealId, "bafy-proof-cid");
    await escrow.connect(client).approveWork(dealId);

    const amounts = await escrow.getDealAmounts(dealId);
    const parties = await escrow.getDealParties(dealId);
    assert.equal(amounts.escrowAmount, 0n);
    assert.equal(amounts.platformFee, 0n);
    assert.equal(parties.status, Status.PaymentReleased);
  });

  it("allows auto release after the review period", async function () {
    const { escrow, freelancer, dealId } = await createDeal();

    await escrow.connect(freelancer).acceptDeal(dealId);
    await escrow.connect(freelancer).submitWork(dealId, "bafy-proof-cid");

    await assert.rejects(escrow.connect(freelancer).autoRelease(dealId));

    await ethers.provider.send("evm_increaseTime", [reviewPeriod + 1]);
    await ethers.provider.send("evm_mine", []);
    await escrow.connect(freelancer).autoRelease(dealId);

    const parties = await escrow.getDealParties(dealId);
    assert.equal(parties.status, Status.PaymentReleased);
  });

  it("allows client refund after missed deadline when no proof was submitted", async function () {
    const { escrow, client, deadline, dealId } = await createDeal();
    const now = await latestTimestamp();

    await ethers.provider.send("evm_increaseTime", [deadline - now + 1]);
    await ethers.provider.send("evm_mine", []);
    await escrow.connect(client).claimRefundAfterMissedDeadline(dealId);

    const parties = await escrow.getDealParties(dealId);
    const amounts = await escrow.getDealAmounts(dealId);
    assert.equal(parties.status, Status.Refunded);
    assert.equal(amounts.escrowAmount, 0n);
  });

  it("allows cancellation before freelancer acceptance", async function () {
    const { escrow, client, dealId } = await createDeal();

    await escrow.connect(client).cancelBeforeAcceptance(dealId);
    const parties = await escrow.getDealParties(dealId);
    const amounts = await escrow.getDealAmounts(dealId);
    assert.equal(parties.status, Status.Cancelled);
    assert.equal(amounts.escrowAmount, 0n);
  });

  it("supports public deals, applications, and assignment", async function () {
    const { escrow, client, freelancer } = await deployEscrow();
    const deadline = (await latestTimestamp()) + 7 * 24 * 60 * 60;

    await escrow.connect(client).createPublicDeal(
      deadline,
      reviewPeriod,
      requirementsHash,
      true,
      true,
      { value: totalRequired },
    );

    await escrow.connect(freelancer).applyToDeal(1n);
    assert.equal(await escrow.applications(1n, freelancer.address), true);

    await escrow.connect(client).assignFreelancer(1n, freelancer.address);
    const parties = await escrow.getDealParties(1n);
    assert.equal(parties.status, Status.Assigned);
    assert.equal(parties.freelancer, freelancer.address);
  });

  it("allows either participant to raise a dispute and only resolver to resolve", async function () {
    const { escrow, freelancer, resolver, stranger, dealId } =
      await createDeal();

    await escrow.connect(freelancer).acceptDeal(dealId);
    await escrow.connect(freelancer).raiseDispute(dealId, "Client is not responding");

    await assert.rejects(escrow.connect(stranger).resolveDispute(dealId, false));

    await escrow.connect(resolver).resolveDispute(dealId, false);
    const parties = await escrow.getDealParties(dealId);
    assert.equal(parties.status, Status.Resolved);
  });

  it("pauses risky state-changing deal actions", async function () {
    const { escrow, client, freelancer, resolver } = await deployEscrow();
    const deadline = (await latestTimestamp()) + 3600;

    await escrow.connect(resolver).pause();

    await assert.rejects(
      escrow.connect(client).createDeal(
        freelancer.address,
        deadline,
        reviewPeriod,
        requirementsHash,
        true,
        true,
        { value: totalRequired },
      ),
    );

    await escrow.connect(resolver).unpause();
    await escrow.connect(client).createDeal(
      freelancer.address,
      deadline,
      reviewPeriod,
      requirementsHash,
      true,
      true,
      { value: totalRequired },
    );
  });
});
