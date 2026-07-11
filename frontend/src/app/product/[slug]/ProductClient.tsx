"use client"

import { useState } from "react"
import Image from "next/image"
import { Product, ProductVariant } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, Truck, Eye, Droplet } from "lucide-react"
import { useCartStore } from "@/store/useCartStore"

interface PrescriptionData {
  rightEye: { sph: string; cyl: string; axis: string };
  leftEye: { sph: string; cyl: string; axis: string };
  pd: string;
}

// حالا محصول به صورت آماده از سرور دریافت می‌شود و نیازی به useEffect و حالت Loading نیست
export default function ProductClient({ initialProduct }: { initialProduct: Product }) {
  const [product] = useState<Product>(initialProduct)
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  )
  
  const [prescription, setPrescription] = useState<PrescriptionData>({
    rightEye: { sph: "", cyl: "", axis: "" },
    leftEye: { sph: "", cyl: "", axis: "" },
    pd: ""
  })

  const addItem = useCartStore((state) => state.addItem)

  const displayPrice = selectedVariant ? (selectedVariant.discount_price || selectedVariant.price) : 0
  const hasDiscount = selectedVariant && selectedVariant.discount_price !== null
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const rawImageUrl = selectedVariant?.images?.[0]?.image_url || product.images?.[0]?.image_url;
  const currentImage = rawImageUrl 
    ? (rawImageUrl.startsWith("http") ? rawImageUrl : `${backendUrl}${rawImageUrl}`)
    : "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop";

  const productType = (product as any).product_type || "SUNGLASSES" 

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return
    const finalPrescription = productType === 'EYEGLASSES' ? prescription : undefined;
    addItem(product, selectedVariant, 1, finalPrescription);
  }

  return (
    <div className="min-h-screen bg-white font-sans text-right pb-24" dir="rtl">
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          
          {/* گالری تصاویر */}
          <div className="w-full md:w-1/2">
            <div className="sticky top-24">
              <div className="relative aspect-square w-full rounded-3xl bg-zinc-50 overflow-hidden border border-zinc-100">
                <Image 
                  src={currentImage} 
                  alt={product.title} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw" 
                  className="object-contain p-8 transition-opacity duration-300" 
                  priority 
                />
              </div>
            </div>
          </div>

          {/* اطلاعات محصول */}
          <div className="w-full md:w-1/2 flex flex-col justify-start">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-800 text-xs font-bold uppercase tracking-widest rounded-md" dir="ltr">
                {product.brand?.name}
              </span>
              <span className="text-sm font-medium text-zinc-400">/ {product.category?.name}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 leading-tight">{product.title}</h1>
            <p className="text-base text-zinc-500 mb-8 leading-relaxed">{product.description}</p>

            {/* بخش قیمت */}
            <div className="mb-8">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-emerald-600">
                  {new Intl.NumberFormat("fa-IR").format(displayPrice)} <span className="text-lg font-medium">تومان</span>
                </span>
                {hasDiscount && selectedVariant && (
                  <span className="text-lg font-medium text-zinc-400 line-through mb-1">
                    {new Intl.NumberFormat("fa-IR").format(selectedVariant.price)}
                  </span>
                )}
              </div>
            </div>

            {/* رندر شرطی بر اساس نوع محصول */}
            {(productType === "SUNGLASSES" || productType === "EYEGLASSES") && product.variants && (
              <div className="mb-8 border-t border-zinc-100 pt-8">
                <h3 className="text-sm font-bold text-zinc-900 mb-4 tracking-wider flex items-center gap-2">
                  رنگ فریم: <span className="text-zinc-500 font-medium">{selectedVariant?.attributes?.color_name || selectedVariant?.color_name}</span>
                </h3>
                <div className="flex flex-wrap gap-4">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedVariant?.id === variant.id ? "border-zinc-900 scale-110" : "border-transparent hover:border-zinc-300"
                      }`}
                    >
                      <span 
                        className="w-10 h-10 rounded-full border border-zinc-200 shadow-inner"
                        style={{ backgroundColor: variant.attributes?.color_code || variant.color_code || "#000000" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {productType === "EYEGLASSES" && (
              <div className="mb-8 bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                <h3 className="text-lg font-black text-zinc-800 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" /> ثبت نمره چشم (اختیاری)
                </h3>
                
                <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs font-bold text-zinc-500">
                  <div className="text-right">چشم</div>
                  <div>SPH (ضعیفی)</div>
                  <div>CYL (آستیگمات)</div>
                  <div>AXIS (محور)</div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="flex items-center font-bold text-sm text-zinc-700">راست (OD)</div>
                  <Input dir="ltr" placeholder="-1.50" value={prescription.rightEye.sph} onChange={e => setPrescription({...prescription, rightEye: {...prescription.rightEye, sph: e.target.value}})} className="bg-white text-center" />
                  <Input dir="ltr" placeholder="-0.50" value={prescription.rightEye.cyl} onChange={e => setPrescription({...prescription, rightEye: {...prescription.rightEye, cyl: e.target.value}})} className="bg-white text-center" />
                  <Input dir="ltr" placeholder="180" value={prescription.rightEye.axis} onChange={e => setPrescription({...prescription, rightEye: {...prescription.rightEye, axis: e.target.value}})} className="bg-white text-center" />
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="flex items-center font-bold text-sm text-zinc-700">چپ (OS)</div>
                  <Input dir="ltr" placeholder="-1.25" value={prescription.leftEye.sph} onChange={e => setPrescription({...prescription, leftEye: {...prescription.leftEye, sph: e.target.value}})} className="bg-white text-center" />
                  <Input dir="ltr" placeholder="-0.75" value={prescription.leftEye.cyl} onChange={e => setPrescription({...prescription, leftEye: {...prescription.leftEye, cyl: e.target.value}})} className="bg-white text-center" />
                  <Input dir="ltr" placeholder="175" value={prescription.leftEye.axis} onChange={e => setPrescription({...prescription, leftEye: {...prescription.leftEye, axis: e.target.value}})} className="bg-white text-center" />
                </div>

                <div className="flex items-center justify-between border-t border-zinc-200 pt-4 mt-2">
                  <label className="text-sm font-bold text-zinc-700">فاصله مردمک‌ها (PD)</label>
                  <Input dir="ltr" placeholder="62" value={prescription.pd} onChange={e => setPrescription({...prescription, pd: e.target.value})} className="bg-white w-24 text-center" />
                </div>
              </div>
            )}

            {(productType === "CONTACT_LENSES" || productType === "LENSES") && product.variants && (
              <div className="mb-8 border-t border-zinc-100 pt-8">
                <h3 className="text-lg font-black text-zinc-800 mb-4 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-500" /> انتخاب نمره لنز
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.variants.map((variant) => {
                    const sph = variant.attributes?.sph || "0.00"
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedVariant?.id === variant.id 
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" 
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        <div dir="ltr">SPH: {sph}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* دکمه افزودن به سبد */}
            <div className="mt-8">
              <Button 
                onClick={handleAddToCart}
                size="lg" 
                className="w-full h-16 text-xl font-black bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl shadow-xl shadow-zinc-200/50 transition-all hover:-translate-y-1"
                disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
              >
                {!selectedVariant 
                  ? "یک گزینه را انتخاب کنید" 
                  : selectedVariant.stock_quantity === 0 
                  ? "ناموجود در انبار" 
                  : "افزودن به سبد خرید"}
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 pt-8 border-t border-zinc-100">
              <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                <ShieldCheck className="w-6 h-6 text-emerald-500" /> تضمین اصالت کالا
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                <Truck className="w-6 h-6 text-emerald-500" /> ارسال سریع
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}