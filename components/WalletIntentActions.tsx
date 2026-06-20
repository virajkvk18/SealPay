"use client";

import { BriefcaseBusiness, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { setDashboardMode, type DashboardMode } from "@/lib/dashboardMode";
import { useWallet } from "@/lib/wallet";

function intentDestination(mode: DashboardMode) {
  return `/dashboard?mode=${mode}`;
}

export default function WalletIntentActions({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const { address, connect, error, isConnecting } = useWallet();

  async function continueAs(mode: DashboardMode) {
    const wallet = address || (await connect());
    if (!wallet) return;

    setDashboardMode(mode);
    router.push(intentDestination(mode));
  }

  return (
    <div>
      <div className={`flex flex-wrap gap-3 ${compact ? "" : "mt-9"}`}>
        <button
          type="button"
          onClick={() => void continueAs("client")}
          disabled={isConnecting}
          className="primary-button min-h-12 px-6"
        >
          {isConnecting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <BriefcaseBusiness className="size-4" />
          )}
          Hire a Freelancer
        </button>
        <button
          type="button"
          onClick={() => void continueAs("freelancer")}
          disabled={isConnecting}
          className="secondary-button min-h-12 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
        >
          <Search className="size-4" />
          Work as Freelancer
        </button>
      </div>
      {error ? (
        <p className="mt-4 max-w-xl rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
