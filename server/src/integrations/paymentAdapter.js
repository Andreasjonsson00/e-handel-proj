// Adapter for the payment service (Stripe).
// This is the ONLY file that knows Stripe: keys, öre, line_items, ui_mode and the webhook signature.
// The rest of the shop only sees OUR model: an order id and its items in, a URL or a client secret out.
//
// Three parts:
//   1. Hosted:   Stripe's own payment page. We send the customer there with a URL.
//   2. Embedded: Stripe's payment form inside OUR page. React gets a client secret.
//   3. Webhook:  Stripe tells our server that the payment went through.
//
// TIMEOUT AND ERRORS – the common requirement in Labb 3:
// "Every call has a timeout. If the service is down, the user gets an understandable message, and the shop doesn't crash."
//   TIMEOUT 1  our server → Stripe   timeout + retries on the Stripe client below            -> we set it in code
//   TIMEOUT 2  the customer pays     the session expires (expires_at: 30 min – 24 h)         -> we set it in code (default 24 h)
//   TIMEOUT 3  Stripe → our webhook  Stripe's timeout on our answer – answer 200 quickly     -> Stripe, not in code
// When Stripe fails: the route catches the error and answers 502 with a clear message (routes/checkout.ts),
// and React shows it (App.tsx). The order stays 'pending' – nothing is marked as paid.

import Stripe from "stripe";

const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

// Only the secret key is needed to start. The webhook secret is checked in verifyWebhook(),
// so you can test hosted and embedded before you have started `stripe listen`.
if (!SECRET_KEY) {
  throw new Error(
    "Stripe is not configured. Copy .env.example to .env and fill in STRIPE_SECRET_KEY.",
  );
}

// The secret key may create payments. It is only used here, on the server.
//
// TIMEOUT 1: our server → Stripe (create sessions). We control this one here.
// The Stripe client has timeout and retries built in – what we wrote ourselves in fetchJson in L2.
// - timeout: 10 s per attempt. The default is 80 s – far too long for a customer waiting on a button.
//   Safe even for create: the client sends an idempotency key, so the same session is never created twice.
// Worst case: 3 attempts × 10 s ≈ 30 s. Then it throws, and the route answers 502 with a clear message.
const stripe = new Stripe(SECRET_KEY, { timeout: 10_000 });

/* --- 1. HOSTED: the customer pays on Stripe's page --- */
export async function createHostedCheckout(orderId, items) {
  const lineItems = items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "sek",
      unit_amount: Math.round(Number(item.price) * 100),
      product_data: {
        name: item.name,
      },
    },
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    line_items: lineItems,
    client_reference_id: String(orderId),
    metadata: {
      orderId: String(orderId),
    },
    success_url: `${CLIENT_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CLIENT_URL}/`,
  });

  console.log("[HOSTED] Checkout Session created:", session.id);

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/* --- 2. WEBHOOK: Stripe tells us that the payment went through --- */

// Checks that the request really comes from Stripe, and turns it into an event.
// Throws if the signature is wrong – e.g. someone sending a fake "paid" with curl.
// rawBody must be the bytes exactly as Stripe sent them: the signature is calculated on them.
export function verifyWebhook(rawBody, signature) {
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is missing in .env. Copy the whsec_... that `stripe listen` prints.",
    );
  }
  return stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
}
