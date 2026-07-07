import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductVariant } from '@/types/product';

// ۱. اضافه کردن تایپ دقیق نمره پزشکی
export interface PrescriptionData {
  rightEye: { sph: string; cyl: string; axis: string };
  leftEye: { sph: string; cyl: string; axis: string };
  pd: string;
}

export interface CartItem {
  cartItemId: string; // شناسه یکتای ردیف سبد خرید (ترکیب تنوع + نمره پزشکی)
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
  prescription?: PrescriptionData; // اضافه شدن فرم پزشکی به آیتم سبد خرید
}

interface CartState {
  items: CartItem[];
  // ۲. آپدیت کردن امضای تابع برای دریافت نمره پزشکی
  addItem: (product: Product, variant: ProductVariant, quantity?: number, prescription?: PrescriptionData) => void;
  removeItem: (cartItemId: string) => void; // حالا بر اساس cartItemId حذف می‌کنیم
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant, quantity = 1, prescription) => {
        set((state) => {
          // ۳. ساخت شناسه یکتا: اگر نمره پزشکی داشت، آن را به آیدی متصل می‌کنیم تا متمایز شود
          const prescriptionString = prescription ? JSON.stringify(prescription) : "";
          const cartItemId = `${variant.id}-${prescriptionString}`;

          const existingItemIndex = state.items.findIndex(
            (item) => item.cartItemId === cartItemId
          );

          if (existingItemIndex > -1) {
            // اگر دقیقاً همین کالا با همین نمره پزشکی در سبد بود، فقط تعداد را بالا ببر
            const updatedItems = [...state.items];
            const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
            
            if (newQuantity <= variant.stock_quantity) {
              updatedItems[existingItemIndex].quantity = newQuantity;
            }
            return { items: updatedItems };
          }

          // اگر کالای جدیدی است (یا نمره پزشکی متفاوتی دارد)، به عنوان خط جدید اضافه کن
          const defaultImage = variant.images?.[0]?.image_url || "";
          const price = variant.discount_price || variant.price;

          const newItem: CartItem = {
            cartItemId, // ذخیره شناسه یکتای جدید
            variantId: variant.id,
            productId: product.id,
            title: product.title,
            slug: product.slug,
            colorName: variant.color_name || "",
            colorCode: variant.color_code || null,
            size: variant.size || "",
            price: price,
            image: defaultImage,
            quantity: quantity,
            maxStock: variant.stock_quantity,
            prescription: prescription, // ذخیره اطلاعات پزشکی
          };

          return { items: [...state.items, newItem] };
        });
      },

      // آپدیت بقیه متدها برای استفاده از cartItemId به جای variantId
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
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
      name: 'bina-cart-storage',
    }
  )
);