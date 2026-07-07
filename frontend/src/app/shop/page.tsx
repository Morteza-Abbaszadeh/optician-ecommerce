"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Loader2, SlidersHorizontal } from "lucide-react"

// کامپوننت اصلی فروشگاه که از هوک‌های مسیر استفاده می‌کند
function ShopPageContent() {
  const searchParams = useSearchParams()
  // گرفتن پارامتر جنسیت از لینک (مثلاً اگر از صفحه اصلی آمده باشد)
  const initialGender = searchParams.get("gender") || "all"

  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState(initialGender)

  useEffect(() => {
    // دریافت تمام محصولات از بک‌اند
    apiClient.get("/products")
      .then(res => {
        setProducts(res.data)
      })
      .catch(err => console.error("خطا در دریافت محصولات:", err))
      .finally(() => setIsLoading(false))
  }, [])

  // هر زمان که محصولات لود شدند یا فیلترها تغییر کردند، لیست آپدیت می‌شود
  useEffect(() => {
    let result = products

    // فیلتر جستجوی متنی
    if (searchTerm) {
      result = result.filter(p => p.title.includes(searchTerm))
    }

    // فیلتر جنسیت (چون ممکن است فیلد مجزا در دیتابیس نداشته باشیم، از روی اسم یا دسته‌بندی فیلتر می‌کنیم)
    if (genderFilter === "women") {
      result = result.filter(p => p.title.includes("زنان") || p.title.includes("دختران"))
    } else if (genderFilter === "men") {
      result = result.filter(p => p.title.includes("مردان") || p.title.includes("پسران"))
    }

    setFilteredProducts(result)
  }, [products, searchTerm, genderFilter])

  // توابع کمکی برای استخراج امن قیمت و عکس
  const getPrice = (product: any) => {
    if (product.variants && product.variants.length > 0) return product.variants[0].price || 0
    return 0
  }


  const getImage = (product: any) => {
    try {
      if (
        product?.variants?.length > 0 && 
        product.variants[0].images?.length > 0 &&
        product.variants[0].images[0].image_url
      ) {
        const imageUrl = product.variants[0].images[0].image_url;
        if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          return imageUrl;
        }
      }
      return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";
    } catch (error) {
      return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-20" dir="rtl">
      
      {/* هدر ساده صفحه فروشگاه */}
      <div className="bg-white border-b border-zinc-200 py-12 px-4">
        <div className="max-w-[1400px] mx-auto text-center">
          <h1 className="text-4xl font-black text-zinc-900 mb-4">ویترین فروشگاه</h1>
          <p className="text-zinc-500 max-w-lg mx-auto">
            جدیدترین کالکشن عینک‌های آفتابی و طبی با طراحی‌های مدرن و کیفیت بی‌نظیر.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* سایدبار فیلترها */}
        <aside className="w-full lg:w-1/4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-black flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
              <SlidersHorizontal className="w-5 h-5 text-zinc-400" /> فیلتر محصولات
            </h2>

            {/* جستجو */}
            <div className="mb-6 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input 
                placeholder="جستجوی مدل..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-10 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-zinc-900 h-12 text-sm"
              />
            </div>

            {/* دسته‌بندی جنسیت */}
            <div className="space-y-3">
              <h3 className="font-bold text-zinc-700 mb-3">کالکشن</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setGenderFilter("all")}
                  className={`text-right px-4 py-3 rounded-xl text-sm font-bold transition-colors ${genderFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  همه محصولات
                </button>
                <button 
                  onClick={() => setGenderFilter("women")}
                  className={`text-right px-4 py-3 rounded-xl text-sm font-bold transition-colors ${genderFilter === 'women' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  کالکشن زنانه
                </button>
                <button 
                  onClick={() => setGenderFilter("men")}
                  className={`text-right px-4 py-3 rounded-xl text-sm font-bold transition-colors ${genderFilter === 'men' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  کالکشن مردانه
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* گرید محصولات */}
        <div className="w-full lg:w-3/4">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-100 p-12 text-center h-[400px] flex flex-col items-center justify-center">
              <Filter className="w-12 h-12 text-zinc-300 mb-4" />
              <h3 className="text-xl font-bold text-zinc-700 mb-2">محصولی یافت نشد!</h3>
              <p className="text-zinc-500">با این فیلترها محصولی برای نمایش وجود ندارد.</p>
              <Button onClick={() => {setGenderFilter("all"); setSearchTerm("");}} variant="outline" className="mt-6 rounded-xl">
                پاک کردن فیلترها
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center text-sm text-zinc-500 font-bold">
                <span>نمایش {filteredProducts.length} محصول</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Link href={`/product/${product.slug}`} key={product.slug} className="group">
                    <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-zinc-200 h-full flex flex-col">
                      <div className="relative h-64 w-full mb-6 bg-zinc-50 rounded-2xl overflow-hidden shrink-0">
                        <Image 
                          src={getImage(product)} 
                          alt={product.title} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      </div>
                      <h4 className="font-black text-lg text-zinc-800 line-clamp-2 mb-2">{product.title}</h4>
                      {product.category && <p className="text-xs text-zinc-400 font-bold mb-4">{product.category.name}</p>}
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-50">
                        <p className="text-zinc-900 font-black text-lg">
                          {new Intl.NumberFormat("fa-IR").format(getPrice(product))} <span className="text-xs text-zinc-400 font-normal">تومان</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

// در Next.js وقتی از useSearchParams استفاده می‌کنیم، کل کامپوننت باید داخل Suspense رندر شود
export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-10 h-10 animate-spin text-zinc-900" /></div>}>
      <ShopPageContent />
    </Suspense>
  )
}