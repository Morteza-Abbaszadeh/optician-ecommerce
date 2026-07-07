"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PackagePlus, Loader2, Plus, Trash2, Image as ImageIcon, Droplet, Cog, Glasses, Upload } from "lucide-react"
import Link from "next/link"

// ==========================================
// 1. Zod Schema
// ==========================================
const productSchema = z.object({
  title: z.string().min(2, "نام کالا الزامی است"),
  slug: z.string().min(2, "لینک لاتین الزامی است"),
  description: z.string().optional(),
  category_id: z.string().min(1, "انتخاب دسته الزامی است"),
  brand_id: z.string().min(1, "انتخاب برند الزامی است"),
  product_type: z.string(),
  is_prescription_ready: z.boolean().default(false),
  specifications: z.array(z.object({
    key: z.string(),
    value: z.string()
  })),
  variants: z.array(z.object({
    price: z.coerce.number().min(1000, "قیمت نامعتبر است"),
    discount_price: z.coerce.number().optional().nullable(),
    stock_quantity: z.coerce.number().min(0, "موجودی نمیتواند منفی باشد"),
    attributes: z.object({
      color_name: z.string().optional(),
      color_code: z.string().optional(),
      size: z.string().optional(),
      sph: z.string().optional(),
      cyl: z.string().optional(),
      axis: z.string().optional(),
    }),
    images: z.array(z.object({
      image_url: z.string().min(1, "لینک عکس الزامی است"),
      is_primary: z.boolean().default(false)
    })).min(1, "حداقل یک عکس لازم است")
  })).min(1, "حداقل یک تنوع لازم است")
})

type ProductFormValues = z.infer<typeof productSchema>

export default function AddProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  // استیت‌های ساخت سریع
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")

  // ==========================================
  // 2. Setup React Hook Form
  // ==========================================
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "", slug: "", description: "", category_id: "", brand_id: "",
      product_type: "SUNGLASSES", is_prescription_ready: false,
      specifications: [
        { key: "جنسیت", value: "یونیسکس" },
        { key: "فرم فریم", value: "ویفرر" },
      ],
      variants: [{
        price: 0, stock_quantity: 0,
        attributes: { color_name: "", color_code: "#000000", size: "", sph: "", cyl: "", axis: "" },
        images: [{ image_url: "", is_primary: true }]
      }]
    }
  })

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ control, name: "specifications" })
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: "variants" })

  const watchedProductType = watch("product_type")

  // ==========================================
  // 3. Effects & API Calls
  // ==========================================
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          apiClient.get("/products/categories/"),
          apiClient.get("/products/brands/")
        ])
        setCategories(catsRes.data)
        setBrands(brandsRes.data)
        if (catsRes.data.length > 0) setValue("category_id", catsRes.data[0].id)
        if (brandsRes.data.length > 0) setValue("brand_id", brandsRes.data[0].id)
      } catch (err) {
        console.error("خطا در دریافت لیست دسته‌ها و برندها", err)
      }
    }
    fetchDependencies()
  }, [setValue])

  // تغییر خودکار فیلدهای Specifications بر اساس نوع محصول
  useEffect(() => {
    if (watchedProductType === "LENSES" || watchedProductType === "CONTACT_LENSES") {
      setValue("specifications", [
        { key: "ضریب شکست (Index)", value: "1.50" },
        { key: "پوشش (Coating)", value: "ضد انعکاس" }
      ])
    } else {
      setValue("specifications", [
        { key: "جنسیت", value: "یونیسکس" },
        { key: "فرم فریم", value: "" }
      ])
    }
  }, [watchedProductType, setValue])

  // ==========================================
  // 4. Custom Handlers (Upload, Add Brand/Cat)
  // ==========================================
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-')
    try {
      const res = await apiClient.post("/products/categories/admin/", { name: newCategoryName, slug })
      setCategories([...categories, res.data])
      setValue("category_id", res.data.id)
      setNewCategoryName("")
      setIsAddingCategory(false)
    } catch (err) {
      alert("خطا در ساخت دسته‌بندی.")
    }
  }

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return
    const slug = newBrandName.trim().toLowerCase().replace(/\s+/g, '-')
    try {
      const res = await apiClient.post("/products/brands/admin/", { name: newBrandName, slug })
      setBrands([...brands, res.data])
      setValue("brand_id", res.data.id)
      setNewBrandName("")
      setIsAddingBrand(false)
    } catch (err) {
      alert("خطا در ساخت برند.")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, vIndex: number, iIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)

    try {
      setValue(`variants.${vIndex}.images.${iIndex}.image_url`, "در حال آپلود...")
      const res = await apiClient.post("/products/admin/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setValue(`variants.${vIndex}.images.${iIndex}.image_url`, res.data.image_url)
    } catch (err) {
      alert("خطا در آپلود تصویر.")
      setValue(`variants.${vIndex}.images.${iIndex}.image_url`, "")
    }
  }

  // ==========================================
  // 5. Final Submit
  // ==========================================
  const onSubmit = async (data: ProductFormValues) => {
    setIsLoading(true)
    setError("")

    // تبدیل Specifications آرایه‌ای به آبجکت برای بک‌اند
    const cleanSpecifications: Record<string, string> = {}
    data.specifications.forEach(spec => {
      if (spec.key.trim() && spec.value.trim()) cleanSpecifications[spec.key.trim()] = spec.value.trim()
    })

    const payload = {
      ...data,
      slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
      specifications: cleanSpecifications,
    }

    try {
      await apiClient.post("/products/admin/", payload)
      alert("محصول با موفقیت ثبت شد! 🎉")
      router.push("/admin")
    } catch (err: any) {
      setError(err.response?.data?.detail || "خطایی رخ داد.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20 font-sans" dir="rtl">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
          <PackagePlus className="w-8 h-8 text-emerald-500" /> افزودن محصول هوشمند
        </h1>
        <Link href="/admin"><Button variant="outline" className="rounded-xl">بازگشت</Button></Link>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* === باکس 1: اطلاعات پایه === */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-800 border-b border-zinc-100 pb-4 flex items-center gap-2">
            <Glasses className="w-5 h-5 text-zinc-400"/> اطلاعات اصلی کالا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">نام کامل کالا *</label>
              <Input {...register("title")} className="bg-zinc-50 border-zinc-200 h-12" />
              {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">لینک لاتین (Slug) *</label>
              <Input {...register("slug")} className="bg-zinc-50 border-zinc-200 h-12 text-left" dir="ltr" />
              {errors.slug && <span className="text-red-500 text-xs">{errors.slug.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">نوع محصول *</label>
              <select {...register("product_type")} className="w-full p-3 h-12 border rounded-xl bg-zinc-50 border-zinc-200 outline-none">
                <option value="SUNGLASSES">عینک آفتابی</option>
                <option value="EYEGLASSES">عینک طبی</option>
                <option value="CONTACT_LENSES">لنز تماسی</option>
                <option value="LENSES">عدسی عینک</option>
                <option value="ACCESSORIES">لوازم جانبی</option>
              </select>
            </div>
            
            {/* دسته‌بندی */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">دسته‌بندی *</label>
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="h-12 bg-emerald-50" />
                  <Button type="button" onClick={handleCreateCategory} className="h-12 bg-emerald-600 rounded-xl px-4">ثبت</Button>
                  <Button type="button" onClick={() => setIsAddingCategory(false)} variant="outline" className="h-12 rounded-xl">لغو</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select {...register("category_id")} className="w-full p-3 h-12 border rounded-xl bg-zinc-50 border-zinc-200 outline-none">
                    <option value="" disabled>انتخاب کنید...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <Button type="button" onClick={() => setIsAddingCategory(true)} className="h-12 bg-zinc-900 px-4 rounded-xl"><Plus className="w-5 h-5"/></Button>
                </div>
              )}
            </div>

            {/* برند */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">برند *</label>
              {isAddingBrand ? (
                <div className="flex gap-2">
                  <Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} className="h-12 bg-blue-50" />
                  <Button type="button" onClick={handleCreateBrand} className="h-12 bg-blue-600 rounded-xl px-4">ثبت</Button>
                  <Button type="button" onClick={() => setIsAddingBrand(false)} variant="outline" className="h-12 rounded-xl">لغو</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select {...register("brand_id")} className="w-full p-3 h-12 border rounded-xl bg-zinc-50 border-zinc-200 outline-none">
                    <option value="" disabled>انتخاب کنید...</option>
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                  <Button type="button" onClick={() => setIsAddingBrand(true)} className="h-12 bg-zinc-900 px-4 rounded-xl"><Plus className="w-5 h-5"/></Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-bold text-zinc-700">توضیحات</label>
              <textarea {...register("description")} className="w-full p-4 border rounded-2xl bg-zinc-50 outline-none min-h-[120px]"></textarea>
            </div>
          </div>
        </div>

        {/* === باکس 2: مشخصات تکمیلی === */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
             <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
               <Cog className="w-5 h-5 text-zinc-400"/> مشخصات تکمیلی
             </h2>
             <Button type="button" onClick={() => appendSpec({ key: "", value: "" })} variant="outline" className="rounded-xl">
               <Plus className="w-4 h-4 mr-2" /> افزودن
             </Button>
          </div>
          <div className="space-y-4">
            {specFields.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start">
                <Input {...register(`specifications.${index}.key`)} placeholder="عنوان" className="bg-zinc-50" />
                <Input {...register(`specifications.${index}.value`)} placeholder="مقدار" className="bg-zinc-50" />
                <button type="button" onClick={() => removeSpec(index)} className="p-2 text-zinc-400 hover:text-red-500 border rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* === باکس 3: تنوع‌ها و عکس‌ها === */}
        <div className="space-y-6">
          <div className="flex justify-between">
            <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2"><Droplet className="w-6 h-6 text-blue-500" /> تنوع‌ها و تصاویر</h2>
            <Button type="button" onClick={() => appendVariant({ price: 0, stock_quantity: 0, attributes: {}, images: [{ image_url: "", is_primary: true }] })} className="bg-zinc-900 text-white rounded-xl"><Plus className="w-5 h-5 ml-2" /> تنوع جدید</Button>
          </div>

          {variantFields.map((variant, vIndex) => (
            <div key={variant.id} className="bg-white p-6 rounded-3xl border-2 border-zinc-100 shadow-sm space-y-6 relative">
              {variantFields.length > 1 && (
                <button type="button" onClick={() => removeVariant(vIndex)} className="absolute top-6 left-6 text-red-400 bg-red-50 p-2 rounded-xl"><Trash2 className="w-5 h-5" /></button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-6">
                <div>
                  <label className="text-sm font-bold text-emerald-600">قیمت (تومان)</label>
                  <Input type="number" {...register(`variants.${vIndex}.price`)} className="bg-emerald-50/50" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-bold text-blue-600">موجودی انبار</label>
                  <Input type="number" {...register(`variants.${vIndex}.stock_quantity`)} className="bg-blue-50/50" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(watchedProductType === "SUNGLASSES" || watchedProductType === "EYEGLASSES") && (
                  <>
                    <Input {...register(`variants.${vIndex}.attributes.color_name`)} placeholder="نام رنگ" />
                    <Input {...register(`variants.${vIndex}.attributes.color_code`)} placeholder="کد رنگ (#000000)" dir="ltr" />
                    <Input {...register(`variants.${vIndex}.attributes.size`)} placeholder="سایز (50-20)" dir="ltr" />
                  </>
                )}
              </div>

              {/* کامپوننت داخلی مدیریت تصاویر با حفظ قابلیت آپلود شما */}
              <ImagesManager control={control} register={register} vIndex={vIndex} handleFileUpload={handleFileUpload} />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-16 text-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl">
          {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : "ثبت نهایی محصول در انبار"}
        </Button>
      </form>
    </div>
  )
}

function ImagesManager({ control, register, vIndex, handleFileUpload }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `variants.${vIndex}.images` })

  return (
    <div className="bg-zinc-50 p-6 rounded-2xl border space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <label className="font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5" /> تصاویر این تنوع</label>
        <Button type="button" onClick={() => append({ image_url: "", is_primary: false })} variant="outline" size="sm" className="rounded-xl"><Plus className="w-4 h-4" /> افزودن عکس</Button>
      </div>
      {fields.map((img, iIndex) => (
        <div key={img.id} className="flex flex-col sm:flex-row gap-3">
          <Input {...register(`variants.${vIndex}.images.${iIndex}.image_url`)} className="h-12 bg-white flex-1" placeholder="لینک عکس..." dir="ltr" />
          
          <div className="relative shrink-0 w-full sm:w-auto">
            <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, vIndex, iIndex)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <Button type="button" variant="secondary" className="h-12 px-6 rounded-xl border pointer-events-none"><Upload className="w-5 h-5 ml-2" /> آپلود سیستم</Button>
          </div>

          {fields.length > 1 && (
            <button type="button" onClick={() => remove(iIndex)} className="p-3 text-red-400 bg-white border rounded-xl"><Trash2 className="w-5 h-5" /></button>
          )}
        </div>
      ))}
    </div>
  )
}