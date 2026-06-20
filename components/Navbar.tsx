"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import WalletButton from "@/components/WalletButton";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  matches?: string[];
}

const appNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", matches: ["/dashboard"] },
  { href: "/create-deal", label: "Create Deal", matches: ["/create-deal"] },
  { href: "/deal/SP-1003", label: "Disputes", matches: ["/deal"] },
  { href: "/reputation", label: "Reputation", matches: ["/reputation"] },
];

const landingNavItems: NavItem[] = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#for-clients", label: "For Clients" },
  { href: "/#for-freelancers", label: "For Freelancers" },
  { href: "/#security", label: "Security" },
  { href: "/#proof-timeline", label: "Proof Timeline" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-200/10 bg-[#020b10]/86 shadow-xl shadow-black/10 backdrop-blur-2xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/sealpay-mark.png"
            alt="SealPay logo"
            width={48}
            height={48}
            className="size-12 object-contain drop-shadow-[0_10px_24px_rgba(139,92,246,0.28)]"
            priority
          />
          {isLandingPage ? (
            <span className="brand-font text-xl font-black tracking-tight sm:text-2xl">
              <span className="text-white">Seal</span>
              <span className="bg-gradient-to-br from-[#c36bff] via-[#8b2cff] to-[#5921d6] bg-clip-text text-transparent">
                Pay
              </span>
            </span>
          ) : null}
          {!isLandingPage ? (
            <span className="chain-chip nav-chain-chip">
              <Activity className="size-3" />
              Web3 Network
            </span>
          ) : null}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {(isLandingPage ? landingNavItems : appNavItems).map((item) => {
            const isActive =
              item.matches?.some((match) => pathname.startsWith(match)) ??
              false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/6 hover:text-white",
                  isActive &&
                    "bg-cyan-300/10 font-black text-cyan-100 ring-1 ring-cyan-200/15",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <WalletButton compactOnly />
      </nav>
    </header>
  );
}
