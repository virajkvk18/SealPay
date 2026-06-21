"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Network,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { formatWallet } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";

const identityRules = [
  "No email, password, OTP, or centralized account",
  "Your connected address is your only identity",
  "Your role is selected before the wallet session begins",
  "Every value-moving action requires a wallet signature",
];

export default function WalletOnboardingPage() {
  const {
    address,
    chainId,
    error,
    isAmoy,
    isConnecting,
    connect,
    switchToAmoy,
  } = useWallet();

  return (
    <main className="web3-shell protocol-grid relative overflow-hidden">
      <header className="relative z-10 border-b border-violet-100/10 bg-black/15 backdrop-blur-2xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/sealpay-mark.png"
              alt="SealPay logo"
              width={48}
              height={48}
              className="size-12 object-contain drop-shadow-[0_10px_24px_rgba(139,92,246,0.28)]"
              priority
            />
          </Link>
          <Link
            href="/"
            className="secondary-button border-white/15 bg-white/5 px-4 py-2 text-sm text-white"
          >
            <ArrowLeft className="size-4" />
            Back home
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
        <div>
          <div className="chain-chip inline-flex">
            <ShieldCheck className="size-3.5" />
            Wallet-native access
          </div>
          <h1 className="brand-font mt-7 max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            One wallet. No account.{" "}
            <span className="gradient-text">Pure Web3 identity.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
            SealPay combines your connected address with the client or
            freelancer path selected on the landing page.
          </p>

          <div className="mt-8 grid gap-3">
            {identityRules.map((rule) => (
              <p
                key={rule}
                className="flex items-start gap-3 text-sm font-semibold text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-300" />
                {rule}
              </p>
            ))}
          </div>
        </div>

        <section className="glass-panel-dark rounded-[2rem] p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                Access protocol
              </p>
              <h2 className="brand-font mt-3 text-3xl font-black text-white">
                Connect your wallet
              </h2>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-violet-300/10 text-violet-200 ring-1 ring-violet-200/15">
              <Wallet className="size-5" />
            </span>
          </div>

          <div className="mt-8 rounded-3xl border border-violet-100/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`size-2.5 rounded-full ${address ? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`}
                />
                <div>
                  <p className="text-sm font-black text-white">
                    {address ? "Wallet connected" : "No wallet connected"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {address ? formatWallet(address) : "0x..."}
                  </p>
                </div>
              </div>
              {address ? (
                <span className="chain-chip inline-flex">
                  Chain {parseInt(chainId, 16)}
                </span>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3">
            {!address ? (
              <button
                type="button"
                onClick={connect}
                disabled={isConnecting}
                className="primary-button min-h-13 w-full"
              >
                <Wallet className="size-4" />
                {isConnecting ? "Requesting wallet..." : "Connect MetaMask"}
              </button>
            ) : !isAmoy ? (
              <button
                type="button"
                onClick={switchToAmoy}
                className="primary-button min-h-13 w-full"
              >
                <Network className="size-4" />
                Switch to Web3 Network
              </button>
            ) : (
              <Link href="/" className="primary-button min-h-13 w-full">
                Choose Client or Freelancer
                <ArrowRight className="size-4" />
              </Link>
            )}

            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="secondary-button min-h-12 border-white/10 bg-white/5 text-sm text-slate-200"
            >
              View Blockchain Explorer
              <ExternalLink className="size-4" />
            </a>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Connecting is free. SealPay requests a signature only when you
            perform an on-chain action.
          </p>
        </section>
      </section>
    </main>
  );
}
