'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StoreHours, StoreContact } from './StoreInfo';

export function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-stone-800/50 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            {/* Actual logo image - inverted for dark background */}
            <Image
              src="/images/blackbird-logo.png"
              alt="Blackbird"
              width={120}
              height={96}
              className="w-auto h-16 invert opacity-40 mb-4"
            />
            <p className="text-stone-600 text-sm">
              Maitland, FL
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-amber-400/80 font-medium text-sm uppercase tracking-wider mb-4">
              Menu
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu?category=coffee" className="text-stone-500 hover:text-stone-300 text-sm transition">
                  Coffee
                </Link>
              </li>
              <li>
                <Link href="/menu?category=cold-brew" className="text-stone-500 hover:text-stone-300 text-sm transition">
                  Cold Brew
                </Link>
              </li>
              <li>
                <Link href="/menu?category=breakfast" className="text-stone-500 hover:text-stone-300 text-sm transition">
                  Food
                </Link>
              </li>
              <li>
                <Link href="/comics" className="text-stone-500 hover:text-stone-300 text-sm transition">
                  Comics
                </Link>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-amber-400/80 font-medium text-sm uppercase tracking-wider mb-4">
              Hours
            </h3>
            <StoreHours />
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-amber-400/80 font-medium text-sm uppercase tracking-wider mb-4">
              Visit Us
            </h3>
            <StoreContact />
            <div className="mt-4">
              <Link 
                href="/order" 
                className="text-amber-400/80 hover:text-amber-300 text-sm font-medium transition"
              >
                Track Your Order →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-stone-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-stone-700 text-sm">
            © {new Date().getFullYear()} Blackbird Comics & Coffeehouse
          </p>
          <div className="flex items-center gap-4 text-stone-600 text-sm">
            <Link href="/order" className="hover:text-stone-400 transition">
              Track Order
            </Link>
            <span className="text-stone-800">·</span>
            <a 
              href="https://www.instagram.com/blackbirdcch/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-stone-400 transition"
            >
              Instagram
            </a>
            <span className="text-stone-800">·</span>
            <a 
              href="https://www.facebook.com/BlackbirdComicsAndCoffeehouse/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-stone-400 transition"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}