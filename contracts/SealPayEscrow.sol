// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SealPayEscrow {
    enum Status {
        Created,
        WorkSubmitted,
        Approved,
        PaymentReleased,
        Disputed,
        Resolved
    }

    struct Deal {
        uint256 id;
        address payable client;
        address payable freelancer;
        uint256 amount;
        Status status;
        string proofHash;
        string disputeReason;
        uint256 createdAt;
    }

    uint256 public nextDealId = 1;
    mapping(uint256 => Deal) public deals;

    event DealCreated(
        uint256 indexed dealId,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );
    event WorkSubmitted(uint256 indexed dealId, string proofHash);
    event WorkApproved(uint256 indexed dealId);
    event PaymentReleased(uint256 indexed dealId, address indexed freelancer, uint256 amount);
    event DisputeRaised(uint256 indexed dealId, string reason);
    event DisputeResolved(uint256 indexed dealId, bool releaseToFreelancer);

    modifier onlyClient(uint256 dealId) {
        require(msg.sender == deals[dealId].client, "SealPay: only client");
        _;
    }

    modifier onlyFreelancer(uint256 dealId) {
        require(msg.sender == deals[dealId].freelancer, "SealPay: only freelancer");
        _;
    }

    function createDeal(address payable freelancer) external payable returns (uint256) {
        require(freelancer != address(0), "SealPay: invalid freelancer");
        require(msg.value > 0, "SealPay: escrow amount required");

        uint256 dealId = nextDealId++;
        deals[dealId] = Deal({
            id: dealId,
            client: payable(msg.sender),
            freelancer: freelancer,
            amount: msg.value,
            status: Status.Created,
            proofHash: "",
            disputeReason: "",
            createdAt: block.timestamp
        });

        emit DealCreated(dealId, msg.sender, freelancer, msg.value);
        return dealId;
    }

    function submitWork(uint256 dealId, string memory proofHash) external onlyFreelancer(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.amount > 0, "SealPay: deal not found");
        require(
            deal.status == Status.Created || deal.status == Status.WorkSubmitted,
            "SealPay: cannot submit now"
        );

        deal.proofHash = proofHash;
        deal.status = Status.WorkSubmitted;

        emit WorkSubmitted(dealId, proofHash);
    }

    function approveWork(uint256 dealId) external onlyClient(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.WorkSubmitted, "SealPay: work not submitted");

        deal.status = Status.Approved;
        emit WorkApproved(dealId);

        uint256 payout = deal.amount;
        deal.amount = 0;
        deal.status = Status.PaymentReleased;
        deal.freelancer.transfer(payout);

        emit PaymentReleased(dealId, deal.freelancer, payout);
    }

    function raiseDispute(
        uint256 dealId,
        string memory reason
    ) external onlyClient(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.amount > 0, "SealPay: no funds in escrow");
        require(deal.status != Status.PaymentReleased, "SealPay: already released");

        deal.disputeReason = reason;
        deal.status = Status.Disputed;

        emit DisputeRaised(dealId, reason);
    }

    function resolveDispute(uint256 dealId, bool releaseToFreelancer) external {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Disputed, "SealPay: deal is not disputed");

        uint256 payout = deal.amount;
        deal.amount = 0;
        deal.status = Status.Resolved;

        if (releaseToFreelancer) {
            deal.freelancer.transfer(payout);
        } else {
            deal.client.transfer(payout);
        }

        emit DisputeResolved(dealId, releaseToFreelancer);
    }
}
