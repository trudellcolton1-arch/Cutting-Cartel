"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";

function SignInInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(errorParam ? "Sign-in failed. Try again." : null);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await signIn("credentials", { email, password, callbackUrl, redirect: false });
    setBusy(false);
    if (res?.error) setMsg("Invalid email or password.");
    else if (res?.url) window.location.href = res.url;
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await signIn("email", { email, callbackUrl, redirect: false });
    setBusy(false);
    if (res?.error) setMsg("Couldn't send link. Email may not be configured.");
    else setMsg("Check your inbox for a sign-in link.");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-1 text-sm text-bone-200/70">Lock in your cut. Manage your bookings.</p>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="btn-ghost mt-8 w-full justify-center"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-bone-200/50">
        <div className="h-px flex-1 bg-ink-700" />
        or
        <div className="h-px flex-1 bg-ink-700" />
      </div>

      <div className="mb-3 flex gap-2 text-xs">
        <button
          className={`pill ${mode === "password" ? "border-cartel-500 text-cartel-300" : ""}`}
          onClick={() => setMode("password")}
        >
          Password
        </button>
        <button
          className={`pill ${mode === "magic" ? "border-cartel-500 text-cartel-300" : ""}`}
          onClick={() => setMode("magic")}
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePassword} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-200/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-200/50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button disabled={busy} className="btn-primary w-full justify-center">
            {busy ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagic} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <button disabled={busy} className="btn-primary w-full justify-center">
            {busy ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}

      {msg && <p className="mt-4 text-sm text-cartel-300">{msg}</p>}

      <p className="mt-8 text-center text-xs text-bone-200/60">
        New here?{" "}
        <a href="/auth/register" className="text-cartel-300 hover:text-cartel-100">
          Create an account
        </a>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-bone-200/60">Loading…</div>}>
      <SignInInner />
    </Suspense>
  );
}
