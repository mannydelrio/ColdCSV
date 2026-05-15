import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("plan, credits_used, credits_limit, credits_reset_at, stripe_subscription_id, created_at")
    .eq("id", user!.id)
    .single();

  const planLabel: Record<string, string> = {
    free: "Free",
    pro: "Pro — $29/mo",
    scale: "Scale — $79/mo",
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl text-[#1A1A18]">Account</h1>
        <p className="text-[#5A5A54] text-sm mt-1">{user?.email}</p>
      </div>

      {/* Plan card */}
      <div className="bg-white border border-[#E8E8E2] rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-xs text-[#9A9A94] uppercase tracking-wide font-medium mb-1">Current plan</p>
          <p className="text-[#1A1A18] font-medium text-lg">
            {planLabel[userData?.plan ?? "free"] ?? "Free"}
          </p>
        </div>

        <div className="h-px bg-[#E8E8E2]" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#9A9A94] mb-1">Credits used</p>
            <p className="text-[#1A1A18] font-medium">
              {userData?.credits_used ?? 0} / {userData?.credits_limit ?? 10}
            </p>
          </div>
          {userData?.credits_reset_at && (
            <div>
              <p className="text-xs text-[#9A9A94] mb-1">Resets on</p>
              <p className="text-[#1A1A18] font-medium">
                {new Date(userData.credits_reset_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-[#E8E8E2]" />

        {userData?.plan === "free" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#5A5A54]">
              Upgrade to get 500–2,000 monthly credits and unlock higher volume processing.
            </p>
            <div className="flex gap-3">
              <UpgradeButton plan="pro" label="Upgrade to Pro — $29/mo" />
              <UpgradeButton plan="scale" label="Upgrade to Scale — $79/mo" />
            </div>
          </div>
        ) : (
          <div>
            <ManageBillingButton />
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-[#E8E8E2] rounded-2xl p-6">
        <p className="text-xs text-[#9A9A94] uppercase tracking-wide font-medium mb-4">Account</p>
        <p className="text-sm text-[#5A5A54] mb-4">Member since {new Date(userData?.created_at ?? "").toLocaleDateString()}</p>
        <SignOutButton />
      </div>
    </div>
  );
}

function UpgradeButton({ plan, label }: { plan: string; label: string }) {
  return (
    <form action="/api/create-checkout-session" method="POST">
      <input type="hidden" name="plan" value={plan} />
      <button
        type="submit"
        className="bg-[#2A6B4A] text-white px-4 py-2.5 rounded-pill text-sm font-medium hover:bg-[#235c3f] transition"
      >
        {label}
      </button>
    </form>
  );
}

function ManageBillingButton() {
  return (
    <form action="/api/create-portal-session" method="POST">
      <button
        type="submit"
        className="bg-[#1A1A18] text-white px-4 py-2.5 rounded-pill text-sm font-medium hover:bg-[#2A2A26] transition"
      >
        Manage billing
      </button>
    </form>
  );
}

function SignOutButton() {
  return (
    <Link
      href="/api/auth/signout"
      className="text-sm text-red-500 hover:text-red-600 transition"
    >
      Sign out
    </Link>
  );
}
