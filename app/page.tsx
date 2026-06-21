import Image from "next/image";
import {
  BadgeCheck,
  Blocks,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Eye,
  FileCheck2,
  FileKey2,
  Fingerprint,
  Gauge,
  GitBranch,
  Layers3,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import WalletIntentActions from "@/components/WalletIntentActions";

const workflowSteps = [
  {
    title: "Deal created",
    detail: "Client defines the work and terms.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Payment locked",
    detail: "Funds enter smart contract escrow.",
    icon: LockKeyhole,
  },
  {
    title: "Proof submitted",
    detail: "Freelancer shares protected proof.",
    icon: FileKey2,
  },
  {
    title: "AI review",
    detail: "Trust signals support human review.",
    icon: BrainCircuit,
  },
  {
    title: "Client decision",
    detail: "Approve the work or raise a dispute.",
    icon: UserRoundCheck,
  },
  {
    title: "Fair settlement",
    detail: "Funds release according to the outcome.",
    icon: CircleDollarSign,
  },
  {
    title: "Timeline updated",
    detail: "Every proof record stays visible.",
    icon: Fingerprint,
  },
];

const clientBenefits = [
  "Create direct deals with a freelancer wallet",
  "Post opportunities for freelancers to apply",
  "Lock payment before work begins",
  "Review protected proof before approval",
  "Raise a dispute when delivery is not valid",
  "Verify every action in the proof timeline",
];

const freelancerBenefits = [
  "Browse open opportunities",
  "Receive direct wallet assignments",
  "See that payment is protected before working",
  "Submit proof through decentralized storage",
  "Build a reusable wallet trust history",
  "Receive payment after approval",
];

const securityFeatures = [
  {
    title: "Wallet Identity",
    description:
      "Your wallet address is your identity. No password database or centralized account is required.",
    icon: Wallet,
  },
  {
    title: "Smart Contract Escrow",
    description:
      "Payment stays protected by transparent settlement rules until approval or dispute resolution.",
    icon: Blocks,
  },
  {
    title: "Decentralized Proof",
    description:
      "Proof records use content identifiers and hashes so submitted evidence can be independently verified.",
    icon: FileCheck2,
  },
  {
    title: "Public Proof Timeline",
    description:
      "Deal events, proof hashes, and transaction references create an auditable history for both sides.",
    icon: Eye,
  },
];

const timelineEvents = [
  "Deal created",
  "Freelancer assigned",
  "Payment locked",
  "Proof submitted",
  "AI review completed",
  "Work approved",
  "Payment released",
];

const faqs = [
  {
    question: "Do I need to create a SealPay account?",
    answer:
      "No. Your connected wallet is your identity. There is no email, password, signup, or OTP flow.",
  },
  {
    question: "Can one wallet be both a client and a freelancer?",
    answer:
      "Yes. Your role is determined per deal. The same wallet can hire in one deal and complete work in another.",
  },
  {
    question: "Can AI release payment?",
    answer:
      "No. AI only supports risk, proof, milestone, and dispute review. Payment actions remain controlled by users and smart contract rules.",
  },
  {
    question: "Where is work proof stored?",
    answer:
      "Proof files use decentralized storage. SealPay records the related content identifier or proof hash so the submission can be verified later.",
  },
  {
    question: "What happens when there is a dispute?",
    answer:
      "Either party can raise a dispute. Evidence and timeline history support review before funds are released or returned.",
  },
];

const floatingSignals = [
  {
    title: "Escrow locked",
    detail: "Payment protected",
    icon: LockKeyhole,
    className: "hero-signal-left-top",
  },
  {
    title: "Trust review",
    detail: "AI-assisted",
    icon: BrainCircuit,
    className: "hero-signal-right-top",
  },
  {
    title: "Proof stored",
    detail: "CID verifiable",
    icon: FileKey2,
    className: "hero-signal-left-bottom",
  },
  {
    title: "Fair payout",
    detail: "Ready to settle",
    icon: CircleDollarSign,
    className: "hero-signal-right-bottom",
  },
];

const protocolSignals = [
  "Wallet-first identity",
  "Payment protection",
  "Protected work proof",
  "Transparent settlement",
  "Public proof history",
];

const protocolOverview = [
  {
    value: "2-sided",
    label: "Client and freelancer workflow",
    icon: UserRoundCheck,
  },
  {
    value: "7-stage",
    label: "Traceable deal lifecycle",
    icon: GitBranch,
  },
  {
    value: "Wallet-first",
    label: "Identity without passwords",
    icon: Wallet,
  },
  {
    value: "Proof-linked",
    label: "Evidence tied to each deal",
    icon: Fingerprint,
  },
];

const protocolLayers = [
  {
    eyebrow: "Identity layer",
    title: "Wallets establish who acts",
    description:
      "Clients and freelancers connect a wallet and use its address as their deal identity, removing the need for a password account.",
    note: "Used for role and ownership checks",
    icon: Wallet,
  },
  {
    eyebrow: "Settlement layer",
    title: "Escrow protects the payment",
    description:
      "Deal funds can be locked before delivery and released according to approval or dispute outcomes instead of informal promises.",
    note: "Transparent payment state",
    icon: Blocks,
  },
  {
    eyebrow: "Evidence layer",
    title: "Content identifiers preserve proof",
    description:
      "Submitted files are linked through decentralized storage identifiers and hashes, making later verification possible for both parties.",
    note: "Verifiable submission history",
    icon: Database,
  },
  {
    eyebrow: "Review layer",
    title: "AI explains risk, not outcomes",
    description:
      "AI can summarize evidence and flag inconsistencies, but it cannot sign transactions or independently release escrowed funds.",
    note: "Advisory assistance only",
    icon: Gauge,
  },
];

export default function Home() {
  return (
    <main className="web3-shell protocol-grid landing-professional relative overflow-hidden">
      <Navbar />

      <section className="landing-section hero-section relative z-10 grid gap-12 pb-16 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-20 lg:pt-16">
        <div className="hero-copy">
          <div className="chain-chip inline-flex">
            <ShieldCheck className="size-3.5" />
            Wallet-first payment protection
          </div>
          <h1 className="brand-font mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4rem]">
            Seal the deal.{" "}
            <span className="gradient-text">Secure the pay.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-slate-200 sm:whitespace-nowrap sm:text-lg">
            Web3 escrow for freelancers, creators, and service buyers.
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            Clients lock payment before work starts. Freelancers submit
            protected proof. SealPay releases funds fairly through smart
            contracts.
          </p>

          <div className="mt-6">
            <WalletIntentActions compact />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-400">
            {["No passwords", "Wallet identity", "Transparent settlement"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-violet-300" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="hero-visual-stage relative mx-auto w-full max-w-[550px]">
          <div className="hero-orbit hero-orbit-outer" />
          <div className="hero-orbit hero-orbit-inner" />
          <Image
            src="/sealpay-web3-dashboard-square.webp"
            alt="SealPay wallet escrow dashboard with protected payment, decentralized proof, and trust review"
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
        aria-label="SealPay protocol overview"
        className="landing-section relative z-10 pb-16 lg:pb-20"
      >
        <div className="protocol-overview-grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035]">
          {protocolOverview.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.value} className="protocol-overview-item">
                <Icon className="size-5 text-violet-300" />
                <div>
                  <p className="brand-font text-base font-black text-white">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {item.label}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-label="SealPay benefits"
        className="relative z-10 mb-20 overflow-hidden border-y border-violet-100/10 bg-black/20 py-4"
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

      <section className="landing-section relative z-10 grid gap-5 pb-20 lg:grid-cols-2">
        <article className="glass-panel-dark rounded-[2rem] p-7 sm:p-9">
          <video
            className="landing-inline-video"
            src="/sealpay-payment-concern.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="A client and freelancer considering payment risk"
          />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">
            The payment trust problem
          </p>
          <h2 className="brand-font mt-4 text-3xl font-black text-white">
            Promises are not payment protection.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
            Freelancers and student creators deliver work but still face delayed
            or denied payments. Clients fear paying before receiving valid work.
            Too many deals depend on chats, screenshots, verbal promises, and
            informal invoices.
          </p>
        </article>
        <article className="glass-panel-dark rounded-[2rem] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            The SealPay solution
          </p>
          <h2 className="brand-font mt-4 text-3xl font-black text-white">
            Payment and proof move together.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
            SealPay lets clients protect payment in escrow before work begins.
            Freelancers submit protected proof, AI supports review, and
            settlement follows approval or transparent dispute resolution.
          </p>
        </article>
      </section>

      <section
        id="architecture"
        className="landing-section relative z-10 pb-20"
      >
        <div className="landing-heading-grid mb-9">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              <Layers3 className="size-4" />
              Protocol architecture
            </div>
            <h2 className="brand-font mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Know what protects every part of the deal.
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-7 text-slate-400">
            SealPay separates identity, settlement, evidence, and review so one
            service does not silently control the entire workflow.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {protocolLayers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <article
                key={layer.title}
                className="architecture-card group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-300/15 to-violet-400/15 text-violet-200 ring-1 ring-white/10">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs font-black text-slate-600">
                    LAYER 0{index + 1}
                  </span>
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  {layer.eyebrow}
                </p>
                <h3 className="brand-font mt-2 text-xl font-black text-white">
                  {layer.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {layer.description}
                </p>
                <div className="mt-5 flex items-center gap-2 border-t border-white/8 pt-4 text-xs font-bold text-slate-300">
                  <CheckCircle2 className="size-4 text-violet-300" />
                  {layer.note}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-5 text-sm leading-6 text-slate-300">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-200" />
          <p>
            <strong className="text-white">Decentralization is progressive.</strong>{" "}
            Wallet identity, smart-contract escrow, and verifiable proof reduce
            trust in intermediaries. Optional storage gateways and AI providers
            remain supporting services, not payment authorities.
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        className="landing-section relative z-10 pb-20"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              How SealPay works
            </p>
            <h2 className="brand-font mt-3 text-3xl font-black text-white sm:text-4xl">
              From agreement to fair settlement.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-400">
            Every step produces a clear status for both wallets and the public
            proof timeline.
          </p>
        </div>
        <video
          className="landing-wide-video"
          src="/sealpay-client-creates-deal.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="A SealPay client creating a protected deal"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="protocol-step-card rounded-3xl border border-violet-100/10 bg-white/[0.035] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-violet-300/10 text-violet-200">
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
      </section>

      <section className="landing-section relative z-10 grid gap-5 pb-20 lg:grid-cols-2">
        <article
          id="for-clients"
          className="audience-panel rounded-[2rem] border border-violet-200/10 p-7 sm:p-9"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-violet-300/10 text-violet-200">
            <BriefcaseBusiness className="size-5" />
          </span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            For Clients
          </p>
          <h2 className="brand-font mt-3 text-3xl font-black text-white">
            Hire with proof, not guesswork.
          </h2>
          <div className="mt-6 grid gap-3">
            {clientBenefits.map((benefit) => (
              <p
                key={benefit}
                className="flex gap-3 text-sm font-semibold leading-6 text-slate-300"
              >
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-violet-300" />
                {benefit}
              </p>
            ))}
          </div>
        </article>
        <article
          id="for-freelancers"
          className="audience-panel rounded-[2rem] border border-violet-200/10 p-7 sm:p-9"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-violet-300/10 text-violet-200">
            <Search className="size-5" />
          </span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            For Freelancers
          </p>
          <h2 className="brand-font mt-3 text-3xl font-black text-white">
            Work knowing payment is protected.
          </h2>
          <div className="mt-6 grid gap-3">
            {freelancerBenefits.map((benefit) => (
              <p
                key={benefit}
                className="flex gap-3 text-sm font-semibold leading-6 text-slate-300"
              >
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-violet-300" />
                {benefit}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section
        id="security"
        className="landing-section relative z-10 pb-20"
      >
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            Security by transparency
          </p>
          <h2 className="brand-font mx-auto mt-3 max-w-3xl text-3xl font-black text-white sm:text-4xl">
            Trust anchored to wallets, proof, and settlement rules.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {securityFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="trust-feature-card glass-panel-dark rounded-[1.75rem] p-7"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-300/20 to-violet-300/10 text-violet-200 ring-1 ring-violet-100/10">
                  <Icon className="size-5" />
                </span>
                <h3 className="brand-font mt-6 text-xl font-black text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section relative z-10 grid gap-5 pb-20 lg:grid-cols-2">
        <article className="glass-panel-dark rounded-[2rem] p-7 sm:p-9">
          <FileKey2 className="size-7 text-violet-300" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            Decentralized Storage
          </p>
          <h2 className="brand-font mt-3 text-3xl font-black text-white">
            Proof that does not disappear with a chat.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            Proof files use decentralized storage and are represented by content
            identifiers or proof hashes. Both sides can verify what was
            submitted and when it entered the deal history.
          </p>
        </article>
        <article className="glass-panel-dark rounded-[2rem] p-7 sm:p-9">
          <BrainCircuit className="size-7 text-violet-300" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            AI Trust Engine
          </p>
          <h2 className="brand-font mt-3 text-3xl font-black text-white">
            Useful signals without surrendering control.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            AI supports risk scoring, milestone suggestions, proof review, and
            dispute summaries. It never makes the final payment decision; users
            and smart contract actions remain in control.
          </p>
        </article>
      </section>

      <section
        id="proof-timeline"
        className="landing-section relative z-10 pb-20"
      >
        <div className="glass-panel-dark rounded-[2rem] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            Public Proof Timeline
          </p>
          <h2 className="brand-font mt-3 text-3xl font-black text-white sm:text-4xl">
            One visible history from deal to payout.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {timelineEvents.map((event, index) => (
              <div
                key={event}
                className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
              >
                <span className="grid size-7 place-items-center rounded-full bg-violet-400/15 text-xs font-black text-violet-200">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-black leading-5 text-white">
                  {event}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative z-10 mx-auto max-w-4xl px-5 pb-20 sm:px-8"
      >
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            FAQ
          </p>
          <h2 className="brand-font mt-3 text-3xl font-black text-white sm:text-4xl">
            Clear answers before you connect.
          </h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="faq-item rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-sm font-black text-white">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-section relative z-10 pb-24">
        <div className="landing-cta relative overflow-hidden rounded-[2rem] border border-violet-300/15 px-6 py-10 sm:px-10 sm:py-12">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                <Sparkles className="size-4" />
                Choose how you want to begin
              </div>
              <h2 className="brand-font mt-4 max-w-3xl text-3xl font-black text-white sm:text-4xl">
                Protect the payment. Prove the work. Settle with confidence.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Connect your wallet through the action that matches your next
                deal.
              </p>
            </div>
            <div className="landing-final-action">
              <video
                className="landing-logo-video"
                src="/sealpay-logo-reveal.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="SealPay logo animation"
              />
              <WalletIntentActions compact />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
