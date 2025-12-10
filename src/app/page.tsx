import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/birdseyeview.jpg"
            alt="Blackbird interior"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/70 to-stone-950" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Actual Blackbird Logo - inverted for dark background */}
          <div className="mb-0 pointer-events-none">
            <Image
              src="/images/blackbird-logo.png"
              alt="Blackbird Comics & Coffeehouse"
              width={1200}
              height={960}
              className="mx-auto w-auto h-[500px] sm:h-[700px] md:h-[900px] invert"
              priority
            />
          </div>

          <h1 className="sr-only">BLACKBIRD</h1>
          
          <p className="text-amber-400 text-xl font-medium tracking-[0.3em] uppercase -mt-72 sm:-mt-60 md:-mt-52 mb-10 pointer-events-none">
            Maitland, Florida
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
            <Link 
              href="/menu" 
              className="group px-8 py-4 bg-amber-500 text-stone-900 rounded-full font-semibold text-lg hover:bg-amber-400 transition-all hover:scale-105"
            >
              View Menu
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link 
              href="/comics" 
              className="px-8 py-4 border border-stone-700 text-stone-300 rounded-full font-medium text-lg hover:bg-stone-800 hover:border-stone-600 transition-all"
            >
              Shop Comics
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 px-6 bg-stone-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl sm:text-3xl text-amber-100/80 font-light italic leading-relaxed">
            "Come for the coffee, stay for the comics—or come for the comics and stay for the coffee!"
          </blockquote>
          <div className="mt-6 w-16 h-px bg-amber-500/50 mx-auto" />
        </div>
      </section>

      {/* Two Worlds Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Coffee Side */}
          <Link href="/menu" className="group relative h-[400px] rounded-2xl overflow-hidden">
            <Image
              src="/images/counterview.jpg"
              alt="Coffee bar"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-amber-400 text-sm tracking-[0.2em] uppercase mb-2">Panther Coffee</p>
              <h3 className="text-3xl font-bold text-white mb-2">Coffee & Eats</h3>
              <p className="text-stone-400 text-sm">Craft espresso, cold brew, fresh food</p>
              <div className="mt-4 text-amber-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                View Menu →
              </div>
            </div>
          </Link>

          {/* Comics Side */}
          <Link href="/comics" className="group relative h-[400px] rounded-2xl overflow-hidden">
            <Image
              src="/images/manga.jpg"
              alt="Comics and manga"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-amber-400 text-sm tracking-[0.2em] uppercase mb-2">New Every Wednesday</p>
              <h3 className="text-3xl font-bold text-white mb-2">Comics & More</h3>
              <p className="text-stone-400 text-sm">New releases, manga, graphic novels, collectibles</p>
              <div className="mt-4 text-amber-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                Shop Now →
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Features Row */}
      <section className="py-16 px-6 border-t border-stone-800/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CoffeeIcon className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-amber-50 font-medium mb-1">Craft Coffee</h4>
            <p className="text-stone-500 text-sm">Panther Coffee beans</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ComicIcon className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-amber-50 font-medium mb-1">900+ Comics</h4>
            <p className="text-stone-500 text-sm">New & back issues</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <GameIcon className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-amber-50 font-medium mb-1">Board Games</h4>
            <p className="text-stone-500 text-sm">Play or rent</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <VinylIcon className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-amber-50 font-medium mb-1">Vinyl & More</h4>
            <p className="text-stone-500 text-sm">Curated collection</p>
          </div>
        </div>
      </section>

      {/* Visit Section */}
      <section className="py-20 px-6 bg-stone-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-amber-50 mb-6">Come Hang Out</h2>
          <p className="text-stone-400 text-lg mb-8 max-w-2xl mx-auto">
            We're more than a coffee shop. We're a community hub where creativity meets caffeination.
          </p>
          
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
              <LocationIcon className="w-5 h-5 text-amber-400" />
              <span>500 E Horatio Ave, Maitland FL</span>
            </div>
            <span className="hidden sm:block text-stone-700">·</span>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-amber-400" />
              <span>Open Daily</span>
            </div>
            <span className="hidden sm:block text-stone-700">·</span>
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-amber-400" />
              <span>(321) 316-4296</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Icons
function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  );
}

function ComicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
    </svg>
  );
}

function VinylIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}