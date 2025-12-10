'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore } from '@/lib/cart';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'processing' | 'failed'>('loading');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handlePaymentResult();
  }, []);

  const handlePaymentResult = async () => {
    // Check payment status from redirect
    if (redirectStatus === 'failed') {
      setStatus('failed');
      setError('Payment was declined. Please try again.');
      return;
    }

    if (redirectStatus === 'succeeded' || redirectStatus === 'pending') {
      // Get pending order data from sessionStorage
      const pendingOrderData = sessionStorage.getItem('pendingOrder');
      
      if (!pendingOrderData) {
        // Order might already be created, just show success
        setStatus(redirectStatus === 'succeeded' ? 'success' : 'processing');
        setOrderNumber(`BB-${paymentIntentId?.slice(-8).toUpperCase() || Date.now().toString(36).toUpperCase()}`);
        return;
      }

      try {
        const orderData = JSON.parse(pendingOrderData);
        
        // Create order in database
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            ...orderData,
          }),
        });

        const result = await response.json();

        if (response.ok && result.orderNumber) {
          setOrderNumber(result.orderNumber);
          setOrderId(result.orderId);
          setStatus(redirectStatus === 'succeeded' ? 'success' : 'processing');
          
          // Clear cart and pending order
          clearCart();
          sessionStorage.removeItem('pendingOrder');
        } else {
          // Order creation failed but payment succeeded
          // Still show success - webhook will handle it
          setOrderNumber(`BB-${paymentIntentId?.slice(-8).toUpperCase()}`);
          setStatus('success');
          clearCart();
          sessionStorage.removeItem('pendingOrder');
        }
      } catch (err) {
        console.error('Order creation error:', err);
        // Payment succeeded, order will be created by webhook
        setOrderNumber(`BB-${paymentIntentId?.slice(-8).toUpperCase()}`);
        setStatus('success');
        clearCart();
        sessionStorage.removeItem('pendingOrder');
      }
    } else {
      // Unknown status
      setStatus('failed');
      setError('Something went wrong. Please contact support.');
    }
  };

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'failed') {
    return (
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XIcon className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          Payment Failed
        </h1>
        
        <p className="text-stone-500 mb-8">
          {error || 'Your payment could not be processed.'}
        </p>

        <Link
          href="/checkout"
          className="inline-block py-3 px-8 rounded-xl font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
        >
          Try Again
        </Link>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClockIcon className="w-10 h-10 text-amber-600" />
        </div>

        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          Payment Processing
        </h1>
        
        <p className="text-stone-500 mb-8">
          Your payment is being processed. We'll notify you when it's confirmed.
        </p>

        {orderNumber && (
          <div className="bg-white rounded-2xl p-6 border border-stone-100 mb-8">
            <div className="flex justify-between">
              <span className="text-stone-500">Reference</span>
              <span className="font-semibold text-stone-900">{orderNumber}</span>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-block py-3 px-8 rounded-xl font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
        >
          Back Home
        </Link>
      </div>
    );
  }

  // Success state
  return (
    <div className="max-w-md w-full text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckIcon className="w-10 h-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-stone-900 mb-2">
        Order Confirmed!
      </h1>
      
      <p className="text-stone-500 mb-8">
        Thank you for your order. We're preparing it now.
      </p>

      {/* Order Details Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-100 mb-8 text-left">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-stone-500">Order Number</span>
            <span className="font-semibold text-stone-900">{orderNumber}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-stone-500">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Preparing
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-stone-500">Estimated Ready</span>
            <span className="font-medium text-stone-900">~15 minutes</span>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-start gap-3">
              <LocationIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-stone-900">Pickup Location</p>
                <p className="text-sm text-stone-500">
                  Blackbird Comics & Coffeehouse<br />
                  500 E Horatio Ave, Maitland FL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-stone-100 rounded-2xl p-6 mb-8 text-left">
        <h2 className="font-semibold text-stone-900 mb-3">What's Next?</h2>
        <ul className="space-y-2 text-sm text-stone-600">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            You'll receive an email confirmation shortly
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            We'll notify you when your order is ready
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            Just give your name at the counter for pickup
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {orderId && (
          <Link
            href={`/order/${orderId}`}
            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-amber-500 text-stone-900 hover:bg-amber-400 transition-colors"
          >
            Track Order
          </Link>
        )}
        <Link
          href="/menu"
          className="flex-1 py-3 px-6 rounded-xl font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
        >
          Order More
        </Link>
        <Link
          href="/"
          className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 border-stone-200 text-stone-700 hover:border-stone-300 transition-colors"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<LoadingState />}>
          <OrderConfirmationContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-md w-full text-center">
      <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="w-8 h-8 border-4 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
      </div>
      <p className="text-stone-500">Processing your order...</p>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
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