import { supabase } from "./supabase";

export async function getDeals() {
  const { data, error } = await supabase
    .from("deals")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}