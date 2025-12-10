'use client';

import Link from 'next/link';
import { useCartStore, type CartItem } from '@/lib/cart';
import { cn, formatPrice } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTax = useCartStore((s) => s.getTax);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative bg-white w-full max-w-md h-full flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Your Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <CartIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">Your cart is empty</p>
              <button
                onClick={onClose}
                className="mt-4 text-amber-600 font-medium hover:text-amber-700"
              >
                Browse menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 p-5 bg-white">
            {/* Totals */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (6%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-stone-900 pt-2 border-t border-stone-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="block w-full bg-stone-900 text-white py-4 px-6 rounded-xl font-semibold text-center hover:bg-stone-800 transition-colors"
            >
              Checkout
            </Link>

            <p className="text-center text-xs text-stone-400 mt-3">
              Pickup only · Ready in 10-15 min
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CartItemCard({
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
    <div className="bg-stone-50 rounded-xl p-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-900">{item.product.name}</h3>
          <p className="text-sm text-stone-500">{item.size.name}</p>
          {modifierText && (
            <p className="text-sm text-stone-400 mt-1">{modifierText}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-stone-200 rounded-full transition-colors"
        >
          <TrashIcon className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-3">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-300 transition-colors bg-white"
          >
            <MinusIcon className="w-3 h-3 text-stone-600" />
          </button>
          <span className="w-6 text-center font-medium text-stone-900">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-300 transition-colors bg-white"
          >
            <PlusIcon className="w-3 h-3 text-stone-600" />
          </button>
        </div>

        <span className="font-semibold text-stone-900">
          {formatPrice(item.totalPrice)}
        </span>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
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
