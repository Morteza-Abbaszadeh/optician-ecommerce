from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.modules.orders.models import OrderStatus, PaymentMethod
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any

# === فرم ثبت سفارش اولیه از سمت فرانت‌اند (مشتری) ===
class OrderItemCreate(BaseModel):
    variant_id: str
    quantity: int
    prescription: Optional[Dict[str, Any]] = None
    
class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: str
    payment_method: PaymentMethod = PaymentMethod.ONLINE # پیش‌فرض پرداخت آنلاین

# === فرم آپدیت سفارش از سمت ادمین (در پنل مدیریت) ===
class OrderUpdateAdmin(BaseModel):
    status: Optional[OrderStatus] = None
    tracking_code: Optional[str] = None
    shipping_company: Optional[str] = None
    admin_note: Optional[str] = None

# === دیتای خروجی آیتم سفارش (Snapshot) ===
class OrderItemResponse(BaseModel):
    id: UUID
    variant_id: str
    quantity: int
    unit_price: float
    model_config = ConfigDict(from_attributes=True)
    prescription: Optional[Dict[str, Any]] = None
    
# === دیتای خروجی کامل سفارش (برای پروفایل و داشبورد) ===
class OrderResponse(BaseModel):
    id: str | UUID
    total_price: float
    shipping_cost: float
    final_price: float
    status: OrderStatus
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    tracking_code: Optional[str] = None
    shipping_company: Optional[str] = None
    shipping_address: str
    admin_note: Optional[str] = None
    created_at: datetime
    
    # لیست کالاهای خریداری شده در این فاکتور
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)