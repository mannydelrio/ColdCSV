import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const PLANS = {
  free: { credits_limit: 10, credits_reset_at: null },
  pro: { credits_limit: 500 },
  scale: { credits_limit: 2000 },
} as const;

export type Plan = keyof typeof PLANS;
