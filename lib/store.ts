"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Deal, Role } from "@/lib/mockData";
import { initialDeals, roles } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

const dealsKey = "sealpay-deals-v1";
const roleKey = "sealpay-role-v1";
const dealsChangedEvent = "sealpay-deals-change";
const roleChangedEvent = "sealpay-role-change";
const initialDealsSnapshot = JSON.stringify(initialDeals);
const legacyCurrencyLabel = ["test", "ETH"].join(" ");

function readDeals() {
  if (typeof window === "undefined") return initialDeals;

  try {
    const stored = window.localStorage.getItem(dealsKey);
    return stored ? (JSON.parse(stored) as Deal[]) : initialDeals;
  } catch {
    return initialDeals;
  }
}

function readRole(): Role {
  if (typeof window === "undefined") return "Client";
  const stored = window.localStorage.getItem(roleKey) as Role | null;
  return roles.includes(stored as Role) ? (stored as Role) : "Client";
}

function writeDeals(deals: Deal[]) {
  window.localStorage.setItem(dealsKey, JSON.stringify(deals));
  window.dispatchEvent(new Event(dealsChangedEvent));
}

function syncDeal(deal: Deal) {
  if (!supabase) return;

  void supabase
    .from("deals")
    .update({
      status: deal.status,
      freelancer_wallet: deal.freelancerWallet,
      selected_freelancer_wallet: deal.selectedFreelancerWallet ?? null,
      applications: deal.applications ?? [],
      timeline: deal.timeline,
      preview_url: deal.previewUrl ?? deal.proof?.previewUrl ?? null,
      final_file_name:
        deal.finalFileName ?? deal.proof?.finalFileName ?? null,
      proof: deal.proof ?? null,
      ai_proof_review: deal.aiProofReview ?? null,
      dispute_reason: deal.disputeReason ?? null,
      dispute_evidence: deal.disputeEvidence ?? null,
      ai_dispute_summary: deal.aiDisputeSummary ?? null,
      resolution: deal.resolution ?? null,
    })
    .eq("id", deal.id)
    .then(({ error }) => {
      if (error) console.error("Deal sync failed", error);
    });
}

function writeRole(role: Role) {
  window.localStorage.setItem(roleKey, role);
  window.dispatchEvent(new Event(roleChangedEvent));
}

function subscribeDeals(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(dealsChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(dealsChangedEvent, onStoreChange);
  };
}

function subscribeRole(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(roleChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(roleChangedEvent, onStoreChange);
  };
}

function getDealsSnapshot() {
  return window.localStorage.getItem(dealsKey) ?? initialDealsSnapshot;
}

function getServerDealsSnapshot() {
  return initialDealsSnapshot;
}

function getRoleSnapshot() {
  return readRole();
}

function getServerRoleSnapshot(): Role {
  return "Client";
}

function normalizeStoredDeal(deal: Deal): Deal {
  const seedDeal = initialDeals.find((seed) => seed.id === deal.id);
  const finalFileName =
    deal.finalFileName ??
    deal.proof?.finalFileName ??
    deal.proof?.fileName ??
    seedDeal?.finalFileName;
  const previewUrl =
    deal.previewUrl ?? deal.proof?.previewUrl ?? seedDeal?.previewUrl;

  return {
    ...deal,
    applications: deal.applications ?? seedDeal?.applications ?? [],
    finalFileName,
    previewUrl,
    proof: deal.proof
      ? {
          ...deal.proof,
          finalFileName:
            deal.proof.finalFileName ??
            deal.proof.fileName ??
            finalFileName ??
            "final-deliverable.zip",
          deliverableType: deal.proof.deliverableType ?? deal.deliverableType,
        }
      : undefined,
    aiProofReview: deal.aiProofReview ?? seedDeal?.aiProofReview,
    aiDisputeSummary: deal.aiDisputeSummary ?? seedDeal?.aiDisputeSummary,
    timeline: deal.timeline.map((event) => ({
      ...event,
      description: event.description.replaceAll(
        legacyCurrencyLabel,
        "POL",
      ),
    })),
  };
}

function parseDealsSnapshot(snapshot: string) {
  try {
    return (JSON.parse(snapshot) as Deal[]).map(normalizeStoredDeal);
  } catch {
    return initialDeals;
  }
}

export function useSealPay() {
  const dealsSnapshot = useSyncExternalStore(
    subscribeDeals,
    getDealsSnapshot,
    getServerDealsSnapshot,
  );
  const activeRole = useSyncExternalStore(
    subscribeRole,
    getRoleSnapshot,
    getServerRoleSnapshot,
  );
  const deals = useMemo(
    () => parseDealsSnapshot(dealsSnapshot),
    [dealsSnapshot],
  );

  const persistDeals = useCallback(
    (updater: Deal[] | ((currentDeals: Deal[]) => Deal[])) => {
      const currentDeals = readDeals();
      const nextDeals =
        typeof updater === "function" ? updater(currentDeals) : updater;
      writeDeals(nextDeals);
    },
    [],
  );

  const addDeal = useCallback(
    (deal: Deal) => {
      persistDeals((currentDeals) => [deal, ...currentDeals]);
    },
    [persistDeals],
  );

  const updateDeal = useCallback(
    (dealId: string, updater: (deal: Deal) => Deal) => {
      let updatedDeal: Deal | undefined;
      persistDeals((currentDeals) =>
        currentDeals.map((deal) => {
          if (deal.id !== dealId) return deal;
          updatedDeal = updater(deal);
          return updatedDeal;
        }),
      );
      if (updatedDeal) syncDeal(updatedDeal);
    },
    [persistDeals],
  );

  const resetDemo = useCallback(() => {
    writeDeals(initialDeals);
  }, []);

  const setActiveRole = useCallback((role: Role) => {
    writeRole(role);
  }, []);

  const totals = useMemo(() => {
    return deals.reduce(
      (stats, deal) => {
        stats.total += 1;
        stats.lockedAmount += [
          "Payment Locked",
          "Work Submitted",
          "Disputed",
        ].includes(deal.status)
          ? deal.amount
          : 0;
        if (
          ["Created", "Payment Locked", "Work Submitted"].includes(deal.status)
        ) {
          stats.active += 1;
        }
        if (
          ["Approved", "Payment Released", "Resolved"].includes(deal.status)
        ) {
          stats.completed += 1;
        }
        if (deal.status === "Disputed") stats.disputed += 1;
        return stats;
      },
      { total: 0, active: 0, completed: 0, disputed: 0, lockedAmount: 0 },
    );
  }, [deals]);

  return {
    deals,
    totals,
    hydrated: true,
    activeRole,
    addDeal,
    updateDeal,
    setActiveRole,
    resetDemo,
  };
}
