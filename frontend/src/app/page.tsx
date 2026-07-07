"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Camera, ChevronLeft } from "lucide-react"
import { homeService } from "@/services/homeService"
import { apiClient } from "@/services/apiClient"


// دیتای پیش‌فرض در صورتی که دیتابیس هنوز خالی باشد
const defaultSections = [
  { id: 1, section_type: "HERO", title: "بنر اصلی" },
  { id: 2, section_type: "PRODUCT_GRID", title: "مد روز" },
  { id: 3, section_type: "BRAND_COLLECTION", title: "کالکشن ری‌بن" },
  { id: 4, section_type: "SOCIAL_LOCATION", title: "گالری و شبکه اجتماعی" }
]

export default function HomePage() {
  const [sections, setSections] = useState<any[]>([])

  useEffect(() => {
    // گرفتن دیتا از بک‌اند
    homeService.getHomeLayout().then(data => {
      // اگر دیتابیس خالی بود، دیتای پیش‌فرض را نشان بده تا صفحه خالی نماند
      if (!data || data.length === 0) {
        setSections(defaultSections)
      } else {
        setSections(data)
      }
    }).catch(() => {
      // در صورت خطای شبکه هم دیتای پیش‌فرض لود شود
      setSections(defaultSections)
    })
  }, [])

  return (
    <main className="min-h-screen bg-zinc-50 font-sans pb-20" dir="rtl">
      {sections.map((section) => {
        switch (section.section_type) {
          case "HERO":
            return <HeroSection key={section.id} data={section} />
          case "PRODUCT_GRID":
            return <ProductGrid key={section.id} data={section} />
          case "BRAND_COLLECTION":
            return <BrandCollection key={section.id} data={section} />
          case "SOCIAL_LOCATION":
            return <SocialLocationSection key={section.id} data={section} />
          default:
            return null
        }
      })}
    </main>
  )
}

// ==========================================
// کامپوننت‌های زیرمجموعه صفحه اصلی
// ==========================================
function HeroSection({ data }: { data: any }) {
  return (
    <section className="w-full max-w-[1400px] mx-auto p-4 animate-in fade-in duration-700">
      {/* یک گرید دو ستونه تمیز فقط برای تصاویر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] md:h-[550px]">
        
        {/* کالکشن زنانه */}
        <Link href="/shop?gender=women" className="relative rounded-3xl overflow-hidden group cursor-pointer h-full block">
          <Image 
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop" 
            alt="کالکشن زنانه" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-8 right-8 text-white">
            <h3 className="text-3xl font-black mb-3">کالکشن زنانه</h3>
            <span className="text-sm font-bold bg-white text-zinc-900 inline-flex items-center gap-2 px-5 py-3 rounded-xl transition-transform hover:-translate-x-2">
              مشاهده محصولات <ChevronLeft className="w-4 h-4"/>
            </span>
          </div>
        </Link>

        {/* کالکشن مردانه */}
        <Link href="/shop?gender=men" className="relative rounded-3xl overflow-hidden group cursor-pointer h-full block">
          <Image 
            src="https://images.unsplash.com/photo-1614715838608-dd527c46231d?q=80&w=1000&auto=format&fit=crop" 
            alt="کالکشن مردانه" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-8 right-8 text-white">
            <h3 className="text-3xl font-black mb-3">کالکشن مردانه</h3>
            <span className="text-sm font-bold bg-white text-zinc-900 inline-flex items-center gap-2 px-5 py-3 rounded-xl transition-transform hover:-translate-x-2">
              مشاهده محصولات <ChevronLeft className="w-4 h-4"/>
            </span>
          </div>
        </Link>

      </div>
    </section>
  )
}

function ProductGrid({ data }: { data: any }) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // دریافت محصولات واقعی از بک‌اند
    apiClient.get("/products")
      .then(res => {
        // دریافت ۴ محصول اول برای نمایش در این بخش
        setProducts(res.data.slice(0, 4))
      })
      .catch(err => console.error("خطا در دریافت محصولات:", err))
      .finally(() => setIsLoading(false))
  }, [])

  // توابع کمکی برای استخراج امن قیمت و عکس از ساختار تودرتوی محصول
  const getPrice = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price || 0
    }
    return 0
  }

const getImage = (product: any) => {
    try {
      if (
        product?.variants?.length > 0 && 
        product.variants[0].images?.length > 0 &&
        product.variants[0].images[0].image_url // اینجا فیلد صحیح (image_url) را بررسی می‌کنیم
      ) {
        const imageUrl = product.variants[0].images[0].image_url;
        // اطمینان نهایی که رشته خالی نیست
        if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          return imageUrl;
        }
      }
      // بازگشت عکس پیش‌فرض مطمئن
      return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";
    } catch (error) {
      return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";
    }
  }


  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-zinc-900 mb-4 relative inline-block">
          {data.title || "مد روز"}
          <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-zinc-900 rounded-full"></span>
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
           <div className="animate-pulse flex space-x-4 space-x-reverse">
             <div className="rounded-2xl bg-zinc-200 h-40 w-40"></div>
             <div className="rounded-2xl bg-zinc-200 h-40 w-40"></div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full space-y-6">
            <h3 className="text-xl font-bold text-zinc-500 border-b border-zinc-200 pb-2">جدیدترین‌های فروشگاه</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link href={`/product/${product.slug}`} key={product.slug} className="group">
                  <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm transition-all hover:shadow-md hover:border-zinc-200 h-full flex flex-col">
                    <div className="relative h-48 w-full mb-4 bg-zinc-50 rounded-xl overflow-hidden shrink-0">
                      <Image src={getImage(product)} alt={product.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h4 className="font-bold text-sm text-zinc-800 line-clamp-2 mb-2 flex-grow">{product.title}</h4>
                    <p className="text-emerald-600 font-black text-sm mt-auto">
                      {new Intl.NumberFormat("fa-IR").format(getPrice(product))} تومان
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function BrandCollection({ data }: { data: any }) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // می‌توانید در آینده اینجا یک پارامتر برای دریافت محصولات یک برند خاص (مثل brand_id) پاس بدهید
    apiClient.get("/products")
      .then(res => {
        // برای تنوع، مثلاً محصولات را برعکس می‌کنیم یا ۵ تای بعدی را می‌گیریم
        setProducts(res.data.reverse().slice(0, 5))
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false))
  }, [])

  const getPrice = (product: any) => {
    if (product.variants && product.variants.length > 0) return product.variants[0].price || 0
    return 0
  }

const getImage = (product: any) => {
    try {
      if (
        product?.variants?.length > 0 && 
        product.variants[0].images?.length > 0 &&
        product.variants[0].images[0].image_url // اینجا فیلد صحیح (image_url) را بررسی می‌کنیم
      ) {
        const imageUrl = product.variants[0].images[0].image_url;
        // اطمینان نهایی که رشته خالی نیست
        if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          return imageUrl;
        }
      }
      // بازگشت عکس پیش‌فرض مطمئن
      return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";
    } catch (error) {
      return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop";
    }
  }
  return (
    <section className="w-full bg-[#B30000] py-16 my-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="text-white">
            <h2 className="text-3xl font-black mb-2">{data.title || "کالکشن اختصاصی"}</h2>
          </div>
          <Button className="bg-white text-[#B30000] hover:bg-zinc-100 rounded-xl font-bold px-6">
            مشاهده همه <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-white text-center py-10 opacity-70">در حال بارگذاری...</div>
        ) : (
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {products.map((product) => (
              <div key={product.slug} className="min-w-[280px] sm:min-w-[320px] bg-white rounded-3xl p-5 snap-start shrink-0 flex flex-col">
                <div className="relative h-48 bg-zinc-50 rounded-2xl mb-4 overflow-hidden shrink-0">
                   <Image src={getImage(product)} alt={product.title} fill className="object-cover" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2 line-clamp-1">{product.title}</h4>
                <div className="flex justify-between items-center border-t border-zinc-100 pt-4 mt-auto">
                  <span className="font-black text-zinc-900">{new Intl.NumberFormat("fa-IR").format(getPrice(product))} تومان</span>
                  <Link href={`/product/${product.slug}`}>
                     <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs font-bold">خرید</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SocialLocationSection({ data }: { data: any }) {
  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-3xl p-1 relative overflow-hidden group cursor-pointer">
          <div className="bg-white w-full h-full rounded-[23px] p-8 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-purple-600 rounded-full flex items-center justify-center mb-6 text-white">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-4">از اینستاگرام‌مون غافل نشید!</h3>
            <p className="text-zinc-500 mb-8 max-w-sm leading-relaxed">
              در صفحه اینستاگرام ما می‌توانید اطلاعات با مزه در مورد عینک‌ها پیدا کنید.
            </p>
            <Button className="bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 px-8">
              صفحه اینستاگرام ما
            </Button>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden h-[400px] group">
          <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" alt="نقشه فروشگاه" fill className="object-cover opacity-80" />
          <div className="absolute inset-0 bg-zinc-900/60 transition-colors group-hover:bg-zinc-900/50"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
            <MapPin className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black mb-2">از گالری عینک ما دیدن فرمایید</h3>
            <div className="flex gap-4 mt-8">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6">مشاهده لوکیشن</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}