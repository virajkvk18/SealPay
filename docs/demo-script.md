# SealPay Demo Script - IPFS + AI

## 30-Second Role Intro

My part of SealPay is the proof layer. When a freelancer submits work, SealPay uploads the proof file to Pinata IPFS, receives an immutable CID, and then asks Groq AI to review whether the proof matches the deal requirements. The AI does not make the final decision. It gives the client or admin a SealTrust score, verdict, summary, reasons, and issues to check.

## Live Demo Flow

1. Open the landing page and explain the wallet-first flow.
2. Go to the dashboard and open or create a deal.
3. As the client, lock payment in the demo escrow flow.
4. Switch to the freelancer flow and click Submit Work Proof.
5. Add a preview URL, proof note, deliverable type, and proof file.
6. Submit and show the progress states:
   - Uploading to IPFS
   - CID Generated
   - AI Reviewing
7. Point to the generated CID and Pinata gateway link.
8. Show the AI Proof Review card:
   - SealTrust Score
   - Verdict
   - Review summary
   - Reasons
   - Issues to check
9. Open the public proof page and show that the CID and proof trail remain visible for independent verification.
10. Raise a dispute and show the AI dispute summary for the admin/judge.
11. Return to the client flow and approve the work to show payment release.

## What To Say For Judges

SealPay separates storage, review, and payment logic. IPFS stores the proof reference, Groq AI reviews the proof metadata, and the escrow flow controls release. This means the proof cannot be silently changed after submission because a different file would produce a different CID.

Supabase is only an optional cache for proof records. If Supabase fails, the app still keeps the IPFS result and can continue the demo flow. That keeps the Web3 proof path independent from a centralized database.

## Failure Handling

- If Pinata is not configured, the UI shows a clear IPFS upload setup error instead of generating a fake CID.
- If Groq is not configured, the UI shows an AI review error that points to the missing or failing API key.
- If Supabase proof caching fails, the app logs the cache error but does not block the proof submission flow.
- The public proof page can load the saved proof and AI review from Supabase by deal ID, so another laptop can verify the same proof record.

## Final Line

My contribution makes the freelancer proof flow demo-ready: the proof is pinned, the CID is visible, AI review is readable, and the dispute summary helps a judge/admin make a faster decision.
