export type DealStatus =
  | "Created"
  | "Assigned"
  | "Payment Locked"
  | "Work Submitted"
  | "Approved"
  | "Payment Released"
  | "Disputed"
  | "Resolved";

export type ApplicationStatus = "pending" | "selected" | "rejected";

export interface DealApplication {
  id: string;
  freelancerName?: string;
  freelancerWallet: string;
  proposal: string;
  estimatedDelivery: string;
  proposedPrice?: number;
  note?: string;
  trustScore?: number;
  status: ApplicationStatus;
  createdAt: string;
}

export type DeliverableType =
  | "Design"
  | "Code"
  | "Document"
  | "Video"
  | "Other";

export type Role = "Client" | "Freelancer" | "Admin/Judge";

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk";

export type TimelineActor = "Client" | "Freelancer" | "Admin/Judge" | "System";

export interface RiskScore {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  status: DealStatus;
  actor: TimelineActor;
  timestamp: string;
  txHash?: string;
}

export interface WorkProof {
  title: string;
  note: string;
  fileName?: string;
  finalFileName: string;
  deliverableType: DeliverableType;
  previewUrl: string;
  fileHash: string;
  gatewayUrl?: string;
  storageProvider?: "pinata";
  txHash?: string;
  submittedAt: string;
}

export interface AiProofReview {
  status: string;
  score: number;
  reasons: string[];
  verdict?: string;
  issues?: string[];
  summary?: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  clientName: string;
  freelancerName: string;
  clientWallet: string;
  freelancerWallet: string;
  selectedFreelancerWallet?: string;
  applications?: DealApplication[];
  dealKind?: "Direct" | "Public";
  category?: string;
  amount: number;
  deadline: string;
  deliverableType: DeliverableType;
  status: DealStatus;
  risk: RiskScore;
  createdTxHash: string;
  onChainDealId?: string;
  previewUrl?: string;
  finalFileName?: string;
  proof?: WorkProof;
  aiProofReview?: AiProofReview;
  disputeReason?: string;
  disputeEvidence?: string;
  aiDisputeSummary?: string;
  aiDisputeRecommendation?: string;
  resolution?: "Released to freelancer" | "Refunded client";
  timeline: TimelineEvent[];
}

export const demoModeNotice =
  "Deal events and proof records remain visible for independent verification.";

export const roles: Role[] = ["Client", "Freelancer", "Admin/Judge"];

export const deliverableTypes: DeliverableType[] = [
  "Design",
  "Code",
  "Document",
  "Video",
  "Other",
];

export const initialDeals: Deal[] = [
  {
    id: "SP-1001",
    title: "Logo design deal",
    description:
      "Create a clean brand mark and social avatar set for a student-led stationery store.",
    clientName: "Aarav Mehta",
    freelancerName: "Riya Studio",
    clientWallet: "0x4A9f2C8b9E11D7aC6612A01F882B84d239d4b7a1",
    freelancerWallet: "0x8B21C7aF9480d139D4eC7E10f7b6fF8f41710B91",
    amount: 0.42,
    deadline: "2026-06-24",
    deliverableType: "Design",
    status: "Payment Locked",
    risk: {
      score: 28,
      level: "Low Risk",
      reasons: ["Moderate amount", "Clear scope", "Known freelancer wallet"],
    },
    createdTxHash:
      "0x5e42b4a87031d0113a6e2f94544f5239e6a17d81f931c225f8a681bb9de42101",
    timeline: [
      {
        id: "ev-sp1001-1",
        title: "Deal created",
        description: "Client created escrow terms for logo design delivery.",
        status: "Created",
        actor: "Client",
        timestamp: "2026-06-14T10:16:00+05:30",
        txHash:
          "0x5e42b4a87031d0113a6e2f94544f5239e6a17d81f931c225f8a681bb9de42101",
      },
      {
        id: "ev-sp1001-2",
        title: "Payment locked",
        description: "Payment protected by smart contract escrow.",
        status: "Payment Locked",
        actor: "Client",
        timestamp: "2026-06-14T10:21:00+05:30",
        txHash:
          "0x91d11bf1031b6011d02f421347a58902ce77d5ea0d12513e5ad537c7ce28a990",
      },
    ],
  },
  {
    id: "SP-1002",
    title: "Escrow dashboard build",
    description:
      "Build a responsive escrow dashboard with invoice cards, proof vault panels, and handoff notes.",
    clientName: "Nisha Rao",
    freelancerName: "DevWorks Lab",
    clientWallet: "0x72c9A211b8F7b1893B26bFbb9C302dcE725D67e2",
    freelancerWallet: "0x13aB44e5bC8B58a2a7cEe4dEFA33191DD78D1010",
    amount: 1.8,
    deadline: "2026-06-21",
    deliverableType: "Code",
    status: "Work Submitted",
    risk: {
      score: 47,
      level: "Medium Risk",
      reasons: [
        "Higher value deal",
        "Short delivery window",
        "Detailed description",
      ],
    },
    createdTxHash:
      "0x44db3b8ba04202cf1ca452f02b71fe228273d2ab604ce6c8b852c9002eed9bc2",
    proof: {
      title: "Dashboard preview",
      note: "Vercel preview link and exported source ZIP name attached for review.",
      fileName: "sealpay-dashboard-preview.zip",
      finalFileName: "sealpay-dashboard-final.zip",
      deliverableType: "Code",
      previewUrl: "https://images.unsplash.com/photo-1559028012-481c04fa702d",
      fileHash: "bafysealpay7158c829d4e4",
      txHash:
        "0x83f7a0db61a3c5f919dc10ce2e6ebff8c294db0f77f84d510553511c66bbbc70",
      submittedAt: "2026-06-15T18:42:00+05:30",
    },
    previewUrl: "https://images.unsplash.com/photo-1559028012-481c04fa702d",
    finalFileName: "sealpay-dashboard-final.zip",
    aiProofReview: {
      status: "Proof looks valid",
      score: 84,
      reasons: [
        "Delivery note explains the submitted proof.",
        "File type matches the expected deliverable.",
        "Preview link is attached for review.",
        "Proof wording matches the original work description.",
      ],
    },
    timeline: [
      {
        id: "ev-sp1002-1",
        title: "Deal created",
        description: "Escrow dashboard invoice created with code deliverables.",
        status: "Created",
        actor: "Client",
        timestamp: "2026-06-13T15:00:00+05:30",
        txHash:
          "0x44db3b8ba04202cf1ca452f02b71fe228273d2ab604ce6c8b852c9002eed9bc2",
      },
      {
        id: "ev-sp1002-2",
        title: "Payment locked",
        description: "Payment protected before development started.",
        status: "Payment Locked",
        actor: "Client",
        timestamp: "2026-06-13T15:08:00+05:30",
        txHash:
          "0x67710dabddcb4239c91a1fb250b6580f9493bd076feea94ac18a49870051a331",
      },
      {
        id: "ev-sp1002-3",
        title: "Work proof submitted",
        description:
          "Freelancer submitted preview link and source archive hash.",
        status: "Work Submitted",
        actor: "Freelancer",
        timestamp: "2026-06-15T18:42:00+05:30",
        txHash:
          "0x83f7a0db61a3c5f919dc10ce2e6ebff8c294db0f77f84d510553511c66bbbc70",
      },
    ],
  },
  {
    id: "SP-1003",
    title: "Video editing project",
    description:
      "Edit a 90-second campus event reel with captions, music sync, and two revision passes.",
    clientName: "Campus Media Club",
    freelancerName: "FrameCut Studio",
    clientWallet: "0x60Ef98b7A060a93bdCA07C06368d73a1bF39e173",
    freelancerWallet: "0x91b7f08D3421a51C7c07CE640c7Ce967f03aD201",
    amount: 0.75,
    deadline: "2026-06-18",
    deliverableType: "Video",
    status: "Disputed",
    risk: {
      score: 62,
      level: "Medium Risk",
      reasons: [
        "Tight deadline",
        "Revision-heavy scope",
        "Newer freelancer wallet",
      ],
    },
    createdTxHash:
      "0xbf23600f4b436db38c12fd32a909f5040ec2d33ae96ffb723c215f7791dd3122",
    proof: {
      title: "Watermarked event reel",
      note: "Low-res preview shared while final export remains locked.",
      fileName: "event-reel-watermarked.mp4",
      finalFileName: "event-reel-final-4k.mp4",
      deliverableType: "Video",
      previewUrl:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
      fileHash: "bafysealpay1829ad4ce3a8",
      txHash:
        "0xe3db9a28f1f64b617d24309ced2496da124fedc8bb9f6cd5fa86001aa5174c2c",
      submittedAt: "2026-06-15T21:10:00+05:30",
    },
    previewUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    finalFileName: "event-reel-final-4k.mp4",
    aiProofReview: {
      status: "Proof looks valid",
      score: 78,
      reasons: [
        "Delivery note explains the submitted proof.",
        "File type matches the expected deliverable.",
        "Preview link is attached for review.",
        "Proof has a partial match with the work description.",
      ],
    },
    disputeReason: "Client requested a color correction pass before release.",
    disputeEvidence: "Freelancer attached first cut and revision notes.",
    aiDisputeSummary:
      "Buyer/Seller issue: Campus Media Club requested a color correction review before release. Evidence available: Freelancer attached first cut and revision notes. Timeline observation: dispute was raised after work proof was submitted. Suggested admin action: compare the preview against the revision notes, then either release to freelancer or refund the client.",
    timeline: [
      {
        id: "ev-sp1003-1",
        title: "Deal created",
        description: "Video editing escrow created for campus event reel.",
        status: "Created",
        actor: "Client",
        timestamp: "2026-06-12T12:05:00+05:30",
        txHash:
          "0xbf23600f4b436db38c12fd32a909f5040ec2d33ae96ffb723c215f7791dd3122",
      },
      {
        id: "ev-sp1003-2",
        title: "Payment locked",
        description: "Payment protected by smart contract escrow.",
        status: "Payment Locked",
        actor: "Client",
        timestamp: "2026-06-12T12:12:00+05:30",
        txHash:
          "0xc6071e150020474cd26c5a09ce560cc29737da367d0139625423b17f87529a4a",
      },
      {
        id: "ev-sp1003-3",
        title: "Work proof submitted",
        description: "Watermarked preview and file hash submitted.",
        status: "Work Submitted",
        actor: "Freelancer",
        timestamp: "2026-06-15T21:10:00+05:30",
        txHash:
          "0xe3db9a28f1f64b617d24309ced2496da124fedc8bb9f6cd5fa86001aa5174c2c",
      },
      {
        id: "ev-sp1003-4",
        title: "Dispute raised",
        description: "Client asked an admin judge to review revision evidence.",
        status: "Disputed",
        actor: "Client",
        timestamp: "2026-06-15T22:05:00+05:30",
        txHash:
          "0xa2f451b35cab21cfcadfc2b48303e7d83e3b3977d490a9207e424e0f076d54f1",
      },
    ],
  },
];
