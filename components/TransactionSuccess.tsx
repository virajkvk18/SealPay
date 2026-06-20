"use client";

import { CheckCircle2, Copy, ExternalLink, X } from "lucide-react";
import { formatAmount, formatWallet, getExplorerTxUrl } from "@/lib/utils";

export default function TransactionSuccess({
  type,
  amount,
  dealTitle,
  freelancerWallet,
  txHash,
  onClose,
}: {
  type: "locked" | "released";
  amount: number;
  dealTitle: string;
  freelancerWallet?: string;
  txHash?: string;
  onClose: () => void;
}) {
  const locked = type === "locked";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#010b13]/75 p-4 backdrop-blur-sm">
      <article className="w-full max-w-lg rounded-[2rem] border border-emerald-300/20 bg-[#071722] p-6 text-white shadow-2xl">
        <div className="flex justify-between gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="size-6" />
          </span>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2 className="mt-5 text-2xl font-black">
          Payment {locked ? "Locked" : "Released"} Successfully
        </h2>
        <p className="mt-3 leading-7 text-slate-300">
          {locked
            ? "Funds are now secured in smart contract escrow. The freelancer can safely begin work."
            : "The freelancer has been paid and the deal is now completed."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Amount</p>
            <p className="mt-2 font-black">{formatAmount(amount)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              {locked ? "Deal" : "Freelancer"}
            </p>
            <p className="mt-2 font-black">
              {locked ? dealTitle : formatWallet(freelancerWallet ?? "")}
            </p>
          </div>
        </div>
        {txHash ? (
          <div className="mt-4 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              Blockchain record generated
            </p>
            <p className="mt-2 font-mono text-sm">{formatWallet(txHash)}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="secondary-button border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
              >
                <Copy className="size-4" />
                Copy Transaction Hash
              </button>
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="primary-button px-4 py-2 text-sm"
              >
                View Blockchain Record
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Blockchain record will appear after transaction confirmation.
          </p>
        )}
      </article>
    </div>
  );
}
