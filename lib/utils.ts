import type { DealStatus, RiskLevel, TimelineEvent } from "@/lib/mockData";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatWallet(wallet: string) {
  if (!wallet) return "No wallet";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function formatAmount(amount: number) {
  return `${amount.toLocaleString("en-US", {
    maximumFractionDigits: 3,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })} POL`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function makeTxHash() {
  return `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;
}

export function makeFileHash() {
  return `bafysealpay${Array.from({ length: 14 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;
}

export function makeDealId() {
  return `SP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeTimelineEvent(
  event: Omit<TimelineEvent, "id" | "timestamp"> & { timestamp?: string },
): TimelineEvent {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `ev-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    ...event,
    id,
    timestamp: event.timestamp ?? nowIso(),
  };
}

export function statusTone(status: DealStatus) {
  const tones: Record<DealStatus, string> = {
    Created: "border-[#c4c7cb] bg-[#f2f4f6] text-[#43474b]",
    Assigned: "border-violet-200 bg-violet-100/60 text-violet-800",
    Locked: "border-amber-200 bg-amber-100/50 text-amber-800",
    "Payment Locked": "border-amber-200 bg-amber-100/50 text-amber-800",
    "Work Submitted": "border-[#47d6ff]/40 bg-[#b6ebff]/45 text-[#00566a]",
    Approved: "border-emerald-200 bg-emerald-100/60 text-emerald-800",
    "Payment Released": "border-emerald-200 bg-emerald-100/70 text-emerald-800",
    Disputed: "border-red-200 bg-[#ffdad6]/70 text-[#93000a]",
    Resolved: "border-[#edb1ff]/50 bg-[#f9d8ff]/70 text-[#6e208c]",
  };

  return tones[status];
}

export function getExplorerTxUrl(txHash: string) {
  const base =
    process.env.NEXT_PUBLIC_EXPLORER_BASE_URL ??
    "https://amoy.polygonscan.com/tx";
  return `${base.replace(/\/$/, "")}/${txHash}`;
}

export function riskTone(level: RiskLevel) {
  const tones: Record<RiskLevel, string> = {
    "Low Risk": "border-emerald-200 bg-emerald-100/70 text-emerald-800",
    "Medium Risk": "border-amber-200 bg-amber-100/60 text-amber-800",
    "High Risk": "border-red-200 bg-[#ffdad6]/80 text-[#93000a]",
  };

  return tones[level];
}

export function proofPath(id: string) {
  return `/proof/${encodeURIComponent(id)}`;
}
