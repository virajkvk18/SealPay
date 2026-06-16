# SealPay

**Seal the deal. Secure the pay.**

SealPay is a demo-ready FinTech + Web3 hackathon MVP for safer freelance payments. It shows how a client can lock funds, a freelancer can submit proof of work, AI can assist risk/proof review, and a public proof timeline can verify the full escrow flow.

## Problem

Freelancers often deliver work before receiving payment. Clients also worry about releasing funds before seeing proof that the work matches the agreed scope. This creates late payments, disputes, and weak trust between both sides.

## Why SealPay Is Needed

SealPay gives both sides a visible process:

- Client creates a deal and locks payment in escrow.
- AI flags risky scope, short deadlines, and weak proof.
- Freelancer submits proof before final release.
- Client approves only after review.
- Every major step appears in a public proof timeline.
- Human admin/judge stays responsible for final dispute decisions.

## MVP Features

- Polished landing page, dashboard, create invoice flow, deal vault, and public proof explorer
- Mock wallet connection with connect/disconnect state
- LocalStorage deal persistence with reset demo flow
- Mock blockchain transactions and proof hashes
- Deal creation with AI risk score
- AI milestone suggestion for payment structure
- Work proof submission and AI proof review
- Deliverable Lock with watermarked preview before payment release
- Client, freelancer, and admin/judge role switcher
- Optional dispute raising and admin resolution
- SealTrust score card
- Solidity escrow contract included for future testnet extension

## AI Trust Engine

`lib/aiEngine.ts` contains deterministic local helper logic:

- `calculateRiskScore()` checks amount, deadline, scope detail, and wallet familiarity.
- `suggestMilestones()` recommends single payment or 30/40/30 milestone release.
- `analyzeWorkProof()` scores proof note, file name, preview URL, keyword match, and file type.
- `summarizeDispute()` creates an admin-assist dispute summary.
- `generateSealTrustScore()` computes a simple wallet-level trust score.

AI is only an assistant. Final approval and dispute decisions stay with a human admin/judge.

## Deliverable Lock

SealPay protects freelancer work by showing only watermarked/partial previews before payment release. Full files unlock only after approval and payment release.

No platform can fully prevent screenshots, but SealPay reduces misuse through protected previews, locked final files, blockchain proof, and reputation penalties.

## Web3 Escrow Flow

```text
Create Deal
-> AI Risk Score
-> Lock Payment
-> Submit Work Proof
-> AI Proof Review
-> Approve Work
-> Payment Released
-> Public Proof Timeline
-> Optional Dispute Resolution
```

The MVP uses mock/testnet-style transaction hashes and test MATIC labels. No real money moves.

## Demo Flow

1. Open `/`.
2. Go to `/dashboard`.
3. Review the 3-minute demo flow card.
4. Open `/create-deal` and create a new invoice.
5. Open the deal and lock payment as Client.
6. Switch to Freelancer and submit proof.
7. Review the AI Proof Review card.
8. Switch back to Client and approve work.
9. Show the payment released state and unlocked deliverable.
10. Open `/proof/[id]` to show the mini blockchain explorer.
11. Open `SP-1003` to show dispute summary and admin resolution.

Useful seeded routes:

- `/deal/SP-1001` - payment locked sample
- `/deal/SP-1002` - work submitted sample
- `/deal/SP-1003` - disputed sample
- `/proof/SP-1001` - public proof explorer sample

## Tech Stack

- Next.js + TypeScript
- Tailwind CSS
- Lucide icons
- LocalStorage mock store
- Deterministic local AI helper logic
- Solidity contract in `contracts/SealPayEscrow.sol`

## How To Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build check:

```bash
npm run build
```

## Mock Mode

Frontend runs in mock mode by default. Smart contract deployment is not required for the MVP. Mock mode includes:

- Mock wallet address
- Mock deal database in LocalStorage
- Mock transaction hashes
- Mock proof hashes
- Test MATIC labels for Polygon Amoy-style demo flow

This MVP does not use real money, real INR escrow, production payments, or production compliance.

## Security Posture

This MVP currently has no real authentication system, password storage, session cookies, password reset flow, backend API routes, or database queries. Because those systems are not present, there are no in-repo passwords to hash, sessions to expire, email verification tokens to configure, or database ownership checks to refactor yet.

Current hardening included in this repo:

- `proxy.ts` adds security headers, production HTTPS redirect handling, suspicious-path blocking, and lightweight request rate limiting.
- API, auth, and AI route groups are rate-limit grouped in the proxy so future server endpoints inherit abuse protection.
- Auth/API security events, rate-limit hits, HTTPS redirects, and suspicious paths are logged server-side with `console.warn`.
- `.env*` files are ignored except `.env.example`, and the example only exposes public mock settings through `NEXT_PUBLIC_`.
- Proof preview URLs are constrained to `http` or `https` links before being stored through the UI.

Before using SealPay with real users, add server-side authentication and enforce:

- Argon2id or bcrypt password hashing with per-user salts.
- Email verification before account activation.
- Short-lived sessions with secure, httpOnly, sameSite cookies.
- Expiring, single-use password reset tokens stored hashed on the server.
- Login, signup, reset, API, and AI-generation rate limits backed by Redis or another shared production store.
- Server-side ownership checks on every read, update, delete, approval, proof submission, dispute, and payout action.
- Server-only secrets for database URLs, service keys, wallet private keys, AI API keys, and webhook secrets.
- Private database networking or IP allow-listing so the database is not directly reachable from the public internet.

## Smart Contract Future Extension

`contracts/SealPayEscrow.sol` is included for Polygon Amoy/Sepolia testnet extension. It includes:

- `createDeal(address freelancer) payable`
- `submitWork(uint256 dealId, string memory proofHash)`
- `approveWork(uint256 dealId)`
- `raiseDispute(uint256 dealId, string memory reason)`
- `resolveDispute(uint256 dealId, bool releaseToFreelancer)`

Frontend runs in mock mode by default. Smart contract is included for Polygon Amoy/Sepolia testnet extension.

## Intentionally Not Included

- Real INR payment
- Real authentication
- Full backend
- MongoDB or Firebase setup
- Real IPFS upload
- Paid AI APIs
- DAO arbitration
- KYC
- Marketplace
- Production escrow compliance

## Future Scope

- MetaMask integration
- Polygon Amoy deployment
- IPFS/Filecoin proof storage
- Milestone-based smart contract payouts
- Admin dashboard for dispute review
- Freelancer profile and reputation history
- Payment proof integrations
- Compliance review for production escrow use
