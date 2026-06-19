# SealPay Demo Script - IPFS + AI Role

My role was IPFS proof storage and AI verification. When the freelancer uploads proof, SealPay sends the file to Pinata IPFS and receives a unique CID. This CID is saved in our backend and can also be submitted on-chain, so the proof cannot be silently changed later. AI checks whether the proof looks relevant to the deal and creates a short dispute summary if conflict happens.

## Demo Flow

1. Open a locked deal as the Freelancer.
2. Click Submit Work Proof.
3. Upload a proof file and submit it with a preview URL.
4. SealPay sends the file to the server-only Pinata API route.
5. Pinata returns a CID and gateway URL.
6. SealPay stores the CID as the proof hash and shows it in the Deal Vault.
7. AI reviews whether the uploaded proof looks relevant to the deal.
8. Open the Public Proof Explorer to show the CID, gateway link, AI score, verdict, and timeline.
9. If a dispute is raised, AI creates a short summary and recommendation for the admin/judge.
