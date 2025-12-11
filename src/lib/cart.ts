import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductSize, Modifier } from '@/types';

export interface CartItem {
  id: string;
  product: Product;
  size: ProductSize;
  modifiers: Modifier[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  
  // Actions
  addItem: (product: Product, size: ProductSize, modifiers?: Modifier[], quantity?: number, notes?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed (as functions since Zustand doesn't auto-compute)
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

const TAX_RATE = 0.06; // Michigan 6%

// Helper to create a unique key for cart item comparison
// Two items are "identical" if they have the same product, size, and modifiers
function getItemKey(productId: string, sizeName: string, modifiers: Modifier[]): string {
  const modifierNames = modifiers.map(m => m.name).sort().join('|');
  return `${productId}::${sizeName}::${modifierNames}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, modifiers = [], quantity = 1, notes) => {
        const modifiersPrice = modifiers.reduce((sum, m) => sum + m.price, 0);
        const unitPrice = size.price + modifiersPrice;
        
        // Generate key for this item configuration
        const itemKey = getItemKey(product.id, size.name, modifiers);
        
        // Check if an identical item already exists in cart
        const existingItem = get().items.find(item => 
          getItemKey(item.product.id, item.size.name, item.modifiers) === itemKey
        );

        if (existingItem) {
          // Item exists - increment quantity instead of adding duplicate
          const newQuantity = existingItem.quantity + quantity;
          set((state) => ({
            items: state.items.map((item) =>
              item.id === existingItem.id
                ? { 
                    ...item, 
                    quantity: newQuantity, 
                    totalPrice: item.unitPrice * newQuantity,
                    // Append notes if both have them
                    notes: item.notes && notes 
                      ? `${item.notes}; ${notes}` 
                      : item.notes || notes
                  }
                : item
            ),
          }));
        } else {
          // New item - add to cart
          const newItem: CartItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            product,
            size,
            modifiers,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            notes,
          };

          set((state) => ({
            items: [...state.items, newItem],
          }));
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getItemCount: () => {
        // Return total quantity of all items, not just number of line items
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
      },

      getTax: () => {
        return get().getSubtotal() * TAX_RATE;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return subtotal + subtotal * TAX_RATE;
      },
    }),
    {
      name: 'blackbird-cart',
    }
  )
);

// Hook for easy access
export function useCart() {
  const store = useCartStore();
  
  return {
    items: store.items,
    itemCount: store.getItemCount(),
    subtotal: store.getSubtotal(),
    tax: store.getTax(),
    total: store.getTotal(),
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    isEmpty: store.items.length === 0,
  };
}