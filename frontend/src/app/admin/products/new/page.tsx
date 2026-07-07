"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, PackagePlus, Loader2, Plus, Trash2, Image as ImageIcon, Droplet, Cog, Glasses, Upload } from "lucide-react"
import Link from "next/link"

export default function AddProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  // === استیت‌های ساخت سریع ===
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")

  const [basicInfo, setBasicInfo] = useState({
    title: "", slug: "", description: "", category_id: "", brand_id: "",
    product_type: "SUNGLASSES", is_prescription_ready: false,
  })

  const [specifications, setSpecifications] = useState([
    { key: "جنسیت", value: "یونیسکس" },
    { key: "فرم فریم", value: "ویفرر" },
    { key: "نوع فریم", value: "تمام فریم" },
    { key: "جنس بدنه", value: "کائوچویی" },
    { key: "کشور سازنده", value: "ایتالیا" }
  ])

  useEffect(() => {
    if (basicInfo.product_type === "LENSES" || basicInfo.product_type === "CONTACT_LENSES") {
      setSpecifications([
        { key: "ضریب شکست (Index)", value: "1.50" },
        { key: "پوشش (Coating)", value: "ضد انعکاس" },
        { key: "کشور سازنده", value: "" }
      ])
    } else {
      setSpecifications([
        { key: "جنسیت", value: "یونیسکس" },
        { key: "فرم فریم", value: "" },
        { key: "نوع فریم", value: "" },
        { key: "جنس بدنه", value: "" },
        { key: "کشور سازنده", value: "" }
      ])
    }
  }, [basicInfo.product_type])

  const [variants, setVariants] = useState([
    {
      price: "", discount_price: "", stock_quantity: "",
      attributes: { color_name: "", color_code: "#000000", size: "", sph: "", cyl: "", axis: "" },
      images: [{ image_url: "", is_primary: true }]
    }
  ])

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          apiClient.get("/products/categories/"),
          apiClient.get("/products/brands/")
        ])
        setCategories(catsRes.data)
        setBrands(brandsRes.data)
        setBasicInfo(prev => ({
          ...prev,
          category_id: catsRes.data.length > 0 ? catsRes.data[0].id : "",
          brand_id: brandsRes.data.length > 0 ? brandsRes.data[0].id : ""
        }))
      } catch (err) {
        console.error("خطا در دریافت لیست دسته‌ها و برندها", err)
      }
    }
    fetchDependencies()
  }, [])

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setBasicInfo(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  // === توابع ثبت سریع در دیتابیس ===
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-')
    try {
      const res = await apiClient.post("/products/categories/admin/", { name: newCategoryName, slug })
      setCategories([...categories, res.data])
      setBasicInfo(prev => ({ ...prev, category_id: res.data.id }))
      setNewCategoryName("")
      setIsAddingCategory(false)
    } catch (err) {
      alert("خطا در ساخت دسته‌بندی. شاید نام مشابهی وجود دارد.")
    }
  }

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return
    const slug = newBrandName.trim().toLowerCase().replace(/\s+/g, '-')
    try {
      const res = await apiClient.post("/products/brands/admin/", { name: newBrandName, slug })
      setBrands([...brands, res.data])
      setBasicInfo(prev => ({ ...prev, brand_id: res.data.id }))
      setNewBrandName("")
      setIsAddingBrand(false)
    } catch (err) {
      alert("خطا در ساخت برند.")
    }
  }

  // مدیریت Specifications و Variants
  const addSpecification = () => setSpecifications([...specifications, { key: "", value: "" }])
  const removeSpecification = (index: number) => setSpecifications(specifications.filter((_, i) => i !== index))
  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specifications]
    newSpecs[index][field] = val
    setSpecifications(newSpecs)
  }

  const addVariant = () => setVariants([...variants, { price: "", discount_price: "", stock_quantity: "", attributes: { color_name: "", color_code: "#000000", size: "", sph: "", cyl: "", axis: "" }, images: [{ image_url: "", is_primary: true }] }])
  const removeVariant = (index: number) => { if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index)) }
  const handleVariantAttrChange = (index: number, attrKey: string, value: string) => {
    const newVariants = [...variants]
    newVariants[index].attributes = { ...newVariants[index].attributes, [attrKey]: value }
    setVariants(newVariants)
  }
  const handleVariantBaseChange = (index: number, field: string, value: string) => {
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

  // 👈 این تابع جدید برای آپلود عکس اضافه شد
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, vIndex: number, iIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      // در حین آپلود، به کاربر نشان می‌دهیم که در حال بارگذاری است
      handleImageChange(vIndex, iIndex, "در حال آپلود...")
      
      const res = await apiClient.post("/products/admin/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      // جایگزین کردن متن با آدرس واقعی که سرور برگردانده است
      handleImageChange(vIndex, iIndex, res.data.image_url)
    } catch (err) {
      console.error("خطا در آپلود", err)
      alert("خطا در آپلود تصویر. لطفاً مجدد تلاش کنید.")
      handleImageChange(vIndex, iIndex, "") // در صورت خطا کادر را خالی می‌کنیم
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!basicInfo.category_id || !basicInfo.brand_id) {
      setError("لطفاً یک دسته‌بندی و یک برند انتخاب کنید.")
      return
    }
    
    setIsLoading(true)
    setError("")

    const cleanSpecifications: Record<string, string> = {}
    specifications.forEach(spec => {
      if (spec.key.trim() && spec.value.trim()) {
        cleanSpecifications[spec.key.trim()] = spec.value.trim()
      }
    })
    
    const cleanVariants = variants.map(v => {
      const cleanAttributes = Object.fromEntries(Object.entries(v.attributes).filter(([_, val]) => val !== ""))
      return {
        price: Number(v.price),
        discount_price: v.discount_price ? Number(v.discount_price) : null,
        stock_quantity: Number(v.stock_quantity),
        attributes: cleanAttributes,
        images: v.images.filter(img => img.image_url.trim() !== "")
      }
    })

    const payload = {
      ...basicInfo,
      slug: basicInfo.slug.toLowerCase().replace(/\s+/g, '-'),
      specifications: cleanSpecifications,
      variants: cleanVariants
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
        <div>
          <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
            <PackagePlus className="w-8 h-8 text-emerald-500" /> افزودن محصول هوشمند
          </h1>
        </div>
        <Link href="/admin"><Button variant="outline" className="rounded-xl">بازگشت</Button></Link>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* === باکس 1: اطلاعات پایه === */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-800 border-b border-zinc-100 pb-4 flex items-center gap-2">
            <Glasses className="w-5 h-5 text-zinc-400"/> اطلاعات اصلی کالا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">نام کامل کالا *</label>
              <Input required name="title" value={basicInfo.title} onChange={handleBasicChange} className="bg-zinc-50 border-zinc-200 h-12" placeholder="عینک آفتابی..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">لینک لاتین (Slug) *</label>
              <Input required name="slug" value={basicInfo.slug} onChange={handleBasicChange} className="bg-zinc-50 border-zinc-200 h-12 text-left" placeholder="julbo-sunglasses" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">نوع محصول *</label>
              <select name="product_type" value={basicInfo.product_type} onChange={handleBasicChange} className="w-full p-3 h-12 border rounded-xl bg-zinc-50 border-zinc-200 outline-none">
                <option value="SUNGLASSES">عینک آفتابی</option>
                <option value="EYEGLASSES">عینک طبی</option>
                <option value="CONTACT_LENSES">لنز تماسی</option>
                <option value="LENSES">عدسی عینک</option>
                <option value="ACCESSORIES">لوازم جانبی</option>
              </select>
            </div>
            
            {/* --- باکس انتخاب یا افزودن دسته --- */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">دسته‌بندی *</label>
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="مثال: عینک ورزشی" className="h-12 border-emerald-300 bg-emerald-50" />
                  <Button type="button" onClick={handleCreateCategory} className="h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4">ثبت</Button>
                  <Button type="button" onClick={() => setIsAddingCategory(false)} variant="outline" className="h-12 rounded-xl">لغو</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select required name="category_id" value={basicInfo.category_id} onChange={handleBasicChange} className="w-full p-3 h-12 border rounded-xl bg-zinc-50 border-zinc-200 outline-none">
                    <option value="" disabled>{categories.length === 0 ? "بدون دسته" : "انتخاب کنید..."}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <Button type="button" onClick={() => setIsAddingCategory(true)} className="h-12 bg-zinc-900 px-4 rounded-xl" title="ساخت دسته جدید"><Plus className="w-5 h-5"/></Button>
                </div>
              )}
            </div>

            {/* --- باکس انتخاب یا افزودن برند --- */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">برند *</label>
              {isAddingBrand ? (
                <div className="flex gap-2">
                  <Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="مثال: Ray-Ban" className="h-12 border-blue-300 bg-blue-50" />
                  <Button type="button" onClick={handleCreateBrand} className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl px-4">ثبت</Button>
                  <Button type="button" onClick={() => setIsAddingBrand(false)} variant="outline" className="h-12 rounded-xl">لغو</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select required name="brand_id" value={basicInfo.brand_id} onChange={handleBasicChange} className="w-full p-3 h-12 border rounded-xl bg-zinc-50 border-zinc-200 outline-none">
                    <option value="" disabled>{brands.length === 0 ? "بدون برند" : "انتخاب کنید..."}</option>
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                  <Button type="button" onClick={() => setIsAddingBrand(true)} className="h-12 bg-zinc-900 px-4 rounded-xl" title="ساخت برند جدید"><Plus className="w-5 h-5"/></Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-bold text-zinc-700">توضیحات (متن بازاریابی)</label>
              <textarea name="description" value={basicInfo.description} onChange={handleBasicChange} className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200 outline-none min-h-[120px]"></textarea>
            </div>
          </div>
        </div>

        {/* === باکس 2: مشخصات تکمیلی === */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
             <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
               <Cog className="w-5 h-5 text-zinc-400"/> مشخصات تکمیلی (دلخواه)
             </h2>
             <Button type="button" onClick={addSpecification} variant="outline" className="gap-2 rounded-xl text-sm font-bold bg-zinc-50">
               <Plus className="w-4 h-4" /> افزودن ویژگی جدید
             </Button>
          </div>
          <div className="space-y-4">
            {specifications.map((spec, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1 space-y-1">
                  <Input value={spec.key} onChange={(e) => handleSpecChange(index, 'key', e.target.value)} placeholder="عنوان (مثال: جنس لولا)" className="bg-zinc-50 font-bold text-zinc-700" />
                </div>
                <div className="flex-1 space-y-1">
                  <Input value={spec.value} onChange={(e) => handleSpecChange(index, 'value', e.target.value)} placeholder="مقدار (مثال: فنری)" className="bg-zinc-50" />
                </div>
                <button type="button" onClick={() => removeSpecification(index)} className="p-2 mt-1 text-zinc-400 hover:text-red-500 bg-zinc-50 rounded-lg border border-zinc-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* === باکس 3: تنوع‌ها === */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-800 flex items-center gap-2">
              <Droplet className="w-6 h-6 text-blue-500" /> تنوع‌ها، موجودی و نمره‌های پزشکی
            </h2>
            <Button type="button" onClick={addVariant} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl gap-2 font-bold px-6">
              <Plus className="w-5 h-5" /> افزودن تنوع جدید
            </Button>
          </div>

          {variants.map((variant, vIndex) => (
            <div key={vIndex} className="bg-white p-6 rounded-3xl border-2 border-zinc-100 shadow-sm space-y-6 relative hover:border-blue-200 transition-colors">
              {variants.length > 1 && (
                <button type="button" onClick={() => removeVariant(vIndex)} className="absolute top-6 left-6 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-zinc-100 pb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 text-emerald-600">قیمت (تومان) *</label>
                  <Input required type="number" value={variant.price} onChange={(e) => handleVariantBaseChange(vIndex, 'price', e.target.value)} className="bg-emerald-50/50 border-emerald-100 h-12 font-bold" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 text-red-600">قیمت حراج (اختیاری)</label>
                  <Input type="number" value={variant.discount_price} onChange={(e) => handleVariantBaseChange(vIndex, 'discount_price', e.target.value)} className="bg-red-50/50 border-red-100 h-12 font-bold" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 text-blue-600">موجودی انبار *</label>
                  <Input required type="number" value={variant.stock_quantity} onChange={(e) => handleVariantBaseChange(vIndex, 'stock_quantity', e.target.value)} className="bg-blue-50/50 border-blue-100 h-12 font-bold" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {(basicInfo.product_type === "SUNGLASSES" || basicInfo.product_type === "EYEGLASSES") && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">نام رنگ</label>
                      <Input value={variant.attributes.color_name} onChange={(e) => handleVariantAttrChange(vIndex, 'color_name', e.target.value)} className="bg-zinc-50 h-12" placeholder="مشکی مات" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">کد رنگ</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={variant.attributes.color_code} onChange={(e) => handleVariantAttrChange(vIndex, 'color_code', e.target.value)} className="h-12 w-12 rounded cursor-pointer shrink-0 border border-zinc-200" />
                        <Input value={variant.attributes.color_code} onChange={(e) => handleVariantAttrChange(vIndex, 'color_code', e.target.value)} className="bg-zinc-50 h-12 uppercase" dir="ltr" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">سایز (Size)</label>
                      <Input value={variant.attributes.size} onChange={(e) => handleVariantAttrChange(vIndex, 'size', e.target.value)} className="bg-zinc-50 h-12" placeholder="50-20" dir="ltr" />
                    </div>
                  </>
                )}

                {(basicInfo.product_type === "CONTACT_LENSES" || basicInfo.product_type === "LENSES") && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">نمره ضعیفی (SPH)</label>
                      <Input value={variant.attributes.sph} onChange={(e) => handleVariantAttrChange(vIndex, 'sph', e.target.value)} className="bg-purple-50 h-12" placeholder="-2.50" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">آستیگمات (CYL)</label>
                      <Input value={variant.attributes.cyl} onChange={(e) => handleVariantAttrChange(vIndex, 'cyl', e.target.value)} className="bg-purple-50 h-12" placeholder="-1.00" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">محور (AXIS)</label>
                      <Input value={variant.attributes.axis} onChange={(e) => handleVariantAttrChange(vIndex, 'axis', e.target.value)} className="bg-purple-50 h-12" placeholder="180" dir="ltr" />
                    </div>
                  </>
                )}
              </div>

              {/* 👈 تغییرات اصلی در این قسمت اعمال شد (دکمه آپلود) */}
              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-zinc-400" /> تصاویر این تنوع
                  </label>
                  <Button type="button" onClick={() => addImageToVariant(vIndex)} variant="outline" size="sm" className="bg-white rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-1" /> افزودن عکس
                  </Button>
                </div>
                {variant.images.map((img, iIndex) => (
                  <div key={iIndex} className="flex flex-col sm:flex-row gap-3">
                    <Input 
                      required 
                      value={img.image_url} 
                      onChange={(e) => handleImageChange(vIndex, iIndex, e.target.value)} 
                      className="h-12 bg-white flex-1" 
                      placeholder="لینک عکس را وارد کنید یا از دکمه آپلود استفاده کنید" 
                      dir="ltr" 
                    />
                    
                    {/* دکمه جادویی آپلود فایل */}
                    <div className="relative shrink-0 w-full sm:w-auto">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, vIndex, iIndex)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        title="انتخاب عکس از سیستم"
                      />
                      <Button type="button" variant="secondary" className="h-12 w-full sm:w-auto px-6 rounded-xl gap-2 font-bold pointer-events-none border border-zinc-200 shadow-sm hover:bg-zinc-100">
                        <Upload className="w-5 h-5 text-zinc-600" /> آپلود از سیستم
                      </Button>
                    </div>

                    {variant.images.length > 1 && (
                      <button type="button" onClick={() => removeImageFromVariant(vIndex, iIndex)} className="p-3 text-red-400 bg-white border border-zinc-200 rounded-xl shrink-0 hover:bg-red-50 hover:border-red-200 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-16 text-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl transition-all shadow-xl hover:-translate-y-1">
          {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : "ثبت نهایی محصول در انبار"}
        </Button>

      </form>
    </div>
  )
}