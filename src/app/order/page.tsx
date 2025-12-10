'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

export default function OrderLookupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    const supabase = getSupabase();
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('customer_email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      setError('Something went wrong. Please try again.');
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Placed' },
      paid: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Placed' },
      preparing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Preparing' },
      ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
      completed: { bg: 'bg-stone-100', text: 'text-stone-600', label: 'Complete' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };
    const config = configs[status] || configs.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Track Your Order</h1>
          <p className="text-stone-500">Enter your email to find your recent orders</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition disabled:opacity-50"
            >
              {loading ? '...' : 'Find'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-500 mb-4">No orders found for this email</p>
                <Link
                  href="/menu"
                  className="text-amber-600 font-medium hover:text-amber-700"
                >
                  Place an order →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-stone-500 mb-4">
                  Found {orders.length} order{orders.length !== 1 ? 's' : ''}
                </p>
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/order/${order.id}`)}
                    className="w-full bg-white rounded-xl p-4 border border-stone-100 hover:border-amber-300 hover:shadow-md transition text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-stone-900">
                        Order #{order.order_number}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-500">{formatDate(order.created_at)}</span>
                      <span className="font-medium text-stone-900">{formatPrice(order.total)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Direct Order Number */}
        <div className="mt-12 pt-8 border-t border-stone-200 text-center">
          <p className="text-stone-500 text-sm mb-3">Have an order number?</p>
          <DirectLookup />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DirectLookup() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      router.push(`/order/${orderNumber.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
      <input
        type="text"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="Order #"
        className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-amber-500 focus:ring-0 outline-none"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition"
      >
        Go
      </button>
    </form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
