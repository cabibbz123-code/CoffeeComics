import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeString, validateCustomer, isValidAmount } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(`orders:${clientIP}`, RATE_LIMITS.orders);
    
    if (!rateLimitResult.success) {
      console.warn(`Rate limit exceeded for orders: ${clientIP}`);
      return rateLimitResponse(rateLimitResult);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { paymentIntentId, customer, items, subtotal, tax, total, instructions } = body;

    // Validate payment intent ID format
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      );
    }

    // Basic format check for Stripe payment intent
    if (!paymentIntentId.startsWith('pi_') || paymentIntentId.length < 20) {
      return NextResponse.json(
        { error: 'Invalid payment intent format' },
        { status: 400 }
      );
    }

    // Validate customer
    const customerValidation = validateCustomer(customer);
    if (!customerValidation.valid) {
      return NextResponse.json(
        { error: customerValidation.error },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain items' },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Too many items in order' },
        { status: 400 }
      );
    }

    // Validate amounts
    if (!isValidAmount(subtotal) || !isValidAmount(tax) || !isValidAmount(total)) {
      return NextResponse.json(
        { error: 'Invalid order amounts' },
        { status: 400 }
      );
    }

    // Check for duplicate order (idempotency)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (existingOrder) {
      // Order already exists - return it (idempotent)
      return NextResponse.json({
        success: true,
        orderNumber: existingOrder.order_number,
        orderId: existingOrder.id,
        duplicate: true,
      });
    }

    const validatedCustomer = customerValidation.customer!;

    // Generate order number from payment intent
    const orderNumber = `BB-${paymentIntentId.slice(-8).toUpperCase()}`;

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: validatedCustomer.name,
        customer_email: validatedCustomer.email,
        customer_phone: validatedCustomer.phone || null,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'pending',
        payment_status: 'paid',
        payment_intent_id: paymentIntentId,
        special_instructions: sanitizeString(instructions || '', 500) || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items with validation
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId ? sanitizeString(String(item.productId), 100) : null,
        product_name: sanitizeString(String(item.productName || 'Unknown'), 200),
        size_name: item.sizeName ? sanitizeString(String(item.sizeName), 50) : null,
        quantity: Math.min(Math.max(1, parseInt(item.quantity) || 1), 99),
        unit_price: Math.max(0, parseFloat(item.unitPrice) || 0),
        modifiers: Array.isArray(item.modifiers) ? item.modifiers.slice(0, 20) : [],
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Don't fail the whole order for items error
      }
    }

    console.log(`Order created: ${orderNumber} for ${validatedCustomer.email}`);

    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}