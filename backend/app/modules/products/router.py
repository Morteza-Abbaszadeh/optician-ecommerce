import logging
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List

from app.modules.products.schemas import (
    ProductResponse, ProductCreate, 
    CategoryCreate, CategoryResponse, 
    BrandCreate, BrandResponse
)
from app.modules.products.services import ProductService
from app.modules.products.dependencies import get_product_service
from app.modules.users.dependencies import get_current_superuser 
from app.modules.products.models import Product

from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache

# تعریف لاگر اختصاصی برای این فایل
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["Products"])

@router.get(
    "", 
    response_model=List[ProductResponse], 
    summary="دریافت لیست محصولات"
)
@cache(expire=300)
async def get_products(
    limit: int = 20, 
    offset: int = 0,
    service: ProductService = Depends(get_product_service)
):
    """دریافت لیست محصولات فعال برای صفحه اصلی فروشگاه."""
    try:
        return await service.get_all_products(limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"خطا در دریافت لیست محصولات: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در دریافت لیست محصولات")

@router.get(
    "/{slug}", 
    response_model=ProductResponse, 
    summary="دریافت جزئیات یک محصول"
)
@cache(expire=600)
async def get_product(
    slug: str,
    service: ProductService = Depends(get_product_service)
):
    """دریافت اطلاعات کامل یک محصول با استفاده از اسلاگ"""
    try:
        product = await service.get_product_by_slug(slug)
        if not product:
            logger.warning(f"تلاش برای مشاهده محصول ناموجود با اسلاگ: {slug}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="محصول مورد نظر یافت نشد"
            )
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"خطا در دریافت جزئیات محصول {slug}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطای سرور در دریافت جزئیات محصول")

@router.post(
    "/admin/", 
    response_model=ProductResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="افزودن محصول جدید (ویژه ادمین)",
    dependencies=[Depends(get_current_superuser)]
)
async def create_product_admin(
    payload: ProductCreate,
    service: ProductService = Depends(get_product_service)
):
    """ثبت یک عینک جدید در سیستم."""
    try:
        new_product = await service.create_product(payload)
        logger.info(f"محصول جدید با عنوان '{payload.title}' توسط ادمین با موفقیت ثبت شد.")
        return new_product
    except Exception as e:
        logger.error(f"خطای بحرانی در ثبت محصول جدید '{payload.title}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در ثبت محصول جدید")

# ==========================================
# روترهای دسته‌بندی (Categories)
# ==========================================
@router.get("/categories/", response_model=List[CategoryResponse], summary="دریافت لیست دسته‌ها")
@cache(expire=86400)
async def get_categories(service: ProductService = Depends(get_product_service)):
    return await service.repository.get_all_categories()

@router.post("/categories/admin/", response_model=CategoryResponse, dependencies=[Depends(get_current_superuser)])
async def create_category(payload: CategoryCreate, service: ProductService = Depends(get_product_service)):
    try:
        new_cat = await service.repository.create_category(payload.model_dump())
        logger.info(f"دسته‌بندی جدید '{payload.name}' ثبت شد.")
        await FastAPICache.clear()
        return new_cat
    except Exception as e:
        logger.error(f"خطا در ایجاد دسته‌بندی '{payload.name}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در ثبت دسته‌بندی")

# ==========================================
# روترهای برندها (Brands)
# ==========================================
@router.get("/brands/", response_model=List[BrandResponse], summary="دریافت لیست برندها")
@cache(expire=86400)
async def get_brands(service: ProductService = Depends(get_product_service)):
    return await service.repository.get_all_brands()

@router.post("/brands/admin/", response_model=BrandResponse, dependencies=[Depends(get_current_superuser)])
async def create_brand(payload: BrandCreate, service: ProductService = Depends(get_product_service)):
    try:
        new_brand = await service.repository.create_brand(payload.model_dump())
        logger.info(f"برند جدید '{payload.name}' ثبت شد.")
        await FastAPICache.clear()
        return new_brand
    except Exception as e:
        logger.error(f"خطا در ایجاد برند '{payload.name}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در ثبت برند")

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
    """حذف نرم محصول."""
    try:
        result = await service.deactivate_product(product_id)
        logger.info(f"محصول با آیدی {product_id} غیرفعال (حذف نرم) شد.")
        return result
    except Exception as e:
        logger.error(f"خطا در غیرفعال‌سازی محصول {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در حذف محصول")

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
    try:
        product = await service.repository.get_product_by_id(product_id)
        if not product:
            logger.warning(f"جستجوی ادمین برای محصول ناموجود با آیدی: {product_id}")
            raise HTTPException(status_code=404, detail="محصول یافت نشد")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"خطا در دریافت محصول {product_id} برای ادمین: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در دریافت اطلاعات محصول")

@router.patch("/admin/{product_id}/restore", dependencies=[Depends(get_current_superuser)])
async def restore_product_admin(product_id: str, service: ProductService = Depends(get_product_service)):
    """بازگردانی محصول حذف شده"""
    try:
        result = await service.restore_product(product_id)
        logger.info(f"محصول {product_id} با موفقیت بازگردانی (فعال) شد.")
        return result
    except Exception as e:
        logger.error(f"خطا در بازگردانی محصول {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در بازگردانی محصول")

@router.put(
    "/admin/{product_id}", 
    response_model=ProductResponse, 
    dependencies=[Depends(get_current_superuser)]
)
async def update_product_admin(product_id: str, payload: ProductCreate, service: ProductService = Depends(get_product_service)):
    try:
        updated_product = await service.repository.update_product_with_variants(product_id, payload.model_dump())
        if not updated_product:
            logger.warning(f"تلاش ادمین برای آپدیت محصولی که وجود ندارد (آیدی: {product_id})")
            raise HTTPException(status_code=404, detail="محصول برای ویرایش یافت نشد")
        
        await FastAPICache.clear()
        logger.info(f"محصول {product_id} با موفقیت توسط ادمین ویرایش شد.")
        return updated_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"خطای سرور در ویرایش محصول {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در بروزرسانی محصول")

@router.post(
    "/admin/upload-image", 
    summary="آپلود عکس محصول",
    dependencies=[Depends(get_current_superuser)]
)
async def upload_product_image(file: UploadFile = File(...)):
    """دریافت فایل عکس از ادمین، ذخیره در سرور و بازگرداندن URL نهایی"""
    try:
        file_extension = file.filename.split(".")[-1]
        new_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join("static/uploads/products", new_filename)
        
        # ذخیره فیزیکی فایل روی هارد سرور
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        image_url = f"http://localhost:8000/static/uploads/products/{new_filename}"
        
        logger.info(f"یک عکس محصول جدید با موفقیت در سرور آپلود شد: {new_filename}")
        return {"image_url": image_url}
        
    except Exception as e:
        # اگر موقع ذخیره فایل روی هارد (Permission Denied, Disk Full) خطایی رخ دهد، اینجا شکار می‌شود
        logger.error(f"خطای بحرانی در زمان آپلود و ذخیره عکس محصول روی سرور: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطای سرور در آپلود تصویر")