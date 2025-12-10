import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blackbird Comics & Coffeehouse',
  description: 'Coffee. Comics. Community. Order ahead for pickup in Maitland, Florida.',
  keywords: ['coffee', 'comics', 'coffeehouse', 'maitland', 'florida', 'order online', 'pickup'],
  openGraph: {
    title: 'Blackbird Comics & Coffeehouse',
    description: 'Coffee. Comics. Community.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1c1917',
              color: '#fef3c7',
              border: 'none',
            },
          }}
        />
      </body>
    </html>
  );
}