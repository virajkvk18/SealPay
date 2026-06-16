import Link from "next/link";
import Image from "next/image";
import { FileSearch, LayoutDashboard, PlusCircle } from "lucide-react";
import WalletButton from "@/components/WalletButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create-deal", label: "New Deal", icon: PlusCircle },
  { href: "/proof/SP-1001", label: "Proof", icon: FileSearch },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/72 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/sealpay-logo.png"
            alt="SealPay logo"
            width={44}
            height={44}
            className="size-11 rounded-2xl object-cover shadow-lg shadow-cyan-900/10"
          />
          <span>
            <span className="block font-[Sora] text-xl font-black tracking-normal text-[#010b13]">
              SealPay
            </span>
            <span className="hidden text-xs font-semibold text-[#53606a] sm:block">
              Mock Web3 escrow
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-[#101d25]/10 bg-white/70 p-1 shadow-inner md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#43474b] transition hover:bg-[#f2f4f6] hover:text-[#010b13]"
              >
                <Icon className="size-4" />
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
