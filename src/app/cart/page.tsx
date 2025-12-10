'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore, type CartItem } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTax = useCartStore((s) => s.getTax);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Your Cart</h1>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <CartIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Your cart is empty</h2>
            <p className="text-stone-500 mb-6">Add some items to get started</p>
            <Link
              href="/menu"
              className="inline-block bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-800 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-stone-100 sticky top-24">
                <h2 className="font-semibold text-stone-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Tax (6%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-stone-900 pt-3 border-t border-stone-100">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full bg-stone-900 text-white py-4 px-6 rounded-xl font-semibold text-center hover:bg-stone-800 transition-colors"
                >
                  Checkout
                </Link>

                <p className="text-center text-xs text-stone-400 mt-4">
                  Pickup only · Ready in 10-15 min
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
}) {
  const modifierText = item.modifiers.length > 0
    ? item.modifiers.map((m) => m.name).join(', ')
    : null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-900">{item.product.name}</h3>
          <p className="text-sm text-stone-500">{item.size.name}</p>
          {modifierText && (
            <p className="text-sm text-stone-400 mt-1">{modifierText}</p>
          )}
          <p className="text-sm font-medium text-stone-900 mt-2">
            {formatPrice(item.unitPrice)} each
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            onClick={onRemove}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-300 transition-colors"
            >
              <MinusIcon className="w-3 h-3 text-stone-600" />
            </button>
            <span className="w-6 text-center font-medium text-stone-900">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-300 transition-colors"
            >
              <PlusIcon className="w-3 h-3 text-stone-600" />
            </button>
          </div>

          <span className="font-semibold text-stone-900">
            {formatPrice(item.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}
