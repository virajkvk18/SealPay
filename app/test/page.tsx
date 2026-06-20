"use client";

import { supabase } from "@/lib/supabase";
import { updateApplication } from "@/lib/deals";

export default function TestPage() {

  // 1. TEST CONNECTION
  async function testConnection() {
    if (!supabase) {
      alert("Supabase is not configured");
      return;
    }

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .limit(1);

    if (error) {
      alert(error.message);
    } else {
      alert(`Supabase connected. Returned ${data.length} deal row.`);
    }
  }

  // 2. DEBUG DEALS
  async function debugDeals() {
    const client = supabase;
    if (!client) {
      alert("Supabase is not configured");
      return;
    }

    const { data: deals, error } = await client
      .from("deals")
      .select("*");

    console.log("DEALS:", deals);
    console.log("ERROR:", error);

    if (!deals || deals.length === 0) {
      alert("No deals found in DB");
    } else {
      alert(`Found ${deals.length} deals`);
    }
  }

  // 3. CREATE TEST APPLICATION
  async function createTestApplication() {
    console.log("CREATING APPLICATION...");

    const client = supabase;
    if (!client) {
      alert("Supabase is not configured");
      return null;
    }

    const { data: deals, error: dealError } = await client
      .from("deals")
      .select("*")
      .limit(1);

    if (dealError || !deals?.length) {
      console.log("No deals found", dealError);
      alert("No deals found — create a deal first");
      return null;
    }

    const { data: profiles, error: profileError } = await client
      .from("profiles")
      .select("*")
      .limit(1);

    if (profileError || !profiles?.length) {
      console.log("No profiles found", profileError);
      alert("No profiles found — create a profile first");
      return null;
    }

    const dealId = deals[0].id;
    const freelancerId = profiles[0].id;

    console.log("USING:", dealId, freelancerId);

    const { data, error } = await client
      .from("applications")
      .insert([
        {
          deal_id: dealId,
          freelancer_id: freelancerId,
          status: "applied",
          proposed_price: 5000
        },
      ])
      .select();

    console.log("CREATE RESULT DATA:", data);
    console.log("CREATE ERROR:", JSON.stringify(error, null, 2));

    if (error) {
      alert(error.message || "Insert failed");
      return null;
    }

    return data?.[0];
  }

  // 4. UPDATE TEST APPLICATION
  async function testUpdateApplication() {
    const app = await createTestApplication();

    if (!app) {
      alert("Failed at CREATE step");
      return;
    }

    const result = await updateApplication(app.id, {
      status: "shortlisted",
    });

    console.log("UPDATE RESULT:", result);

    if (!result) {
      alert("Update failed");
      return;
    }

    alert("SUCCESS 🎉");
  }

  return (
    <div style={{ padding: "20px", display: "flex", gap: "10px" }}>
      <button onClick={testConnection}>
        Test Supabase
      </button>

      <button onClick={debugDeals}>
        Debug Deals
      </button>

      <button onClick={createTestApplication}>
        1. Create Test Application
      </button>

      <button onClick={testUpdateApplication}>
        2. Create + Update Flow Test
      </button>
    </div>
  );
}
