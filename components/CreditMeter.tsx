import Link from "next/link";

interface Props {
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsResetAt: string | null;
}

export default function CreditMeter({
  plan,
  creditsUsed,
  creditsLimit,
  creditsResetAt,
}: Props) {
  const remaining = creditsLimit - creditsUsed;
  const pct = Math.min((creditsUsed / creditsLimit) * 100, 100);
  const low = remaining <= Math.ceil(creditsLimit * 0.1);

  return (
    <div className="bg-white border border-[#E8E8E2] rounded-2xl p-5 flex items-center gap-6 flex-wrap">
      <div className="flex-1 min-w-48">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#1A1A18]">
            {creditsUsed.toLocaleString()} / {creditsLimit.toLocaleString()} credits used
          </span>
          {creditsResetAt && (
            <span className="text-xs text-[#9A9A94]">
              Resets {new Date(creditsResetAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="h-2 bg-[#F0F0EC] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              low ? "bg-red-400" : "bg-[#2A6B4A]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {low && (
          <p className="text-xs text-red-500 mt-1.5">
            {remaining} credit{remaining !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>

      {plan === "free" && (
        <Link
          href="/account"
          className="text-sm bg-[#2A6B4A] text-white px-4 py-2 rounded-pill hover:bg-[#235c3f] transition whitespace-nowrap"
        >
          Upgrade for more
        </Link>
      )}
    </div>
  );
}
