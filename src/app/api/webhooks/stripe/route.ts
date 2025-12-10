import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create Supabase admin client lazily
function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const supabase = getSupabase();

  // Generate order number
  const orderNumber = `BB-${Date.now().toString(36).toUpperCase()}`;

  // Create order in database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: metadata.customer_name,
      customer_email: metadata.customer_email,
      customer_phone: metadata.customer_phone || null,
      subtotal: parseFloat(metadata.subtotal),
      tax: parseFloat(metadata.tax),
      total: parseFloat(metadata.total),
      status: 'pending',
      payment_status: 'paid',
      payment_intent_id: paymentIntent.id,
      special_instructions: metadata.instructions || null,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Failed to create order:', orderError);
    throw orderError;
  }

  console.log(`Order created: ${orderNumber} (${paymentIntent.id})`);

  // TODO: Send confirmation email
  // TODO: Send notification to store (e.g., via Slack, SMS, or dashboard)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  // Could log this or notify someone
}
