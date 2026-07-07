from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.modules.orders.models import Order, OrderItem, OrderStatus
from app.modules.products.models import ProductVariant

class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_order(self, user_id: str, order_data) -> Order:
        total_price = 0.0
        order_items = []

        # ۱. بررسی تک تک کالاها در دیتابیس (محاسبه قیمت و کسر موجودی)
        for item in order_data.items:
            result = await self.session.execute(
                select(ProductVariant).where(ProductVariant.id == item.variant_id)
            )
            variant = result.scalars().first()

            if not variant:
                raise ValueError(f"محصول با شناسه {item.variant_id} یافت نشد")
            
            if variant.stock_quantity < item.quantity:
                raise ValueError("موجودی انبار برای این محصول کافی نیست")

            # محاسبه امن قیمت از دیتابیس (اگر حراج بود، قیمت حراج لحاظ می‌شود)
            unit_price = variant.discount_price if variant.discount_price else variant.price
            total_price += (unit_price * item.quantity)

            # کسر کردن از موجودی انبار
            variant.stock_quantity -= item.quantity

            # ساخت آیتم با قیمت قفل شده (Snapshot)
            order_items.append(
                OrderItem(
                    variant_id=variant.id,
                    quantity=item.quantity,
                    unit_price=unit_price
                )
            )

        # ۲. محاسبه هزینه‌های نهایی (اینجا هزینه ارسال را مثلا 50 هزار تومان ثابت گذاشتیم)
        # در آینده می‌توانید این را بر اساس وزن کالا داینامیک کنید
        shipping_cost = 50000.0 if total_price < 2000000 else 0.0 # ارسال رایگان برای خرید بالای دو میلیون
        final_price = total_price + shipping_cost

        # ۳. ایجاد فاکتور اصلی
        new_order = Order(
            user_id=user_id,
            total_price=total_price,
            shipping_cost=shipping_cost,
            final_price=final_price,
            shipping_address=order_data.shipping_address,
            payment_method=order_data.payment_method
        )
        self.session.add(new_order)
        await self.session.flush() # گرفتن شناسه (ID) فاکتور قبل از ذخیره نهایی

        # ۴. متصل کردن آیتم‌ها به فاکتور
        for oi in order_items:
            oi.order_id = new_order.id
            self.session.add(oi)

        await self.session.commit()
        await self.session.refresh(new_order)
        return new_order
    
    async def get_all_orders_admin(self, limit: int = 50, offset: int = 0) -> list[Order]:
        """دریافت لیست تمام فاکتورها برای پنل مدیریت"""
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product))
            .order_by(Order.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_order_admin(self, order_id: str, update_data: dict) -> Order:
        """ویرایش سفارش توسط ادمین (ثبت کدرهگیری، تغییر وضعیت و یادداشت)"""
        result = await self.session.execute(select(Order).where(Order.id == order_id))
        order = result.scalars().first()
        
        if order:
            # فقط فیلدهایی که ارسال شده‌اند را آپدیت کن
            for key, value in update_data.items():
                if value is not None:
                    setattr(order, key, value)
                    
            await self.session.commit()
            await self.session.refresh(order)
            return order
        return None

    async def get_user_orders(self, user_id: str):
        """دریافت لیست سفارشات کاربر برای پروفایل"""
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product) 
            )
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())