# SealPay

<p align="center">
  <img src="public/sealpay-mark.png" width="110" alt="SealPay logo" />
</p>

<h1 align="center">Seal Pay</h1>

<p align="center">
  <strong>Secure freelance payments with smart-contract escrow, protected deliverables, proof trails, and AI-assisted review.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178c6?style=for-the-badge" />
  <img alt="Web3" src="https://img.shields.io/badge/Web3-Escrow-00a6c8?style=for-the-badge" />
  <img alt="MVP" src="https://img.shields.io/badge/Hackathon-MVP-8a2be2?style=for-the-badge" />
</p>

<p align="center">
  <img src="public/sealpay-landing-hero.png" width="900" alt="SealPay landing preview" />
</p>
## Problem

Freelance work often breaks down at the same trust point:

| Client Risk                       | Freelancer Risk                            |
| --------------------------------- | ------------------------------------------ |
| Paying before seeing enough proof | Sending full work before payment release   |
| Weak dispute evidence             | Late payments or non-payment               |
| No shared proof history           | Proof being copied, downloaded, or misused |

SealPay turns this trust gap into a visible escrow workflow.

## What SealPay Does

| Module                   | What It Does                                                                   | Why It Matters                                |
| ------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------- |
| Landing Page             | Explains the product and routes users into the MVP                             | Gives the demo a polished first impression    |
| Dashboard                | Shows locked value, invoices, activity, roles, and reputation                  | Makes the escrow workspace easy to present    |
| Create Invoice           | Lets a client define the work, wallets, amount, deadline, and deliverable type | Starts a structured escrow agreement          |
| Deal Vault               | Shows deal details, escrow status, risk, proof, disputes, and actions          | Central place for payment and proof decisions |
| Deliverable Lock         | Shows only watermarked/partial previews before release                         | Reduces misuse of freelancer work             |
| Pinata/IPFS Proof Upload | Pins submitted proof files and stores the returned CID                         | Makes work proof portable beyond the UI       |
| Public Proof Explorer    | Shows a blockchain-style timeline with hashes                                  | Makes the flow verifiable and shareable       |
| Reputation Page          | Summarizes completed work, disputes, and trust signals                         | Adds accountability beyond one transaction    |
| Solidity Contract        | Documents the future on-chain escrow extension                                 | Shows a realistic path from MVP to testnet    |

## Core Flow

```mermaid
flowchart LR
  A["Client creates invoice"] --> B["AI risk score"]
  B --> C["Client locks payment"]
  C --> D["Freelancer submits proof"]
  D --> E["Pinata/IPFS CID"]
  E --> F["Deliverable Lock preview"]
  F --> G["AI proof review"]
  G --> H{"Client decision"}
  H -->|Approve| I["Payment released"]
  H -->|Dispute| J["Admin/Judge review"]
  J --> K["Release or refund"]
  I --> L["Public proof timeline"]
  K --> L
```

## Deliverable Lock

SealPay protects freelancer work by separating the preview from the final file.

Before payment release:

- The client sees only a protected preview.
- Image/design work is blurred and watermarked.
- Code, documents, and videos show a preview card instead of the full file.
- The final file name is visible, but download stays disabled.
- Watermark includes the SealPay label, deal ID, and client wallet.

After payment release:

- The preview unlocks.
- The final deliverable download button becomes available.
- The deal timeline records the approval and release events.

Important limitation: no platform can fully prevent screenshots. SealPay reduces misuse through watermarked previews, locked final files, blockchain-style proof, and reputation penalties.

## AI Trust Engine

SealPay uses server-side Groq API routes for real AI proof review and dispute summaries. `GROQ_API_KEY` must stay server-side and must never be exposed with a `NEXT_PUBLIC_` prefix.

| Route / Function               | Purpose                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `POST /api/ai/proof-review`    | Sends deal and proof metadata to Groq and returns score, verdict, reasons, issues, and summary |
| `POST /api/ai/dispute-summary` | Sends dispute evidence and proof CID to Groq and returns an admin/judge summary                |
| `calculateRiskScore()`         | Scores deal risk using amount, deadline, scope detail, and wallet familiarity                  |
| `suggestMilestones()`          | Suggests single-release or milestone payment structure                                         |
| `generateSealTrustScore()`     | Creates a wallet-level trust score from deal history                                           |

AI is only an assistant. Final approval and dispute decisions stay with a human client or admin/judge.

## IPFS Proof Storage

The proof submission flow calls `POST /api/pinata/upload` before AI review and shows the user a clear three-step state: Uploading to IPFS, CID Generated, and AI Reviewing.

- With `PINATA_JWT` configured, the server uploads the selected proof file to Pinata and returns a CID plus gateway URL.
- With `NEXT_PUBLIC_ENABLE_MOCK_MODE=true` and no `PINATA_JWT`, the route returns a mock CID so the demo remains fully usable.
- The returned CID is stored as the deal proof hash and shown in both the Deal Vault and Public Proof Explorer.
- Supabase proof saving is treated as an optional cache. If that insert fails, the IPFS CID and AI review flow can still continue.
- Groq and Pinata failures are surfaced with clearer messages so demo operators can quickly identify missing keys or provider errors.

Local setup:

```bash
cp .env.example .env.local
```

Then add:

```text
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

## IPFS + AI Proof Flow

Freelancer uploads work proof -> SealPay uploads it to Pinata IPFS -> Pinata returns a CID -> the UI confirms CID Generated -> Groq reviews proof relevance -> the CID and AI review are cached when Supabase is configured -> client approves or raises dispute.

- IPFS gives the deal an immutable proof reference.
- The CID changes if the uploaded file changes.
- AI only assists; the human client or admin/judge makes the final decision.
- `PINATA_JWT` must stay server-side and must never be exposed in frontend code.

Create the Supabase proof table with:

```sql
create table if not exists proofs (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  proof_cid text not null,
  proof_url text not null,
  file_name text,
  ai_review jsonb,
  status text default 'submitted',
  created_at timestamptz default now()
);

alter table proofs enable row level security;

create policy "Allow public read proofs"
on proofs for select
using (true);

create policy "Allow public insert proofs"
on proofs for insert
with check (true);
```

## Pages Included

| Route          | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| `/`            | Polished product landing page                          |
| `/dashboard`   | Escrow workspace and invoice ledger                    |
| `/create-deal` | Create a new invoice/deal                              |
| `/deal/[id]`   | Deal vault, escrow actions, deliverable lock, disputes |
| `/proof/[id]`  | Public proof explorer for a deal timeline              |
| `/reputation`  | Wallet and workspace reputation view                   |

Create a deal from `/create-deal`, then open its deal vault and proof explorer using the generated deal ID.

## Why This MVP Is Feasible

SealPay is feasible for a hackathon because the demo focuses on the core trust workflow instead of trying to build a full financial institution on day one.

| MVP Decision                  | Why It Works                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| LocalStorage mock store       | Fast to demo without backend setup                                      |
| Wallet-first identity flow    | Lets judges understand the Web3 identity model from the first screen    |
| Mock transaction hashes       | Demonstrates proof trail behavior before testnet deployment             |
| Server-side Groq AI routes    | Gives real AI proof review while keeping API keys off the frontend      |
| Solidity contract included    | Gives a clear path to real testnet escrow                               |
| Deliverable Lock UI           | Demonstrates a real freelancer pain point with low technical overhead   |

## Production Path

```mermaid
flowchart TB
  MVP["Current MVP"] --> Roles["Wallet-based role gating"]
  MVP --> DB["Optional Supabase cache"]
  MVP --> Wallet["MetaMask wallet signing"]
  MVP --> Chain["Polygon Amoy escrow deployment"]
  Roles --> Ownership["Server-side ownership checks"]
  DB --> Ownership
  Chain --> Proof["On-chain proof and payout events"]
  Wallet --> Proof
  Ownership --> Prod["Production-ready SealPay"]
  Proof --> Prod
```

To move from MVP to production, SealPay would need real auth, a backend database, server-side ownership checks, deployed contracts, real file storage, real payment/compliance review, and production monitoring.

## Tech Stack

| Layer                | Technology                                    |
| -------------------- | --------------------------------------------- |
| App Framework        | Next.js App Router                            |
| Language             | TypeScript                                    |
| UI                   | Tailwind CSS, Lucide icons                    |
| State                | LocalStorage mock store                       |
| AI Logic             | Server-side Groq API routes                   |
| Proof Storage        | Pinata API route with mock-CID fallback       |
| Web3 Contract        | Solidity escrow contract                      |
| Deployment Hardening | Next proxy security headers and rate limiting |

## Project Structure

```text
app/
  api/pinata/upload/route.ts Pinata/IPFS upload endpoint
  page.tsx              Landing page
  dashboard/page.tsx    Escrow dashboard
  create-deal/page.tsx  Invoice creation
  deal/[id]/page.tsx    Deal vault and escrow actions
  proof/[id]/page.tsx   Public proof explorer
  reputation/page.tsx   Reputation dashboard

components/
  Navbar.tsx
  WalletButton.tsx
  CreateDealForm.tsx
  SubmitProofModal.tsx
  DisputeModal.tsx

lib/
  aiEngine.ts           Risk, proof, dispute, and trust scoring
  mockData.ts           Shared deal, proof, role, and timeline types
  store.ts              Local mock persistence
  utils.ts              Formatting and hash helpers

contracts/
  SealPayEscrow.sol     Future on-chain escrow contract

proxy.ts                Security headers, HTTPS redirect, rate limiting
```

## How To Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Build check:

```bash
npm run build
```

Lint check:

```bash
npm run lint
```

## Demo Script

1. Open `/` and show the landing page.
2. Click into `/dashboard`.
3. Show locked value, invoice list, role switcher, and reputation score.
4. Open `/create-deal` and create a new invoice.
5. Open the new deal and lock payment as Client.
6. Switch to Freelancer and submit proof with preview URL and final file name.
7. Attach a proof file and show the states: Uploading to IPFS, CID Generated, and AI Reviewing.
8. Show the generated IPFS CID, gateway link, SealTrust score, AI verdict, reasons, and issues.
9. Show the Deliverable Lock card before release.
10. Switch back to Client and approve work.
11. Show the unlocked deliverable state.
12. Open `/proof/[id]` to show the public proof timeline.
13. Open a disputed deal to show the AI dispute summary and admin/judge resolution.

Role explanation:

> My role was IPFS proof storage and AI verification. When the freelancer uploads proof, SealPay sends the file to Pinata IPFS and receives a unique CID. This CID is saved in our backend and can also be submitted on-chain, so the proof cannot be silently changed later. AI checks whether the proof looks relevant to the deal and creates a short dispute summary if conflict happens.

## Demo Mode

SealPay currently runs in demo mode by default. It includes:

- Wallet-first identity and role-based UI
- LocalStorage deal database
- Mock transaction hashes
- Real Pinata uploads when `PINATA_JWT` is configured
- Mock proof CIDs only when Pinata is not configured and mock mode is enabled
- Real Groq AI proof and dispute review when `GROQ_API_KEY` is configured
- Test MATIC labels for Polygon Amoy-style demo flow

No real money moves in the MVP.

## Security Posture

This MVP currently has no real authentication system, password storage, session cookies, password reset flow, backend API routes, or database queries. Because those systems are not present, there are no in-repo passwords to hash, sessions to expire, email verification tokens to configure, or database ownership checks to refactor yet.

Current hardening included in this repo:

- `proxy.ts` adds security headers, production HTTPS redirect handling, suspicious-path blocking, and lightweight request rate limiting.
- API, auth, and AI route groups are rate-limit grouped in the proxy so future server endpoints inherit abuse protection.
- Auth/API security events, rate-limit hits, HTTPS redirects, and suspicious paths are logged server-side with `console.warn`.
- `.env*` files are ignored except `.env.example`, and the example only exposes public mock settings through `NEXT_PUBLIC_`.
- Proof preview URLs are constrained to `http` or `https` links before being stored through the UI.
- Root layout suppresses hydration warnings caused by browser extensions injecting attributes before React loads.

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

`contracts/SealPayEscrow.sol` is included for Polygon Amoy/Sepolia testnet extension. It supports:

| Contract Function                                          | Purpose                                       |
| ---------------------------------------------------------- | --------------------------------------------- |
| `createDeal(address freelancer) payable`                   | Client creates an escrow deal and locks funds |
| `submitWork(uint256 dealId, string memory proofHash)`      | Freelancer submits proof hash                 |
| `approveWork(uint256 dealId)`                              | Client approves work and releases funds       |
| `raiseDispute(uint256 dealId, string memory reason)`       | Client or freelancer raises a dispute         |
| `resolveDispute(uint256 dealId, bool releaseToFreelancer)` | Admin resolves the dispute                    |

## What Is Intentionally Not Included Yet

- Real INR payment
- Real authentication
- Full backend
- MongoDB, PostgreSQL, Supabase, or Firebase setup
- Paid AI APIs
- DAO arbitration
- KYC
- Marketplace
- Production escrow compliance

## Future Scope

- Contract write integration for lock payment, submit proof, approve, refund
- Polygon Amoy deployment
- Encrypted final deliverables and stronger IPFS/Filecoin proof storage
- Milestone-based smart contract payouts
- Backend API with ownership checks
- Admin dashboard for dispute review
- Freelancer profile and reputation history
- Payment proof integrations
- Production logging and monitoring dashboard
- Compliance review for real escrow/payment use

## License

This project is provided as a hackathon MVP and proof-of-concept. Review legal, payment, privacy, and compliance requirements before using it with real users or real funds.
