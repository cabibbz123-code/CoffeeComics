import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeString, isValidEmail, isValidAmount, validateCustomer } from '@/lib/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Tiered platform fees by product type
const PLATFORM_FEES = {
  drink: 0.18,  // 18% on drinks
  food: 0.18,   // 18% on food
  comic: 0.10,  // 10% on comics (lower margin product)
  default: 0.15 // 15% fallback
};

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.06');

// Maximum allowed price discrepancy (in dollars) - reject if client price differs more than this
const MAX_PRICE_DISCREPANCY = 0.02;

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    product_type?: 'drink' | 'food' | 'comic';
  };
  size: {
    name: string;
    price: number;
  };
  modifiers: {
    id?: string;
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

// Verify prices against database - returns server-calculated subtotal or throws
async function verifyAndCalculatePrices(items: CartItem[]): Promise<{ 
  subtotal: number; 
  platformFee: number;
  verifiedItems: { productName: string; productType: string; sizeName: string; unitPrice: number; quantity: number; modifiers: { name: string; price: number }[] }[] 
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all unique product IDs from cart
  const productIds = Array.from(new Set(items.map(item => item.product.id)));
  
  // Fetch products with their sizes and modifier groups
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      base_price,
      product_type,
      is_active,
      in_stock,
      product_sizes (
        name,
        price
      ),
      modifier_groups (
        id,
        name,
        modifiers (
          id,
          name,
          price,
          is_available
        )
      )
    `)
    .in('id', productIds);

  if (productsError) {
    console.error('Error fetching products for price verification:', productsError);
    throw new Error('Failed to verify prices');
  }

  if (!products || products.length === 0) {
    throw new Error('No valid products found');
  }

  // Build lookup maps for fast price checking
  const productMap = new Map<string, {
    name: string;
    productType: string;
    basePrice: number;
    isActive: boolean;
    inStock: boolean;
    sizes: Map<string, number>;
    modifiers: Map<string, number>;
  }>();

  for (const product of products) {
    const sizes = new Map<string, number>();
    for (const size of (product.product_sizes || [])) {
      sizes.set(size.name.toLowerCase(), size.price);
    }

    const modifiers = new Map<string, number>();
    for (const group of (product.modifier_groups || [])) {
      for (const mod of (group.modifiers || [])) {
        if (mod.is_available) {
          modifiers.set(mod.name.toLowerCase(), mod.price);
        }
      }
    }

    productMap.set(product.id, {
      name: product.name,
      productType: product.product_type || 'food',
      basePrice: product.base_price,
      isActive: product.is_active,
      inStock: product.in_stock,
      sizes,
      modifiers,
    });
  }

  // Verify each cart item against database prices
  let serverSubtotal = 0;
  let totalPlatformFee = 0;
  const verifiedItems: { productName: string; productType: string; sizeName: string; unitPrice: number; quantity: number; modifiers: { name: string; price: number }[] }[] = [];

  for (const item of items) {
    const product = productMap.get(item.product.id);
    
    if (!product) {
      throw new Error(`Product not found: ${item.product.name}`);
    }

    if (!product.isActive) {
      throw new Error(`Product is no longer available: ${product.name}`);
    }

    if (!product.inStock) {
      throw new Error(`Product is out of stock: ${product.name}`);
    }

    // Get server-side size price
    const sizeName = item.size.name.toLowerCase();
    let serverSizePrice = product.sizes.get(sizeName);
    
    // If size not found, check for 'standard' or 'regular' as defaults, or use base_price
    if (serverSizePrice === undefined) {
      serverSizePrice = product.sizes.get('standard') ?? 
                        product.sizes.get('regular') ?? 
                        product.basePrice;
    }

    // Calculate server-side modifier total
    let serverModifiersTotal = 0;
    const verifiedModifiers: { name: string; price: number }[] = [];
    
    for (const clientMod of item.modifiers) {
      const modName = clientMod.name.toLowerCase();
      const serverModPrice = product.modifiers.get(modName);
      
      if (serverModPrice === undefined) {
        // Modifier not found - could be removed or renamed, reject
        console.warn(`Modifier not found: ${clientMod.name} for product ${product.name}`);
        throw new Error(`Modifier "${clientMod.name}" is no longer available for ${product.name}`);
      }
      
      serverModifiersTotal += serverModPrice;
      verifiedModifiers.push({ name: clientMod.name, price: serverModPrice });
    }

    // Calculate server-side unit price
    const serverUnitPrice = serverSizePrice + serverModifiersTotal;
    
    // Compare with client-provided price
    const clientUnitPrice = item.unitPrice;
    const priceDiff = Math.abs(serverUnitPrice - clientUnitPrice);
    
    if (priceDiff > MAX_PRICE_DISCREPANCY) {
      console.error(`Price manipulation detected for ${product.name}: client=${clientUnitPrice}, server=${serverUnitPrice}`);
      throw new Error(`Price mismatch for ${product.name}. Please refresh your cart and try again.`);
    }

    // Use SERVER price for calculation
    const itemTotal = serverUnitPrice * item.quantity;
    serverSubtotal += itemTotal;

    // Calculate platform fee for this item based on product type
    const feeRate = PLATFORM_FEES[product.productType as keyof typeof PLATFORM_FEES] || PLATFORM_FEES.default;
    totalPlatformFee += itemTotal * feeRate;

    verifiedItems.push({
      productName: product.name,
      productType: product.productType,
      sizeName: item.size.name,
      unitPrice: serverUnitPrice,
      quantity: item.quantity,
      modifiers: verifiedModifiers,
    });
  }

  return { subtotal: serverSubtotal, platformFee: totalPlatformFee, verifiedItems };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(`checkout:${clientIP}`, RATE_LIMITS.checkout);
    
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

    // Validate quantities
    for (const item of items) {
      if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json(
          { error: 'Invalid item quantity' },
          { status: 400 }
        );
      }
      
      if (!item.product?.id) {
        return NextResponse.json(
          { error: 'Invalid product in cart' },
          { status: 400 }
        );
      }
    }

    // CRITICAL: Verify prices against database and calculate server-side
    let subtotal: number;
    let platformFee: number;
    let verifiedItems: { productName: string; productType: string; sizeName: string; unitPrice: number; quantity: number; modifiers: { name: string; price: number }[] }[];
    
    try {
      const result = await verifyAndCalculatePrices(items);
      subtotal = result.subtotal;
      platformFee = result.platformFee;
      verifiedItems = result.verifiedItems;
    } catch (priceError) {
      console.error('Price verification failed:', priceError);
      return NextResponse.json(
        { error: priceError instanceof Error ? priceError.message : 'Price verification failed' },
        { status: 400 }
      );
    }

    // Calculate tax and total using SERVER-VERIFIED subtotal
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
    // Platform fee is calculated per-item based on product type (18% food/drink, 10% comics)
    const platformFeeCents = Math.round(platformFee * 100);

    // Build line items description from VERIFIED items (sanitized)
    const description = verifiedItems
      .map((item) => {
        let desc = `${item.quantity}x ${sanitizeString(item.productName, 50)}`;
        if (item.sizeName !== 'Regular' && item.sizeName !== 'Standard') {
          desc += ` (${sanitizeString(item.sizeName, 20)})`;
        }
        if (item.modifiers.length > 0) {
          desc += ` - ${item.modifiers.map((m) => sanitizeString(m.name, 20)).join(', ')}`;
        }
        return desc;
      })
      .join('; ')
      .slice(0, 500); // Stripe description limit

    const validatedCustomer = customerValidation.customer!;

    // Serialize items for webhook fallback (Stripe metadata has 500 char limit per value)
    // Keep only essential fields and truncate if needed
    const compactItems = verifiedItems.map(item => ({
      productName: item.productName.slice(0, 50),
      sizeName: item.sizeName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      modifiers: item.modifiers.map(m => ({ name: m.name.slice(0, 30), price: m.price }))
    }));
    let itemsJson = JSON.stringify(compactItems);
    
    // Stripe metadata limit is 500 chars - if too long, truncate items
    if (itemsJson.length > 490) {
      // Try with fewer modifiers
      const minimalItems = verifiedItems.map(item => ({
        productName: item.productName.slice(0, 40),
        sizeName: item.sizeName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        modifiers: item.modifiers.slice(0, 2).map(m => ({ name: m.name.slice(0, 20), price: m.price }))
      }));
      itemsJson = JSON.stringify(minimalItems);
      
      // If still too long, just store item count for logging
      if (itemsJson.length > 490) {
        itemsJson = JSON.stringify({ truncated: true, count: verifiedItems.length });
      }
    }

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
        items_json: itemsJson, // For webhook fallback
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
      console.log(`Stripe Connect: $${(platformFeeCents/100).toFixed(2)} fee on $${subtotal.toFixed(2)} subtotal (${((platformFeeCents/100)/subtotal*100).toFixed(1)}% effective rate)`);
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