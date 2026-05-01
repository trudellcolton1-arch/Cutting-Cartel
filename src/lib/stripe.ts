import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Allow build to succeed without keys; runtime calls will throw if used.
  // eslint-disable-next-line no-console
  console.warn("[stripe] STRIPE_SECRET_KEY not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  // Use the SDK's bundled API version so the typed literal always matches.
  typescript: true,
  appInfo: {
    name: "Cutline AI",
    url: "https://cuttingcartel.com",
  },
});
