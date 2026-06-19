"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";
import { saveWalletProfile, type Web3Role } from "@/lib/profiles";
import { formatWallet } from "@/lib/utils";

const walletKey = "sealpay-wallet-v1";
const walletChangedEvent = "sealpay-wallet-change";

function makeMockWallet() {
  return `0x${Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;
}

export default function AuthPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState<Web3Role>("Client");
  const [form, setForm] = useState({
    name: "",
    skills: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function connectMockWallet() {
    const nextWallet = makeMockWallet();
    setWallet(nextWallet);
    window.localStorage.setItem(walletKey, nextWallet);
    window.dispatchEvent(new Event(walletChangedEvent));
    setStatus("Mock wallet connected. Choose your role to finish onboarding.");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wallet) {
      setError("Connect a wallet before saving your profile.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    setError("");

    try {
      await saveWalletProfile({
        wallet,
        name: form.name.trim(),
        role,
        skills: role === "Freelancer" ? form.skills.trim() : undefined,
      });
      setStatus("Wallet profile saved. Redirecting to dashboard...");
      window.setTimeout(() => router.push("/dashboard"), 700);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Profile save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell grid-bg min-h-screen text-[#191c1e]">
      <header className="border-b border-[#d8dadc]/70 bg-white/78 backdrop-blur-xl">
        <nav className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/sealpay-logo.png"
              alt="SealPay logo"
              width={44}
              height={44}
              className="size-11 rounded-2xl object-cover shadow-lg shadow-cyan-900/10"
              priority
            />
            <span className="brand-font text-[25px] font-black leading-none tracking-normal text-black">
              SealPay
            </span>
          </Link>
          <Link href="/" className="secondary-button px-4 py-2 text-sm">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#b6ebff] px-4 py-1.5 text-xs font-bold text-[#001f28]">
            <ShieldCheck className="size-3.5" />
            Pure Web3 Identity
          </div>
          <h1 className="brand-font mt-7 max-w-xl text-[42px] font-black leading-[1.08] text-black sm:text-[50px]">
            Your wallet is your SealPay identity.
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#43474b]">
            SealPay does not depend on centralized login. Connect a wallet, choose your
            role, and Supabase only stores application state.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              "No passwords or auth provider.",
              "Wallet address becomes the user identity.",
              "Supabase stores only profiles, deals, proofs, and timeline data.",
            ].map((item) => (
              <p key={item} className="flex items-center gap-3 text-sm font-bold text-[#43474b]">
                <CheckCircle2 className="size-4 text-emerald-700" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <section className="glass-panel rounded-[32px] p-6 shadow-2xl shadow-[#101d25]/10">
          <div className="rounded-3xl bg-[#010b13] p-6 text-white">
            <p className="text-sm font-black uppercase tracking-normal text-cyan-100">
              Step 1
            </p>
            <h2 className="brand-font mt-2 text-3xl font-black">Connect wallet</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              MetaMask will be integrated later. This button creates a demo wallet address
              and stores it locally for the current MVP flow.
            </p>
            <button type="button" onClick={connectMockWallet} className="primary-button mt-5">
              <Wallet className="size-4" />
              {wallet ? "Reconnect Mock Wallet" : "Connect Mock Wallet"}
            </button>
          </div>

          {wallet ? (
            <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-50 p-4">
              <p className="text-sm font-black text-[#00566a]">Connected wallet</p>
              <p className="mt-2 break-all font-mono text-sm font-bold text-[#010b13]">
                {wallet}
              </p>
              <p className="mt-2 text-xs font-bold text-[#53606a]">
                Display: {formatWallet(wallet)}
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-[#00677f]">
                First time?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["Client", "Freelancer"] as Web3Role[]).map((nextRole) => (
                  <button
                    key={nextRole}
                    type="button"
                    onClick={() => setRole(nextRole)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                      role === nextRole
                        ? "border-black bg-black text-white"
                        : "border-[#101d25]/10 bg-white/70 text-[#43474b]"
                    }`}
                  >
                    I&apos;m a {nextRole}
                  </button>
                ))}
              </div>
            </div>

            <label>
              <span className="mb-2 block text-sm font-bold text-[#43474b]">Name</span>
              <input
                required
                className="input-field"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={role === "Client" ? "Aarav Mehta" : "Aanya Studio"}
              />
            </label>

            {role === "Freelancer" ? (
              <label>
                <span className="mb-2 block text-sm font-bold text-[#43474b]">
                  Skills
                </span>
                <input
                  required
                  className="input-field"
                  value={form.skills}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, skills: event.target.value }))
                  }
                  placeholder="Logo design, thumbnails, landing pages"
                />
              </label>
            ) : null}

            {status ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                {status}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={submitting || !wallet} className="primary-button w-full">
              {submitting ? "Saving Profile..." : "Continue to Dashboard"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
