"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRoundCheck, X } from "lucide-react";
import {
  getApplicationsForDeals,
  selectApplicationForDeal,
  updateApplication,
} from "@/lib/deals";
import type { Deal, DealApplication } from "@/lib/mockData";
import { useSealPay } from "@/lib/store";
import { formatWallet, makeTimelineEvent } from "@/lib/utils";
import Toast from "@/components/Toast";

export default function ApplicationsList({
  deals,
  dark = false,
}: {
  deals: Deal[];
  dark?: boolean;
}) {
  const { updateDeal } = useSealPay();
  const [selection, setSelection] = useState<{
    deal: Deal;
    application: DealApplication;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [remoteApplications, setRemoteApplications] = useState<
    Array<DealApplication & { dealId: string }>
  >([]);
  const dealIds = useMemo(() => deals.map((deal) => deal.id), [deals]);
  const applications = useMemo(
    () =>
      deals.flatMap((deal) => {
        const remoteForDeal = remoteApplications.filter(
          (application) => application.dealId === deal.id,
        );
        const remoteIds = new Set(
          remoteForDeal.map((application) => application.id),
        );
        const localOnly = (deal.applications ?? []).filter(
          (application) => !remoteIds.has(application.id),
        );

        return [...remoteForDeal, ...localOnly].map((application) => ({
          deal,
          application,
        }));
      }),
    [deals, remoteApplications],
  );

  useEffect(() => {
    let cancelled = false;
    void getApplicationsForDeals(dealIds).then((rows) => {
      if (!cancelled) setRemoteApplications(rows);
    });

    return () => {
      cancelled = true;
    };
  }, [dealIds]);

  async function reject(deal: Deal, application: DealApplication) {
    try {
      await updateApplication(application.id, { status: "rejected" });
      updateDeal(deal.id, (current) => ({
        ...current,
        applications: current.applications?.map((item) =>
          item.id === application.id ? { ...item, status: "rejected" } : item,
        ),
      }));
      setRemoteApplications((current) =>
        current.map((item) =>
          item.id === application.id ? { ...item, status: "rejected" } : item,
        ),
      );
    } catch {
      setMessage("Application rejection failed. Please try again.");
    }
  }
  async function confirm() {
    if (!selection) return;
    const selectedFreelancerName =
      selection.application.freelancerName ??
      formatWallet(selection.application.freelancerWallet);

    try {
      await selectApplicationForDeal(selection.deal.id, selection.application.id);
      updateDeal(selection.deal.id, (current) => ({
        ...current,
        freelancerWallet: selection.application.freelancerWallet,
        selectedFreelancerWallet: selection.application.freelancerWallet,
        freelancerName: selectedFreelancerName,
        status: "Assigned",
        applications: current.applications?.map((item) => ({
          ...item,
          status:
            item.id === selection.application.id ? "selected" : "rejected",
        })),
        timeline: [
          ...current.timeline,
          makeTimelineEvent({
            title: "Freelancer selected",
            description: `Client assigned the deal to ${selectedFreelancerName}.`,
            status: "Assigned",
            actor: "Client",
          }),
        ],
      }));
      setRemoteApplications((current) =>
        current.map((item) =>
          item.dealId === selection.deal.id
            ? {
                ...item,
                status:
                  item.id === selection.application.id
                    ? "selected"
                    : "rejected",
              }
            : item,
        ),
      );
      setMessage("Freelancer selected successfully.");
      setSelection(null);
    } catch {
      setMessage("Freelancer selection failed. Please try again.");
    }
  }

  return (
    <section
      id="applications"
      className={
        dark
          ? "dashboard-panel overflow-hidden rounded-[2rem]"
          : "glass-panel rounded-3xl p-6 sm:p-8"
      }
    >
      <div className={dark ? "border-b border-white/8 px-6 py-5" : ""}>
        <h2
          className={
            dark
              ? "text-xl font-black text-white"
              : "text-2xl font-black text-[#010b13]"
          }
        >
          Applications Received
        </h2>
        <p
          className={
            dark ? "mt-1 text-xs text-slate-500" : "mt-2 text-sm text-[#53606a]"
          }
        >
          Review proposals and assign one freelancer.
        </p>
      </div>
      {message === "Freelancer selected successfully." ? (
        <p className={dark ? "mx-6 mt-5 text-sm font-bold text-cyan-200" : "mt-5 text-sm font-bold text-[#00677f]"}>
          Next step: Lock payment in escrow.
        </p>
      ) : null}
      <div className={dark ? "space-y-4 p-6" : "mt-6 space-y-4"}>
        {applications.length ? (
          applications.map(({ deal, application }) => (
            <article
              key={application.id}
              className={
                dark
                  ? "rounded-2xl border border-white/8 bg-white/[0.025] p-5"
                  : "rounded-2xl border border-[#101d25]/10 bg-white/70 p-5"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    className={
                      dark
                        ? "font-black text-white"
                        : "font-black text-[#010b13]"
                    }
                  >
                    {deal.title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {formatWallet(application.freelancerWallet)}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black capitalize text-cyan-300">
                  {application.status}
                </span>
              </div>
              <p
                className={
                  dark
                    ? "mt-4 text-sm leading-6 text-slate-300"
                    : "mt-4 text-sm leading-6 text-[#43474b]"
                }
              >
                {application.proposal}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                {application.proposedPrice ? (
                  <span>Proposed: {application.proposedPrice} POL</span>
                ) : null}
                <span>Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                {application.trustScore ? (
                  <span>Trust: {application.trustScore}</span>
                ) : null}
              </div>
              {application.status === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelection({ deal, application })}
                    className="primary-button px-4 py-2 text-sm"
                  >
                    <UserRoundCheck className="size-4" />
                    Select Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(deal, application)}
                    className="secondary-button px-4 py-2 text-sm"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="py-8 text-center">
            <UserRoundCheck className="mx-auto size-8 text-slate-600" />
            <p className="mt-4 text-sm font-bold text-slate-500">
              No applications received yet.
            </p>
          </div>
        )}
      </div>
      {selection ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#010b13]/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#071722] p-6 text-white">
            <div className="flex justify-between gap-4">
              <h2 className="text-2xl font-black">Select this freelancer?</h2>
              <button onClick={() => setSelection(null)}>
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-4 leading-7 text-slate-300">
              This will assign the deal to this freelancer. Only the selected
              freelancer will be able to submit work.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelection(null)}
                className="secondary-button border-white/10 bg-white/5 text-white"
              >
                Cancel
              </button>
              <button onClick={confirm} className="primary-button">
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast message={message} onClose={() => setMessage("")} />
    </section>
  );
}
