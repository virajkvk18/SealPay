import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type Web3Role = "Client" | "Freelancer";

export interface WalletProfileInput {
  wallet: string;
  name: string;
  role: Web3Role;
  skills?: string;
}

export async function saveWalletProfile(profile: WalletProfileInput) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Add URL and anon key to .env.local.");
  }

  const { error } = await supabase.from("profiles").upsert({
    wallet_address: profile.wallet,
    display_name: profile.name,
    role: profile.role,
    skills: profile.role === "Freelancer" ? profile.skills || null : null,
  });

  if (error) {
    throw new Error(`Profile save failed: ${error.message}`);
  }
}
