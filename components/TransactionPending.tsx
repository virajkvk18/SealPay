"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { formatWallet } from "@/lib/utils";

export type TransactionUiPhase = "wallet" | "confirming";

export default function TransactionPending({
  action,
  phase,
  txHash,
}: {
  action: string;
  phase: TransactionUiPhase;
  txHash?: string;
}) {
  const waitingForWallet = phase === "wallet";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#1e1233]/80 p-4 backdrop-blur-md">
      <article
        role="status"
        aria-live="polite"
        className="w-full max-w-md rounded-[2rem] border border-violet-300/20 bg-[#1c1230] p-7 text-center text-white shadow-2xl"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-200">
          {waitingForWallet ? (
            <ShieldCheck className="size-7" />
          ) : (
            <LoaderCircle className="size-7 animate-spin" />
          )}
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          {action}
        </p>
        <h2 className="mt-3 text-2xl font-black">
          {waitingForWallet
            ? "Waiting for wallet confirmation..."
            : "Transaction submitted. Waiting for blockchain confirmation..."}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {waitingForWallet
            ? "Review the transaction details in your wallet to continue."
            : "Keep this page open while the transaction receipt is confirmed."}
        </p>
        {txHash ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-slate-300">
            {formatWallet(txHash)}
          </p>
        ) : null}
      </article>
    </div>
  );
}
