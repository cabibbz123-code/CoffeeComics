import { cn, formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    badge: string | null;
    notes: string | null;
    image_url?: string | null;
    sizes: { name: string; price: number }[];
  };
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const hasMultipleSizes = product.sizes && product.sizes.length > 1;
  const priceDisplay = hasMultipleSizes
    ? `${formatPrice(product.sizes[0].price)} - ${formatPrice(product.sizes[product.sizes.length - 1].price)}`
    : formatPrice(product.base_price);

  const hasImage = product.image_url && product.image_url.trim() !== '';

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl text-left border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all group h-full flex flex-col overflow-hidden"
    >
      {/* Image Area */}
      <div className="relative h-32 bg-stone-100 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <Image
            src={product.image_url!}
            alt={product.name}
            fill
            loading="eager"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 300px"
          />
        ) : (
          <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {product.badge && (
          <span className={cn(
            'absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded',
            product.badge === 'Popular' || product.badge === 'Best Seller'
              ? 'bg-amber-500 text-white'
              : product.badge === 'New'
              ? 'bg-green-500 text-white'
              : product.badge === 'Vegan'
              ? 'bg-emerald-500 text-white'
              : product.badge === 'Hearty'
              ? 'bg-orange-500 text-white'
              : product.badge === 'Distinctive' || product.badge === 'House Favorite'
              ? 'bg-purple-500 text-white'
              : 'bg-stone-700 text-white'
          )}>
            {product.badge}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-1 mb-1">
          {product.name}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-stone-500 line-clamp-2 flex-1 mb-3">
          {product.description || '\u00A0'}
        </p>
        
        {/* Notes */}
        {product.notes && (
          <p className="text-xs text-stone-400 italic mb-3 line-clamp-1">
            {product.notes}
          </p>
        )}
        
        {/* Price Row */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div>
            <span className="font-bold text-stone-900">{priceDisplay}</span>
            {hasMultipleSizes && (
              <span className="text-xs text-stone-400 ml-1">· {product.sizes.length} sizes</span>
            )}
          </div>
          <span className="w-8 h-8 rounded-full bg-stone-900 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
            <PlusIcon className="w-4 h-4 text-white" />
          </span>
        </div>
      </div>
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}