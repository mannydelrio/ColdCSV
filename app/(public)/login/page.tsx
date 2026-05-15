"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="text-[#1A1A18] font-display text-2xl">
            ColdCSV
          </Link>
          <p className="mt-2 text-[#5A5A54] text-sm">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white border border-[#E8E8E2] rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2A6B4A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#2A6B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-display text-xl text-[#1A1A18] mb-2">Check your email</h2>
              <p className="text-[#5A5A54] text-sm">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1A1A18] mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3.5 py-2.5 border border-[#E8E8E2] rounded-xl text-[#1A1A18] placeholder-[#9A9A94] focus:outline-none focus:ring-2 focus:ring-[#2A6B4A]/30 focus:border-[#2A6B4A] text-sm bg-white transition"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1A18] text-white py-2.5 rounded-pill text-sm font-medium hover:bg-[#2A2A26] transition disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#5A5A54]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#2A6B4A] font-medium hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
