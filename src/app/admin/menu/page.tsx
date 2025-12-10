'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: string;
  product_type: string;
  badge: string | null;
  image_url: string | null;
  is_active: boolean;
  in_stock: boolean;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = getSupabase();
    
    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('display_order');
    
    if (cats) setCategories(cats);

    // Load products with category info
    const { data: prods, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .order('display_order');
    
    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(prods || []);
    }
    
    setLoading(false);
  };

  const handlePhotoClick = (productId: string) => {
    setSelectedProductId(productId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductId) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingId(selectedProductId);

    try {
      const supabase = getSupabase();
      
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', selectedProductId);

      if (updateError) throw updateError;

      // Update local state
      setProducts(products.map(p => 
        p.id === selectedProductId ? { ...p, image_url: publicUrl } : p
      ));

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Make sure storage bucket "images" exists in Supabase.');
    } finally {
      setUploadingId(null);
      setSelectedProductId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleProductStatus = async (productId: string, field: 'is_active' | 'in_stock', currentValue: boolean) => {
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('products')
      .update({ [field]: !currentValue })
      .eq('id', productId);

    if (error) {
      alert('Failed to update product');
    } else {
      setProducts(products.map(p => 
        p.id === productId ? { ...p, [field]: !currentValue } : p
      ));
    }
  };

  const deleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      alert('Failed to delete product');
    } else {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Count products without images
  const noImageCount = products.filter(p => !p.image_url).length;

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <header className="bg-stone-900 text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/orders" className="p-2 -ml-2 hover:bg-stone-800 rounded-lg">
                <BackIcon />
              </Link>
              <h1 className="text-xl font-bold">Menu</h1>
            </div>
            <Link
              href="/admin/menu/new"
              className="bg-amber-500 text-stone-900 px-4 py-2 rounded-xl font-semibold hover:bg-amber-400 transition-colors flex items-center gap-2"
            >
              <PlusIcon />
              <span className="hidden sm:inline">Add Item</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Stats */}
        {noImageCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <CameraIcon className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-800">
              <strong>{noImageCount}</strong> products need photos. Tap the camera icon to add.
            </span>
          </div>
        )}

        {/* Search & Filter */}
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(p => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 mb-4">No products found</p>
            <Link
              href="/admin/menu/new"
              className="inline-flex items-center gap-2 bg-amber-500 text-stone-900 px-6 py-3 rounded-xl font-semibold"
            >
              <PlusIcon />
              Add First Product
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl p-4 border-2 transition-colors ${
                  !product.is_active ? 'border-stone-200 opacity-60' : 'border-transparent'
                }`}
              >
                <div className="flex gap-4">
                  {/* Image with upload button */}
                  <div className="relative">
                    <div 
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden cursor-pointer group ${
                        uploadingId === product.id ? 'animate-pulse' : ''
                      }`}
                      onClick={() => handlePhotoClick(product.id)}
                    >
                      {product.image_url ? (
                        <>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <CameraIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-amber-500 transition-colors">
                          <CameraIcon className="w-6 h-6" />
                          <span className="text-[10px] mt-1">Add</span>
                        </div>
                      )}
                    </div>
                    {uploadingId === product.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-stone-900 truncate">{product.name}</h3>
                        <p className="text-sm text-stone-500">{product.category?.name}</p>
                      </div>
                      <span className="font-semibold text-stone-900 whitespace-nowrap">
                        {formatPrice(product.base_price)}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.badge && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          {product.badge}
                        </span>
                      )}
                      {!product.image_url && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          No Photo
                        </span>
                      )}
                      {!product.is_active && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-xs font-medium">
                          Hidden
                        </span>
                      )}
                      {!product.in_stock && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/admin/menu/${product.id}`}
                        className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleProductStatus(product.id, 'in_stock', product.in_stock)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          product.in_stock
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {product.in_stock ? 'In Stock' : 'Out'}
                      </button>
                      <button
                        onClick={() => toggleProductStatus(product.id, 'is_active', product.is_active)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          product.is_active
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {product.is_active ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        className="px-3 py-1.5 bg-stone-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors ml-auto"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
