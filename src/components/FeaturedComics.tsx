'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart';

interface Comic {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  badge: string | null;
  publisher: string | null;
  image_url: string | null;
}

export function FeaturedComics() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    loadComics();
  }, []);

  const loadComics = async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('products')
      .select('id, name, description, base_price, badge, publisher, image_url')
      .eq('product_type', 'comic')
      .eq('is_active', true)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (data) {
      setComics(data);
    }
    setLoading(false);
  };

  const handleAddToCart = (comic: Comic) => {
    addItem(
      { id: comic.id, name: comic.name } as any,
      { name: 'Standard', price: comic.base_price } as any,
      [],
      1
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-stone-800 rounded-xl animate-pulse">
            <div className="aspect-[2/3] bg-stone-700 rounded-t-xl" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-stone-700 rounded w-3/4" />
              <div className="h-3 bg-stone-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-500">No comics available right now</p>
        <Link href="/comics" className="text-amber-400 hover:text-amber-300 mt-2 inline-block">
          Browse all comics →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {comics.map((comic) => (
        <div
          key={comic.id}
          className="bg-stone-800 rounded-xl overflow-hidden border border-stone-700 hover:border-stone-600 transition-colors group"
        >
          {/* Cover */}
          <div className="aspect-[2/3] bg-stone-700 relative overflow-hidden">
            {comic.image_url ? (
              <img
                src={comic.image_url}
                alt={comic.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            {comic.badge && (
              <span className="absolute top-2 left-2 bg-amber-500 text-stone-900 text-xs font-bold px-2 py-1 rounded">
                {comic.badge}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
              {comic.name}
            </h3>
            {comic.publisher && (
              <p className="text-xs text-stone-500 mb-2">{comic.publisher}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">
                {formatPrice(comic.base_price)}
              </span>
              <button
                onClick={() => handleAddToCart(comic)}
                className="bg-amber-500 text-stone-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}