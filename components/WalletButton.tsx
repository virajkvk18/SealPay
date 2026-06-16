"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { formatWallet } from "@/lib/utils";

const walletKey = "sealpay-wallet-v1";
const walletChangedEvent = "sealpay-wallet-change";
const demoWallet = "0x9D13C8cA88f6E3F575A1e86f2022A1f846D7A901";

function subscribeWallet(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(walletChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(walletChangedEvent, onStoreChange);
  };
}

function getWalletSnapshot() {
  return window.localStorage.getItem(walletKey) ?? "";
}

function getServerWalletSnapshot() {
  return "";
}

export default function WalletButton() {
  const wallet = useSyncExternalStore(
    subscribeWallet,
    getWalletSnapshot,
    getServerWalletSnapshot,
  );

  function toggleWallet() {
    if (wallet) {
      window.localStorage.removeItem(walletKey);
      window.dispatchEvent(new Event(walletChangedEvent));
      return;
    }

    window.localStorage.setItem(walletKey, demoWallet);
    window.dispatchEvent(new Event(walletChangedEvent));
  }

  return (
    <button
      type="button"
      onClick={toggleWallet}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#010b13] px-4 text-sm font-bold text-[#010b13] shadow-lg shadow-cyan-900/10 transition hover:bg-[#00677f]"
    >
      {wallet ? <CheckCircle2 className="size-4" /> : <Wallet className="size-4" />}
      <span>{wallet ? formatWallet(wallet) : "Mock Wallet"}</span>
    </button>
  );
}
