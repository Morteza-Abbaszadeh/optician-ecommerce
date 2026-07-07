import asyncio
from sqlalchemy import delete
from app.core.database import get_db_session
from app.modules.products.models import Category, Brand, Product, ProductVariant, ProductImage

async def seed_guaranteed_images():
    async for session in get_db_session():
        print("🧹 در حال پاکسازی دیتابیس به صورت ایمن...")
        
        # ۱. پاک کردن از پایین‌ترین سطح به بالاترین سطح
        await session.execute(delete(ProductImage))
        await session.execute(delete(ProductVariant))
        await session.execute(delete(Product))
        # ۲. پاک کردن برندها و دسته‌بندی‌ها (جدید)
        await session.execute(delete(Brand))
        await session.execute(delete(Category))
        
        await session.commit()
        
        print("🌱 در حال افزودن محصولات جدید با عکس تضمینی...")

        # ساخت دسته و برند تستی
        cat = Category(name="عینک طبی تستی", slug="test-glasses")
        brand = Brand(name="تست برند", slug="test-brand")
        session.add_all([cat, brand])
        await session.flush()

        # --- محصول ۱ ---
        product_1 = Product(
            title="عینک طبی ری‌بن اصلی",
            slug="rayban-rx-test",
            product_type="EYEGLASSES",
            category_id=cat.id,
            brand_id=brand.id,
            description="عینک با کیفیت عالی و عکس تضمینی.",
            specifications={"material": "فلزی"}
        )
        session.add(product_1)
        await session.flush()

        variant_1 = ProductVariant(
            product_id=product_1.id,
            price=2500000,
            stock_quantity=10,
            attributes={"color_name": "طلایی", "size": "50"}
        )
        session.add(variant_1)
        await session.flush()

        image_1 = ProductImage(
            variant_id=variant_1.id, 
            image_url="https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=800&auto=format&fit=crop", 
            is_primary=True
        )
        session.add(image_1)

        # --- محصول ۲ ---
        product_2 = Product(
            title="عینک آفتابی اسپرت",
            slug="sport-sunglass-test",
            product_type="SUNGLASSES",
            category_id=cat.id,
            brand_id=brand.id,
            description="مناسب برای کوهنوردی.",
            specifications={"gender": "مردانه"}
        )
        session.add(product_2)
        await session.flush()

        variant_2 = ProductVariant(
            product_id=product_2.id,
            price=3200000,
            stock_quantity=5,
            attributes={"color_name": "مشکی", "size": "55"}
        )
        session.add(variant_2)
        await session.flush()

        image_2 = ProductImage(
            variant_id=variant_2.id, 
            image_url="https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop", 
            is_primary=True
        )
        session.add(image_2)

        await session.commit()
        print("✅ عملیات با موفقیت انجام شد! حالا سایت را رفرش کنید.")
        
        break 

if __name__ == "__main__":
    asyncio.run(seed_guaranteed_images())