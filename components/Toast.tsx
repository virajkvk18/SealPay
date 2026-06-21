"use client";

import { CheckCircle2, X } from "lucide-react";

export default function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-300/25 bg-[#1c1230]/95 px-4 py-3 text-sm font-bold text-emerald-100 shadow-2xl backdrop-blur-xl"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
      <span className="leading-6">{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="grid size-6 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
