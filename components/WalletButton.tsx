"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/wallet";
import { formatWallet } from "@/lib/utils";

export default function WalletButton() {
  const [wallet, setWallet] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  async function handleConnectWallet() {
    setError("");
    setIsConnecting(true);

    try {
      const account = await connectWallet();
      setWallet(account);
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : "Could not connect wallet. Please try again.";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-xs font-black text-white shadow-lg shadow-cyan-900/10 transition hover:bg-[#00677f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isConnecting ? "Connecting..." : wallet ? formatWallet(wallet) : "Connect Wallet"}
      </button>
      {error ? (
        <p className="max-w-48 text-right text-xs font-bold leading-5 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
