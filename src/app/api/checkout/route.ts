import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeString, isValidEmail, isValidAmount, validateCustomer } from '@/lib/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5');
const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.06');

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
  };
  size: {
    name: string;
    price: number;
  };
  modifiers: {
    name: string;
    price: number;
  }[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CheckoutRequest {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  instructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`checkout:${clientIP}`, RATE_LIMITS.checkout);
    
    if (!rateLimitResult.success) {
      console.warn(`Rate limit exceeded for checkout: ${clientIP}`);
      return rateLimitResponse(rateLimitResult);
    }

    const body: CheckoutRequest = await request.json();
    const { items, customer, instructions } = body;

    // Validate items exist
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Limit items count
    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Too many items in cart' },
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

    // Validate each item and recalculate prices server-side
    let calculatedSubtotal = 0;
    for (const item of items) {
      if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json(
          { error: 'Invalid item quantity' },
          { status: 400 }
        );
      }
      
      if (!isValidAmount(item.unitPrice) || !isValidAmount(item.totalPrice)) {
        return NextResponse.json(
          { error: 'Invalid item price' },
          { status: 400 }
        );
      }
      
      // Recalculate to prevent price manipulation
      const itemTotal = item.unitPrice * item.quantity;
      if (Math.abs(itemTotal - item.totalPrice) > 0.01) {
        console.warn(`Price mismatch detected: expected ${itemTotal}, got ${item.totalPrice}`);
      }
      calculatedSubtotal += itemTotal;
    }

    // Use server-calculated total
    const subtotal = calculatedSubtotal;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    // Sanity check on total
    if (total < 0.50 || total > 10000) {
      return NextResponse.json(
        { error: 'Order total out of acceptable range' },
        { status: 400 }
      );
    }

    // Convert to cents for Stripe
    const totalCents = Math.round(total * 100);
    const platformFeeCents = Math.round(totalCents * (PLATFORM_FEE_PERCENT / 100));

    // Build line items description (sanitized)
    const description = items
      .map((item) => {
        let desc = `${item.quantity}x ${sanitizeString(item.product.name, 50)}`;
        if (item.size.name !== 'Regular' && item.size.name !== 'Standard') {
          desc += ` (${sanitizeString(item.size.name, 20)})`;
        }
        if (item.modifiers.length > 0) {
          desc += ` - ${item.modifiers.map((m) => sanitizeString(m.name, 20)).join(', ')}`;
        }
        return desc;
      })
      .join('; ')
      .slice(0, 500); // Stripe description limit

    const validatedCustomer = customerValidation.customer!;

    // Create PaymentIntent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: `Blackbird order: ${description}`,
      metadata: {
        customer_name: validatedCustomer.name,
        customer_email: validatedCustomer.email,
        customer_phone: validatedCustomer.phone || '',
        instructions: sanitizeString(instructions || '', 500),
        item_count: items.length.toString(),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        platform_fee: (platformFeeCents / 100).toFixed(2),
      },
      receipt_email: validatedCustomer.email,
    };

    // Only add Stripe Connect if we have a valid connected account ID
    const connectedAccountId = process.env.STRIPE_CONNECTED_ACCOUNT_ID;
    if (connectedAccountId && connectedAccountId.startsWith('acct_') && connectedAccountId.length > 10) {
      paymentIntentParams.application_fee_amount = platformFeeCents;
      paymentIntentParams.transfer_data = {
        destination: connectedAccountId,
      };
      console.log('Using Stripe Connect with account:', connectedAccountId);
    } else {
      console.log('Running without Stripe Connect (direct payments)');
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Failed to process checkout. Please try again.' },
      { status: 500 }
    );
  }
}