"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Wallet } from "lucide-react";
import WalletIntentActions from "@/components/WalletIntentActions";
import {
  clearDashboardSession,
  useDashboardMode,
  useDashboardWallet,
} from "@/lib/dashboardMode";
import { cn, formatWallet } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";

interface NavItem {
  href: string;
  label: string;
}

const landingItems: NavItem[] = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#for-clients", label: "For Clients" },
  { href: "/#for-freelancers", label: "For Freelancers" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];

const clientItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create-deal", label: "Create Deal" },
  { href: "/dashboard#my-deals", label: "My Deals" },
  { href: "/dashboard#applications", label: "Applications Received" },
  { href: "/dashboard#pending-approvals", label: "Pending Approvals" },
  { href: "/dashboard#submitted-proofs", label: "Proof Timeline" },
  { href: "/reputation", label: "Trust Score" },
];

const freelancerItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/open-deals", label: "Open Deals" },
  { href: "/dashboard#assigned", label: "Assigned Deals" },
  { href: "/dashboard#submit-work", label: "Submit Work" },
  { href: "/dashboard#submitted-proofs", label: "Submitted Proofs" },
  { href: "/reputation", label: "Earnings" },
  { href: "/reputation", label: "Trust Score" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const mode = useDashboardMode();
  const wallet = useDashboardWallet();
  const { connect, disconnect, isConnecting } = useWallet();
  const isLanding = pathname === "/";
  const isPublicNav = isLanding || !mode;
  const items = isPublicNav
    ? landingItems
    : mode === "freelancer"
      ? freelancerItems
      : clientItems;

  function logout() {
    clearDashboardSession();
    void disconnect();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-200/10 bg-[#020b10]/92 shadow-xl shadow-black/10 backdrop-blur-2xl">
      <nav className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/sealpay-mark.png"
            alt="SealPay logo"
            width={44}
            height={44}
            className="size-11 object-contain"
            priority
          />
          <span className="brand-font hidden text-xl font-black sm:inline">
            <span className="text-white">Seal</span>
            <span className="text-violet-400">Pay</span>
          </span>
        </Link>
        <div className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "rounded-full px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/6 hover:text-white",
                !isLanding &&
                  pathname === item.href &&
                  "bg-cyan-300/10 text-cyan-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {isLanding ? (
          <div className="hidden shrink-0 xl:block">
            <WalletIntentActions compact />
          </div>
        ) : mode ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs font-black text-violet-200 sm:inline">
              {mode === "freelancer" ? "Freelancer Mode" : "Client Mode"}
            </span>
            <button
              type="button"
              onClick={() => void connect()}
              disabled={isConnecting}
              className="hidden items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 font-mono text-xs text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/10 disabled:cursor-wait disabled:opacity-70 md:flex"
              title="Open MetaMask"
            >
              <Wallet className="size-3.5" />
              {isConnecting ? "Connecting..." : formatWallet(wallet)}
            </button>
            <button
              type="button"
              onClick={logout}
              className="secondary-button border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/"
            className="secondary-button border-white/10 bg-white/5 px-4 py-2 text-xs text-white"
          >
            Choose Role
          </Link>
        )}
      </nav>
      {!isPublicNav ? (
        <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}-mobile`}
              href={item.href}
              className="shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
