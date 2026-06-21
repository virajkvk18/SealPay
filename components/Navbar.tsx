"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Wallet } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
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
  { href: "/dashboard#applications", label: "Applications" },
  { href: "/dashboard#timeline", label: "Timeline" },
];

const freelancerItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/open-deals", label: "Open Deals" },
  { href: "/dashboard#assigned", label: "Assigned Work" },
  { href: "/dashboard#submit-work", label: "Submit Work" },
  { href: "/dashboard#timeline", label: "Timeline" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const mode = useDashboardMode();
  const wallet = useDashboardWallet();
  const { connect, disconnect, isConnecting } = useWallet();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-40 border-b border-violet-200/10 bg-[#130d21]/92 shadow-xl shadow-black/10 backdrop-blur-2xl">
      <nav className="navbar-shell flex min-h-20 w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="brand-lockup flex shrink-0 items-center">
          <Image
            src="/sealpay-mark.png"
            alt="SealPay logo"
            width={52}
            height={52}
            className="brand-mark object-contain"
            priority
          />
          <span className="brand-font brand-wordmark hidden font-black sm:inline">
            <span className="text-white">Seal</span>
            <span className="text-violet-400">Pay</span>
          </span>
        </Link>
        <div className="hidden min-w-0 items-center justify-center gap-2 lg:flex">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "navbar-link",
                !isLanding &&
                  pathname === item.href &&
                  "navbar-link-active",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {isLanding ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
            <div className="hidden xl:block">
              <WalletIntentActions compact />
            </div>
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
              className="hidden items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/5 px-3 py-2 font-mono text-xs text-violet-100 transition hover:border-violet-200/40 hover:bg-violet-300/10 disabled:cursor-wait disabled:opacity-70 md:flex"
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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
            <Link
              href="/"
              className="secondary-button border-white/10 bg-white/5 px-4 py-2 text-xs text-white"
            >
              Choose Role
            </Link>
          </div>
        )}
      </nav>
      {!isPublicNav ? (
        <div className="navbar-mobile-row flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 sm:px-6 lg:hidden lg:px-8">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}-mobile`}
              href={item.href}
              className="navbar-link shrink-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
