"use client";

import { useSyncExternalStore } from "react";

export type DashboardMode = "client" | "freelancer";

const dashboardModeKey = "sealpay-dashboard-mode-v1";
const dashboardWalletKey = "sealpay-wallet-v1";
const dashboardSessionEvent = "sealpay-dashboard-session-change";

function isDashboardMode(value: string | null): value is DashboardMode {
  return value === "client" || value === "freelancer";
}

function readMode() {
  const value = window.localStorage.getItem(dashboardModeKey);
  return isDashboardMode(value) ? value : null;
}

function readWallet() {
  return window.localStorage.getItem(dashboardWalletKey) ?? "";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(dashboardSessionEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(dashboardSessionEvent, onStoreChange);
  };
}

function notifySessionChange() {
  window.dispatchEvent(new Event(dashboardSessionEvent));
}

export function setDashboardSession(mode: DashboardMode, wallet: string) {
  window.localStorage.setItem(dashboardModeKey, mode);
  window.localStorage.setItem(dashboardWalletKey, wallet);
  notifySessionChange();
}

export function clearDashboardSession() {
  window.localStorage.removeItem(dashboardModeKey);
  window.localStorage.removeItem(dashboardWalletKey);
  notifySessionChange();
}

export function useDashboardMode() {
  return useSyncExternalStore(subscribe, readMode, () => null);
}

export function useDashboardWallet() {
  return useSyncExternalStore(subscribe, readWallet, () => "");
}
