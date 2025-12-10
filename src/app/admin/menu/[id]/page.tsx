'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface ProductSize {
  id?: string;
  name: string;
  price: number;
  is_default: boolean;
}

const BADGES = ['', 'Popular', 'New', 'Best Seller', 'Vegan', 'House Favorite', 'Classic', 'Distinctive', 'Hearty'];
const PRODUCT_TYPES = ['drink', 'food', 'comic', 'merchandise'];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const productId = isNew ? null : params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    product_type: 'drink',
    base_price: '',
    badge: '',
    image_url: '',
    notes: '',
    publisher: '',
    is_active: true,
    in_stock: true,
  });

  const [sizes, setSizes] = useState<ProductSize[]>([
    { name: 'Regular', price: 0, is_default: true }
  ]);

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadProduct();
    }
  }, []);

  const loadCategories = async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('display_order');
    
    if (data) {
      setCategories(data);
      if (isNew && data.length > 0) {
        setForm(f => ({ ...f, category_id: data[0].id }));
      }
    }
  };

  const loadProduct = async () => {
    const supabase = getSupabase();
    
    // Load product
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      alert('Product not found');
      router.push('/admin/menu');
      return;
    }

    setForm({
      name: product.name || '',
      description: product.description || '',
      category_id: product.category_id || '',
      product_type: product.product_type || 'drink',
      base_price: product.base_price?.toString() || '',
      badge: product.badge || '',
      image_url: product.image_url || '',
      notes: product.notes || '',
      publisher: product.publisher || '',
      is_active: product.is_active ?? true,
      in_stock: product.in_stock ?? true,
    });

    // Load sizes
    const { data: productSizes } = await supabase
      .from('product_sizes')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');

    if (productSizes && productSizes.length > 0) {
      setSizes(productSizes.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        is_default: s.is_default,
      })));
    }

    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);

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

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setForm(f => ({ ...f, image_url: publicUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Make sure storage is set up in Supabase.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addSize = () => {
    setSizes([...sizes, { name: '', price: 0, is_default: false }]);
  };

  const removeSize = (index: number) => {
    if (sizes.length <= 1) return;
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof ProductSize, value: any) => {
    setSizes(sizes.map((s, i) => {
      if (i === index) {
        if (field === 'is_default' && value) {
          // Only one can be default
          return { ...s, is_default: true };
        }
        return { ...s, [field]: value };
      }
      if (field === 'is_default' && value) {
        return { ...s, is_default: false };
      }
      return s;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.category_id || !form.base_price) {
      alert('Please fill in required fields');
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabase();
      
      const productData = {
        name: form.name,
        description: form.description || null,
        category_id: form.category_id,
        product_type: form.product_type,
        base_price: parseFloat(form.base_price),
        badge: form.badge || null,
        image_url: form.image_url || null,
        notes: form.notes || null,
        publisher: form.publisher || null,
        is_active: form.is_active,
        in_stock: form.in_stock,
      };

      let savedProductId = productId;

      if (isNew) {
        // Generate ID
        const newId = `prod-${Date.now().toString(36)}`;
        
        const { error } = await supabase
          .from('products')
          .insert({ id: newId, ...productData });

        if (error) throw error;
        savedProductId = newId;
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);

        if (error) throw error;
      }

      // Save sizes
      // Delete existing sizes first
      if (!isNew) {
        await supabase
          .from('product_sizes')
          .delete()
          .eq('product_id', savedProductId);
      }

      // Insert new sizes
      const sizesToInsert = sizes
        .filter(s => s.name && s.price >= 0)
        .map((s, index) => ({
          product_id: savedProductId,
          name: s.name,
          price: s.price,
          display_order: index,
          is_default: s.is_default,
        }));

      if (sizesToInsert.length > 0) {
        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizesToInsert);

        if (sizesError) console.error('Error saving sizes:', sizesError);
      }

      router.push('/admin/menu');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-900 text-white sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/menu" className="p-2 -ml-2 hover:bg-stone-800 rounded-lg">
                <BackIcon />
              </Link>
              <h1 className="text-xl font-bold">{isNew ? 'Add Item' : 'Edit Item'}</h1>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Image Upload */}
        <div className="bg-white rounded-2xl p-4">
          <label className="block text-sm font-medium text-stone-700 mb-3">Photo</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
              {form.image_url ? (
                <img src={form.image_url} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-stone-300">
                  📷
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload"
                className={`inline-block px-4 py-2 rounded-xl font-medium cursor-pointer transition-colors ${
                  uploadingImage
                    ? 'bg-stone-100 text-stone-400'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </label>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                  className="ml-2 text-red-600 text-sm"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-stone-400 mt-2">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-stone-900">Basic Info</h2>
          
          <div>
            <label className="block text-sm text-stone-600 mb-1.5">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="e.g. Dark Knight Latte"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
              placeholder="Dark chocolate, cream, vanilla"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Category *</label>
              <select
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Type</label>
              <select
                value={form.product_type}
                onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Base Price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Badge</label>
              <select
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {BADGES.map((badge) => (
                  <option key={badge} value={badge}>{badge || '(none)'}</option>
                ))}
              </select>
            </div>
          </div>

          {form.product_type === 'comic' && (
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Publisher</label>
              <input
                type="text"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="e.g. DC Comics, Marvel, Manga"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-stone-600 mb-1.5">Notes (internal)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="e.g. Cannot be made dairy free"
            />
          </div>
        </div>

        {/* Sizes */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Sizes & Prices</h2>
            <button
              type="button"
              onClick={addSize}
              className="text-amber-600 font-medium text-sm"
            >
              + Add Size
            </button>
          </div>

          {sizes.map((size, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                value={size.name}
                onChange={(e) => updateSize(index, 'name', e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="Size name"
              />
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={size.price}
                  onChange={(e) => updateSize(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-2 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => updateSize(index, 'is_default', true)}
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  size.is_default
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                Default
              </button>
              {sizes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-stone-900">Status</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-900">Visible on menu</p>
              <p className="text-sm text-stone-500">Customers can see this item</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`w-12 h-7 rounded-full transition-colors ${
                form.is_active ? 'bg-green-500' : 'bg-stone-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-1 ${
                form.is_active ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-900">In stock</p>
              <p className="text-sm text-stone-500">Item is available to order</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, in_stock: !form.in_stock })}
              className={`w-12 h-7 rounded-full transition-colors ${
                form.in_stock ? 'bg-green-500' : 'bg-stone-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-1 ${
                form.in_stock ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <Link
            href="/admin/menu"
            className="flex-1 py-4 px-6 rounded-xl font-semibold text-center border-2 border-stone-200 text-stone-700 hover:border-stone-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-colors ${
              saving
                ? 'bg-stone-300 text-stone-500'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {saving ? 'Saving...' : (isNew ? 'Add Item' : 'Save Changes')}
          </button>
        </div>
      </form>
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
