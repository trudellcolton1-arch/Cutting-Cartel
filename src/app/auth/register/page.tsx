"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? "Registration failed.");
      setBusy(false);
      return;
    }
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Create your account</h1>
      <p className="mt-1 text-sm text-bone-200/70">Used to send your cut and notes to your barber.</p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            minLength={8}
            required
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="btn-primary w-full justify-center">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
