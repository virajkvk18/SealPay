"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  clearDashboardSession,
  useDashboardMode,
  useDashboardWallet,
  type DashboardMode,
} from "@/lib/dashboardMode";
import { useWallet } from "@/lib/wallet";

export default function RoleGuard({
  allow,
  children,
}: {
  allow: DashboardMode[];
  children: ReactNode;
}) {
  const router = useRouter();
  const mode = useDashboardMode();
  const sessionWallet = useDashboardWallet();
  const { address, initialized } = useWallet();
  const walletMatches = Boolean(
    address &&
      sessionWallet &&
      address.toLowerCase() === sessionWallet.toLowerCase(),
  );
  const permitted = Boolean(mode && allow.includes(mode) && walletMatches);

  useEffect(() => {
    if (!initialized || permitted) return;
    if (!walletMatches) clearDashboardSession();
    router.replace(
      mode && walletMatches ? "/dashboard" : "/?notice=choose-role",
    );
  }, [initialized, mode, permitted, router, walletMatches]);

  if (!initialized || !permitted) {
    return (
      <main className="dashboard-shell grid min-h-screen place-items-center">
        <p className="rounded-full border border-violet-300/15 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300">
          Verifying wallet identity...
        </p>
      </main>
    );
  }

  return children;
}
