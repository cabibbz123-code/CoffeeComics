'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart';
import { getSupabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  name: string;
  product_type: 'drink' | 'food' | 'comic';
  base_price: number;
  category_slug?: string;
}

export function Header() {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const supabase = getSupabase();
      const { data } = await supabase
        .from('products')
        .select('id, name, product_type, base_price, category:categories(slug)')
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(6);
      
      setResults((data || []).map(p => ({
        ...p,
        category_slug: (p.category as any)?.slug
      })));
      setLoading(false);
    };

    const debounce = setTimeout(search, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router]);

  const handleResultClick = (result: SearchResult) => {
    if (result.product_type === 'comic') {
      router.push('/comics');
    } else {
      router.push(`/menu${result.category_slug ? `?category=${result.category_slug}` : ''}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <>
      <header className="bg-stone-950 text-amber-50 sticky top-0 z-50 border-b border-stone-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition sm:hidden"
            aria-label="Open menu"
          >
            <HamburgerIcon className="w-6 h-6" />
          </button>

          {/* Clean text logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <div className="flex items-center gap-3">
              <span className="text-amber-200/80 text-lg tracking-wide font-medium">BLACKBIRD</span>
              <span className="text-stone-600 hidden xs:inline">|</span>
              <div className="hidden xs:block">
                <p className="text-amber-200/50 text-xs tracking-[0.15em] uppercase">Comics & Coffeehouse</p>
                <p className="text-stone-600 text-[10px]">Est. 2018 · Maitland, FL</p>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <div className="flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-40 sm:w-56 px-3 py-2 rounded-full bg-stone-900 text-white text-sm border border-stone-700 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      setResults([]);
                    }}
                    className="ml-1 p-2 text-stone-400 hover:text-white"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-500 hover:text-white transition"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              )}

              {searchOpen && (searchQuery.length >= 2) && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden">
                  {loading ? (
                    <div className="p-4 text-center text-stone-500 text-sm">Searching...</div>
                  ) : results.length === 0 ? (
                    <div className="p-4 text-center text-stone-500 text-sm">No results found</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition text-left border-b border-stone-50 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-stone-900 text-sm">{result.name}</p>
                            <p className="text-xs text-stone-500 capitalize">{result.product_type}</p>
                          </div>
                          <span className="text-sm font-medium text-stone-700">
                            {formatPrice(result.base_price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop nav links */}
            <Link 
              href="/menu"
              className="text-sm font-medium px-4 py-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition hidden sm:block"
            >
              Menu
            </Link>
            <Link 
              href="/comics"
              className="text-sm font-medium px-4 py-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition hidden sm:block"
            >
              Shop
            </Link>
            <Link 
              href="/order"
              className="p-2 rounded-full hover:bg-stone-800 text-stone-500 hover:text-stone-200 transition hidden md:flex"
              title="Track Order"
            >
              <ClipboardIcon className="w-5 h-5" />
            </Link>
            <Link 
              href="/cart"
              className="bg-amber-500 text-stone-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-amber-400 transition flex items-center gap-2 ml-2"
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className="bg-stone-900 text-amber-50 text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] sm:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-stone-950 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800">
              <span className="text-amber-200/80 text-lg font-medium">BLACKBIRD</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-stone-800 text-stone-400"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Nav Links */}
            <nav className="p-4 space-y-1">
              <Link 
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-300 hover:bg-stone-900 hover:text-white transition"
              >
                <CoffeeIcon className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Menu</span>
              </Link>
              <Link 
                href="/comics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-300 hover:bg-stone-900 hover:text-white transition"
              >
                <ComicIcon className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Comics Shop</span>
              </Link>
              <Link 
                href="/order"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-300 hover:bg-stone-900 hover:text-white transition"
              >
                <ClipboardIcon className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Track Order</span>
              </Link>
              <Link 
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-300 hover:bg-stone-900 hover:text-white transition"
              >
                <CartIcon />
                <span className="font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-stone-900 text-xs px-2 py-0.5 rounded-full font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Footer info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-800">
              <p className="text-stone-500 text-xs">Comics & Coffeehouse</p>
              <p className="text-stone-600 text-xs">500 E Horatio Ave, Maitland FL</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13a4 4 0 014-4h10a4 4 0 014 4v2a4 4 0 01-4 4H7a4 4 0 01-4-4v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2" />
    </svg>
  );
}

function ComicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}