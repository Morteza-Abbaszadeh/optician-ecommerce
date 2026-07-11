import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return {
    rules: {
      userAgent: '*', // اعمال قوانین برای همه موتورهای جستجو (گوگل، بینگ و...)
      allow: '/',
      // جلوگیری از خزش ربات‌ها در صفحات خصوصی و سبد خرید
      disallow: [
        '/admin/', 
        '/profile/', 
        '/cart/', 
        '/checkout/'
      ],
    },
    // معرفی مسیر داینامیک نقشه سایت که در قدم قبل ساختیم
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}