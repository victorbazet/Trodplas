// =============================================================================
// Centralized environment-variable access.
//
// - `clientEnv` holds only NEXT_PUBLIC_* values (safe in the browser).
// - `serverEnv` holds secrets and is only safe to import from server code
//   (server components, route handlers, server actions, scripts).
//
// We read process.env lazily through getters so that a missing *server* secret
// never crashes a client bundle, and we throw a clear error only when the
// secret is actually needed.
// =============================================================================

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export const clientEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
  },
  get resendApiKey() {
    return required("RESEND_API_KEY", process.env.RESEND_API_KEY);
  },
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "Trodplas <onboarding@resend.dev>",
  // Platform commission in basis points (2000 = 20%). Defaults to 20%.
  platformFeeBps: Number(process.env.PLATFORM_FEE_BPS ?? "2000"),
};
