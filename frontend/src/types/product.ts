export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  color_name: string;
  color_code: string | null;
  size: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_active: boolean;
}
export interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  color_name: string;
  color_code: string | null;
  size: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[]; // این خط اضافه شد
}
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  gender: string;
  frame_shape: string;
  frame_type: string;
  material: string | null;
  is_prescription_ready: boolean;
  specifications: Record<string, any>;
  category: Category;
  brand: Brand;
  variants: ProductVariant[];
}