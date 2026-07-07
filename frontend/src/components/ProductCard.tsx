"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasVariants = product.variants && product.variants.length > 0;
  
  // پیدا کردن قیمت برای نمایش
  const displayPrice = hasVariants 
    ? product.variants[0].discount_price || product.variants[0].price 
    : 0;

  // پیدا کردن عکس پیش‌فرض (عکس اولین رنگ)
  const defaultImage = hasVariants && product.variants[0].images?.[0]?.image_url
    ? product.variants[0].images[0].image_url
    : "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-zinc-100 p-4 transition-all hover:shadow-xl hover:border-zinc-200" dir="rtl">
      
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-50 mb-4">
        <Image
          src={defaultImage}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {product.brand && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-zinc-800 uppercase tracking-wider" dir="ltr">
            {product.brand.name}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow text-right">
        <span className="text-xs font-medium text-zinc-400 mb-1">
          {product.category?.name || "دسته‌بندی"}
        </span>
        
        <Link href={`/product/${product.slug}`} className="mb-2">
          <h3 className="text-sm font-bold text-zinc-900 line-clamp-2 hover:text-zinc-600 transition-colors leading-relaxed">
            {product.title}
          </h3>
        </Link>

        {hasVariants && (
          <div className="flex items-center gap-1 mb-4 justify-start">
            {product.variants.slice(0, 3).map((variant) => (
              <div 
                key={variant.id}
                className="w-4 h-4 rounded-full border border-zinc-200 shadow-sm"
                style={{ backgroundColor: variant.color_code || "#000000" }}
                title={variant.color_name}
              />
            ))}
            {product.variants.length > 3 && (
              <span className="text-[10px] text-zinc-400 font-medium mr-1">
                +{product.variants.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-50">
          <Button variant="ghost" size="sm" className="text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg px-3">
            مشاهده جزئیات
          </Button>
          
          <div className="flex items-center gap-1 flex-row-reverse">
            <span className="text-xs text-zinc-500 font-medium">تومان</span>
            <span className="text-base font-black text-zinc-900">
              {formatPrice(displayPrice)}
            </span>
          </div>
        </div>
      </div>

      <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">مشاهده محصول</span>
      </Link>
    </div>
  );
}