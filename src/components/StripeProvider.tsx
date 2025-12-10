'use client';

import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret: string;
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#f59e0b', // amber-500
        colorBackground: '#ffffff',
        colorText: '#1c1917', // stone-900
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '2px solid #e7e5e4', // stone-200
          boxShadow: 'none',
          padding: '12px 16px',
        },
        '.Input:focus': {
          border: '2px solid #f59e0b', // amber-500
          boxShadow: '0 0 0 1px #f59e0b',
        },
        '.Label': {
          fontWeight: '500',
          marginBottom: '8px',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
