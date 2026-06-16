"use client";

import { FormEvent, useState } from "react";
import { Scale, X } from "lucide-react";

export interface DisputeFormValues {
  reason: string;
  evidence: string;
}

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: DisputeFormValues) => void;
}

const emptyDispute = {
  reason: "",
  evidence: "",
};

export default function DisputeModal({ open, onClose, onSubmit }: DisputeModalProps) {
  const [form, setForm] = useState(emptyDispute);

  if (!open) return null;

  function updateField(field: keyof DisputeFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
    setForm(emptyDispute);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#010b13]/45 px-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-xl rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-amber-300/40 bg-amber-100/60 text-amber-800">
              <Scale className="size-5" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-[#010b13]">Raise dispute</h2>
              <p className="text-sm text-[#53606a]">
                Capture the issue and evidence for an admin judge.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full border border-[#101d25]/10 bg-white/70 text-[#43474b] transition hover:text-[#010b13]"
            aria-label="Close dispute modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Dispute reason
            </span>
            <textarea
              required
              className="input-field min-h-28 resize-y"
              value={form.reason}
              onChange={(event) => updateField("reason", event.target.value)}
              placeholder="Explain what should be reviewed before release."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Evidence note
            </span>
            <textarea
              required
              className="input-field min-h-24 resize-y"
              value={form.evidence}
              onChange={(event) => updateField("evidence", event.target.value)}
              placeholder="Mention screenshots, links, or revision evidence."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="secondary-button">
            Cancel
          </button>
          <button type="submit" className="danger-button">
            Raise Dispute
          </button>
        </div>
      </form>
    </div>
  );
}
