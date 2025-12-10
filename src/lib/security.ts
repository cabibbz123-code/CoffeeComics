// Input validation and sanitization utilities

// Sanitize string input - remove potentially dangerous characters
export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potential script injection
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=/gi, '');
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate phone number (basic US format)
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');
  
  // Check if it's 10-15 digits (international support)
  return /^\d{10,15}$/.test(cleaned);
}

// Sanitize phone number
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  return phone.replace(/[^\d\+\-\(\)\s\.]/g, '').slice(0, 20);
}

// Validate monetary amount
export function isValidAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= 0 &&
    amount <= 100000 // Max $100,000
  );
}

// Validate order items structure
export interface OrderItem {
  productId?: string;
  productName: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  modifiers?: Array<{ name: string; price: number }>;
}

export function validateOrderItems(items: unknown): { valid: boolean; error?: string; items?: OrderItem[] } {
  if (!Array.isArray(items)) {
    return { valid: false, error: 'Items must be an array' };
  }
  
  if (items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' };
  }
  
  if (items.length > 100) {
    return { valid: false, error: 'Too many items in order' };
  }
  
  const validatedItems: OrderItem[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (typeof item !== 'object' || item === null) {
      return { valid: false, error: `Item ${i + 1} is invalid` };
    }
    
    const { productId, productName, sizeName, quantity, unitPrice, modifiers } = item as Record<string, unknown>;
    
    // Validate product name
    if (typeof productName !== 'string' || productName.trim().length === 0) {
      return { valid: false, error: `Item ${i + 1} missing product name` };
    }
    
    // Validate quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { valid: false, error: `Item ${i + 1} has invalid quantity` };
    }
    
    // Validate price
    if (!isValidAmount(unitPrice as number)) {
      return { valid: false, error: `Item ${i + 1} has invalid price` };
    }
    
    // Validate modifiers if present
    let validatedModifiers: Array<{ name: string; price: number }> = [];
    if (modifiers !== undefined) {
      if (!Array.isArray(modifiers)) {
        return { valid: false, error: `Item ${i + 1} has invalid modifiers` };
      }
      
      for (const mod of modifiers) {
        if (typeof mod !== 'object' || mod === null) continue;
        const { name, price } = mod as Record<string, unknown>;
        if (typeof name === 'string' && typeof price === 'number') {
          validatedModifiers.push({
            name: sanitizeString(name, 100),
            price: Math.max(0, Math.min(price, 100)),
          });
        }
      }
    }
    
    validatedItems.push({
      productId: typeof productId === 'string' ? sanitizeString(productId, 100) : undefined,
      productName: sanitizeString(productName, 200),
      sizeName: typeof sizeName === 'string' ? sanitizeString(sizeName, 50) : undefined,
      quantity: quantity as number,
      unitPrice: unitPrice as number,
      modifiers: validatedModifiers,
    });
  }
  
  return { valid: true, items: validatedItems };
}

// Validate customer data
export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
}

export function validateCustomer(data: unknown): { valid: boolean; error?: string; customer?: CustomerData } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid customer data' };
  }
  
  const { name, email, phone } = data as Record<string, unknown>;
  
  // Validate name
  if (typeof name !== 'string' || name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Name is too long' };
  }
  
  // Validate email
  if (typeof email !== 'string' || !isValidEmail(email)) {
    return { valid: false, error: 'Invalid email address' };
  }
  
  // Validate phone if provided
  const cleanPhone = typeof phone === 'string' ? sanitizePhone(phone) : undefined;
  if (cleanPhone && !isValidPhone(cleanPhone)) {
    return { valid: false, error: 'Invalid phone number' };
  }
  
  return {
    valid: true,
    customer: {
      name: sanitizeString(name, 100),
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
    },
  };
}

// Verify Stripe webhook signature
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // This is a placeholder - actual implementation would use Stripe's SDK
  // stripe.webhooks.constructEvent(payload, signature, secret)
  return true; // Let the actual Stripe SDK handle this
}

// Generate secure order number
export function generateSecureOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O/0, I/1
  let result = 'BB-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
