'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart';
import { toast } from 'sonner';

interface Size {
  name: string;
  price: number;
}

interface ModifierOption {
  name: string;
  price?: number;
}

interface ModifierGroup {
  group: string;
  required?: boolean;
  max?: number;
  options: (string | ModifierOption)[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  badge: string | null;
  notes: string | null;
  image_url?: string | null;
  sizes: Size[];
  modifiers?: ModifierGroup[];
}

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: () => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  // Default size if none provided
  const defaultSize = product.sizes?.[0] || { name: 'Regular', price: product.base_price };
  const [selectedSize, setSelectedSize] = useState<Size>(defaultSize);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  
  const addItem = useCartStore((s) => s.addItem);

  // Initialize required modifiers
  useEffect(() => {
    if (product.modifiers) {
      const initial: Record<string, string[]> = {};
      product.modifiers.forEach((group) => {
        initial[group.group] = [];
      });
      setSelectedModifiers(initial);
    }
  }, [product]);

  // Calculate total price
  const getModifierPrice = (option: string | ModifierOption): number => {
    if (typeof option === 'string') return 0;
    return option.price || 0;
  };

  const getModifierName = (option: string | ModifierOption): string => {
    if (typeof option === 'string') return option;
    return option.name;
  };

  const modifiersTotal = Object.entries(selectedModifiers).reduce((total, [groupName, selected]) => {
    const group = product.modifiers?.find((g) => g.group === groupName);
    if (!group) return total;
    
    return total + selected.reduce((sum, name) => {
      const option = group.options.find((o) => getModifierName(o) === name);
      return sum + (option ? getModifierPrice(option) : 0);
    }, 0);
  }, 0);

  const unitPrice = selectedSize.price + modifiersTotal;
  const totalPrice = unitPrice * quantity;

  // Handle modifier selection
  const toggleModifier = (groupName: string, optionName: string, group: ModifierGroup) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupName] || [];
      
      if (group.required && group.max === 1) {
        // Single required selection - replace
        return { ...prev, [groupName]: [optionName] };
      }
      
      if (current.includes(optionName)) {
        // Deselect
        return { ...prev, [groupName]: current.filter((n) => n !== optionName) };
      }
      
      // Check max
      if (group.max && current.length >= group.max) {
        return prev;
      }
      
      // Add
      return { ...prev, [groupName]: [...current, optionName] };
    });
  };

  // Validate before adding to cart
  const canAddToCart = () => {
    if (!product.modifiers) return true;
    
    for (const group of product.modifiers) {
      if (group.required) {
        const selected = selectedModifiers[group.group] || [];
        if (selected.length === 0) return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      toast.error('Please complete all required selections');
      return;
    }

    // Build modifiers array for cart
    const modifiersList = Object.entries(selectedModifiers).flatMap(([groupName, selected]) => {
      const group = product.modifiers?.find((g) => g.group === groupName);
      if (!group) return [];
      
      return selected.map((name) => {
        const option = group.options.find((o) => getModifierName(o) === name);
        return {
          id: `${groupName}-${name}`,
          group_id: groupName,
          name,
          price: option ? getModifierPrice(option) : 0,
          is_available: true,
          display_order: 0,
        };
      });
    });

    addItem(
      {
        id: product.id,
        category_id: '',
        name: product.name,
        description: product.description,
        product_type: 'drink',
        base_price: product.base_price,
        publisher: null,
        sku: null,
        in_stock: true,
        image_url: null,
        badge: product.badge,
        display_order: 0,
        notes: product.notes,
        is_active: true,
        is_featured: false,
      },
      {
        id: `${product.id}-${selectedSize.name}`,
        product_id: product.id,
        name: selectedSize.name,
        price: selectedSize.price,
        display_order: 0,
        is_default: false,
      },
      modifiersList,
      quantity
    );

    toast.success(`${product.name} added to cart`);
    if (onAddToCart) {
      onAddToCart();
    } else {
      onClose();
    }
  };

  const hasImage = product.image_url && product.image_url.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Product Image */}
        {hasImage && (
          <div className="relative w-full h-48 sm:h-56 bg-stone-100 shrink-0">
            <Image
              src={product.image_url!}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
              priority
            />
            {/* Close button overlaid on image */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full transition-colors shadow-sm"
            >
              <CloseIcon className="w-5 h-5 text-stone-600" />
            </button>
            {/* Badge on image */}
            {product.badge && (
              <div className="absolute bottom-3 left-3">
                <span className={cn(
                  'text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm',
                  product.badge === 'Popular' || product.badge === 'Best Seller'
                    ? 'bg-amber-500 text-white'
                    : product.badge === 'New'
                    ? 'bg-green-500 text-white'
                    : product.badge === 'Vegan'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-stone-700'
                )}>
                  {product.badge}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Header */}
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">{product.name}</h2>
              <p className="text-stone-500 mt-1">{product.description}</p>
              {product.notes && (
                <p className="text-sm text-amber-600 mt-2">{product.notes}</p>
              )}
            </div>
            {/* Only show close button here if no image */}
            {!hasImage && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors shrink-0"
              >
                <CloseIcon className="w-5 h-5 text-stone-400" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Size Selection */}
          {product.sizes && product.sizes.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.name}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'py-3 px-4 rounded-xl border-2 text-center transition-all',
                      selectedSize.name === size.name
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                    )}
                  >
                    <div className="font-medium text-stone-900">{size.name}</div>
                    <div className="text-sm text-stone-500">{formatPrice(size.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {product.modifiers?.map((group) => (
            <div key={group.group}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-900">{group.group}</h3>
                <span className="text-xs text-stone-400">
                  {group.required ? 'Required' : group.max ? `Choose up to ${group.max}` : 'Optional'}
                </span>
              </div>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const name = getModifierName(option);
                  const price = getModifierPrice(option);
                  const isSelected = selectedModifiers[group.group]?.includes(name);
                  
                  return (
                    <button
                      key={name}
                      onClick={() => toggleModifier(group.group, name, group)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all',
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-stone-200 hover:border-stone-300'
                      )}
                    >
                      <span className="font-medium text-stone-900">{name}</span>
                      <span className="text-stone-500">
                        {price > 0 ? `+${formatPrice(price)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Quantity</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center hover:border-stone-300 transition-colors"
              >
                <MinusIcon className="w-4 h-4 text-stone-600" />
              </button>
              <span className="text-xl font-semibold text-stone-900 w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center hover:border-stone-300 transition-colors"
              >
                <PlusIcon className="w-4 h-4 text-stone-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-100 bg-white">
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors flex items-center justify-between',
              canAddToCart()
                ? 'bg-stone-900 text-white hover:bg-stone-800'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            )}
          >
            <span>Add to Cart</span>
            <span>{formatPrice(totalPrice)}</span>
          </button>
        </div>
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