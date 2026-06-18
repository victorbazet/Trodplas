import { stripe } from "@/lib/stripe/server";
import { clientEnv } from "@/lib/env";

/**
 * Stripe Connect — Express accounts for lenders.
 *
 * Flow:
 *   1. createConnectAccount() → creates an Express account, returns acct_...
 *      (store on profiles.stripe_account_id).
 *   2. createOnboardingLink() → hosted onboarding URL the lender completes.
 *   3. The `account.updated` webhook flips profiles.stripe_onboarded to true
 *      once charges_enabled && payouts_enabled.
 */

export async function createConnectAccount(email?: string) {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    // Lenders earn money → they need transfers/payouts.
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: "individual",
    metadata: { platform: "trodplas" },
  });
  return account;
}

/**
 * Create a one-time onboarding link. The link expires quickly, so generate it
 * on demand when the lender clicks "Connect payouts".
 */
export async function createOnboardingLink(accountId: string) {
  const base = clientEnv.appUrl;
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    // If the link expires or onboarding is interrupted, Stripe sends the user here.
    refresh_url: `${base}/onboarding/refresh`,
    // Where Stripe returns the user after they finish (or exit) onboarding.
    return_url: `${base}/onboarding/return`,
    type: "account_onboarding",
  });
  return accountLink;
}

/** True when the connected account can both accept charges and receive payouts. */
export function isAccountFullyOnboarded(account: {
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}) {
  return Boolean(account.charges_enabled && account.payouts_enabled);
}

/** Optional: a Stripe Express dashboard login link for onboarded lenders. */
export async function createLoginLink(accountId: string) {
  return stripe.accounts.createLoginLink(accountId);
}
