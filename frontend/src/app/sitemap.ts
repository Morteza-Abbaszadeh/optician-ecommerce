import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // آدرس پایه سایت شما (در سرور اصلی باید مقدار NEXT_PUBLIC_SITE_URL را در env. قرار دهید)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // ۱. مسیرهای استاتیک و اصلی سایت
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // بالاترین اولویت برای صفحه اصلی
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // می‌توانید صفحات دیگری مثل درباره ما را هم اضافه کنید
  ]

  try {
    // ۲. دریافت داینامیک لیست محصولات از بک‌اند FastAPI
    const backendUrl = process.env.INTERNAL_API_URL || "http://backend:8000/api/v1"
    
    // ما اینجا از fetch خود Next.js استفاده می‌کنیم تا بتوانیم کش هوشمند را فعال کنیم
    // با revalidate: 3600، نکس‌جی‌اس نقشه سایت را ۱ ساعت کش می‌کند تا به دیتابیس فشار نیاید
    const res = await fetch(`${backendUrl}/products?limit=1000`, {
      next: { revalidate: 3600 } 
    })

    if (!res.ok) {
      throw new Error("دریافت محصولات برای نقشه سایت با خطا مواجه شد")
    }

    const data = await res.json()
    // بررسی ساختار پاسخ بک‌اند (اگر محصولات در یک آرایه هستند یا داخل کلید خاصی مثل items/data)
    const products = Array.isArray(data) ? data : (data.items || data.data || [])

    // ۳. تبدیل دیتای محصولات به فرمت استاندارد نقشه سایت
    const dynamicRoutes: MetadataRoute.Sitemap = products.map((product: any) => ({
      url: `${baseUrl}/product/${product.slug}`,
      // اگر محصول فیلد آپدیت (updated_at) دارد آن را پاس بدهید، در غیر اینصورت تاریخ روز
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    // ترکیب صفحات اصلی و صفحات محصولات
    return [...staticRoutes, ...dynamicRoutes]

  } catch (error) {
    console.error("خطا در تولید نقشه سایت:", error)
    // اگر بک‌اند به هر دلیلی در دسترس نبود، حداقل صفحات اصلی به گوگل داده شود
    return staticRoutes
  }
}