import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Blackbird's connected account ID
export const CONNECTED_ACCOUNT_ID = process.env.STRIPE_CONNECTED_ACCOUNT_ID!;

// Your platform fee percentage
export const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5');

// Calculate platform fee in cents
export function calculatePlatformFee(amountInCents: number): number {
  return Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));
}

// Create PaymentIntent for checkout
export async function createPaymentIntent(
  amountInCents: number,
  metadata: Record<string, string> = {}
) {
  const platformFee = calculatePlatformFee(amountInCents);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    // Your cut
    application_fee_amount: platformFee,
    // Rest goes to Blackbird
    transfer_data: {
      destination: CONNECTED_ACCOUNT_ID,
    },
    metadata: {
      ...metadata,
      platform_fee_cents: platformFee.toString(),
    },
  });

  return paymentIntent;
}

// Refund a payment
export async function refundPayment(paymentIntentId: string, amountInCents?: number) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountInCents,
    reverse_transfer: true,
    refund_application_fee: true,
  });

  return refund;
}
