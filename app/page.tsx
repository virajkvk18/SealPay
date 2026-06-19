import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Fingerprint, Gavel, PlayCircle, ShieldCheck } from "lucide-react";

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
              <span className="brand-font text-[25px] font-black leading-none tracking-normal text-black">
                SealPay
              </span>
            </Link>
            <div className="hidden items-center gap-7 md:flex">
              <Link href="/dashboard" className="border-b-2 border-black pb-1 text-xs font-bold text-black">
                Dashboard
              </Link>
              <Link href="/create-deal" className="text-xs font-medium text-[#43474b] transition hover:text-black">
                Invoices
              </Link>
              <Link href="/deal/SP-1003" className="text-xs font-medium text-[#43474b] transition hover:text-black">
                Disputes
              </Link>
              <Link href="/reputation" className="text-xs font-medium text-[#43474b] transition hover:text-black">
                Reputation
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden h-10 items-center rounded-full border border-black px-5 text-xs font-black text-black transition hover:bg-black/5 sm:inline-flex"
            >
              Explore Deals
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-10 items-center rounded-full bg-black px-5 text-xs font-black text-white transition hover:bg-[#00677f]"
            >
              Connect Wallet
            </Link>
          </div>
        </nav>
      </header>

      <section className="blockchain-bg mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 pb-16 pt-9 lg:grid-cols-[1fr_0.98fr] lg:items-center">
        <div className="pt-0 lg:pt-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#b6ebff] px-4 py-1.5 text-xs font-bold text-[#001f28]">
            <ShieldCheck className="size-3.5" />
            Web3 Escrow Infrastructure
          </div>

          <h1 className="brand-font mt-7 max-w-[610px] text-[44px] font-black leading-[1.09] tracking-normal text-black sm:text-[48px] lg:text-[50px]">
            Secure Freelance Payments with{" "}
            <span className="bg-gradient-to-br from-[#00677f] to-[#00d2ff] bg-clip-text text-transparent">
              Smart Contract Escrow
            </span>
          </h1>

          <p className="mt-7 max-w-[520px] text-[15px] leading-6 text-[#43474b]">
            Seal the deal. Secure the pay. Lock invoice payments, verify work proof,
            and release funds transparently.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/auth"
              className="inline-flex h-12 items-center rounded-full bg-black px-7 text-xs font-black text-white shadow-sm transition hover:bg-[#00677f]"
            >
              Connect Wallet
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-12 items-center rounded-full border border-black px-7 text-xs font-black text-black transition hover:bg-black/5"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 px-3 text-xs font-bold text-[#43474b] transition hover:text-black"
            >
              <PlayCircle className="size-4" />
              Explore Deals
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-7 rounded-full bg-[#00d2ff]/20 blur-3xl" />
          <div className="glass-panel relative overflow-hidden rounded-[32px] p-6 shadow-2xl shadow-[#101d25]/10">
            <Image
              src="/sealpay-landing-hero.png"
              alt="Glowing invoice proof on a secure SealPay escrow platform"
              width={1000}
              height={750}
              priority
              className="aspect-[4/3] w-full rounded-[24px] object-cover"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 pb-16">
        <div className="glass-panel rounded-[28px] p-8">
          <h2 className="brand-font text-2xl font-black text-black">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Client posts an escrow deal.",
              "Freelancer submits IPFS proof.",
              "AI reviews proof and disputes.",
              "Timeline verifies every step.",
            ].map((step, index) => (
              <div key={step} className="rounded-2xl border border-[#101d25]/10 bg-white/65 p-4">
                <span className="grid size-8 place-items-center rounded-full bg-black text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-bold leading-6 text-[#43474b]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 pb-16 md:grid-cols-3">
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
              <h2 className="brand-font text-[21px] font-black tracking-normal text-[#191c1e]">
                {card.title}
              </h2>
              <p className="mt-3 max-w-[280px] text-[14px] font-medium leading-6 text-[#74777b]">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <section id="demo-flow" className="mx-auto grid max-w-[1280px] gap-8 px-6 pb-16 lg:grid-cols-2">
        <article className="rounded-[28px] bg-[#010b13] p-8 text-white shadow-2xl shadow-cyan-950/20">
          <h2 className="brand-font text-2xl font-black">Demo flow</h2>
          <p className="mt-5 text-sm leading-7 text-white/72">
            Sign up, explore the dashboard, submit proof to IPFS, let Groq review it,
            and open the public proof timeline.
          </p>
          <Link href="/dashboard" className="primary-button mt-6 bg-white text-black">
            Explore Deals
            <ArrowRight className="size-4" />
          </Link>
        </article>

        <article className="glass-panel rounded-[28px] p-8">
          <h2 className="brand-font text-2xl font-black text-black">Why SealPay</h2>
          <div className="mt-5 space-y-3">
            {[
              "Clients avoid paying before proof is visible.",
              "Freelancers avoid sending full work before escrow is locked.",
              "IPFS CID proves uploaded work cannot silently change.",
              "AI assists proof review and dispute summaries.",
            ].map((item) => (
              <p key={item} className="flex items-start gap-3 text-sm font-bold leading-6 text-[#43474b]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                {item}
              </p>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
