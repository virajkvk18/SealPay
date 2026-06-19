"use client";

import { CheckCircle2, Wallet } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { formatWallet } from "@/lib/utils";

export default function WalletButton() {
  const { address, isAmoy, isConnecting, connect, switchToAmoy } = useWallet();

  if (address && !isAmoy) {
    return (
      <button
        type="button"
        onClick={switchToAmoy}
        className="wallet-button wallet-button-warning"
      >
        Switch to Amoy
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={isConnecting || Boolean(address)}
      className="wallet-button"
    >
      {address ? (
        <CheckCircle2 className="size-4" />
      ) : (
        <Wallet className="size-4" />
      )}
      {isConnecting
        ? "Connecting..."
        : address
          ? formatWallet(address)
          : "Connect Wallet"}
    </button>
  );
}
