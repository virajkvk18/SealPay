"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Coins,
  FileText,
  Fingerprint,
  LockKeyhole,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { deliverableTypes, type Deal } from "@/lib/mockData";
import { calculateRiskScore, suggestMilestones } from "@/lib/aiEngine";
import { useSealPay } from "@/lib/store";
import {
  formatAmount,
  formatDate,
  formatWallet,
  makeDealId,
  makeTimelineEvent,
  makeTxHash,
  riskTone,
} from "@/lib/utils";

const initialForm = {
  title: "",
  description: "",
  clientName: "",
  freelancerName: "",
  clientWallet: "",
  freelancerWallet: "",
  amount: "0.25",
  deadline: "",
  deliverableType: "Design",
};

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-4 top-[2.85rem] text-[#00677f]">
      {children}
    </span>
  );
}

export default function CreateDealForm() {
  const router = useRouter();
  const { deals, addDeal } = useSealPay();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const knownFreelancerWallets = useMemo(
    () => deals.map((deal) => deal.freelancerWallet),
    [deals],
  );

  const liveRisk = useMemo(
    () =>
      calculateRiskScore({
        amount: Number(form.amount),
        deadline: form.deadline,
        description: form.description,
        freelancerWallet: form.freelancerWallet,
        knownFreelancerWallets,
      }),
    [form.amount, form.deadline, form.description, form.freelancerWallet, knownFreelancerWallets],
  );
  const milestoneSuggestion = useMemo(
    () =>
      suggestMilestones({
        amount: Number(form.amount),
        deadline: form.deadline,
        description: form.description,
      }),
    [form.amount, form.deadline, form.description],
  );

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function createUniqueDealId() {
    let id = makeDealId();
    while (deals.some((deal) => deal.id === id)) id = makeDealId();
    return id;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const id = createUniqueDealId();
    const txHash = makeTxHash();
    const amount = Number(form.amount);
    const risk = calculateRiskScore({
      amount,
      deadline: form.deadline,
      description: form.description,
      freelancerWallet: form.freelancerWallet,
      knownFreelancerWallets,
    });

    const deal: Deal = {
      id,
      title: form.title.trim(),
      description: form.description.trim() || "No detailed description provided.",
      clientName: form.clientName.trim(),
      freelancerName: form.freelancerName.trim(),
      clientWallet: form.clientWallet.trim(),
      freelancerWallet: form.freelancerWallet.trim(),
      amount,
      deadline: form.deadline,
      deliverableType: form.deliverableType as Deal["deliverableType"],
      status: "Created",
      risk,
      createdTxHash: txHash,
      timeline: [
        makeTimelineEvent({
          title: "Invoice created",
          description: `${form.clientName.trim()} created a SealPay invoice for ${form.freelancerName.trim()}.`,
          actor: "Client",
          status: "Created",
          txHash,
        }),
      ],
    };

    addDeal(deal);
    router.push(`/deal/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-cyan-100 text-[#00677f]">
            <FileText className="size-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-normal text-[#010b13]">
              Invoice Details
            </h2>
            <p className="mt-1 text-sm text-[#53606a]">
              Define the escrow terms before the payment is locked.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Invoice Title
            </span>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Mobile app landing page"
            />
          </label>

          <label className="relative">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Client Wallet Address
            </span>
            <FieldIcon>
              <Wallet className="size-4" />
            </FieldIcon>
            <input
              required
              className="input-field pl-11 font-mono text-sm"
              value={form.clientWallet}
              onChange={(event) => updateField("clientWallet", event.target.value)}
              placeholder="0x..."
            />
          </label>

          <label className="relative">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Freelancer Wallet Address
            </span>
            <FieldIcon>
              <Wallet className="size-4" />
            </FieldIcon>
            <input
              required
              className="input-field pl-11 font-mono text-sm"
              value={form.freelancerWallet}
              onChange={(event) => updateField("freelancerWallet", event.target.value)}
              placeholder="0x..."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">Client Name</span>
            <input
              required
              className="input-field"
              value={form.clientName}
              onChange={(event) => updateField("clientName", event.target.value)}
              placeholder="Client or team"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Freelancer Name
            </span>
            <input
              required
              className="input-field"
              value={form.freelancerName}
              onChange={(event) => updateField("freelancerName", event.target.value)}
              placeholder="Freelancer or studio"
            />
          </label>

          <label className="relative">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Amount in test MATIC
            </span>
            <FieldIcon>
              <Coins className="size-4" />
            </FieldIcon>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              className="input-field pl-11"
              value={form.amount}
              onChange={(event) => updateField("amount", event.target.value)}
            />
          </label>

          <label className="relative">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">Deadline</span>
            <FieldIcon>
              <CalendarClock className="size-4" />
            </FieldIcon>
            <input
              required
              type="date"
              className="input-field pl-11"
              value={form.deadline}
              onChange={(event) => updateField("deadline", event.target.value)}
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Proof of Work Requirements
            </span>
            <select
              className="input-field"
              value={form.deliverableType}
              onChange={(event) => updateField("deliverableType", event.target.value)}
            >
              {deliverableTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Milestone Description
            </span>
            <textarea
              className="input-field min-h-36 resize-y"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe acceptance criteria, handoff format, and review rules."
            />
          </label>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="glass-panel overflow-hidden rounded-[2rem]">
          <div className="bg-[#010b13] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-cyan-100">Live Preview</p>
                <h3 className="mt-2 text-2xl font-black tracking-normal">
                  {form.title || "Untitled invoice"}
                </h3>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                <LockKeyhole className="size-5" />
              </span>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm text-white/60">Amount locked</p>
              <p className="mt-2 text-3xl font-black">
                {formatAmount(Number(form.amount) || 0)}
              </p>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
              <span className="text-sm font-bold text-[#53606a]">Deadline</span>
              <span className="text-sm font-black text-[#010b13]">
                {form.deadline ? formatDate(form.deadline) : "Select date"}
              </span>
            </div>
            <div className="rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
              <p className="text-xs font-black uppercase tracking-normal text-[#74777b]">
                Client
              </p>
              <p className="mt-2 font-mono text-sm font-bold text-[#010b13]">
                {form.clientWallet ? formatWallet(form.clientWallet) : "0x..."}
              </p>
            </div>
            <div className="rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
              <p className="text-xs font-black uppercase tracking-normal text-[#74777b]">
                Freelancer
              </p>
              <p className="mt-2 font-mono text-sm font-bold text-[#010b13]">
                {form.freelancerWallet ? formatWallet(form.freelancerWallet) : "0x..."}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-800">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#53606a]">Deal Risk Score</p>
              <p className="text-2xl font-black text-[#010b13]">{liveRisk.score}/100</p>
            </div>
          </div>

          <span
            className={`mt-5 inline-flex rounded-full border px-3 py-1.5 text-sm font-black ${riskTone(
              liveRisk.level,
            )}`}
          >
            {liveRisk.level}
          </span>

          <ul className="mt-5 space-y-2 text-sm text-[#53606a]">
            {liveRisk.reasons.map((reason) => (
              <li key={reason} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-cyan-300" />
                {reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-cyan-100 text-[#00677f]">
              <Fingerprint className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#53606a]">AI Milestone Suggestion</p>
              <p className="text-lg font-black text-[#010b13]">
                {milestoneSuggestion.structure.length === 1
                  ? "Single release"
                  : "Milestone-based payment"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {milestoneSuggestion.structure.map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-[#101d25]/10 bg-white/60 px-4 py-3 text-sm font-bold text-[#43474b]"
              >
                {step}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[#53606a]">
            {milestoneSuggestion.reason}
          </p>
          {milestoneSuggestion.warning || liveRisk.level !== "Low Risk" ? (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
              {milestoneSuggestion.warning ??
                "SealPay flags this as a riskier deal, so milestone review is recommended."}
            </p>
          ) : null}
        </section>

        <section className="rounded-[2rem] bg-cyan-50 p-5">
          <div className="flex items-start gap-3">
            <Fingerprint className="mt-0.5 size-5 shrink-0 text-[#00677f]" />
            <p className="text-sm leading-6 text-[#43474b]">
              Creating an invoice generates a local SealPay hash and opens the escrow
              evidence vault.
            </p>
          </div>
        </section>

        <button type="submit" disabled={isSubmitting} className="primary-button w-full">
          Create Invoice Hash
          <ArrowRight className="size-4" />
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          <BadgeCheck className="size-4" />
          Smart-contract escrow ready
        </div>
      </aside>
    </form>
  );
}
