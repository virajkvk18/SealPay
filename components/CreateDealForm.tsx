"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, CalendarClock, Info, ShieldAlert } from "lucide-react";
import { deliverableTypes, type Deal } from "@/lib/mockData";
import { calculateRiskScore } from "@/lib/riskScore";
import { useSealPay } from "@/lib/store";
import {
  formatAmount,
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
          title: "Deal created",
          description: `${form.clientName.trim()} created a mock escrow for ${form.freelancerName.trim()}.`,
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
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="glass-panel rounded-3xl p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-800">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-normal text-[#010b13]">
              Create a new deal
            </h1>
            <p className="mt-1 text-sm text-[#53606a]">
              Lock terms, generate a mock transaction, and open the escrow page.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">Job title</span>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Mobile app landing page"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Job description
            </span>
            <textarea
              className="input-field min-h-32 resize-y"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe the deliverable, acceptance criteria, and handoff format."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Client name
            </span>
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
              Freelancer name
            </span>
            <input
              required
              className="input-field"
              value={form.freelancerName}
              onChange={(event) => updateField("freelancerName", event.target.value)}
              placeholder="Freelancer or studio"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Client wallet address
            </span>
            <input
              required
              className="input-field font-mono text-sm"
              value={form.clientWallet}
              onChange={(event) => updateField("clientWallet", event.target.value)}
              placeholder="0x..."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Freelancer wallet address
            </span>
            <input
              required
              className="input-field font-mono text-sm"
              value={form.freelancerWallet}
              onChange={(event) => updateField("freelancerWallet", event.target.value)}
              placeholder="0x..."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Amount in test ETH/MATIC
            </span>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              className="input-field"
              value={form.amount}
              onChange={(event) => updateField("amount", event.target.value)}
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">Deadline</span>
            <input
              required
              type="date"
              className="input-field"
              value={form.deadline}
              onChange={(event) => updateField("deadline", event.target.value)}
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Deliverable type
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
        </div>
      </section>

      <aside className="space-y-4">
        <div className="glass-panel rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-amber-300/40 bg-amber-100/60 text-amber-800">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#53606a]">Deal Risk Score</p>
              <p className="text-2xl font-black text-[#010b13]">{liveRisk.score}/100</p>
            </div>
          </div>

          <div className="mt-5">
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-black ${riskTone(
                liveRisk.level,
              )}`}
            >
              {liveRisk.level}
            </span>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-[#53606a]">
            {liveRisk.reasons.map((reason) => (
              <li key={reason} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-cyan-300" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="soft-panel rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-5 shrink-0 text-[#00677f]" />
            <p className="text-sm leading-6 text-[#43474b]">
              Submitting creates a local deal, assigns status Created, and generates a
              fake blockchain transaction hash for the public proof timeline.
            </p>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="primary-button w-full">
          Create Deal
          <ArrowRight className="size-4" />
        </button>

        <div className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#43474b]">
            <CalendarClock className="size-4 text-emerald-700" />
            Live estimate
          </div>
          <p className="mt-2 text-2xl font-black text-[#010b13]">
            {formatAmount(Number(form.amount) || 0)}
          </p>
        </div>
      </aside>
    </form>
  );
}
