import { Metadata } from "next"
import { notFound } from "next/navigation"
import { productService } from "@/services/productService"
import ProductClient from "./ProductClient"

// در Next.js 15 پارامترها به صورت Promise پاس داده می‌شوند
interface Props {
  params: Promise<{ slug: string }>
}

// ۱. تولید متادیتا داینامیک برای سئو گوگل و شبکه‌های اجتماعی
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const product = await productService.getProductBySlug(slug)
    if (!product) return { title: "محصول یافت نشد | فروشگاه عینک" }

    const title = `${product.title} | خرید آنلاین`
    const description = product.description?.substring(0, 160) || `خرید اینترنتی ${product.title} با بهترین کیفیت.`
    // تلاش برای گرفتن اولین عکس از اولین واریانت
    const imageUrl = product.variants?.[0]?.images?.[0]?.image_url || "/images/default-glasses.jpg"

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: [{ url: imageUrl, alt: product.title }],
      },
    }
  } catch {
    return { title: "مشخصات محصول | فروشگاه عینک" }
  }
}

// ۲. کامپوننت سروری اصلی برای رندر اولیه و اسکیما داتا
export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  
  let product;
  try {
    product = await productService.getProductBySlug(slug)
  } catch (error) {
    return notFound()
  }

  if (!product) return notFound()

  const displayPrice = product.variants?.[0]?.discount_price || product.variants?.[0]?.price || 0;

  // ۳. ساخت اسکیما استاندارد برای Rich Snippet گوگل
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand?.name || "نامشخص"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "IRR", // واحد پول دیتابیس
      "price": displayPrice,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.variants?.[0]?.stock_quantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* پاس دادن محصول آماده به ظاهر سایت - بدون نیاز به لودینگ اضافه */}
      <ProductClient initialProduct={product} />
    </>
  )
}