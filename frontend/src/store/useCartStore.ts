import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductVariant } from '@/types/product';

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  colorName: string;
  colorCode: string | null;
  size: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.variantId === variant.id
          );

          if (existingItemIndex > -1) {
            // If item exists, increase quantity (but do not exceed stock)
            const updatedItems = [...state.items];
            const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
            
            if (newQuantity <= variant.stock_quantity) {
              updatedItems[existingItemIndex].quantity = newQuantity;
            }
            return { items: updatedItems };
          }

          // If item is new, add it to cart
          const defaultImage = variant.images?.[0]?.image_url || "";
          const price = variant.discount_price || variant.price;

          const newItem: CartItem = {
            variantId: variant.id,
            productId: product.id,
            title: product.title,
            slug: product.slug,
            colorName: variant.color_name,
            colorCode: variant.color_code,
            size: variant.size,
            price: price,
            image: defaultImage,
            quantity: quantity,
            maxStock: variant.stock_quantity,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxStock) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'bina-cart-storage', // The key used in localStorage
    }
  )
);