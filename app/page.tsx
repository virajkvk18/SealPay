import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Blocks,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  FileKey2,
  Fingerprint,
  Gavel,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const protocolSteps = [
  {
    title: "Create and fund",
    detail: "Client defines the deal and locks testnet funds.",
    icon: LockKeyhole,
  },
  {
    title: "Submit proof",
    detail: "Freelancer pins proof to IPFS and submits its CID.",
    icon: FileKey2,
  },
  {
    title: "Review or dispute",
    detail: "Client approves work or opens transparent arbitration.",
    icon: Gavel,
  },
  {
    title: "Settle on-chain",
    detail: "The contract releases payment or returns escrowed funds.",
    icon: Blocks,
  },
];

const trustCards = [
  {
    title: "Wallet-native roles",
    description:
      "Client, freelancer, and arbitrator permissions come from wallet addresses in each deal.",
    icon: Wallet,
  },
  {
    title: "Verifiable proof",
    description:
      "IPFS content identifiers and contract events create a public, tamper-evident history.",
    icon: Fingerprint,
  },
  {
    title: "Non-custodial escrow",
    description:
      "Funds remain governed by contract rules rather than a platform-controlled account.",
    icon: ShieldCheck,
  },
];

const floatingSignals = [
  {
    title: "Escrow locked",
    detail: "Funds protected",
    icon: LockKeyhole,
    className: "hero-signal-left-top",
  },
  {
    title: "AI trust score",
    detail: "92 · Excellent",
    icon: BrainCircuit,
    className: "hero-signal-right-top",
  },
  {
    title: "IPFS proof",
    detail: "CID verified",
    icon: FileKey2,
    className: "hero-signal-left-bottom",
  },
  {
    title: "Amoy payout",
    detail: "Ready to settle",
    icon: CircleDollarSign,
    className: "hero-signal-right-bottom",
  },
];

const protocolSignals = [
  "Wallet-native identity",
  "Non-custodial escrow",
  "IPFS proof storage",
  "Polygon Amoy settlement",
  "Public transaction trail",
];

export default function Home() {
  return (
    <main className="web3-shell protocol-grid relative overflow-hidden">
      <Navbar />

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:pb-28 lg:pt-16">
        <div>
          <div className="chain-chip inline-flex">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
            Built for Polygon Amoy
          </div>
          <h1 className="brand-font mt-7 max-w-3xl text-5xl font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Trust the contract,{" "}
            <span className="gradient-text">not the promise.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            SealPay protects freelance deals with wallet-native identity,
            testnet escrow, IPFS proof, and transparent dispute resolution.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/auth" className="primary-button min-h-12 px-6">
              <Wallet className="size-4" />
              Connect wallet
            </Link>
            <Link
              href="/dashboard"
              className="secondary-button min-h-12 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
            >
              Explore protocol
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-400">
            {["No password", "No custodial account", "No payment gateway"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-cyan-300" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="hero-visual-stage relative mx-auto w-full max-w-[590px]">
          <div className="hero-orbit hero-orbit-outer" />
          <div className="hero-orbit hero-orbit-inner" />
          <Image
            src="/sealpay-web3-dashboard-square.webp"
            alt="SealPay Web3 escrow dashboard surrounded by smart contract, IPFS, AI trust, Polygon, payout, and wallet features"
            width={900}
            height={900}
            priority
            sizes="(max-width: 1024px) 92vw, 540px"
            className="hero-dashboard-visual mx-auto aspect-square w-full rounded-[2rem] object-cover"
          />

          <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-0 lg:block">
            {floatingSignals.map((signal) => {
              const Icon = signal.icon;

              return (
                <div
                  key={signal.title}
                  className={`hero-signal-card ${signal.className}`}
                >
                  <span className="hero-signal-icon">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <strong>{signal.title}</strong>
                    <small>{signal.detail}</small>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-label="SealPay protocol capabilities"
        className="relative z-10 mb-20 overflow-hidden border-y border-cyan-100/10 bg-black/20 py-4"
      >
        <div className="protocol-ticker-track">
          {[...protocolSignals, ...protocolSignals].map((signal, index) => (
            <span
              key={`${signal}-${index}`}
              aria-hidden={index >= protocolSignals.length ? true : undefined}
              className="protocol-ticker-item"
            >
              <BadgeCheck className="size-4 text-violet-300" />
              {signal}
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="glass-panel-dark rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Protocol flow
              </p>
              <h2 className="brand-font mt-3 text-3xl font-black text-white">
                Four steps. Every action verifiable.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              The blockchain and IPFS remain the source of truth from funding to
              settlement.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {protocolSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="protocol-step-card rounded-3xl border border-cyan-100/10 bg-white/[0.035] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-xs font-black text-slate-600">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-black text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              The SealPay trust layer
            </p>
            <h2 className="brand-font mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Built so neither side has to trust blindly.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-400">
            Identity, evidence, and settlement stay independently verifiable
            throughout the deal.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {trustCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="trust-feature-card glass-panel-dark rounded-[1.75rem] p-7"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-300/10 text-cyan-200 ring-1 ring-cyan-100/10">
                  <Icon className="size-5" />
                </span>
                <h3 className="brand-font mt-6 text-xl font-black text-white">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="landing-cta relative overflow-hidden rounded-[2rem] border border-violet-300/15 px-6 py-10 sm:px-10 sm:py-12">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                <Activity className="size-4" />
                Your next deal, sealed on-chain
              </div>
              <h2 className="brand-font mt-4 max-w-3xl text-3xl font-black text-white sm:text-4xl">
                Protect the payment. Prove the work. Release with confidence.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Connect a wallet to explore the complete SealPay escrow flow on
                Polygon Amoy testnet.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/auth" className="primary-button min-h-12 px-6">
                <Wallet className="size-4" />
                Connect wallet
              </Link>
              <Link
                href="/create-deal"
                className="secondary-button min-h-12 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              >
                Create a deal
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
