"use client";

import { useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import Toast from "@/components/Toast";
import type { Deal } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { formatWallet, makeTimelineEvent } from "@/lib/utils";
import { useDashboardMode } from "@/lib/dashboardMode";

export default function ApplyDealButton({
  deal,
  wallet,
}: {
  deal: Deal;
  wallet: string;
}) {
  const { updateDeal } = useSealPay();
  const mode = useDashboardMode();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const applied = deal.applications?.some(
    (item) => item.freelancerWallet.toLowerCase() === wallet.toLowerCase(),
  );
  const eligible =
    mode === "freelancer" &&
    deal.dealKind === "Public" &&
    deal.status === "Created";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError("");
    try {
      updateDeal(deal.id, (current) => ({
        ...current,
        applications: [
          ...(current.applications ?? []),
          {
            id: crypto.randomUUID(),
            freelancerName: formatWallet(wallet),
            freelancerWallet: wallet,
            proposal: String(form.get("proposal") ?? ""),
            estimatedDelivery: String(form.get("delivery") ?? ""),
            note: String(form.get("note") ?? ""),
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ],
        timeline: [
          ...current.timeline,
          makeTimelineEvent({
            title: "Application received",
            description: `A freelancer applied with an estimated delivery of ${String(form.get("delivery"))}.`,
            status: current.status,
            actor: "Freelancer",
          }),
        ],
      }));
      setMessage("Application submitted successfully.");
      setOpen(false);
    } catch {
      setError("Application could not be submitted. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!wallet)
    return (
      <p className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm font-bold text-[#00566a]">
        Connect your wallet by choosing Work as Freelancer to apply.
      </p>
    );
  if (!eligible && !applied) return null;
  return (
    <>
      <button
        type="button"
        disabled={applied}
        onClick={() => setOpen(true)}
        className="primary-button w-full"
      >
        <Send className="size-4" />
        {applied ? "Application Sent" : "Apply for Deal"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#010b13]/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#071722] p-6 text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                  Freelancer application
                </p>
                <h2 className="mt-2 text-2xl font-black">Apply for Deal</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full bg-white/5"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mt-6 block text-sm font-bold">
              Proposal message
              <textarea
                required
                name="proposal"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-cyan-300"
                placeholder="Explain how you will deliver this work."
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Estimated delivery time
              <input
                required
                name="delivery"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-cyan-300"
                placeholder="For example, 5 business days"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Optional note
              <textarea
                name="note"
                rows={2}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-cyan-300"
              />
            </label>
            {error ? (
              <p className="mt-4 text-sm font-bold text-red-300">{error}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="secondary-button border-white/10 bg-white/5 text-white"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                className="primary-button"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <Toast message={message} onClose={() => setMessage("")} />
    </>
  );
}
