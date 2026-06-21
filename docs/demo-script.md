# SealPay Demo Script - IPFS Proof Layer

## 30-Second Role Intro

My part of SealPay is the proof layer. When a freelancer submits work, SealPay uploads the proof file to Pinata IPFS, receives an immutable CID, and shows that CID in the deal vault and public proof page. The CID can later be submitted to the smart contract, so the proof trail can be verified without trusting a centralized database.

## Live Demo Flow

1. Open the landing page and explain the wallet-first flow.
2. Go to the dashboard and open or create a deal.
3. As the client, lock payment in escrow.
4. Switch to the freelancer flow and click Submit Work.
5. Add a preview URL, proof note, deliverable type, and proof file.
6. Submit and show the progress states:
   - Uploading to IPFS
   - CID Generated
   - Proof Record Saving
7. Point to the generated CID and Pinata gateway link.
8. Open the public proof page and show that the CID and proof trail remain visible for independent verification.
9. Explain that Supabase is only a cache/indexer for the demo.
10. Explain that the production direction is smart contract state plus emitted events as the source of truth.
11. Return to the client flow and approve the work to show payment release.

## What To Say For Judges

SealPay separates storage, indexing, and payment logic. IPFS stores the proof reference, the escrow contract controls payment, and Supabase is treated only as an optional cache for faster demo reads. If the uploaded file changes, the CID changes, so the proof cannot be silently replaced.

The decentralized path is:

- Wallet address is the user identity.
- Pinata/IPFS stores proof files and returns CIDs.
- The smart contract stores escrow state and proof CIDs.
- Contract events replace the database as the authoritative timeline.
- Supabase can still index events for UX, but it should not be the source of truth.

## Failure Handling

- If Pinata is not configured, the UI shows a clear IPFS upload setup error instead of generating a fake CID.
- If Supabase proof caching fails, the app logs the cache error but does not block the proof submission flow.
- The public proof page can load the saved proof by deal ID, so another laptop can verify the same CID.

## Final Line

My contribution makes the freelancer proof flow demo-ready: the proof is pinned to IPFS, the CID is visible, and the flow is ready for contract-event based verification.
