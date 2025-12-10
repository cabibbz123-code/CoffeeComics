// ============================================
// BLACKBIRD WEBSITE TYPES
// ============================================

export type ProductType = 'drink' | 'food' | 'comic';
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// ============================================
// STORE
// ============================================
export interface StoreSettings {
  id: number;
  name: string;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  hours: Record<string, { open: string; close: string }>;
  is_open: boolean;
  accepts_online_orders: boolean;
  prep_time_minutes: number;
  tax_rate: number;
  updated_at: string;
}

// ============================================
// MENU
// ============================================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  available_from: string | null;
  available_until: string | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  product_type: ProductType;
  base_price: number;
  publisher: string | null;
  sku: string | null;
  in_stock: boolean;
  image_url: string | null;
  badge: string | null;
  display_order: number;
  notes: string | null;
  is_active: boolean;
  is_featured: boolean;
}

export interface ProductSize {
  id: string;
  product_id: string;
  name: string;
  price: number;
  display_order: number;
  is_default: boolean;
}

export interface ModifierGroup {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  min_selections: number;
  max_selections: number | null;
  is_required: boolean;
  display_order: number;
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

// Product with all details
export interface ProductWithDetails extends Product {
  sizes: ProductSize[];
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
}

// ============================================
// ORDERS
// ============================================
export interface Order {
  id: string;
  order_number: number;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  status: OrderStatus;
  special_instructions: string | null;
  subtotal: number;
  tax: number;
  total: number;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  ready_at: string | null;
  completed_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_type: ProductType;
  size_name: string | null;
  unit_price: number;
  quantity: number;
  modifiers_total: number;
  line_total: number;
  modifiers: { name: string; price: number }[];
  notes: string | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// ============================================
// CART (Client-side)
// ============================================
export interface CartItem {
  id: string; // Unique cart item ID
  product: Product;
  size: ProductSize;
  modifiers: Modifier[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// ============================================
// API
// ============================================
export interface CheckoutRequest {
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  items: {
    product_id: string;
    size_id: string;
    modifier_ids: string[];
    quantity: number;
    notes?: string;
  }[];
  special_instructions?: string;
}

export interface CheckoutResponse {
  order_id: string;
  order_number: number;
  client_secret: string;
}
