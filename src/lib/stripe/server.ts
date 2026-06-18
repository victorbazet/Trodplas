import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

/**
 * SERVER-ONLY Stripe client.
 *
 * Lazily constructed: we DON'T read STRIPE_SECRET_KEY at module load, so the
 * app can be built without secrets present. The real client is created on first
 * use (at request time) and memoized. The exported `stripe` is a Proxy that
 * forwards to it, so callers keep using `stripe.paymentIntents.create(...)`.
 *
 * We omit `apiVersion` to use the account default. Connected-account requests
 * are made per-call via `{ stripeAccount }` rather than a second client.
 */
let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.stripeSecretKey, {
      appInfo: { name: "Trodplas", version: "0.1.0" },
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
