# SealPay

**Seal the Deal. Secure the Pay.**

SealPay is a polished hackathon MVP for Web3-based freelancer escrow. It protects freelancers, students, designers, developers, tutors, and small service providers by locking client payment before work starts and releasing it only after verified delivery.

## Problem

Freelancers often complete work but face delayed payment, denied delivery, or misuse of the delivered work before payment is made.

## Solution

SealPay creates a simple escrow flow: a client creates a deal, locks payment, the freelancer submits proof of work, the client approves it, and the payment is released. Every step appears in a public proof timeline with mock transaction hashes.

## MVP Features

- Mock wallet connection
- Mock blockchain transactions with fake hashes
- Local mock deal database
- Deal creation flow
- Risk score calculator
- Proof-of-work submission modal
- Deliverable lock/unlock demo
- Client, freelancer, and admin/judge role switcher
- Dispute and resolution simulation
- Public proof timeline at `/proof/[id]`
- Simple Solidity escrow contract for future testnet extension

## Demo Flow

1. Open the landing page.
2. Click **Launch MVP**.
3. View the dashboard.
4. Create a new deal.
5. Open the deal and lock payment as Client.
6. Switch to Freelancer and submit work proof.
7. Switch back to Client and approve work.
8. Show payment released and the unlocked deliverable.
9. Open the public proof timeline.
10. Use the seeded disputed deal `SP-1003` to briefly show dispute resolution.

## Tech Stack

- Next.js with TypeScript
- Tailwind CSS
- Lucide icons
- Local browser state and seeded mock data
- Solidity contract included in `contracts/SealPayEscrow.sol`

## How To Run

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Smart Contract

`contracts/SealPayEscrow.sol` includes a simple escrow contract with:

- `createDeal(address freelancer) payable`
- `submitWork(uint256 dealId, string memory proofHash)`
- `approveWork(uint256 dealId)`
- `raiseDispute(uint256 dealId, string memory reason)`
- `resolveDispute(uint256 dealId, bool releaseToFreelancer)`

The frontend does not require deployment. It clearly runs in demo mode with mock transaction hashes.

## Future Scope

- Real smart contract deployment
- MetaMask integration
- IPFS file storage
- Milestone-based payments
- Reputation score
- Arbitration DAO
- UPI/off-chain payment proof integration
- Freelancer profile verification
