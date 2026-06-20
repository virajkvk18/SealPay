"use client";

import { CheckCircle2, Wallet } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { formatWallet } from "@/lib/utils";

export default function WalletButton({
  compactOnly = false,
}: {
  compactOnly?: boolean;
}) {
  const { address, isAmoy, isConnecting, connect, switchToAmoy } = useWallet();

  if (compactOnly && !address) return null;

  if (address && !isAmoy && !compactOnly) {
    return (
      <button
        type="button"
        onClick={switchToAmoy}
        className="wallet-button wallet-button-warning"
      >
        Switch Network
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={isConnecting || Boolean(address)}
      className={address ? "wallet-button wallet-chip" : "wallet-button"}
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
