"use client";

import { BriefcaseBusiness, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { setDashboardSession, type DashboardMode } from "@/lib/dashboardMode";
import { useWallet } from "@/lib/wallet";

export default function WalletIntentActions({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const { connect, error, isConnecting } = useWallet();

  async function continueAs(mode: DashboardMode) {
    const wallet = await connect();
    if (!wallet) return;

    setDashboardSession(mode, wallet);
    router.push("/dashboard");
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
          className="freelancer-cta secondary-button min-h-12 px-6"
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
