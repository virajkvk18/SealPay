import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SealPay | Secure Smart-Contract Escrow",
  description:
    "SealPay locks invoice payments, verifies work proof, and releases funds transparently with smart-contract escrow.",
  icons: {
    icon: "/sealpay-logo.png",
    apple: "/sealpay-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-[#f7f9fb] text-[#191c1e]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
