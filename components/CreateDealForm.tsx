"use client";
import { createDeal } from "@/lib/deals";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Fingerprint,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { deliverableTypes, type Deal } from "@/lib/mockData";
import { calculateRiskScore, suggestMilestones } from "@/lib/scoring";
import { useSealPay } from "@/lib/store";
import { useWallet } from "@/lib/wallet";
import {
  formatAmount,
  formatDate,
  formatWallet,
  makeDealId,
  makeTimelineEvent,
  riskTone,
} from "@/lib/utils";

const initialForm = {
  title: "",
  description: "",
  clientName: "",
  freelancerName: "",
  clientWallet: "",
  freelancerWallet: "",
  amount: "0.001",
  deadline: "",
  deliverableType: "Design",
  category: "Design",
};

export default function CreateDealForm({
  initialDealKind = "direct",
}: {
  initialDealKind?: "direct" | "public";
}) {
  const router = useRouter();
  const { deals, addDeal } = useSealPay();
  const { address } = useWallet();
  const [dealKind, setDealKind] = useState<"direct" | "public">(
    initialDealKind,
  );
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    [
      form.amount,
      form.deadline,
      form.description,
      form.freelancerWallet,
      knownFreelancerWallets,
    ],
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    const amount = Number(form.amount);
    const connectedWallet = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(connectedWallet)) {
      setFormError("Connect a valid client wallet before creating a deal.");
      return;
    }
    const clientWallet = connectedWallet.toLowerCase();
    const freelancerWallet =
      dealKind === "direct" ? form.freelancerWallet.trim().toLowerCase() : "";
    if (
      dealKind === "direct" &&
      !/^0x[a-fA-F0-9]{40}$/.test(freelancerWallet)
    ) {
      setFormError(
        "Enter a valid freelancer wallet address for a direct deal.",
      );
      return;
    }
    if (dealKind === "direct" && freelancerWallet === clientWallet) {
      setFormError(
        "Client and freelancer wallets must be different. Connect or enter a separate freelancer wallet.",
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Escrow amount must be greater than zero.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Add a clear milestone description.");
      return;
    }
    if (!form.deadline || new Date(form.deadline).getTime() <= Date.now()) {
      setFormError("Choose a future deadline.");
      return;
    }
    setIsSubmitting(true);
    const id = createUniqueDealId();
    const risk = calculateRiskScore({
      amount,
      deadline: form.deadline,
      description: form.description,
      freelancerWallet: dealKind === "direct" ? form.freelancerWallet : "",
      knownFreelancerWallets,
    });

    const deal: Deal = {
      id,
      title: form.title.trim(),
      description:
        form.description.trim() || "No detailed description provided.",
      clientName: form.clientName.trim(),
      freelancerName:
        dealKind === "direct" ? form.freelancerName.trim() : "Open Application",
      clientWallet,
      freelancerWallet,
      dealKind: dealKind === "direct" ? "Direct" : "Public",
      category: form.category,
      amount,
      deadline: form.deadline,
      deliverableType: form.deliverableType as Deal["deliverableType"],
      status: dealKind === "direct" ? "Assigned" : "Created",
      risk,
      createdTxHash: "",
      timeline: [
        makeTimelineEvent({
          title: "Deal created",
          description:
            dealKind === "direct"
              ? `${form.clientName.trim()} created a direct SealPay deal for ${form.freelancerName.trim()}.`
              : `${form.clientName.trim()} posted a public SealPay opportunity.`,
          actor: "Client",
          status: "Created",
        }),
      ],
    };

    let finalDeal = deal;
    try {
      const remoteRows = await createDeal({
        title: deal.title,
        description: deal.description,
        budget: deal.amount,
        deal_kind: deal.dealKind?.toLowerCase(),
        client_wallet: deal.clientWallet,
        freelancer_wallet: deal.freelancerWallet,
        status: "open",
        created_at: new Date().toISOString(),
        client_name: deal.clientName,
        freelancer_name: deal.freelancerName,
        deliverable_type: deal.deliverableType,
        risk: deal.risk,
        created_tx_hash: deal.createdTxHash,
        preview_url: null,
        final_file_name: null,
        proof: null,
        dispute_reason: null,
        dispute_evidence: null,
        resolution: null,
        deadline: deal.deadline,
      });
      const remoteId = remoteRows?.[0]?.id;
      if (!remoteId) {
        throw new Error("Shared database did not return a deal id.");
      }
      finalDeal = {
        ...deal,
        id: String(remoteId),
      };
    } catch (error) {
      console.warn(
        "Remote deal save failed; not adding wallet-local record.",
        error,
      );
      setFormError(
        "Deal could not be saved to the shared database. Other users will not be able to see it.",
      );
      setIsSubmitting(false);
      return;
    }

    addDeal(finalDeal);
    setSuccessMessage("Deal created successfully.");
    window.setTimeout(() => router.push(`/deal/${finalDeal.id}`), 700);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]"
    >
      <ol
        className="deal-progress grid grid-cols-4 gap-2 lg:col-span-2"
        aria-label="Create deal progress"
      >
        {["Deal Type", "Work Details", "Payment", "Review"].map(
          (step, index) => (
            <li key={step} className="flex min-w-0 items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-violet-400/30 bg-violet-400/10 text-xs font-black text-violet-200">
                {index + 1}
              </span>
              <span className="hidden truncate text-xs font-bold text-slate-400 sm:block">
                {step}
              </span>
            </li>
          ),
        )}
      </ol>
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-[#7c3aed]">
            <FileText className="size-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-normal text-[#1e1233]">
              Deal Details
            </h2>
            <p className="mt-1 text-sm text-[#53606a]">
              Define the escrow terms before the payment is locked.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Deal Type
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(["direct", "public"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setDealKind(kind)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black capitalize transition ${
                    dealKind === kind
                      ? "border-black bg-black text-white"
                      : "border-[#101d25]/10 bg-white/65 text-[#43474b]"
                  }`}
                >
                  {kind === "direct" ? "Direct Deal" : "Public Deal"}
                </button>
              ))}
            </div>
          </div>
          {dealKind === "public" ? (
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-[#43474b]">
                Category
              </span>
              <select
                required
                className="input-field"
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
              >
                {deliverableTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Deal Title
            </span>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Mobile app landing page"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Client Wallet Address
            </span>
            <input
              required
              readOnly
              className="input-field font-mono text-sm"
              value={address}
              onChange={(event) => updateField("clientWallet", event.target.value)}
              placeholder="0x..."
            />
          </label>

          {dealKind === "direct" ? (
            <label>
              <span className="mb-2 block text-sm font-bold text-[#43474b]">
                Freelancer Wallet Address
              </span>
              <input
                required
                className="input-field font-mono text-sm"
                value={form.freelancerWallet}
                onChange={(event) =>
                  updateField("freelancerWallet", event.target.value)
                }
                placeholder="0x..."
              />
            </label>
          ) : null}

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Client Name
            </span>
            <input
              required
              className="input-field"
              value={form.clientName}
              onChange={(event) =>
                updateField("clientName", event.target.value)
              }
              placeholder="Client or team"
            />
          </label>

          {dealKind === "direct" ? (
            <label>
              <span className="mb-2 block text-sm font-bold text-[#43474b]">
                Freelancer Name
              </span>
              <input
                required
                className="input-field"
                value={form.freelancerName}
                onChange={(event) =>
                  updateField("freelancerName", event.target.value)
                }
                placeholder="Freelancer or studio"
              />
            </label>
          ) : null}

          <label className="relative">
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Escrow Amount
            </span>
            <input
              required
              min="0.001"
              step="0.001"
              type="number"
              className="input-field"
              value={form.amount}
              onChange={(event) => updateField("amount", event.target.value)}
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Deadline
            </span>
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
              Proof of Work Requirements
            </span>
            <select
              className="input-field"
              value={form.deliverableType}
              onChange={(event) =>
                updateField("deliverableType", event.target.value)
              }
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
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe acceptance criteria, handoff format, and review rules."
            />
          </label>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="glass-panel overflow-hidden rounded-[2rem]">
          <div className="bg-[#1e1233] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-violet-100">Live Preview</p>
                <h3 className="mt-2 text-2xl font-black tracking-normal">
                  {form.title || "Untitled deal"}
                </h3>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-violet-300/15 text-violet-100">
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
              <span className="text-sm font-black text-[#1e1233]">
                {form.deadline ? formatDate(form.deadline) : "Select date"}
              </span>
            </div>
            <div className="rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
              <p className="text-xs font-black uppercase tracking-normal text-[#74777b]">
                Client
              </p>
              <p className="mt-2 font-mono text-sm font-bold text-[#1e1233]">
                {form.clientWallet || address
                  ? formatWallet(form.clientWallet || address)
                  : "0x..."}
              </p>
            </div>
            <div className="rounded-2xl border border-[#101d25]/10 bg-white/60 p-4">
              <p className="text-xs font-black uppercase tracking-normal text-[#74777b]">
                Freelancer
              </p>
              <p className="mt-2 font-mono text-sm font-bold text-[#1e1233]">
                {dealKind === "public"
                  ? "Open to applications"
                  : form.freelancerWallet
                    ? formatWallet(form.freelancerWallet)
                    : "0x..."}
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
              <p className="text-sm font-bold text-[#53606a]">
                Deal Risk Score
              </p>
              <p className="text-2xl font-black text-[#1e1233]">
                {liveRisk.score}/100
              </p>
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
                <span className="size-1.5 rounded-full bg-violet-300" />
                {reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-[#7c3aed]">
              <Fingerprint className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#53606a]">
                Milestone Suggestion
              </p>
              <p className="text-lg font-black text-[#1e1233]">
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

        <section className="rounded-[2rem] bg-violet-50 p-5">
          <div className="flex items-start gap-3">
            <Fingerprint className="mt-0.5 size-5 shrink-0 text-[#7c3aed]" />
            <p className="text-sm leading-6 text-[#43474b]">
              Creating a deal records its first proof event and opens the deal
              workspace immediately.
            </p>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-button w-full"
        >
          {isSubmitting ? "Creating Deal..." : "Create Deal"}
          <ArrowRight className="size-4" />
        </button>

        {formError ? (
          <p className="rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          <BadgeCheck className="size-4" />
          Smart-contract escrow ready
        </div>
      </aside>
    </form>
  );
}
