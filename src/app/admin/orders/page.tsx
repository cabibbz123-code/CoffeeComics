'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { formatPrice } from '@/lib/utils';
import { getSupabase as getSupabaseClient } from '@/lib/supabase';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  payment_status: string;
  special_instructions: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  size_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  modifiers: { name: string; price: number }[];
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'New', color: 'text-orange-700', bg: 'bg-orange-100' },
  preparing: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-100' },
  ready: { label: 'Ready', color: 'text-green-700', bg: 'bg-green-100' },
  completed: { label: 'Done', color: 'text-stone-500', bg: 'bg-stone-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Initialize Supabase client on mount
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return supabaseRef.current;
  }, []);

  // Get current user
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const playAlert = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [soundEnabled]);

  const showNotification = useCallback((order: Order) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order!', {
        body: `${order.customer_name} - ${formatPrice(order.total)}`,
        icon: '/favicon.ico',
      });
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
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
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      // Map order_items to items for consistency, calculate line_total if missing
      const ordersWithItems = (data || []).map(order => ({
        ...order,
        items: (order.order_items || []).map((item: any) => ({
          ...item,
          line_total: item.line_total ?? (item.unit_price * item.quantity)
        }))
      }));
      setOrders(ordersWithItems);
    }
    setLoading(false);
  }, [getSupabase]);

  // Load orders and set up realtime on mount
  useEffect(() => {
    const supabase = getSupabase();
    
    loadOrders();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('New order received:', payload);
          // Fetch the complete order with items
          const { data: orderWithItems } = await supabase
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
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (orderWithItems) {
            const newOrder = {
              ...orderWithItems,
              items: (orderWithItems.order_items || []).map((item: any) => ({
                ...item,
                line_total: item.line_total ?? (item.unit_price * item.quantity)
              }))
            } as Order;
            setOrders((prev) => [newOrder, ...prev]);
            playAlert();
            showNotification(newOrder);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order updated:', payload);
          const updatedOrder = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getSupabase, loadOrders, playAlert, showNotification]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) {
      return;
    }
    
    const supabase = getSupabase();
    
    // Delete order items first (foreign key constraint)
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
    
    // Delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') {
      return ['pending', 'preparing', 'ready'].includes(order.status);
    }
    return ['completed', 'cancelled'].includes(order.status);
  });

  const activeCount = orders.filter((o) =>
    ['pending', 'preparing', 'ready'].includes(o.status)
  ).length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeSince = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Audio element for alert sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+dlIdxWUxGRk1ZaHeCkJiamI+CcmFVTE1TWGBsdoKNl5uZkYd8cGVdWVtfZm50fYaOk5WTjoZ9c2leWFZXW2FpcoGMlJeVkop/dWtiXVxeY2t0f4uUmJaRiX5zbGReXV9lanWAjJSXlZKKgXdvZ2JgYmVqc32Ij5OVk4+Hf3ZuaGRiY2dsdX6Ij5KTkY2Gf3dwa2dmZ2tueYOKj5GPjIeDfHdya2loa21ye4OJjI2MioeEf3t3c3BvbnB1en+EiIqKiYaCf3x5d3V0dHV3en2Bg4WGhoWDgX98e3p5eXl6e3x+gIGCg4ODgoGAf359fX19fn5/gIGBgYGBgYCAf39/f39/f39/f4CAgICAgICAgIB/f39/f39/f39/f39/f4CAgICAgICAgICAf39/f39/f39/f39/f39/f39/gICAgICAgICAgIB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f4CAgICAgICAf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f38=" type="audio/wav" />
      </audio>

      {/* Header */}
      <header className="bg-stone-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Blackbird Orders</h1>
              {activeCount > 0 && (
                <span className="bg-amber-500 text-stone-900 px-3 py-1 rounded-full text-sm font-bold">
                  {activeCount} Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-stone-400 text-sm hidden sm:block">
                  {userEmail}
                </span>
              )}
              <Link
                href="/admin/menu"
                className="p-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
                title="Manage Menu"
              >
                <MenuIcon />
              </Link>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-amber-500 text-stone-900' : 'bg-stone-700 text-stone-400'
                }`}
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
              </button>
              <button
                onClick={loadOrders}
                className="p-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
                title="Refresh"
              >
                <RefreshIcon />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-stone-700 hover:bg-red-600 transition-colors"
                title="Sign Out"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            Completed
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">☕</div>
            <p className="text-stone-500">No {filter} orders</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Order Cards */}
            <div className="lg:col-span-2 space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition-all border-2 ${
                    selectedOrder?.id === order.id
                      ? 'border-amber-500 shadow-lg'
                      : 'border-transparent hover:border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-900">
                          {order.order_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_CONFIG[order.status].bg
                          } ${STATUS_CONFIG[order.status].color}`}
                        >
                          {STATUS_CONFIG[order.status].label}
                        </span>
                      </div>
                      <p className="font-medium text-stone-900">{order.customer_name}</p>
                      <p className="text-sm text-stone-500">{getTimeSince(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">{formatPrice(order.total)}</p>
                      <p className="text-sm text-stone-500">{formatTime(order.created_at)}</p>
                    </div>
                  </div>

                  {order.special_instructions && (
                    <div className="mt-3 p-2 bg-amber-50 rounded-lg text-sm text-amber-800">
                      <span className="font-medium">Note:</span> {order.special_instructions}
                    </div>
                  )}

                  {/* Quick Actions */}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <div className="mt-3 flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'preparing');
                          }}
                          className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'ready');
                          }}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'completed');
                          }}
                          className="flex-1 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors"
                        >
                          Complete Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Detail Panel */}
            <div className="lg:col-span-1">
              {selectedOrder ? (
                <div className="bg-white rounded-xl p-5 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">{selectedOrder.order_number}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_CONFIG[selectedOrder.status].bg
                      } ${STATUS_CONFIG[selectedOrder.status].color}`}
                    >
                      {STATUS_CONFIG[selectedOrder.status].label}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-stone-500">Customer</p>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div>
                        <p className="text-sm text-stone-500">Phone</p>
                        <p className="font-medium">{selectedOrder.customer_phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-stone-500">Email</p>
                      <p className="font-medium text-sm">{selectedOrder.customer_email}</p>
                    </div>
                  </div>

                  {selectedOrder.special_instructions && (
                    <div className="p-3 bg-amber-50 rounded-lg mb-4">
                      <p className="text-sm font-medium text-amber-800">Special Instructions</p>
                      <p className="text-sm text-amber-700">{selectedOrder.special_instructions}</p>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="border-t border-stone-100 pt-4 mb-4">
                    <p className="text-sm font-medium text-stone-700 mb-3">Order Items</p>
                    <div className="space-y-3">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item) => (
                          <div key={item.id} className="bg-stone-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
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
                              <span className="text-sm font-medium text-stone-700">
                                {formatPrice(item.unit_price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-400 italic">No items found</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-500">Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-stone-500">Tax</span>
                      <span>{formatPrice(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>

                  <div className="border-t border-stone-100 mt-4 pt-4 text-sm text-stone-500">
                    <p>Ordered: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>

                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="w-full mt-4 py-2 px-4 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete Order
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center text-stone-400">
                  <p>Select an order to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SoundOnIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}