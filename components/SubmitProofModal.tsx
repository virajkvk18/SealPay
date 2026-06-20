"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, FileUp, Link2, Loader2, X } from "lucide-react";
import { deliverableTypes, type DeliverableType } from "@/lib/mockData";

export interface ProofFormValues {
  title: string;
  note: string;
  previewUrl: string;
  finalFileName: string;
  deliverableType: DeliverableType;
  proofCid: string;
  proofGatewayUrl: string;
  uploadedFileName: string;
  storageProvider: "pinata";
}

function normalizePreviewUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

interface SubmitProofModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProofFormValues) => void | Promise<void>;
  defaultDeliverableType: DeliverableType;
  dealId: string;
}

function makeEmptyProof(deliverableType: DeliverableType) {
  return {
    title: "",
    note: "",
    previewUrl: "",
    finalFileName: "",
    deliverableType,
  };
}

type ProofSubmitStage = "idle" | "uploading" | "cid-generated" | "ai-reviewing";

const proofStages = [
  {
    key: "uploading",
    label: "Uploading to IPFS",
    description: "Pinata is pinning the selected proof file.",
  },
  {
    key: "cid-generated",
    label: "CID Generated",
    description: "The immutable IPFS proof reference is ready.",
  },
  {
    key: "ai-reviewing",
    label: "AI Reviewing",
    description: "Groq is checking the proof against deal requirements.",
  },
] as const;

function stageIndex(stage: ProofSubmitStage) {
  return proofStages.findIndex((item) => item.key === stage);
}

export default function SubmitProofModal({
  open,
  onClose,
  onSubmit,
  defaultDeliverableType,
  dealId,
}: SubmitProofModalProps) {
  const [form, setForm] = useState(() =>
    makeEmptyProof(defaultDeliverableType),
  );
  const [formError, setFormError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [finalDeliverable, setFinalDeliverable] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitStage, setSubmitStage] = useState<ProofSubmitStage>("idle");
  const [generatedCid, setGeneratedCid] = useState("");

  if (!open) return null;

  function updateField(field: keyof ProofFormValues, value: string) {
    if (formError) setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadProofFile(file: File) {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("dealId", dealId);

    const response = await fetch("/api/pinata/upload", {
      method: "POST",
      body: uploadData,
    });

    const result = (await response.json()) as {
      cid?: string;
      gatewayUrl?: string;
      fileName?: string;
      error?: string;
      details?: string;
    };

    if (!response.ok || !result.cid || !result.gatewayUrl) {
      throw new Error(
        result.details
          ? `${result.error ?? "Proof upload failed."} ${result.details}`
          : (result.error ?? "Proof upload failed."),
      );
    }

    return {
      cid: result.cid,
      gatewayUrl: result.gatewayUrl,
      fileName: result.fileName ?? file.name,
      provider: "pinata" as const,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const previewUrl = normalizePreviewUrl(form.previewUrl);
    if (!previewUrl) {
      setFormError("Preview URL must be a valid http or https link.");
      return;
    }

    if (!proofFile) {
      setFormError(
        "Attach the final proof file so SealPay can create a proof CID.",
      );
      return;
    }

    setUploading(true);
    setSubmitStage("uploading");
    setGeneratedCid("");
    let upload;
    try {
      upload = await uploadProofFile(proofFile);
      setGeneratedCid(upload.cid);
      setSubmitStage("cid-generated");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? `IPFS upload failed: ${error.message}`
          : "IPFS upload failed. Check Pinata configuration and try again.",
      );
      setUploading(false);
      setSubmitStage("idle");
      return;
    }

    try {
      setSubmitStage("ai-reviewing");
      await onSubmit({
        ...form,
        title: form.title.trim(),
        note: form.note.trim(),
        previewUrl,
        finalFileName:
          form.finalFileName.trim() ||
          finalDeliverable?.name ||
          upload.fileName,
        proofCid: upload.cid,
        proofGatewayUrl: upload.gatewayUrl,
        uploadedFileName: upload.fileName,
        storageProvider: upload.provider,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "AI review or proof save failed. Please try again.",
      );
      setUploading(false);
      setSubmitStage("cid-generated");
      return;
    }
    setForm(makeEmptyProof(defaultDeliverableType));
    setProofFile(null);
    setFinalDeliverable(null);
    setFormError("");
    setUploading(false);
    setSubmitStage("idle");
    setGeneratedCid("");
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
              <h2 className="text-2xl font-black text-[#010b13]">
                Submit work proof
              </h2>
              <p className="text-sm text-[#53606a]">
                Share a protected preview and keep the final file locked until
                release.
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
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Work title
            </span>
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
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#43474b]">
              <Link2 className="size-4 text-[#00677f]" />
              Preview URL
            </span>
            <input
              required
              type="url"
              inputMode="url"
              className="input-field"
              value={form.previewUrl}
              onChange={(event) =>
                updateField("previewUrl", event.target.value)
              }
              placeholder="https://preview.example.com/watermarked-sample"
            />
          </label>
          {formError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              {formError}
            </p>
          ) : null}

          {uploading || generatedCid ? (
            <div className="rounded-3xl border border-cyan-300/25 bg-[#061f2a] p-4 text-white shadow-[0_20px_50px_rgba(0,14,25,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                    Proof submission
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-300">
                    {"Uploading -> CID Generated -> AI Reviewing"}
                  </p>
                </div>
                {uploading ? (
                  <Loader2 className="size-5 animate-spin text-cyan-200" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-300" />
                )}
              </div>

              <div className="mt-4 grid gap-3">
                {proofStages.map((item) => {
                  const currentIndex = stageIndex(submitStage);
                  const itemIndex = stageIndex(item.key);
                  const isCurrent = submitStage === item.key;
                  const isDone = currentIndex > itemIndex;

                  return (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-cyan-200/30 bg-cyan-200/10">
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-emerald-300" />
                        ) : isCurrent ? (
                          <Loader2 className="size-4 animate-spin text-cyan-200" />
                        ) : (
                          <span className="size-2 rounded-full bg-slate-500" />
                        )}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-white">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {generatedCid ? (
                <p className="mt-4 break-all rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-xs font-bold text-cyan-100">
                  CID: {generatedCid}
                </p>
              ) : null}
            </div>
          ) : null}

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Final file name (optional)
            </span>
            <input
              className="input-field"
              value={form.finalFileName}
              onChange={(event) =>
                updateField("finalFileName", event.target.value)
              }
              placeholder="final-deliverable.zip"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Final deliverable file (optional)
            </span>
            <input
              type="file"
              className="input-field"
              onChange={(event) =>
                setFinalDeliverable(event.target.files?.[0] ?? null)
              }
            />
            {finalDeliverable ? (
              <p className="mt-2 text-xs font-bold text-[#53606a]">
                {finalDeliverable.name} will remain protected until payment
                release.
              </p>
            ) : null}
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Final proof file
            </span>
            <input
              required
              type="file"
              className="input-field"
              onChange={(event) =>
                setProofFile(event.target.files?.[0] ?? null)
              }
            />
            {proofFile ? (
              <p className="mt-2 text-xs font-bold text-[#53606a]">
                {proofFile.name} will be pinned before AI review.
              </p>
            ) : null}
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-[#43474b]">
              Deliverable type
            </span>
            <select
              className="input-field"
              value={form.deliverableType}
              onChange={(event) =>
                updateField(
                  "deliverableType",
                  event.target.value as DeliverableType,
                )
              }
            >
              {deliverableTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="secondary-button">
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="primary-button">
            {submitStage === "uploading"
              ? "Uploading..."
              : submitStage === "cid-generated"
                ? "CID Generated..."
                : submitStage === "ai-reviewing"
                  ? "AI Reviewing..."
                  : "Submit Work"}
          </button>
        </div>
      </form>
    </div>
  );
}
