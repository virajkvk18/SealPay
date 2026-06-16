import Image from "next/image";
import Link from "next/link";
import { FileText, Fingerprint, Gavel, LockKeyhole, PlayCircle, ShieldCheck } from "lucide-react";

const trustCards = [
  {
    title: "Smart Contract Escrow",
    description:
      "Programmable security that ensures funds are only released upon mutually agreed milestones.",
    icon: FileText,
  },
  {
    title: "Proof Hash Stored",
    description:
      "Cryptographic proofs of work are immutable and stored on-chain for permanent verification.",
    icon: Fingerprint,
  },
  {
    title: "Dispute Evidence Vault",
    description:
      "Decentralized arbitration layer to resolve conflicts with transparent evidence submission.",
    icon: Gavel,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <header className="border-b border-[#d8dadc]/70 bg-white/78 backdrop-blur-xl">
        <nav className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/sealpay-logo.png"
                alt="SealPay logo"
                width={44}
                height={44}
                className="size-11 rounded-2xl object-cover shadow-lg shadow-cyan-900/10"
                priority
              />
              <span className="brand-font text-[25px] font-black leading-none tracking-[-0.03em] text-black">
                SealPay
              </span>
            </Link>
            <div className="hidden items-center gap-7 md:flex">
              <Link
                href="/dashboard"
                className="border-b-2 border-black pb-1 text-xs font-bold text-black"
              >
                Dashboard
              </Link>
              <Link
                href="/create-deal"
                className="text-xs font-medium text-[#43474b] transition hover:text-black"
              >
                Invoices
              </Link>
              <Link
                href="/deal/SP-1003"
                className="text-xs font-medium text-[#43474b] transition hover:text-black"
              >
                Disputes
              </Link>
              <Link
                href="/proof/SP-1002"
                className="text-xs font-medium text-[#43474b] transition hover:text-black"
              >
                Reputation
              </Link>
            </div>
          </div>
          <button className="rounded-full bg-black px-6 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#00677f]">
            Connect Wallet
          </button>
        </nav>
      </header>

      <section className="blockchain-bg mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 pb-16 pt-9 lg:grid-cols-[1fr_0.98fr] lg:items-center">
        <div className="pt-0 lg:pt-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#b6ebff] px-4 py-1.5 text-xs font-bold text-[#001f28]">
            <ShieldCheck className="size-3.5" />
            Web3 Escrow Infrastructure
          </div>

          <h1 className="brand-font mt-7 max-w-[610px] text-[44px] font-black leading-[1.09] tracking-[-0.035em] text-black sm:text-[48px] lg:text-[50px]">
            Secure Freelance Payments with{" "}
            <span className="bg-gradient-to-br from-[#00677f] to-[#00d2ff] bg-clip-text text-transparent">
              Smart Contract Escrow
            </span>
          </h1>

          <p className="mt-7 max-w-[520px] text-[15px] leading-6 text-[#43474b]">
            Lock invoice payments, verify work proof, and release funds transparently.
            The ultimate trust layer for digital professionals.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-7 text-xs font-black text-white shadow-sm transition hover:bg-[#00677f]"
            >
              <LockKeyhole className="size-4" />
              Lock Payment
            </Link>
            <Link
              href="/create-deal"
              className="inline-flex h-12 items-center rounded-full border border-black px-7 text-xs font-black text-black transition hover:bg-black/5"
            >
              Create Invoice
            </Link>
            <Link
              href="/deal/SP-1002"
              className="inline-flex h-12 items-center gap-2 px-3 text-xs font-bold text-[#43474b] transition hover:text-black"
            >
              <PlayCircle className="size-4" />
              View Demo
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-7 rounded-full bg-[#00d2ff]/20 blur-3xl" />
          <div className="glass-panel relative overflow-hidden rounded-[32px] p-6 shadow-2xl shadow-[#101d25]/10">
            <Image
              src="/sealpay-landing-hero.png"
              alt="Glowing Web3 invoice proof hovering over a secure escrow stage"
              width={1000}
              height={750}
              priority
              className="aspect-[4/3] w-full rounded-[24px] object-cover"
            />
            <div className="absolute bottom-10 left-10 flex items-center gap-4 rounded-xl border border-white/60 bg-white/72 p-4 shadow-lg backdrop-blur-xl">
              <div className="grid size-9 place-items-center rounded-full bg-green-100 text-green-600">
                <ShieldCheck className="size-5 fill-green-600/20" />
              </div>
              <div>
                <p className="text-xs font-black text-black">Payment Secured</p>
                <p className="mt-0.5 text-[12px] font-medium text-[#43474b]">
                  0.45 ETH locked in vault
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 pb-16 md:grid-cols-3">
        {trustCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="glass-panel rounded-[24px] p-8 transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-[#b6ebff]/50 text-[#00677f]">
                <Icon className="size-7" />
              </div>
              <h2 className="brand-font text-[21px] font-black tracking-[-0.02em] text-[#191c1e]">
                {card.title}
              </h2>
              <p className="mt-3 max-w-[280px] text-[14px] font-medium leading-6 text-[#74777b]">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
