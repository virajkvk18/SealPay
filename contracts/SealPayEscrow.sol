// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title SealPayEscrow
/// @notice Rule-based freelance escrow for Polygon Amoy MVP.
/// @dev address(0) paymentToken means native POL. Non-zero paymentToken means ERC20/stablecoin.
contract SealPayEscrow {
    enum Status {
        Open,
        Created,
        Assigned,
        Accepted,
        WorkSubmitted,
        PaymentReleased,
        Refunded,
        Disputed,
        Resolved,
        Cancelled
    }

    struct Deal {
        uint256 id;
        address payable client;
        address payable freelancer;
        address paymentToken;
        uint256 escrowAmount;
        uint256 platformFee;
        Status status;
        string requirementsHash;
        string proofCid;
        string disputeReason;
        uint256 deadline;
        uint256 reviewPeriod;
        uint256 createdAt;
        uint256 assignedAt;
        uint256 acceptedAt;
        uint256 submittedAt;
        uint256 releasedAt;
        bool autoReleaseEnabled;
        bool refundOnMissedDeadline;
        bool clientApprovedRelease;
        bool freelancerAccepted;
        bool isPublic;
    }

    struct DealConfig {
        address payable freelancer;
        address paymentToken;
        uint256 escrowAmount;
        uint256 platformFee;
        uint256 deadline;
        uint256 reviewPeriod;
        string requirementsHash;
        bool autoReleaseEnabled;
        bool refundOnMissedDeadline;
        bool isPublic;
    }

    uint256 public constant MAX_PLATFORM_FEE_BPS = 2500;
    uint256 public nextDealId = 1;
    uint256 public platformFeeBps;
    address payable public platformFeeWallet;
    address public resolver;
    bool public paused;
    uint256 private locked = 1;

    mapping(uint256 => Deal) private deals;
    mapping(uint256 => mapping(address => bool)) public applications;

    event DealCreated(
        uint256 indexed dealId,
        address indexed client,
        address indexed freelancer,
        address paymentToken,
        uint256 escrowAmount,
        uint256 platformFee,
        bool isPublic
    );
    event DealRulesConfigured(
        uint256 indexed dealId,
        uint256 deadline,
        uint256 reviewPeriod,
        string requirementsHash
    );
    event PaymentLocked(uint256 indexed dealId, uint256 escrowAmount, uint256 platformFee);
    event FreelancerApplied(uint256 indexed dealId, address indexed freelancer);
    event FreelancerAssigned(uint256 indexed dealId, address indexed freelancer);
    event DealAccepted(uint256 indexed dealId, address indexed freelancer);
    event WorkSubmitted(uint256 indexed dealId, string proofCid);
    event WorkApproved(uint256 indexed dealId);
    event PaymentReleased(
        uint256 indexed dealId,
        address indexed freelancer,
        uint256 freelancerAmount,
        address indexed feeWallet,
        uint256 platformFee
    );
    event Refunded(uint256 indexed dealId, address indexed client, uint256 amount);
    event DisputeRaised(uint256 indexed dealId, address indexed raisedBy, string reason);
    event DisputeResolved(uint256 indexed dealId, bool releaseToFreelancer);
    event DealCancelled(uint256 indexed dealId);
    event ResolverUpdated(address indexed resolver);
    event PlatformFeeUpdated(address indexed feeWallet, uint256 feeBps);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier nonReentrant() {
        require(locked == 1, "SealPay: reentrant call");
        locked = 2;
        _;
        locked = 1;
    }

    modifier whenNotPaused() {
        require(!paused, "SealPay: paused");
        _;
    }

    modifier dealExists(uint256 dealId) {
        require(deals[dealId].id != 0, "SealPay: deal not found");
        _;
    }

    modifier onlyClient(uint256 dealId) {
        require(msg.sender == deals[dealId].client, "SealPay: only client");
        _;
    }

    modifier onlyFreelancer(uint256 dealId) {
        require(msg.sender == deals[dealId].freelancer, "SealPay: only freelancer");
        _;
    }

    modifier onlyParticipant(uint256 dealId) {
        Deal storage deal = deals[dealId];
        require(
            msg.sender == deal.client || msg.sender == deal.freelancer,
            "SealPay: only participant"
        );
        _;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "SealPay: only resolver");
        _;
    }

    constructor(address payable feeWallet, address initialResolver, uint256 feeBps) {
        require(feeWallet != address(0), "SealPay: invalid fee wallet");
        require(initialResolver != address(0), "SealPay: invalid resolver");
        require(feeBps <= MAX_PLATFORM_FEE_BPS, "SealPay: fee too high");

        platformFeeWallet = feeWallet;
        resolver = initialResolver;
        platformFeeBps = feeBps;
    }

    function createDeal(
        address payable freelancer,
        uint256 deadline,
        uint256 reviewPeriod,
        string calldata requirementsHash,
        bool autoReleaseEnabled,
        bool refundOnMissedDeadline
    ) external payable whenNotPaused returns (uint256) {
        require(freelancer != address(0), "SealPay: invalid freelancer");
        require(freelancer != msg.sender, "SealPay: same client/freelancer");
        return _createNativeDeal(
            freelancer,
            deadline,
            reviewPeriod,
            requirementsHash,
            autoReleaseEnabled,
            refundOnMissedDeadline,
            false
        );
    }

    function createPublicDeal(
        uint256 deadline,
        uint256 reviewPeriod,
        string calldata requirementsHash,
        bool autoReleaseEnabled,
        bool refundOnMissedDeadline
    ) external payable whenNotPaused returns (uint256) {
        return _createNativeDeal(
            payable(address(0)),
            deadline,
            reviewPeriod,
            requirementsHash,
            autoReleaseEnabled,
            refundOnMissedDeadline,
            true
        );
    }

    function createTokenDeal(
        address paymentToken,
        address payable freelancer,
        uint256 escrowAmount,
        uint256 deadline,
        uint256 reviewPeriod,
        string calldata requirementsHash,
        bool autoReleaseEnabled,
        bool refundOnMissedDeadline
    ) external whenNotPaused returns (uint256) {
        require(paymentToken != address(0), "SealPay: invalid token");
        require(freelancer != address(0), "SealPay: invalid freelancer");
        require(freelancer != msg.sender, "SealPay: same client/freelancer");
        uint256 totalRequired = escrowAmount + _feeFor(escrowAmount);
        require(_safeTransferFrom(paymentToken, msg.sender, address(this), totalRequired), "SealPay: token transfer failed");

        DealConfig memory config = DealConfig({
            freelancer: freelancer,
            paymentToken: paymentToken,
            escrowAmount: escrowAmount,
            platformFee: totalRequired - escrowAmount,
            deadline: deadline,
            reviewPeriod: reviewPeriod,
            requirementsHash: requirementsHash,
            autoReleaseEnabled: autoReleaseEnabled,
            refundOnMissedDeadline: refundOnMissedDeadline,
            isPublic: false
        });

        return _storeDeal(config);
    }

    function applyToDeal(uint256 dealId) external dealExists(dealId) whenNotPaused {
        Deal storage deal = deals[dealId];
        require(deal.isPublic, "SealPay: not public");
        require(deal.status == Status.Open, "SealPay: not open");
        require(msg.sender != deal.client, "SealPay: client cannot apply");
        require(!applications[dealId][msg.sender], "SealPay: already applied");

        applications[dealId][msg.sender] = true;
        emit FreelancerApplied(dealId, msg.sender);
    }

    function assignFreelancer(uint256 dealId, address payable freelancer)
        external
        dealExists(dealId)
        onlyClient(dealId)
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(deal.isPublic, "SealPay: not public");
        require(deal.status == Status.Open, "SealPay: not open");
        require(freelancer != address(0), "SealPay: invalid freelancer");
        require(freelancer != deal.client, "SealPay: same client/freelancer");
        require(applications[dealId][freelancer], "SealPay: freelancer did not apply");

        deal.freelancer = freelancer;
        deal.assignedAt = block.timestamp;
        deal.status = Status.Assigned;
        emit FreelancerAssigned(dealId, freelancer);
    }

    function acceptDeal(uint256 dealId)
        external
        dealExists(dealId)
        onlyFreelancer(dealId)
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(
            deal.status == Status.Created || deal.status == Status.Assigned,
            "SealPay: cannot accept now"
        );
        require(block.timestamp <= deal.deadline, "SealPay: deadline passed");

        deal.freelancerAccepted = true;
        deal.acceptedAt = block.timestamp;
        deal.status = Status.Accepted;

        emit DealAccepted(dealId, msg.sender);
    }

    function submitWork(uint256 dealId, string calldata proofCid)
        external
        dealExists(dealId)
        onlyFreelancer(dealId)
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(
            deal.status == Status.Accepted || deal.status == Status.WorkSubmitted,
            "SealPay: cannot submit now"
        );
        require(block.timestamp <= deal.deadline, "SealPay: deadline passed");
        require(bytes(proofCid).length > 0, "SealPay: proof CID required");

        deal.proofCid = proofCid;
        deal.submittedAt = block.timestamp;
        deal.status = Status.WorkSubmitted;

        emit WorkSubmitted(dealId, proofCid);
    }

    function approveWork(uint256 dealId)
        external
        dealExists(dealId)
        onlyClient(dealId)
        nonReentrant
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.WorkSubmitted, "SealPay: work not submitted");
        require(deal.freelancerAccepted, "SealPay: freelancer not accepted");
        require(bytes(deal.proofCid).length > 0, "SealPay: proof missing");

        deal.clientApprovedRelease = true;
        emit WorkApproved(dealId);

        _releaseToFreelancer(dealId);
    }

    function autoRelease(uint256 dealId)
        external
        dealExists(dealId)
        onlyFreelancer(dealId)
        nonReentrant
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(deal.autoReleaseEnabled, "SealPay: auto release disabled");
        require(deal.status == Status.WorkSubmitted, "SealPay: work not submitted");
        require(
            block.timestamp >= deal.submittedAt + deal.reviewPeriod,
            "SealPay: review period active"
        );

        _releaseToFreelancer(dealId);
    }

    function claimRefundAfterMissedDeadline(uint256 dealId)
        external
        dealExists(dealId)
        onlyClient(dealId)
        nonReentrant
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(deal.refundOnMissedDeadline, "SealPay: refund rule disabled");
        require(block.timestamp > deal.deadline, "SealPay: deadline active");
        require(
            deal.status == Status.Open ||
                deal.status == Status.Created ||
                deal.status == Status.Assigned ||
                deal.status == Status.Accepted,
            "SealPay: proof already submitted"
        );

        _refundClient(dealId, true);
    }

    function cancelBeforeAcceptance(uint256 dealId)
        external
        dealExists(dealId)
        onlyClient(dealId)
        nonReentrant
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(
            deal.status == Status.Open ||
                deal.status == Status.Created ||
                deal.status == Status.Assigned,
            "SealPay: cannot cancel now"
        );

        _refundClient(dealId, true);
        deals[dealId].status = Status.Cancelled;
        emit DealCancelled(dealId);
    }

    function raiseDispute(uint256 dealId, string calldata reason)
        external
        dealExists(dealId)
        onlyParticipant(dealId)
        whenNotPaused
    {
        Deal storage deal = deals[dealId];
        require(
            deal.status == Status.Accepted || deal.status == Status.WorkSubmitted,
            "SealPay: cannot dispute now"
        );
        require(bytes(reason).length > 0, "SealPay: reason required");

        deal.disputeReason = reason;
        deal.status = Status.Disputed;

        emit DisputeRaised(dealId, msg.sender, reason);
    }

    function resolveDispute(uint256 dealId, bool releaseToFreelancer)
        external
        dealExists(dealId)
        onlyResolver
        nonReentrant
    {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Disputed, "SealPay: not disputed");

        if (releaseToFreelancer) {
            _releaseToFreelancer(dealId);
        } else {
            _refundClient(dealId, true);
        }

        deals[dealId].status = Status.Resolved;
        emit DisputeResolved(dealId, releaseToFreelancer);
    }

    function pause() external onlyResolver {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyResolver {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function updateResolver(address nextResolver) external onlyResolver {
        require(nextResolver != address(0), "SealPay: invalid resolver");
        resolver = nextResolver;
        emit ResolverUpdated(nextResolver);
    }

    function updatePlatformFee(address payable nextFeeWallet, uint256 nextFeeBps)
        external
        onlyResolver
    {
        require(nextFeeWallet != address(0), "SealPay: invalid fee wallet");
        require(nextFeeBps <= MAX_PLATFORM_FEE_BPS, "SealPay: fee too high");

        platformFeeWallet = nextFeeWallet;
        platformFeeBps = nextFeeBps;
        emit PlatformFeeUpdated(nextFeeWallet, nextFeeBps);
    }

    function getTotalRequired(uint256 escrowAmount) external view returns (uint256) {
        return escrowAmount + _feeFor(escrowAmount);
    }

    function getDealParties(uint256 dealId)
        external
        view
        dealExists(dealId)
        returns (
            address client,
            address freelancer,
            address paymentToken,
            Status status,
            bool isPublic
        )
    {
        Deal storage deal = deals[dealId];
        return (
            deal.client,
            deal.freelancer,
            deal.paymentToken,
            deal.status,
            deal.isPublic
        );
    }

    function getDealAmounts(uint256 dealId)
        external
        view
        dealExists(dealId)
        returns (uint256 escrowAmount, uint256 platformFee)
    {
        Deal storage deal = deals[dealId];
        return (deal.escrowAmount, deal.platformFee);
    }

    function getDealRules(uint256 dealId)
        external
        view
        dealExists(dealId)
        returns (
            uint256 deadline,
            uint256 reviewPeriod,
            string memory requirementsHash,
            bool autoReleaseEnabled,
            bool refundOnMissedDeadline
        )
    {
        Deal storage deal = deals[dealId];
        return (
            deal.deadline,
            deal.reviewPeriod,
            deal.requirementsHash,
            deal.autoReleaseEnabled,
            deal.refundOnMissedDeadline
        );
    }

    function getDealProof(uint256 dealId)
        external
        view
        dealExists(dealId)
        returns (
            string memory proofCid,
            string memory disputeReason,
            uint256 submittedAt,
            uint256 releasedAt,
            bool clientApprovedRelease,
            bool freelancerAccepted
        )
    {
        Deal storage deal = deals[dealId];
        return (
            deal.proofCid,
            deal.disputeReason,
            deal.submittedAt,
            deal.releasedAt,
            deal.clientApprovedRelease,
            deal.freelancerAccepted
        );
    }

    function _createNativeDeal(
        address payable freelancer,
        uint256 deadline,
        uint256 reviewPeriod,
        string calldata requirementsHash,
        bool autoReleaseEnabled,
        bool refundOnMissedDeadline,
        bool isPublic
    ) internal returns (uint256) {
        require(msg.value > 0, "SealPay: escrow amount required");
        uint256 escrowAmount = (msg.value * 10_000) / (10_000 + platformFeeBps);
        uint256 platformFee = msg.value - escrowAmount;
        require(escrowAmount > 0, "SealPay: escrow amount too small");

        DealConfig memory config = DealConfig({
            freelancer: freelancer,
            paymentToken: address(0),
            escrowAmount: escrowAmount,
            platformFee: platformFee,
            deadline: deadline,
            reviewPeriod: reviewPeriod,
            requirementsHash: requirementsHash,
            autoReleaseEnabled: autoReleaseEnabled,
            refundOnMissedDeadline: refundOnMissedDeadline,
            isPublic: isPublic
        });

        return _storeDeal(config);
    }

    function _storeDeal(DealConfig memory config) internal returns (uint256) {
        require(config.deadline > block.timestamp, "SealPay: deadline must be future");
        require(config.reviewPeriod > 0, "SealPay: review period required");
        require(bytes(config.requirementsHash).length > 0, "SealPay: requirements required");

        uint256 dealId = nextDealId++;
        deals[dealId] = Deal({
            id: dealId,
            client: payable(msg.sender),
            freelancer: config.freelancer,
            paymentToken: config.paymentToken,
            escrowAmount: config.escrowAmount,
            platformFee: config.platformFee,
            status: config.isPublic ? Status.Open : Status.Created,
            requirementsHash: config.requirementsHash,
            proofCid: "",
            disputeReason: "",
            deadline: config.deadline,
            reviewPeriod: config.reviewPeriod,
            createdAt: block.timestamp,
            assignedAt: 0,
            acceptedAt: 0,
            submittedAt: 0,
            releasedAt: 0,
            autoReleaseEnabled: config.autoReleaseEnabled,
            refundOnMissedDeadline: config.refundOnMissedDeadline,
            clientApprovedRelease: false,
            freelancerAccepted: false,
            isPublic: config.isPublic
        });

        emit DealCreated(
            dealId,
            msg.sender,
            config.freelancer,
            config.paymentToken,
            config.escrowAmount,
            config.platformFee,
            config.isPublic
        );
        emit DealRulesConfigured(
            dealId,
            config.deadline,
            config.reviewPeriod,
            config.requirementsHash
        );
        emit PaymentLocked(dealId, config.escrowAmount, config.platformFee);

        return dealId;
    }

    function _releaseToFreelancer(uint256 dealId) internal {
        Deal storage deal = deals[dealId];
        require(deal.escrowAmount > 0, "SealPay: already settled");

        uint256 payout = deal.escrowAmount;
        uint256 fee = deal.platformFee;
        address payable freelancer = deal.freelancer;
        address token = deal.paymentToken;
        address payable feeWallet = platformFeeWallet;

        deal.escrowAmount = 0;
        deal.platformFee = 0;
        deal.releasedAt = block.timestamp;
        deal.status = Status.PaymentReleased;

        _payout(token, freelancer, payout);
        if (fee > 0) _payout(token, feeWallet, fee);

        emit PaymentReleased(dealId, freelancer, payout, feeWallet, fee);
    }

    function _refundClient(uint256 dealId, bool includeFee) internal {
        Deal storage deal = deals[dealId];
        require(deal.escrowAmount > 0, "SealPay: already settled");

        uint256 refund = deal.escrowAmount;
        uint256 fee = deal.platformFee;
        address payable client = deal.client;
        address token = deal.paymentToken;

        if (includeFee) {
            refund += fee;
            fee = 0;
        }

        deal.escrowAmount = 0;
        deal.platformFee = 0;
        deal.releasedAt = block.timestamp;
        deal.status = Status.Refunded;

        _payout(token, client, refund);
        if (fee > 0) _payout(token, platformFeeWallet, fee);

        emit Refunded(dealId, client, refund);
    }

    function _feeFor(uint256 escrowAmount) internal view returns (uint256) {
        return (escrowAmount * platformFeeBps) / 10_000;
    }

    function _payout(address token, address payable recipient, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "SealPay: transfer failed");
        } else {
            require(IERC20(token).transfer(recipient, amount), "SealPay: token payout failed");
        }
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal returns (bool) {
        return IERC20(token).transferFrom(from, to, amount);
    }
}
