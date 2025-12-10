'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/lib/cart';
import { getSupabase } from '@/lib/supabase';
import { cn, formatPrice } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductSize {
  name: string;
  price: number;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number;
  badge: string | null;
  notes: string | null;
  image_url: string | null;
  product_type: string;
  sizes: ProductSize[];
  modifiers?: any[];
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  
  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.getTotal());

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const supabase = getSupabase();

    // Load categories (excluding comics, merchandise, collectibles - they have their own page or aren't menu items)
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, slug')
      .not('slug', 'in', '("comics","merchandise","collectibles")')
      .eq('is_active', true)
      .order('display_order');

    if (cats && cats.length > 0) {
      setCategories(cats);
      setActiveCategory(cats[0].id);
    }

    // Load products with sizes AND modifiers
    const { data: prods } = await supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        description,
        base_price,
        badge,
        notes,
        image_url,
        product_type,
        product_sizes (
          name,
          price,
          display_order
        ),
        modifier_groups (
          id,
          name,
          description,
          min_selections,
          max_selections,
          is_required,
          display_order,
          modifiers (
            id,
            name,
            price,
            display_order
          )
        )
      `)
      .eq('is_active', true)
      .eq('in_stock', true)
      .not('product_type', 'in', '("comic","merchandise","collectible")')
      .order('display_order');

    if (prods) {
      // Transform to match expected format
      const transformedProducts = prods.map((p: any) => {
        // Handle sizes
        const sizesRaw = (p.product_sizes || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((s: any) => ({ name: s.name, price: s.price }));
        
        // Deduplicate sizes by name
        const uniqueSizes = sizesRaw.filter((size: any, index: number, self: any[]) =>
          index === self.findIndex((s) => s.name === size.name)
        );
        
        // Handle modifiers - transform to the format ProductModal expects
        const modifierGroups = (p.modifier_groups || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((group: any) => ({
            group: group.name,
            required: group.is_required,
            max: group.max_selections,
            options: (group.modifiers || [])
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((mod: any) => ({
                name: mod.name,
                price: parseFloat(mod.price) || 0
              }))
          }))
          .filter((group: any) => group.options.length > 0); // Only include groups with options
        
        return {
          ...p,
          sizes: uniqueSizes,
          modifiers: modifierGroups.length > 0 ? modifierGroups : undefined
        };
      });
      setProducts(transformedProducts);
    }

    setLoading(false);
  };

  const filteredProducts = products.filter((p) => p.category_id === activeCategory);
  const currentCategory = categories.find((c) => c.id === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-stone-300 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-500">Loading menu...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-stone-900 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Menu</h1>
            <p className="text-stone-400 text-sm">Coffee, espresso, food & more</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar Filter - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-stone-200 p-4 sticky top-4">
                <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Categories
                </h2>
                
                <div className="space-y-1">
                  {categories.map((category) => {
                    const count = products.filter(p => p.category_id === category.id).length;
                    if (count === 0) return null; // Hide empty categories
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                          activeCategory === category.id
                            ? 'bg-amber-50 text-amber-700 font-medium'
                            : 'text-stone-600 hover:bg-stone-50'
                        )}
                      >
                        <span>{category.name}</span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          activeCategory === category.id
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-stone-100 text-stone-500'
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Category Selector */}
              <div className="lg:hidden mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((category) => {
                    const count = products.filter(p => p.category_id === category.id).length;
                    if (count === 0) return null; // Hide empty categories
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                          activeCategory === category.id
                            ? 'bg-stone-900 text-white'
                            : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                        )}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-stone-900 mb-1">
                  {currentCategory?.name || 'Menu'}
                </h2>
                <p className="text-stone-500">
                  {filteredProducts.length} items
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  No items in this category
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Cart Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-stone-900 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg hover:bg-stone-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="bg-amber-500 text-stone-900 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                {cartItems.length}
              </span>
              <span className="font-semibold">View Cart</span>
            </span>
            <span className="font-semibold">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <Footer />
    </div>
  );
}