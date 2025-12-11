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

  // IDEMPOTENCY CHECK: See if order already exists (client-side usually creates it first)
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (existingOrder) {
    console.log(`Order already exists for ${paymentIntent.id}: ${existingOrder.order_number}`);
    return; // Client-side already created it with items - we're done
  }

  // Order doesn't exist - client-side creation must have failed
  // Create order as fallback (but we won't have item details)
  console.warn(`Creating fallback order for ${paymentIntent.id} - items may be missing`);

  // Generate order number from payment intent for consistency
  const orderNumber = `BB-${paymentIntent.id.slice(-8).toUpperCase()}`;

  // Parse items from metadata if available (added in checkout)
  let orderItems: { productName: string; sizeName: string; quantity: number; unitPrice: number; modifiers: any[] }[] = [];
  if (metadata.items_json) {
    try {
      const parsed = JSON.parse(metadata.items_json);
      // Check if items were truncated
      if (parsed.truncated) {
        console.warn(`Items were truncated in metadata for ${paymentIntent.id}, count: ${parsed.count}`);
      } else if (Array.isArray(parsed)) {
        orderItems = parsed;
      }
    } catch (e) {
      console.error('Failed to parse items from metadata:', e);
    }
  }

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

  // Create order items if we have them from metadata
  if (orderItems.length > 0 && order) {
    const itemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      product_name: item.productName,
      size_name: item.sizeName || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      modifiers: item.modifiers || [],
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Failed to create order items from webhook:', itemsError);
      // Don't throw - order is created, items are secondary
    } else {
      console.log(`Created ${orderItems.length} order items from webhook metadata`);
    }
  }

  console.log(`Fallback order created: ${orderNumber} (${paymentIntent.id})`);

  // TODO: Send confirmation email
  // TODO: Send notification to store (e.g., via Slack, SMS, or dashboard)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  // Could log this or notify someone
}