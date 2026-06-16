"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Deal, Role } from "@/lib/mockData";
import { initialDeals, roles } from "@/lib/mockData";

const dealsKey = "sealpay-deals-v1";
const roleKey = "sealpay-role-v1";
const dealsChangedEvent = "sealpay-deals-change";
const roleChangedEvent = "sealpay-role-change";
const initialDealsSnapshot = JSON.stringify(initialDeals);

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

function parseDealsSnapshot(snapshot: string) {
  try {
    return JSON.parse(snapshot) as Deal[];
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
  const deals = useMemo(() => parseDealsSnapshot(dealsSnapshot), [dealsSnapshot]);

  const persistDeals = useCallback((updater: Deal[] | ((currentDeals: Deal[]) => Deal[])) => {
    const currentDeals = readDeals();
    const nextDeals = typeof updater === "function" ? updater(currentDeals) : updater;
    writeDeals(nextDeals);
  }, []);

  const addDeal = useCallback(
    (deal: Deal) => {
      persistDeals((currentDeals) => [deal, ...currentDeals]);
    },
    [persistDeals],
  );

  const updateDeal = useCallback(
    (dealId: string, updater: (deal: Deal) => Deal) => {
      persistDeals((currentDeals) =>
        currentDeals.map((deal) => (deal.id === dealId ? updater(deal) : deal)),
      );
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
        stats.lockedAmount += ["Payment Locked", "Work Submitted", "Disputed"].includes(
          deal.status,
        )
          ? deal.amount
          : 0;
        if (["Created", "Payment Locked", "Work Submitted"].includes(deal.status)) {
          stats.active += 1;
        }
        if (["Approved", "Payment Released", "Resolved"].includes(deal.status)) {
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
