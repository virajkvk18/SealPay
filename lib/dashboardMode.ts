"use client";

import { useSyncExternalStore } from "react";

export type DashboardMode = "client" | "freelancer";

const dashboardModeKey = "sealpay-dashboard-mode-v1";
const dashboardModeEvent = "sealpay-dashboard-mode-change";

function isDashboardMode(value: string | null): value is DashboardMode {
  return value === "client" || value === "freelancer";
}

function readDashboardMode(): DashboardMode {
  const value = window.localStorage.getItem(dashboardModeKey);
  return isDashboardMode(value) ? value : "client";
}

function subscribeDashboardMode(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(dashboardModeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(dashboardModeEvent, onStoreChange);
  };
}

export function setDashboardMode(mode: DashboardMode) {
  window.localStorage.setItem(dashboardModeKey, mode);
  window.dispatchEvent(new Event(dashboardModeEvent));
}

export function useDashboardMode() {
  return useSyncExternalStore(
    subscribeDashboardMode,
    readDashboardMode,
    () => "client" as DashboardMode,
  );
}
