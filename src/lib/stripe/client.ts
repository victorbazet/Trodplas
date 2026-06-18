"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { clientEnv } from "@/lib/env";

// Memoize the Stripe.js promise so it's only created once in the browser.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(clientEnv.stripePublishableKey);
  }
  return stripePromise;
}
