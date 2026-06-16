"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import WalletButton from "@/components/WalletButton";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", matches: ["/dashboard"] },
  { href: "/create-deal", label: "Invoices", matches: ["/create-deal"] },
  { href: "/deal/SP-1003", label: "Disputes", matches: ["/deal"] },
  { href: "/reputation", label: "Reputation", matches: ["/reputation"] },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/sealpay-logo.png"
            alt="SealPay logo"
            width={44}
            height={44}
            className="size-11 rounded-2xl object-cover shadow-lg shadow-cyan-900/10"
          />
          <span className="font-[Sora] text-2xl font-black tracking-normal text-[#010b13]">
            SealPay
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = item.matches.some((match) => pathname.startsWith(match));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 border-transparent pb-1 text-sm font-semibold text-[#43474b] transition hover:text-[#010b13]",
                  isActive && "border-[#010b13] font-black text-[#010b13]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
