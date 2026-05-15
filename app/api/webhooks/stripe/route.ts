import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const service = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan as "pro" | "scale" | undefined;

      if (!userId || !plan) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const resetAt = new Date(subscription.current_period_end * 1000).toISOString();

      await service.from("users").update({
        plan,
        credits_limit: PLANS[plan].credits_limit,
        credits_used: 0,
        credits_reset_at: resetAt,
        stripe_subscription_id: subscription.id,
      }).eq("id", userId);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason !== "subscription_cycle") break;

      const customerId = invoice.customer as string;
      const { data: user } = await service
        .from("users")
        .select("id, plan")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!user || user.plan === "free") break;

      const plan = user.plan as "pro" | "scale";
      const sub = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );
      const resetAt = new Date(sub.current_period_end * 1000).toISOString();

      await service.from("users").update({
        credits_used: 0,
        credits_reset_at: resetAt,
        credits_limit: PLANS[plan].credits_limit,
      }).eq("id", user.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await service.from("users").update({
        plan: "free",
        credits_limit: PLANS.free.credits_limit,
        credits_reset_at: null,
        stripe_subscription_id: null,
      }).eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: { bodyParser: false },
};
