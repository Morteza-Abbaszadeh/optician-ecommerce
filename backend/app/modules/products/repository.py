from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.modules.products.models import ProductImage # این را به ایمپورت‌های بالای فایل اضافه کنید

from app.modules.products.models import Product, Category, Brand, ProductVariant 


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_active_products(self, limit: int = 20, offset: int = 0) -> List[Product]:
        """
        دریافت سریع لیست محصولات برای صفحه اصلی و فروشگاه
        """
        stmt = (
            select(Product)
            .where(Product.is_active == True)
            # ترکیب جداول با یک کوئری برای جلوگیری از افت سرعت
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                selectinload(Product.variants).selectinload(ProductVariant.images)
            )
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        # بازگرداندن لیست محصولات با تمام متعلقات
        return list(result.scalars().all())

    async def get_product_by_slug(self, slug: str) -> Optional[Product]:
        """
        دریافت اطلاعات کامل یک محصول برای صفحه جزئیات کالا
        """
        stmt = (
            select(Product)
            .where(Product.slug == slug)
            .where(Product.is_active == True)
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                selectinload(Product.variants).selectinload(ProductVariant.images)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()
    

    # ... توابع قبلی شما سر جایشان می‌مانند ...

    async def create_product_with_variants(self, product_data: dict) -> Product:
        """
        ساخت محصول جدید به همراه تمام تنوع‌ها (رنگ/سایز) و تصاویر مرتبط در یک عملیات یکپارچه
        """
        # ۱. جدا کردن تنوع‌ها از دیتای اصلی محصول
        variants_data = product_data.pop("variants", [])
        
        # ۲. ساخت بدنه اصلی محصول
        new_product = Product(**product_data)
        self.session.add(new_product)
        await self.session.flush() # برای دریافت سریع آیدی محصول ساخته شده
        
        # ۳. حلقه زدن روی تنوع‌ها و ساخت آن‌ها
        for variant_dict in variants_data:
            images_data = variant_dict.pop("images", [])
            new_variant = ProductVariant(product_id=new_product.id, **variant_dict)
            self.session.add(new_variant)
            await self.session.flush() # برای دریافت آیدی تنوع
            
            # ۴. ذخیره عکس‌های هر تنوع
            for image_dict in images_data:
                new_image = ProductImage(variant_id=new_variant.id, **image_dict)
                self.session.add(new_image)
                
        # ۵. تایید نهایی و ذخیره قطعی در دیتابیس
        await self.session.commit()
        
        # ۶. بازگرداندن محصول کامل برای نمایش در فرانت‌اند
        return await self.get_product_by_slug(new_product.slug)

# ==========================================
    # بخش دسته‌بندی‌ها (Categories)
    # ==========================================
    async def get_all_categories(self) -> List[Category]:
        result = await self.session.execute(select(Category).where(Category.is_active == True))
        return list(result.scalars().all())

    async def create_category(self, category_data: dict) -> Category:
        new_category = Category(**category_data)
        self.session.add(new_category)
        await self.session.commit()
        return new_category

    # ==========================================
    # بخش برندها (Brands)
    # ==========================================
    async def get_all_brands(self) -> List[Brand]:
        result = await self.session.execute(select(Brand).where(Brand.is_active == True))
        return list(result.scalars().all())

    async def create_brand(self, brand_data: dict) -> Brand:
        new_brand = Brand(**brand_data)
        self.session.add(new_brand)
        await self.session.commit()
        return new_brand
    
    
    async def deactivate_product(self, product_id: str) -> bool:
        """
        حذف نرم (Soft Delete): تغییر وضعیت محصول به غیرفعال
        """
        result = await self.session.execute(select(Product).where(Product.id == product_id))
        product = result.scalars().first()
        
        if product:
            product.is_active = False
            await self.session.commit()
            return True
        return False
    
    
    async def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """دریافت محصول بر اساس آیدی برای پنل ادمین"""
        stmt = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                selectinload(Product.variants).selectinload(ProductVariant.images)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def update_product_with_variants(self, product_id: str, product_data: dict) -> Product:
        """ویرایش محصول و جایگزینی تنوع‌ها و عکس‌های جدید"""
        product = await self.get_product_by_id(product_id)
        if not product:
            return None

        variants_data = product_data.pop("variants", [])

        # ۱. آپدیت اطلاعات اصلی عینک
        for key, value in product_data.items():
            setattr(product, key, value)

        # ۲. پاک کردن تنوع‌ها و عکس‌های قدیمی (روش جایگزینی سریع برای MVP)
        for variant in product.variants:
            await self.session.delete(variant)
        await self.session.flush()

        # ۳. ذخیره تنوع‌ها و عکس‌های جدیدی که ادمین فرستاده
        for variant_dict in variants_data:
            images_data = variant_dict.pop("images", [])
            new_variant = ProductVariant(product_id=product.id, **variant_dict)
            self.session.add(new_variant)
            await self.session.flush()
            
            for image_dict in images_data:
                new_image = ProductImage(variant_id=new_variant.id, **image_dict)
                self.session.add(new_image)

        await self.session.commit()
        return await self.get_product_by_id(product_id)
    
    
    async def get_all_products_for_admin(self, limit: int = 50, offset: int = 0) -> List[Product]:
        """دریافت تمام محصولات (چه فعال و چه غیرفعال) مخصوص پنل ادمین"""
        stmt = (
            select(Product)
            # اینجا شرط is_active==True را برداشتیم تا همه را بیاورد
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                selectinload(Product.variants).selectinload(ProductVariant.images)
            )
            .limit(limit)
            .offset(offset)
            .order_by(Product.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def restore_product(self, product_id: str) -> bool:
        """بازگردانی محصول به فروشگاه"""
        result = await self.session.execute(select(Product).where(Product.id == product_id))
        product = result.scalars().first()
        if product:
            product.is_active = True
            await self.session.commit()
            return True
        return False