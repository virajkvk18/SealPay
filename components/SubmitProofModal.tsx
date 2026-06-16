"use client";

import { FormEvent, useState } from "react";
import { FileUp, Link2, X } from "lucide-react";

export interface ProofFormValues {
  title: string;
  note: string;
  fileName: string;
  previewUrl: string;
}

interface SubmitProofModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProofFormValues) => void;
}

const emptyProof = {
  title: "",
  note: "",
  fileName: "",
  previewUrl: "",
};

export default function SubmitProofModal({
  open,
  onClose,
  onSubmit,
}: SubmitProofModalProps) {
  const [form, setForm] = useState(emptyProof);

  if (!open) return null;

  function updateField(field: keyof ProofFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
    setForm(emptyProof);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#010b13]/45 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="glass-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-[#00566a]">
              <FileUp className="size-5" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-[#010b13]">Submit work proof</h2>
              <p className="text-sm text-[#53606a]">
                Attach demo metadata and seal it with a fake file hash.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full border border-[#101d25]/10 bg-white/70 text-[#43474b] transition hover:text-[#010b13]"
            aria-label="Close submit proof modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">Work title</span>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Final landing page build"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Delivery note
            </span>
            <textarea
              required
              className="input-field min-h-28 resize-y"
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Summarize the handoff, files, and acceptance checklist."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">File name</span>
            <input
              required
              className="input-field"
              value={form.fileName}
              onChange={(event) => updateField("fileName", event.target.value)}
              placeholder="deliverable-preview.zip"
            />
          </label>

          <label>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#43474b]">
              <Link2 className="size-4 text-[#00677f]" />
              Preview link or sample image URL
            </span>
            <input
              className="input-field"
              value={form.previewUrl}
              onChange={(event) => updateField("previewUrl", event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="secondary-button">
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Submit Proof
          </button>
        </div>
      </form>
    </div>
  );
}
