"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Product, ProductVariant } from "@/types/product"
import { productService } from "@/services/productService"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, Truck, Ruler } from "lucide-react"
import { useCartStore } from "@/store/useCartStore"

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  // فراخوانی تابع افزودن به سبد خرید از استور
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await productService.getProductBySlug(slug)
        setProduct(data)
        
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
      } catch (err) {
        setError("محصول مورد نظر یافت نشد یا خطایی رخ داده است.")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 gap-4" dir="rtl">
        <div className="text-xl font-medium text-zinc-600">{error || "محصول پیدا نشد"}</div>
      </div>
    )
  }

  const displayPrice = selectedVariant 
    ? (selectedVariant.discount_price || selectedVariant.price)
    : 0
    
  const hasDiscount = selectedVariant && selectedVariant.discount_price !== null

  // گرفتن عکس مخصوص همین رنگ (اگر عکسی نبود از یک عکس پیش‌فرض استفاده می‌کند)
  const currentImage = selectedVariant?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop"

  return (
    <div className="min-h-screen bg-white font-sans text-right" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          
          {/* ستون راست: گالری تصاویر */}
          <div className="w-full md:w-1/2">
            <div className="relative aspect-square w-full rounded-3xl bg-zinc-50 overflow-hidden border border-zinc-100">
              <Image
                src={currentImage}
                alt={`${product.title} - ${selectedVariant?.color_name || ''}`}
                fill
                className="object-contain p-8 transition-opacity duration-300"
                priority
              />
            </div>
          </div>

          {/* ستون چپ: اطلاعات محصول */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-800 text-xs font-bold uppercase tracking-widest rounded-md" dir="ltr">
                {product.brand?.name}
              </span>
              <span className="text-sm font-medium text-zinc-400">
                / {product.category?.name}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 leading-tight">
              {product.title}
            </h1>
            
            <p className="text-base text-zinc-500 mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* بخش قیمت */}
            <div className="mb-8">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-zinc-900">
                  {new Intl.NumberFormat("fa-IR").format(displayPrice)} <span className="text-lg font-medium text-zinc-500">تومان</span>
                </span>
                {hasDiscount && (
                  <span className="text-lg font-medium text-zinc-400 line-through mb-1">
                    {new Intl.NumberFormat("fa-IR").format(selectedVariant.price)}
                  </span>
                )}
              </div>
            </div>

            {/* بخش انتخاب رنگ */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8 border-t border-zinc-100 pt-8">
                <h3 className="text-sm font-bold text-zinc-900 mb-4 tracking-wider flex items-center gap-2">
                  انتخاب رنگ: <span className="text-zinc-500 font-medium">{selectedVariant?.color_name}</span>
                </h3>
                <div className="flex flex-wrap gap-4">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedVariant?.id === variant.id 
                          ? "border-zinc-900 scale-110" 
                          : "border-transparent hover:border-zinc-300"
                      }`}
                    >
                      <span 
                        className="w-10 h-10 rounded-full border border-zinc-200 shadow-inner"
                        style={{ backgroundColor: variant.color_code || "#000000" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* دکمه افزودن به سبد خرید */}
            <div className="mt-auto">
              <Button 
                onClick={() => {
                  if (product && selectedVariant) {
                    addItem(product, selectedVariant, 1)
                  }
                }}
                size="lg" 
                className="w-full h-14 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xl shadow-zinc-200 transition-all"
                disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
              >
                {!selectedVariant 
                  ? "یک گزینه را انتخاب کنید" 
                  : selectedVariant.stock_quantity === 0 
                  ? "ناموجود" 
                  : "افزودن به سبد خرید"}
              </Button>
            </div>

            {/* ویژگی‌های محصول */}
            <div className="mt-8 grid grid-cols-2 gap-4 pt-8 border-t border-zinc-100">
              <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                <ShieldCheck className="w-5 h-5 text-zinc-400" />
                تضمین اصالت کالا
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                <Truck className="w-5 h-5 text-zinc-400" />
                ارسال سریع و مطمئن
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                <Ruler className="w-5 h-5 text-zinc-400" />
                فرم فریم: {product.frame_shape}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}