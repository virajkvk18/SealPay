"use client";

import { supabase } from "@/lib/supabase";

export default function TestPage() {
  async function testConnection() {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .limit(1);

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert(error.message);
    } else {
      alert("Supabase Connected!");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={testConnection}>
        Test Supabase
      </button>
    </div>
  );
}