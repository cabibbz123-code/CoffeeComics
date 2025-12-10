'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore } from '@/lib/cart';
import { formatPrice, cn } from '@/lib/utils';
import { StripeProvider } from '@/components/StripeProvider';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTax = useCartStore((s) => s.getTax);
  const getTotal = useCartStore((s) => s.getTotal);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instructions: '',
  });
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          instructions: formData.instructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-stone-900 mb-4">Your cart is empty</h1>
            <Link
              href="/menu"
              className="text-amber-600 font-medium hover:text-amber-700"
            >
              Browse menu
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={cn(
            'flex items-center gap-2',
            step === 'info' ? 'text-amber-600' : 'text-stone-400'
          )}>
            <span className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
              step === 'info' ? 'bg-amber-500 text-white' : 'bg-stone-200'
            )}>1</span>
            <span className="font-medium">Info</span>
          </div>
          <div className="w-12 h-0.5 bg-stone-200" />
          <div className={cn(
            'flex items-center gap-2',
            step === 'payment' ? 'text-amber-600' : 'text-stone-400'
          )}>
            <span className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
              step === 'payment' ? 'bg-amber-500 text-white' : 'bg-stone-200'
            )}>2</span>
            <span className="font-medium">Payment</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-stone-900 mb-8 text-center">
          {step === 'info' ? 'Your Information' : 'Payment'}
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            {step === 'info' ? (
              <form onSubmit={handleInfoSubmit} className="space-y-6">
                {/* Contact Info */}
                <div className="bg-white rounded-2xl p-6 border border-stone-100">
                  <h2 className="font-semibold text-stone-900 mb-4">Contact Info</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition-colors"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">
                        Phone (for pickup notification)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition-colors"
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="bg-white rounded-2xl p-6 border border-stone-100">
                  <h2 className="font-semibold text-stone-900 mb-4">Special Instructions</h2>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="Any special requests? (optional)"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors',
                    loading
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  )}
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>
            ) : (
              clientSecret && (
                <StripeProvider clientSecret={clientSecret}>
                  <PaymentForm 
                    customerName={formData.name}
                    customerEmail={formData.email}
                    customerPhone={formData.phone}
                    instructions={formData.instructions}
                    items={items}
                    total={total}
                  />
                </StripeProvider>
              )
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 sticky top-24">
              <h2 className="font-semibold text-stone-900 mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-stone-900">{item.quantity}x </span>
                      <span className="text-stone-600">{item.product.name}</span>
                      {item.size.name !== 'Regular' && item.size.name !== 'Standard' && (
                        <span className="text-stone-400"> ({item.size.name})</span>
                      )}
                    </div>
                    <span className="text-stone-900 shrink-0 ml-2">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-stone-100">
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

              {/* Pickup Info */}
              <div className="mt-6 pt-6 border-t border-stone-100">
                <div className="flex items-start gap-3">
                  <LocationIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-stone-900">Pickup at Blackbird</p>
                    <p className="text-sm text-stone-500">500 E Horatio Ave, Maitland FL</p>
                    <p className="text-sm text-amber-600 mt-1">Ready in ~15 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Payment Form Component (uses Stripe hooks)
function PaymentForm({ customerName, customerEmail, customerPhone, instructions, items, total }: { 
  customerName: string; 
  customerEmail: string;
  customerPhone: string;
  instructions: string;
  items: any[];
  total: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Store order data in sessionStorage for after redirect
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.06;
      
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          sizeName: item.size.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          modifiers: item.modifiers,
        })),
        subtotal,
        tax,
        total,
        instructions,
      }));

      // Always redirect - works for all payment methods
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirmation`,
          payment_method_data: {
            billing_details: {
              name: customerName,
              email: customerEmail,
            },
          },
        },
      });

      // Only reaches here if redirect fails
      if (confirmError) {
        throw new Error(confirmError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-stone-100">
        <h2 className="font-semibold text-stone-900 mb-4">Payment Details</h2>
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className={cn(
          'w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2',
          !stripe || loading
            ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
            : 'bg-stone-900 text-white hover:bg-stone-800'
        )}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(total)}`
        )}
      </button>

      <p className="text-center text-xs text-stone-400">
        Secure payment powered by Stripe
      </p>
    </form>
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}