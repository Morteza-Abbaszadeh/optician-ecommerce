"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { ArrowRight, Edit, Loader2, Plus, Trash2, Image as ImageIcon, Palette } from "lucide-react"
import Link from "next/link"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const [basicInfo, setBasicInfo] = useState({
    title: "", slug: "", description: "", gender: "یونیسکس",
    frame_shape: "ویفرر", frame_type: "تمام فریم", category_id: "", brand_id: "", is_prescription_ready: false,
  })

  const [variants, setVariants] = useState<any[]>([])

  // دریافت اطلاعات محصول و منوها
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, brandsRes, productRes] = await Promise.all([
          apiClient.get("/products/categories/"),
          apiClient.get("/products/brands/"),
          apiClient.get(`/products/admin/${productId}`)
        ])
        
        setCategories(catsRes.data)
        setBrands(brandsRes.data)
        
        const p = productRes.data
        setBasicInfo({
          title: p.title, slug: p.slug, description: p.description || "",
          gender: p.gender, frame_shape: p.frame_shape, frame_type: p.frame_type,
          category_id: p.category.id, brand_id: p.brand.id, is_prescription_ready: p.is_prescription_ready,
        })

        // چیدن تنوع‌ها و عکس‌ها در استیت
        if (p.variants && p.variants.length > 0) {
          setVariants(p.variants.map((v: any) => ({
            color_name: v.color_name, color_code: v.color_code || "#000000",
            size: v.size, price: v.price, stock_quantity: v.stock_quantity,
            images: v.images.length > 0 ? v.images : [{ image_url: "", is_primary: true }]
          })))
        }
      } catch (err) {
        console.error(err)
        setError("خطا در دریافت اطلاعات محصول.")
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [productId])

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setBasicInfo(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  // توابع مدیریت داینامیک
  const addVariant = () => setVariants([...variants, { color_name: "", color_code: "#000000", size: "", price: "", stock_quantity: "", images: [{ image_url: "", is_primary: true }] }])
  const removeVariant = (index: number) => { if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index)) }
  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }
  const addImageToVariant = (vIndex: number) => {
    const newVariants = [...variants]
    newVariants[vIndex].images.push({ image_url: "", is_primary: false })
    setVariants(newVariants)
  }
  const removeImageFromVariant = (vIndex: number, iIndex: number) => {
    const newVariants = [...variants]
    if (newVariants[vIndex].images.length > 1) {
      newVariants[vIndex].images.splice(iIndex, 1)
      setVariants(newVariants)
    }
  }
  const handleImageChange = (vIndex: number, iIndex: number, value: string) => {
    const newVariants = [...variants]
    newVariants[vIndex].images[iIndex].image_url = value
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const payload = {
      ...basicInfo,
      slug: basicInfo.slug.toLowerCase().replace(/\s+/g, '-'),
      variants: variants.map(v => ({
        ...v, price: Number(v.price), stock_quantity: Number(v.stock_quantity),
        images: v.images.filter((img: any) => img.image_url.trim() !== "")
      }))
    }

    try {
      await apiClient.put(`/products/admin/${productId}`, payload)
      alert("محصول با موفقیت ویرایش شد! ✨")
      router.push("/admin/products")
    } catch (err: any) {
      setError(err.response?.data?.detail || "خطایی رخ داد.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) return <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-20">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <Edit className="w-8 h-8 text-blue-500" />
            ویرایش محصول
          </h1>
        </div>
        <Link href="/admin/products">
          <Button variant="outline" className="gap-2">بازگشت <ArrowRight className="w-4 h-4" /></Button>
        </Link>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* اطلاعات پایه */}
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-800 border-b pb-2">اطلاعات اصلی عینک</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">نام کامل محصول *</label>
              <input required name="title" value={basicInfo.title} onChange={handleBasicChange} className="w-full p-3 border rounded-xl bg-zinc-50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">لینک لاتین (Slug) *</label>
              <input required name="slug" value={basicInfo.slug} onChange={handleBasicChange} className="w-full p-3 border rounded-xl bg-zinc-50" dir="ltr" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">دسته‌بندی *</label>
              <select required name="category_id" value={basicInfo.category_id} onChange={handleBasicChange} className="w-full p-3 border rounded-xl bg-zinc-50">
                <option value="" disabled>انتخاب کنید...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">برند *</label>
              <select required name="brand_id" value={basicInfo.brand_id} onChange={handleBasicChange} className="w-full p-3 border rounded-xl bg-zinc-50">
                <option value="" disabled>انتخاب کنید...</option>
                {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700">توضیحات</label>
              <textarea name="description" value={basicInfo.description} onChange={handleBasicChange} className="w-full p-3 border rounded-xl bg-zinc-50 min-h-[100px]"></textarea>
            </div>
          </div>
        </div>

        {/* بخش رنگ‌بندی و عکس‌ها */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
              <Palette className="w-6 h-6 text-blue-500" />
              تنوع‌های محصول (رنگ و سایز)
            </h2>
            <Button type="button" onClick={addVariant} className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold gap-2">
              <Plus className="w-4 h-4" /> افزودن رنگ جدید
            </Button>
          </div>

          {variants.map((variant, vIndex) => (
            <div key={vIndex} className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm space-y-6 relative">
              {variants.length > 1 && (
                <button type="button" onClick={() => removeVariant(vIndex)} className="absolute top-4 left-4 text-red-400 hover:text-red-600">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">نام رنگ *</label>
                  <input required value={variant.color_name} onChange={(e) => handleVariantChange(vIndex, 'color_name', e.target.value)} className="w-full p-3 border rounded-xl bg-zinc-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">کد رنگ *</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={variant.color_code} onChange={(e) => handleVariantChange(vIndex, 'color_code', e.target.value)} className="h-12 w-12 rounded cursor-pointer shrink-0" />
                    <input type="text" value={variant.color_code} onChange={(e) => handleVariantChange(vIndex, 'color_code', e.target.value)} className="w-full p-3 border rounded-xl bg-zinc-50 uppercase" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">سایز *</label>
                  <input required value={variant.size} onChange={(e) => handleVariantChange(vIndex, 'size', e.target.value)} className="w-full p-3 border rounded-xl bg-zinc-50" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">موجودی *</label>
                  <input required type="number" value={variant.stock_quantity} onChange={(e) => handleVariantChange(vIndex, 'stock_quantity', e.target.value)} className="w-full p-3 border rounded-xl bg-zinc-50" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">قیمت (تومان) *</label>
                  <input required type="number" value={variant.price} onChange={(e) => handleVariantChange(vIndex, 'price', e.target.value)} className="w-full p-3 border rounded-xl bg-zinc-50" dir="ltr" />
                </div>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-zinc-500" /> تصاویرِ رنگ {variant.color_name}
                  </label>
                  <Button type="button" onClick={() => addImageToVariant(vIndex)} variant="outline" size="sm" className="gap-2 text-xs bg-white">
                    <Plus className="w-3 h-3" /> افزودن عکس دیگر
                  </Button>
                </div>
                
                {variant.images.map((img: any, iIndex: number) => (
                  <div key={iIndex} className="flex gap-3">
                    <input 
                      required 
                      value={img.image_url} 
                      onChange={(e) => handleImageChange(vIndex, iIndex, e.target.value)} 
                      className="flex-1 p-3 border rounded-xl bg-white" 
                      dir="ltr" 
                    />
                    {variant.images.length > 1 && (
                      <button type="button" onClick={() => removeImageFromVariant(vIndex, iIndex)} className="p-3 text-red-400 hover:text-red-600 bg-white border rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-16 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "ذخیره تغییرات محصول"}
        </Button>

      </form>
    </div>
  )
}