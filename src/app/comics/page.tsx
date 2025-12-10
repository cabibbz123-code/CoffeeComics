'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/lib/cart';
import { getSupabase } from '@/lib/supabase';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Comic {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  badge: string | null;
  publisher: string | null;
  image_url: string | null;
  created_at?: string;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'name-az' | 'name-za' | 'newest';

interface FilterSidebarProps {
  mobile?: boolean;
  publisherSearch: string;
  setPublisherSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  setMobileFilterOpen?: (value: boolean) => void;
  comics: Comic[];
  publishers: { name: string; count: number }[];
  filteredPublishers: { name: string; count: number }[];
  newReleasesCount: number;
}

function FilterSidebar({
  mobile = false,
  publisherSearch,
  setPublisherSearch,
  filter,
  setFilter,
  setMobileFilterOpen,
  comics,
  publishers,
  filteredPublishers,
  newReleasesCount,
}: FilterSidebarProps) {
  return (
    <div className={cn(mobile ? '' : 'sticky top-4')}>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search publishers..."
            value={publisherSearch}
            onChange={(e) => setPublisherSearch(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => { setFilter('all'); mobile && setMobileFilterOpen?.(false); }}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
            filter === 'all' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-stone-600 hover:bg-stone-100'
          )}
        >
          <span>All Comics</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', 
            filter === 'all' ? 'bg-amber-200 text-amber-800' : 'bg-stone-100 text-stone-500'
          )}>{comics.length}</span>
        </button>

        {newReleasesCount > 0 && (
          <button
            onClick={() => { setFilter('new'); mobile && setMobileFilterOpen?.(false); }}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
              filter === 'new' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              New Releases
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full',
              filter === 'new' ? 'bg-amber-200 text-amber-800' : 'bg-stone-100 text-stone-500'
            )}>{newReleasesCount}</span>
          </button>
        )}

        <div className="border-t border-stone-200 my-3"></div>
        
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-3 mb-2">
          Publishers ({publishers.length})
        </p>

        <div className={cn('space-y-0.5 pr-1', mobile ? 'max-h-[50vh] overflow-y-auto' : 'max-h-[60vh] overflow-y-auto')}>
          {filteredPublishers.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => { setFilter(name); mobile && setMobileFilterOpen?.(false); }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left',
                filter === name ? 'bg-amber-100 text-amber-800 font-medium' : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <span className="truncate pr-2">{name}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                filter === name ? 'bg-amber-200 text-amber-800' : 'bg-stone-100 text-stone-500'
              )}>{count}</span>
            </button>
          ))}
          {filteredPublishers.length === 0 && (
            <p className="text-sm text-stone-400 px-3 py-2">No publishers found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 24;
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [cartOpen, setCartOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [publisherSearch, setPublisherSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.getTotal());

  useEffect(() => {
    loadComics(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreComics();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, comics.length]);

  const loadComics = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(0);
    }
    
    const supabase = getSupabase();
    
    // Get total count first
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('product_type', 'comic')
      .eq('is_active', true)
      .eq('in_stock', true);
    
    setTotalCount(count || 0);
    
    // Get first page
    const { data } = await supabase
      .from('products')
      .select('id, name, description, base_price, badge, publisher, image_url, created_at')
      .eq('product_type', 'comic')
      .eq('is_active', true)
      .eq('in_stock', true)
      .order('display_order')
      .range(0, PAGE_SIZE - 1);

    if (data) {
      setComics(data);
      setHasMore(data.length === PAGE_SIZE);
      setPage(1);
    }
    setLoading(false);
  };

  const loadMoreComics = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const supabase = getSupabase();
    
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    const { data } = await supabase
      .from('products')
      .select('id, name, description, base_price, badge, publisher, image_url, created_at')
      .eq('product_type', 'comic')
      .eq('is_active', true)
      .eq('in_stock', true)
      .order('display_order')
      .range(from, to);

    if (data) {
      setComics(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(prev => prev + 1);
    }
    setLoadingMore(false);
  };

  // Get unique publishers with counts, sorted by count
  const publisherCounts = comics.reduce((acc, c) => {
    if (c.publisher) {
      acc[c.publisher] = (acc[c.publisher] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const publishers = Object.entries(publisherCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const filteredPublishers = publishers.filter(p => 
    p.name.toLowerCase().includes(publisherSearch.toLowerCase())
  );

  const filteredComics = filter === 'all' 
    ? comics 
    : filter === 'new'
    ? comics.filter(c => c.badge === 'New')
    : comics.filter(c => c.publisher === filter);

  const sortedComics = [...filteredComics].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.base_price - b.base_price;
      case 'price-high': return b.base_price - a.base_price;
      case 'name-az': return a.name.localeCompare(b.name);
      case 'name-za': return b.name.localeCompare(a.name);
      case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      default: return 0;
    }
  });

  const handleAddToCart = (comic: Comic) => {
    addItem(
      { 
        id: comic.id, name: comic.name, category_id: '', description: comic.description,
        product_type: 'comic', base_price: comic.base_price, publisher: comic.publisher,
        sku: null, in_stock: true, image_url: comic.image_url, badge: comic.badge,
        display_order: 0, notes: null, is_active: true, is_featured: false,
      },
      { id: `${comic.id}-standard`, product_id: comic.id, name: 'Standard', 
        price: comic.base_price, display_order: 0, is_default: true },
      [], 1
    );
    toast.success(`Added to cart`);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-az', label: 'Name: A to Z' },
    { value: 'name-za', label: 'Name: Z to A' },
  ];

  const newReleasesCount = comics.filter(c => c.badge === 'New').length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-stone-300 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-500">Loading comics...</p>
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
        <div className="bg-stone-900 text-white py-10">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-2">Comics & Graphic Novels</h1>
            <p className="text-stone-400 text-sm">New releases, back issues & more</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </h2>
                <FilterSidebar
                  publisherSearch={publisherSearch}
                  setPublisherSearch={setPublisherSearch}
                  filter={filter}
                  setFilter={setFilter}
                  comics={comics}
                  publishers={publishers}
                  filteredPublishers={filteredPublishers}
                  newReleasesCount={newReleasesCount}
                />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4 gap-4">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {filter !== 'all' && (
                    <span className="bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">1</span>
                  )}
                </button>

                <p className="text-sm text-stone-500 hidden sm:block">
                  <span className="font-semibold text-stone-900">{sortedComics.length}</span>
                  {totalCount > sortedComics.length && <span> of {totalCount}</span>} comics
                  {filter !== 'all' && filter !== 'new' && (
                    <span className="ml-1">from <span className="font-medium text-stone-700">{filter}</span></span>
                  )}
                  {filter === 'new' && <span className="ml-1 text-amber-600 font-medium">• New Releases</span>}
                </p>

                <div className="flex items-center gap-2 ml-auto">
                  {filter !== 'all' && (
                    <button
                      onClick={() => setFilter('all')}
                      className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  )}

                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      <span className="hidden sm:inline">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                      <svg className={cn("w-4 h-4 transition-transform", sortDropdownOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-50">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value); setSortDropdownOpen(false); }}
                            className={cn(
                              'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
                              sortBy === option.value ? 'bg-amber-50 text-amber-700 font-medium' : 'text-stone-600 hover:bg-stone-50'
                            )}
                          >
                            {option.label}
                            {sortBy === option.value && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {filter !== 'all' && (
                <div className="mb-4 sm:hidden">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm">
                    {filter === 'new' ? 'New Releases' : filter}
                    <button onClick={() => setFilter('all')} className="hover:bg-amber-200 rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}

              {sortedComics.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
                  <svg className="w-16 h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-stone-500 mb-4">No comics found</p>
                  <button onClick={() => setFilter('all')} className="text-amber-600 font-medium hover:text-amber-700">
                    View all comics
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedComics.map((comic) => (
                    <div
                      key={comic.id}
                      className="bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-lg hover:border-stone-200 transition-all group"
                    >
                      <div className="aspect-[2/3] bg-stone-100 relative overflow-hidden">
                        {comic.image_url ? (
                          <img src={comic.image_url} alt={comic.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                        {comic.badge && (
                          <span className={cn(
                            'absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded shadow-sm',
                            comic.badge === 'New' || comic.badge === 'New Release' || comic.badge === 'New This Week'
                              ? 'bg-green-500 text-white'
                              : comic.badge === 'Staff Pick' || comic.badge === 'Recommended'
                              ? 'bg-purple-500 text-white'
                              : comic.badge === 'Rare' || comic.badge === 'Limited'
                              ? 'bg-red-500 text-white'
                              : comic.badge === 'Sale'
                              ? 'bg-blue-500 text-white'
                              : 'bg-amber-500 text-stone-900'
                          )}>
                            {comic.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 mb-1 min-h-[2.5rem]">{comic.name}</h3>
                        {comic.publisher && <p className="text-xs text-stone-500 mb-2 truncate">{comic.publisher}</p>}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{formatPrice(comic.base_price)}</span>
                          <button
                            onClick={() => handleAddToCart(comic)}
                            className="bg-stone-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-800 active:scale-95 transition-all"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More trigger / indicator */}
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-3 text-stone-500">
                      <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
                      <span>Loading more comics...</span>
                    </div>
                  )}
                  {!loadingMore && hasMore && sortedComics.length > 0 && (
                    <button
                      onClick={loadMoreComics}
                      className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition-colors"
                    >
                      Load More
                    </button>
                  )}
                  {!hasMore && sortedComics.length > 0 && (
                    <p className="text-stone-400 text-sm">
                      Showing all {sortedComics.length} comics
                    </p>
                  )}
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h2 className="font-semibold text-stone-900">Filter</h2>
              <button onClick={() => setMobileFilterOpen(false)} className="p-2 hover:bg-stone-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              <FilterSidebar
                mobile
                publisherSearch={publisherSearch}
                setPublisherSearch={setPublisherSearch}
                filter={filter}
                setFilter={setFilter}
                setMobileFilterOpen={setMobileFilterOpen}
                comics={comics}
                publishers={publishers}
                filteredPublishers={filteredPublishers}
                newReleasesCount={newReleasesCount}
              />
            </div>
          </div>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-stone-900 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center gap-3">
              <span className="bg-amber-500 text-stone-900 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">{cartItems.length}</span>
              <span className="font-semibold">View Cart</span>
            </span>
            <span className="font-semibold">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Footer />
    </div>
  );
}