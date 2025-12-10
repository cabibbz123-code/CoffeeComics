-- ============================================
-- BLACKBIRD WEBSITE DATABASE SCHEMA
-- A single-store coffee shop & comic store
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STORE SETTINGS (single row for Blackbird)
-- ============================================
CREATE TABLE store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Only one row ever
  name VARCHAR(255) NOT NULL DEFAULT 'Blackbird Comics & Coffeehouse',
  tagline VARCHAR(255) DEFAULT 'Coffee. Comics. Community.',
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  
  -- Hours (JSON)
  hours JSONB DEFAULT '{}',
  
  -- Settings
  is_open BOOLEAN DEFAULT true,
  accepts_online_orders BOOLEAN DEFAULT true,
  prep_time_minutes INTEGER DEFAULT 15,
  tax_rate DECIMAL(5,4) DEFAULT 0.0600, -- 6% Michigan
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO store_settings (name, email, phone, address, city, state, zip) VALUES (
  'Blackbird Comics & Coffeehouse',
  'hello@theblackbirdroost.com',
  '(248) 555-0123',
  '123 Main Street',
  'Troy',
  'MI',
  '48083'
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Time-based availability (for lunch menu)
  available_from TIME,
  available_until TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TYPE product_type AS ENUM ('drink', 'food', 'comic');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  product_type product_type NOT NULL,
  
  -- Pricing (base price for drinks/food, actual price for comics)
  base_price DECIMAL(10,2) NOT NULL,
  
  -- Comic-specific
  publisher VARCHAR(100),
  sku VARCHAR(100),
  in_stock BOOLEAN DEFAULT true,
  
  -- Display
  image_url TEXT,
  badge VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT SIZES
-- ============================================
CREATE TABLE product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false
);

-- ============================================
-- MODIFIER GROUPS & MODIFIERS
-- ============================================
CREATE TABLE modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  
  -- Customer info
  customer_name VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Order details
  status order_status DEFAULT 'pending',
  special_instructions TEXT,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Snapshot of product at time of order
  product_name VARCHAR(255) NOT NULL,
  product_type product_type NOT NULL,
  size_name VARCHAR(50),
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  modifiers_total DECIMAL(10,2) DEFAULT 0.00,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Modifiers (stored as JSON snapshot)
  modifiers JSONB DEFAULT '[]',
  
  notes TEXT
);

-- ============================================
-- ADMIN USERS (for staff login)
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff', -- 'owner', 'manager', 'staff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_store_settings_timestamp
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for menu
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read sizes" ON product_sizes FOR SELECT USING (true);
CREATE POLICY "Public read modifier groups" ON modifier_groups FOR SELECT USING (true);
CREATE POLICY "Public read modifiers" ON modifiers FOR SELECT USING (is_available = true);
CREATE POLICY "Public read settings" ON store_settings FOR SELECT USING (true);

-- Public can create orders
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public create order items" ON order_items FOR INSERT WITH CHECK (true);

-- Public can view their own orders by email (handled in app logic)
CREATE POLICY "Public read own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public read order items" ON order_items FOR SELECT USING (true);
