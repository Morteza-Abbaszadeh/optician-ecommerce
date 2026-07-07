from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.modules.products.schemas import ProductResponse
from app.modules.products.services import ProductService
from app.modules.products.dependencies import get_product_service
from app.modules.users.dependencies import get_current_superuser # مسیر این ایمپورت را با توجه به پروژه خود چک کنید
from app.modules.products.schemas import ProductCreate
from app.modules.products.schemas import CategoryCreate, CategoryResponse, BrandCreate, BrandResponse
from app.modules.products.models import Product
import os
import uuid
from fastapi import UploadFile, File


router = APIRouter(prefix="/products", tags=["Products"])

@router.get(
    "/", 
    response_model=List[ProductResponse], 
    summary="دریافت لیست محصولات"
)
async def get_products(
    limit: int = 20, 
    offset: int = 0,
    service: ProductService = Depends(get_product_service)
):
    """
    دریافت لیست محصولات فعال برای صفحه اصلی فروشگاه.
    این مسیر دارای صفحه بندی (limit و offset) است.
    """
    return await service.get_all_products(limit=limit, offset=offset)

@router.get(
    "/{slug}", 
    response_model=ProductResponse, 
    summary="دریافت جزئیات یک محصول"
)
async def get_product(
    slug: str,
    service: ProductService = Depends(get_product_service)
):
    """
    دریافت اطلاعات کامل یک محصول با استفاده از اسلاگ (نام لاتین در آدرس URL).
    این اطلاعات شامل برند، دسته بندی و تنوع رنگ و سایز است.
    """
    product = await service.get_product_by_slug(slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="محصول مورد نظر یافت نشد"
        )
    return product

@router.post(
    "/admin/", 
    response_model=ProductResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="افزودن محصول جدید (ویژه ادمین)",
    dependencies=[Depends(get_current_superuser)] # 👈 قفل امنیتی ادمین
)
async def create_product_admin(
    payload: ProductCreate,
    service: ProductService = Depends(get_product_service)
):
    """
    ثبت یک عینک جدید در سیستم.
    این مسیر می‌تواند محصول، تنوع‌های رنگ و سایز، و تصاویر را به صورت یکجا دریافت و ذخیره کند.
    """
    # فراخوانی سرویس برای ساخت محصول
    # (باید این متد را در services.py خود ساخته باشید که مستقیماً تابع ریپازیتوری ما را صدا بزند)
    new_product = await service.create_product(payload)
    return new_product


# ==========================================
# روترهای دسته‌بندی (Categories)
# ==========================================
@router.get("/categories/", response_model=List[CategoryResponse], summary="دریافت لیست دسته‌ها")
async def get_categories(service: ProductService = Depends(get_product_service)):
    return await service.repository.get_all_categories()

@router.post("/categories/admin/", response_model=CategoryResponse, dependencies=[Depends(get_current_superuser)])
async def create_category(payload: CategoryCreate, service: ProductService = Depends(get_product_service)):
    return await service.repository.create_category(payload.model_dump())

# ==========================================
# روترهای برندها (Brands)
# ==========================================
@router.get("/brands/", response_model=List[BrandResponse], summary="دریافت لیست برندها")
async def get_brands(service: ProductService = Depends(get_product_service)):
    return await service.repository.get_all_brands()

@router.post("/brands/admin/", response_model=BrandResponse, dependencies=[Depends(get_current_superuser)])
async def create_brand(payload: BrandCreate, service: ProductService = Depends(get_product_service)):
    return await service.repository.create_brand(payload.model_dump())

@router.delete(
    "/admin/{product_id}", 
    status_code=status.HTTP_200_OK,
    summary="حذف (غیرفعال‌سازی) محصول", 
    dependencies=[Depends(get_current_superuser)]
)
async def delete_product_admin(
    product_id: str, 
    service: ProductService = Depends(get_product_service)
):
    """
    حذف نرم محصول. محصول از دیتابیس پاک نمی‌شود بلکه وضعیت is_active آن False می‌شود.
    """
    return await service.deactivate_product(product_id)

@router.get("/admin/all", response_model=List[ProductResponse], dependencies=[Depends(get_current_superuser)])
async def get_all_products_admin(limit: int = 50, offset: int = 0, service: ProductService = Depends(get_product_service)):
    """دریافت لیست کامل محصولات برای جدول پنل ادمین"""
    return await service.get_all_products_for_admin(limit, offset)

@router.get(
    "/admin/{product_id}", 
    response_model=ProductResponse, 
    dependencies=[Depends(get_current_superuser)]
)
async def get_product_by_id_admin(product_id: str, service: ProductService = Depends(get_product_service)):
    product = await service.repository.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    return product
@router.patch("/admin/{product_id}/restore", dependencies=[Depends(get_current_superuser)])
async def restore_product_admin(product_id: str, service: ProductService = Depends(get_product_service)):
    """بازگردانی محصول حذف شده"""
    return await service.restore_product(product_id)
@router.put(
    "/admin/{product_id}", 
    response_model=ProductResponse, 
    dependencies=[Depends(get_current_superuser)]
)
async def update_product_admin(product_id: str, payload: ProductCreate, service: ProductService = Depends(get_product_service)):
    updated_product = await service.repository.update_product_with_variants(product_id, payload.model_dump())
    if not updated_product:
        raise HTTPException(status_code=404, detail="محصول برای ویرایش یافت نشد")
    return updated_product

@router.post(
    "/admin/upload-image", 
    summary="آپلود عکس محصول",
    dependencies=[Depends(get_current_superuser)]
)
async def upload_product_image(file: UploadFile = File(...)):
    """
    دریافت فایل عکس از ادمین، ذخیره در سرور و بازگرداندن URL نهایی
    """
    # ۱. استخراج فرمت فایل (مثلا jpg یا png)
    file_extension = file.filename.split(".")[-1]
    
    # ۲. ساخت یک نام رندوم و یکتا برای عکس تا نام‌ها تداخل پیدا نکنند
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    
    # ۳. مسیر ذخیره‌سازی فایل در سرور
    file_path = os.path.join("static/uploads/products", new_filename)
    
    # ۴. ذخیره فیزیکی فایل روی هارد سرور
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    # ۵. تولید URL نهایی برای ذخیره در دیتابیس
    # دقت کنید که در حالت واقعی به جای localhost نام دامنه شما قرار می‌گیرد
    image_url = f"http://localhost:8000/static/uploads/products/{new_filename}"
    
    return {"image_url": image_url}