import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface ProofInsertInput {
  dealId: string;
  proofCid: string;
  proofUrl: string;
  fileName: string;
}

export interface ProofRecord {
  id?: string;
  deal_id: string;
  proof_cid: string;
  proof_url: string;
  file_name: string | null;
  status: string | null;
  created_at: string | null;
}

export async function saveProofToSupabase({
  dealId,
  proofCid,
  proofUrl,
  fileName,
}: ProofInsertInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { skipped: true };
  }

  const { error } = await supabase.from("proofs").insert({
    deal_id: dealId,
    proof_cid: proofCid,
    proof_url: proofUrl,
    file_name: fileName,
    status: "submitted",
  });

  if (error) {
    console.warn("Supabase proof cache failed:", error.message);
    return { skipped: true, error: error.message };
  }

  return { skipped: false };
}

export async function getLatestProofFromSupabase(dealId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("proofs")
    .select("id, deal_id, proof_cid, proof_url, file_name, status, created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Supabase proof fetch failed:", error.message);
    return null;
  }

  return (data as ProofRecord | null) ?? null;
}
