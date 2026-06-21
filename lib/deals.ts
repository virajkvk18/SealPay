import { supabase } from "./supabase";
import type { Deal, DealApplication } from "./mockData";

type SupabaseDeal = Record<string, unknown>;

export type ApplicationInsertInput = {
  dealId: string;
  freelancerWallet: string;
  coverLetter: string;
  proposedPrice: number;
};

type SupabaseApplication = Record<string, unknown>;

const optionalDealColumns = new Set([
  "applications",
  "category",
  "created_tx_hash",
  "preview_url",
  "final_file_name",
  "proof",
  "dispute_reason",
  "dispute_evidence",
  "resolution",
  "selected_freelancer_wallet",
  "on_chain_deal_id",
  "timeline",
  "created_at",
]);

function getMissingColumnName(message?: string) {
  const match = message?.match(/'([^']+)' column/);
  return match?.[1] ?? "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeDealKind(value: unknown): Deal["dealKind"] {
  const kind = String(value ?? "").toLowerCase();
  return kind === "public" ? "Public" : "Direct";
}

function normalizeDealStatus(
  status: unknown,
  dealKind: Deal["dealKind"],
  freelancerWallet: string,
): Deal["status"] {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "open") {
    return dealKind === "Public" || !freelancerWallet ? "Created" : "Assigned";
  }
  if (normalized === "assigned") return "Assigned";
  if (normalized === "locked") return "Locked";
  if (normalized === "payment locked" || normalized === "payment_locked") {
    return "Payment Locked";
  }
  if (normalized === "work submitted" || normalized === "work_submitted") {
    return "Work Submitted";
  }
  if (normalized === "approved") return "Approved";
  if (normalized === "payment released" || normalized === "payment_released") {
    return "Payment Released";
  }
  if (normalized === "disputed") return "Disputed";
  if (normalized === "resolved") return "Resolved";

  return dealKind === "Public" || !freelancerWallet ? "Created" : "Assigned";
}

export function toSupabaseDealStatus(status: Deal["status"]) {
  const values: Record<Deal["status"], string> = {
    Created: "open",
    Assigned: "assigned",
    Locked: "payment_locked",
    "Payment Locked": "payment_locked",
    "Work Submitted": "work_submitted",
    Approved: "approved",
    "Payment Released": "payment_released",
    Disputed: "disputed",
    Resolved: "resolved",
  };

  return values[status];
}

async function getProfileIdForWallet(wallet: string) {
  if (!supabase) return "";

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("wallet", wallet)
    .maybeSingle();

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return data?.id ? String(data.id) : "";
}

async function getProfileWalletsByIds(profileIds: string[]) {
  if (!supabase || !profileIds.length) return new Map<string, string>();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,wallet")
    .in("id", profileIds);

  if (error) {
    console.log("ERROR:", error);
    return new Map<string, string>();
  }

  return new Map(
    (data ?? []).map((profile) => [
      String(profile.id),
      String(profile.wallet ?? profile.id),
    ]),
  );
}

export function mapSupabaseApplication(row: SupabaseApplication): DealApplication {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    freelancerWallet: String(row.freelancer_id ?? ""),
    proposal: String(row.cover_letter ?? ""),
    estimatedDelivery: "Not specified",
    proposedPrice:
      row.proposed_price === null || row.proposed_price === undefined
        ? undefined
        : Number(row.proposed_price),
    status: (row.status as DealApplication["status"]) ?? "pending",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapSupabaseDeal(row: SupabaseDeal): Deal {
  const risk = row.risk;
  const freelancerWallet = String(row.freelancer_wallet ?? "").trim().toLowerCase();
  const dealKind = normalizeDealKind(row.deal_kind ?? (freelancerWallet ? "direct" : "public"));

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Untitled deal"),
    description: String(row.description ?? "No description provided."),
    clientName: String(row.client_name ?? "Client"),
    freelancerName: String(row.freelancer_name ?? "Unassigned"),
    clientWallet: String(row.client_wallet ?? "").trim().toLowerCase(),
    freelancerWallet,
    dealKind,
    category: row.category
      ? String(row.category)
      : row.deliverable_type
        ? String(row.deliverable_type)
        : undefined,
    selectedFreelancerWallet: row.selected_freelancer_wallet
      ? String(row.selected_freelancer_wallet)
      : undefined,
    applications: Array.isArray(row.applications)
      ? (row.applications as Deal["applications"])
      : [],
    amount: Number(row.budget ?? row.amount ?? 0),
    deadline: String(row.deadline ?? new Date().toISOString()),
    deliverableType:
      (row.deliverable_type as Deal["deliverableType"]) ?? "Other",
    status: normalizeDealStatus(row.status, dealKind, freelancerWallet),
    risk:
      risk && typeof risk === "object"
        ? (risk as Deal["risk"])
        : { score: 0, level: "Low Risk", reasons: ["Risk review pending."] },
    createdTxHash: String(row.created_tx_hash ?? ""),
    timeline: Array.isArray(row.timeline)
      ? (row.timeline as Deal["timeline"])
      : [],
    previewUrl: row.preview_url ? String(row.preview_url) : undefined,
    finalFileName: row.final_file_name
      ? String(row.final_file_name)
      : undefined,
    proof: row.proof as Deal["proof"],
    disputeReason: row.dispute_reason ? String(row.dispute_reason) : undefined,
    disputeEvidence: row.dispute_evidence
      ? String(row.dispute_evidence)
      : undefined,
    resolution: row.resolution as Deal["resolution"],
    onChainDealId: row.on_chain_deal_id ? String(row.on_chain_deal_id) : undefined,
  };
}

export function attachApplicationsToDeals(
  deals: Deal[],
  applications: Array<DealApplication & { dealId: string }>,
) {
  return deals.map((deal) => ({
    ...deal,
    applications: applications
      .filter((application) => application.dealId === deal.id)
      .map((application) => ({
        id: application.id,
        freelancerWallet: application.freelancerWallet,
        proposal: application.proposal,
        estimatedDelivery: application.estimatedDelivery,
        note: application.note,
        trustScore: application.trustScore,
        status: application.status,
        createdAt: application.createdAt,
      })),
  }));
}

/* ---------------- DEALS ---------------- */

export async function getDeals() {
  if (!supabase) return [];

  const { data, error } = await supabase.from("deals").select("*");

  if (error) {
    console.log("ERROR CODE:", error.code);
    console.log("ERROR MESSAGE:", error.message);
    console.log("ERROR DETAILS:", error.details);
    console.log("FULL ERROR:", error);
    throw error;
  }

  return data;
}

export async function getOpenDeals() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("deal_kind", "public")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapSupabaseDeal(row));
}

export async function getClientDeals(clientWallet: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("client_wallet", clientWallet.trim().toLowerCase())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapSupabaseDeal(row));
}

export async function getFreelancerDirectDeals(freelancerWallet: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("freelancer_wallet", freelancerWallet.trim().toLowerCase())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapSupabaseDeal(row));
}

export async function getDealById(dealId: string) {
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (error) throw error;

  return mapSupabaseDeal(data);
}

export async function createDeal(deal: Record<string, unknown>) {
  if (!supabase) {
    throw new Error("Shared database is not configured.");
  }
  const payload = { ...deal };

  for (let attempt = 0; attempt < optionalDealColumns.size + 1; attempt += 1) {
    console.log("INSERTING DEAL:", payload);

    const { data, error } = await supabase
      .from("deals")
      .insert([payload])
      .select();

    if (!error) return data;

    const missingColumn = getMissingColumnName(error.message);
    if (
      error.code === "PGRST204" &&
      missingColumn === "budget" &&
      "budget" in payload
    ) {
      payload.amount = payload.budget;
      delete payload.budget;
      continue;
    }
    if (
      error.code === "PGRST204" &&
      missingColumn === "amount" &&
      "amount" in payload
    ) {
      payload.budget = payload.amount;
      delete payload.amount;
      continue;
    }
    if (error.code === "PGRST204" && optionalDealColumns.has(missingColumn)) {
      delete payload[missingColumn];
      continue;
    }

    console.log("ERROR CODE:", error.code);
    console.log("ERROR MESSAGE:", error.message);
    console.log("ERROR DETAILS:", error.details);
    console.log("FULL ERROR:", error);
    throw error;
  }

  throw new Error("Could not create deal after removing optional columns.");
}

export async function updateDeal(id: string, updates: Partial<Deal>) {
  if (!supabase) return [];
  const payload = { ...updates } as Record<string, unknown>;
  if (updates.status) {
    payload.status = toSupabaseDealStatus(updates.status);
  }

  for (let attempt = 0; attempt < optionalDealColumns.size + 1; attempt += 1) {
    const { data, error } = await supabase
      .from("deals")
      .update(payload)
      .eq("id", id)
      .select();

    if (!error) return data;

    const missingColumn = getMissingColumnName(error.message);
    if (error.code === "PGRST204" && optionalDealColumns.has(missingColumn)) {
      delete payload[missingColumn];
      continue;
    }

    console.log("ERROR:", error);
    throw error;
  }

  throw new Error("Could not update deal after removing optional columns.");
}

export async function deleteDeal(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("deals").delete().eq("id", id);

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return true;
}

/* ---------------- APPLICATIONS ---------------- */

export async function getApplicationsByDeal(dealId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("deal_id", dealId);

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return data;
}

export async function getApplicationsForDeals(dealIds: string[]) {
  const uuidDealIds = dealIds.filter(isUuid);
  if (!supabase || !uuidDealIds.length) return [];

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .in("deal_id", uuidDealIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  const profileWallets = await getProfileWalletsByIds(
    [...new Set((data ?? []).map((row) => String(row.freelancer_id ?? "")))].filter(
      Boolean,
    ),
  );

  return (data ?? []).map((row) => {
    const application = mapSupabaseApplication(row);
    const profileId = String(row.freelancer_id ?? "");

    return {
      ...application,
      freelancerWallet: profileWallets.get(profileId) ?? application.freelancerWallet,
      dealId: String(row.deal_id ?? ""),
    };
  });
}

export async function createApplication({
  dealId,
  freelancerWallet,
  coverLetter,
  proposedPrice,
}: ApplicationInsertInput) {
  if (!supabase) return undefined;
  if (!isUuid(dealId)) {
    return undefined;
  }

  const freelancerProfileId = await getProfileIdForWallet(freelancerWallet);
  if (!freelancerProfileId) {
    return undefined;
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      deal_id: dealId,
      freelancer_id: freelancerProfileId,
      cover_letter: coverLetter,
      proposed_price: proposedPrice,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return {
    ...mapSupabaseApplication(data),
    freelancerWallet,
  };
}

export async function selectApplicationForDeal(
  dealId: string,
  selectedApplicationId: string,
) {
  if (!supabase) return;
  if (!isUuid(dealId)) return;

  const { error: rejectError } = await supabase
    .from("applications")
    .update({ status: "rejected" })
    .eq("deal_id", dealId);

  if (rejectError) {
    console.log("ERROR:", rejectError);
    throw rejectError;
  }

  const { error: selectError } = await supabase
    .from("applications")
    .update({ status: "selected" })
    .eq("id", selectedApplicationId);

  if (selectError) {
    console.log("ERROR:", selectError);
    throw selectError;
  }
}

export async function updateApplication(
  id: string,
  updates: Record<string, unknown>
) {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return data?.[0];
}

export async function deleteApplication(id: string) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id);

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return true;
}
