import { supabase } from "./supabase";

export async function getDeals() {
  if (!supabase) return [];

  const { data, error } = await supabase.from("deals").select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
