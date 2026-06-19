import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AiProofReview } from "@/lib/mockData";

export interface ProofInsertInput {
  dealId: string;
  proofCid: string;
  proofUrl: string;
  fileName: string;
  aiReview: AiProofReview;
}

export async function saveProofToSupabase({
  dealId,
  proofCid,
  proofUrl,
  fileName,
  aiReview,
}: ProofInsertInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { skipped: true };
  }

  const { error } = await supabase.from("proofs").insert({
    deal_id: dealId,
    proof_cid: proofCid,
    proof_url: proofUrl,
    file_name: fileName,
    ai_review: aiReview,
    status: "submitted",
  });

  if (error) {
    throw new Error(`Supabase proof save failed: ${error.message}`);
  }

  return { skipped: false };
}
