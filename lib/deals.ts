import { supabase } from "./supabase";
import type { Deal } from "./mockData";

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

export async function createDeal(deal: Record<string, unknown>) {
  console.log("INSERTING DEAL:", deal);

  const { data, error } = await supabase
    .from("deals")
    .insert([deal])
    .select();

  if (error) {
    console.log("ERROR CODE:", error.code);
    console.log("ERROR MESSAGE:", error.message);
    console.log("ERROR DETAILS:", error.details);
    console.log("FULL ERROR:", error);
    throw error;
  }

  return data;
}

export async function updateDeal(id: string, updates: Partial<Deal>) {
  const { data, error } = await supabase
    .from("deals")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return data;
}

export async function deleteDeal(id: string) {
  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", id);

  if (error) {
    console.log("ERROR:", error);
    throw error;
  }

  return true;
}

/* ---------------- APPLICATIONS ---------------- */

export async function getApplicationsByDeal(dealId: string) {
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

export async function updateApplication(
  id: string,
  updates: Record<string, unknown>
) {
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