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

// Comic card component for virtual list
function ComicCard({ comic, onAddToCart }: { comic: Comic; onAddToCart: (comic: Comic) => void }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-lg hover:border-stone-200 transition-all group h-full">
      <div className="aspect-[2/3] bg-stone-100 relative overflow-hidden">
        {comic.image_url ? (
          <img src={comic.image_url} alt={comic.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
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
            onClick={() => onAddToCart(comic)}
            className="bg-stone-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-800 active:scale-95 transition-all"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [cartOpen, setCartOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [publisherSearch, setPublisherSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 48;
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.getTotal());

  // Load ALL comics at once
  useEffect(() => {
    loadAllComics();
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

  const loadAllComics = async () => {
    setLoading(true);
    const supabase = getSupabase();
    
    // Load all comics at once
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, base_price, badge, publisher, image_url, created_at')
      .eq('product_type', 'comic')
      .eq('is_active', true)
      .eq('in_stock', true)
      .order('display_order');

    if (data) {
      setComics(data);
    }
    if (error) {
      console.error('Error loading comics:', error);
    }
    setLoading(false);
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

  // Pagination
  const totalPages = Math.ceil(sortedComics.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedComics = sortedComics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (comic: Comic) => {
    addItem(
      { 
        id: comic.id, 
        category_id: '',
        name: comic.name, 
        description: comic.description || '',
        product_type: 'comic',
        base_price: comic.base_price,
        publisher: comic.publisher,
        sku: null,
        in_stock: true,
        image_url: comic.image_url,
        badge: comic.badge,
        display_order: 0,
        notes: null,
        is_active: true,
        is_featured: false,
      },
      { id: `${comic.id}-standard`, product_id: comic.id, name: 'Standard', price: comic.base_price, display_order: 0, is_default: true },
      [],
      1
    );
    toast.success(`Added ${comic.name} to cart`);
  };

  const newReleasesCount = comics.filter(c => c.badge === 'New').length;

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-az', label: 'Name: A to Z' },
    { value: 'name-za', label: 'Name: Z to A' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-stone-500">Loading comics...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
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
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                  </button>
                  <h1 className="text-lg font-semibold text-stone-900">
                    {filter === 'all' ? 'All Comics' : filter === 'new' ? 'New Releases' : filter}
                    <span className="text-stone-400 font-normal ml-2">({sortedComics.length})</span>
                  </h1>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <div ref={sortDropdownRef} className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      <span className="hidden sm:inline">Sort:</span>
                      <span>{sortOptions.find(o => o.value === sortBy)?.label}</span>
                      <svg className={cn('w-4 h-4 transition-transform', sortDropdownOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value as SortOption); setSortDropdownOpen(false); }}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm flex items-center justify-between',
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
                  {/* Comics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedComics.map((comic) => (
                      <ComicCard
                        key={comic.id}
                        comic={comic}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          currentPage === 1
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {/* First page */}
                        {currentPage > 3 && (
                          <>
                            <button
                              onClick={() => handlePageChange(1)}
                              className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                              1
                            </button>
                            {currentPage > 4 && <span className="px-2 text-stone-400">...</span>}
                          </>
                        )}
                        
                        {/* Page numbers around current */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                          .map(page => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={cn(
                                'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                                page === currentPage
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                              )}
                            >
                              {page}
                            </button>
                          ))}
                        
                        {/* Last page */}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="px-2 text-stone-400">...</span>}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          currentPage === totalPages
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        Next
                      </button>
                    </div>
                  )}
                  
                  <p className="text-stone-400 text-sm text-center pb-4">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedComics.length)} of {sortedComics.length} comics
                  </p>
                </>
              )}
            </div>
          </div>
        )}
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