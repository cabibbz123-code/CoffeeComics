'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  product_name: string;
  size_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  modifiers: { name: string; price: number }[];
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  special_instructions: string | null;
  created_at: string;
  ready_at: string | null;
  items: OrderItem[];
}

const STATUS_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'pending', label: 'Order Placed', description: 'We received your order' },
  { status: 'preparing', label: 'Preparing', description: 'Your order is being made' },
  { status: 'ready', label: 'Ready', description: 'Ready for pickup!' },
  { status: 'completed', label: 'Complete', description: 'Order picked up' },
];

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; icon: string }> = {
  pending: { color: 'text-orange-600', bg: 'bg-orange-100', icon: '🕐' },
  paid: { color: 'text-orange-600', bg: 'bg-orange-100', icon: '🕐' },
  preparing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: '☕' },
  ready: { color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
  completed: { color: 'text-stone-600', bg: 'bg-stone-100', icon: '🎉' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100', icon: '❌' },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      // Set up real-time subscription
      const supabase = getSupabase();
      const channel = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    
    const supabase = getSupabase();
    
    // Try to find by UUID first, then by order number
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          size_name,
          quantity,
          unit_price,
          line_total,
          modifiers
        )
      `);
    
    // Check if it's a UUID format or order number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    if (isUUID) {
      query = query.eq('id', orderId);
    } else {
      // Assume it's an order number (could be numeric or BB-XXXX format)
      query = query.or(`order_number.eq.${orderId},order_number.ilike.%${orderId}%`);
    }
    
    const { data, error: fetchError } = await query.single();

    if (fetchError || !data) {
      setError('Order not found. Please check your order number.');
      setLoading(false);
      return;
    }

    setOrder({
      ...data,
      items: (data.order_items || []).map((item: any) => ({
        ...item,
        line_total: item.line_total ?? (item.unit_price * item.quantity)
      }))
    });
    setLoading(false);
  };

  const getStatusIndex = (status: OrderStatus): number => {
    if (status === 'paid') return 0; // Treat paid same as pending
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex(s => s.status === status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-stone-300 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-500">Loading order...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Order Not Found</h1>
            <p className="text-stone-500 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-800 transition"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Order Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${STATUS_CONFIG[order.status].bg} ${STATUS_CONFIG[order.status].color} font-medium mb-4`}>
            <span>{STATUS_CONFIG[order.status].icon}</span>
            <span className="capitalize">{order.status === 'paid' ? 'Order Placed' : order.status}</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Order #{order.order_number}</h1>
          <p className="text-stone-500 mt-1">for {order.customer_name}</p>
        </div>

        {/* Cancelled Notice */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <p className="text-red-700 font-medium">This order has been cancelled</p>
            <p className="text-red-600 text-sm mt-1">Please contact us if you have questions</p>
          </div>
        )}

        {/* Status Progress */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-100 mb-6">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-stone-200">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isCompleted 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-stone-200 text-stone-400'
                      } ${isCurrent ? 'ring-4 ring-amber-200' : ''}`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isCompleted ? 'text-stone-900' : 'text-stone-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Message */}
            <div className="mt-6 text-center">
              {order.status === 'ready' ? (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-green-700 font-semibold text-lg">Your order is ready for pickup!</p>
                  <p className="text-green-600 text-sm mt-1">Just give your name at the counter</p>
                </div>
              ) : order.status === 'preparing' ? (
                <p className="text-stone-600">We're making your order now. Should be ready in a few minutes!</p>
              ) : order.status === 'completed' ? (
                <p className="text-stone-600">Thanks for your order! Hope to see you again soon.</p>
              ) : (
                <p className="text-stone-600">We've received your order and will start preparing it shortly.</p>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-900 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start py-2 border-b border-stone-50 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-stone-900">
                    {item.quantity}x {item.product_name}
                  </p>
                  {item.size_name && item.size_name !== 'Standard' && item.size_name !== 'Regular' && (
                    <p className="text-sm text-stone-500">{item.size_name}</p>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-sm text-stone-400">
                      {item.modifiers.map((m: any) => m.name).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-stone-700 font-medium">{formatPrice(item.line_total)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-stone-100 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-stone-900 pt-2 border-t border-stone-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="bg-amber-50 rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium text-amber-800">Special Instructions</p>
            <p className="text-amber-700">{order.special_instructions}</p>
          </div>
        )}

        {/* Pickup Info */}
        <div className="bg-white rounded-2xl p-6 border border-stone-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <LocationIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">Pickup Location</p>
              <p className="text-stone-600">Blackbird Comics & Coffeehouse</p>
              <p className="text-stone-500 text-sm">500 E Horatio Ave, Maitland FL</p>
            </div>
          </div>
        </div>

        {/* Order Time */}
        <p className="text-center text-sm text-stone-400">
          Order placed {new Date(order.created_at).toLocaleString()}
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Link
            href="/menu"
            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-stone-900 text-white text-center hover:bg-stone-800 transition"
          >
            Order Again
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 border-stone-200 text-stone-700 text-center hover:border-stone-300 transition"
          >
            Back Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}