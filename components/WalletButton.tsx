"use client";

import { useSyncExternalStore } from "react";
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
      className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-xs font-black text-white shadow-lg shadow-cyan-900/10 transition hover:bg-[#00677f] active:scale-95"
    >
      {wallet ? formatWallet(wallet) : "Mock Wallet"}
    </button>
  );
}
