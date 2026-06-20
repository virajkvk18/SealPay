"use client";

import { supabase } from "@/lib/supabase";

export default function TestPage() {
  async function testConnection() {
    if (!supabase) {
      alert(
        "Supabase is not configured. Add the public URL and anon key first.",
      );
      return;
    }

    const { data, error } = await supabase.from("deals").select("*").limit(1);

    if (error) {
      alert(error.message);
    } else {
      alert(`Supabase connected. Returned ${data.length} deal row.`);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={testConnection}>Test Supabase</button>
    </div>
  );
}
