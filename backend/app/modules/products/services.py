from typing import List, Optional
from app.modules.products.repository import ProductRepository
from app.modules.products.models import Product
from fastapi import HTTPException, status
from app.modules.products.schemas import ProductCreate

    
class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    async def get_all_products(self, limit: int = 20, offset: int = 0) -> List[Product]:
        return await self.repository.get_all_active_products(limit=limit, offset=offset)

    async def get_product_by_slug(self, slug: str) -> Optional[Product]:
        return await self.repository.get_product_by_slug(slug)

    async def create_product(self, payload: ProductCreate):
        """
        مدیریت منطق ساخت محصول قبل از ذخیره در دیتابیس
        """
        # ۱. بررسی امنیتی: آیا محصولی با این لینک (slug) از قبل داریم؟
        existing_product = await self.repository.get_product_by_slug(payload.slug)
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="محصولی با این نام لاتین (Slug) از قبل وجود دارد. لطفاً اسلاگ دیگری انتخاب کنید."
            )
        
        # ۲. تبدیل مدل Pydantic به دیکشنری پایتون (دیتابیس فقط دیکشنری می‌فهمد)
        product_data = payload.model_dump()
        
        # ۳. ارسال دیتا به لایه دیتابیس (ریپازیتوری) برای ثبت نهایی
        new_product = await self.repository.create_product_with_variants(product_data)
        
        return new_product
    async def deactivate_product(self, product_id: str):
        """
        بررسی و ارسال دستور غیرفعال‌سازی محصول
        """
        success = await self.repository.deactivate_product(product_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="محصول مورد نظر یافت نشد."
            )
        return {"detail": "محصول با موفقیت غیرفعال و از فروشگاه حذف شد."}
    
    
    async def get_all_products_for_admin(self, limit: int = 50, offset: int = 0):
        return await self.repository.get_all_products_for_admin(limit=limit, offset=offset)

    async def restore_product(self, product_id: str):
        success = await self.repository.restore_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail="محصول یافت نشد.")
        return {"detail": "محصول با موفقیت به فروشگاه بازگشت."}