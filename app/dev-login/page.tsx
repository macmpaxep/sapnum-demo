"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DevLoginPage() {
  const [status, setStatus] = useState("");

  async function login(email: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: "demo-password-123" });
    setStatus(error ? error.message : "ok");
  }

  return (
    <div className="p-8 space-y-2">
      {["askhat@sapnum.demo", "aisha@sapnum.demo", "madina@sapnum.demo", "dana@sapnum.demo"].map((email) => (
        <button key={email} onClick={() => login(email)} className="block border px-3 py-1">
          {email}
        </button>
      ))}
      <p>{status}</p>
    </div>
  );
}
