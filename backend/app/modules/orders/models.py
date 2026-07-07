import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base
from sqlalchemy.dialects.postgresql import UUID
# ==========================================
# وضعیت‌های دقیق سفارش (برای پیگیری مشتری و داشبورد)
# ==========================================
class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"   # در انتظار پرداخت
    PROCESSING = "PROCESSING"             # در حال پردازش (پرداخت شده)
    PREPARING = "PREPARING"               # در حال آماده‌سازی (مثلا تراش عدسی)
    SHIPPED = "SHIPPED"                   # ارسال شده
    DELIVERED = "DELIVERED"               # تحویل داده شده
    CANCELLED = "CANCELLED"               # لغو شده
    RETURNED = "RETURNED"                 # مرجوع شده

class PaymentMethod(str, enum.Enum):
    ONLINE = "ONLINE"                     # درگاه پرداخت اینترنتی
    BANK_TRANSFER = "BANK_TRANSFER"       # کارت به کارت / واریز به حساب
    PAY_ON_DELIVERY = "PAY_ON_DELIVERY"   # پرداخت در محل

# ==========================================
# جدول اصلی سفارشات
# ==========================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)    
    # 1. اطلاعات مالی (برای نمودارها و حسابداری)
    total_price = Column(Float, nullable=False) # مجموع قیمت کالاها
    shipping_cost = Column(Float, default=0.0)  # هزینه ارسال
    final_price = Column(Float, nullable=False) # مبلغ نهایی پرداختی (با احتساب هزینه ارسال و تخفیف)
    
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING_PAYMENT)
    
    # 2. اطلاعات پرداخت (رسیدها و درگاه)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.ONLINE)
    transaction_id = Column(String, nullable=True) # شماره تراکنش بانکی (درگاه)
    receipt_number = Column(String, nullable=True) # شماره رسید (برای کارت به کارت)
    payment_date = Column(DateTime, nullable=True) # زمان دقیق پرداخت
    
    # 3. اطلاعات ارسال (برای پیگیری پست/تیپاکس)
    shipping_address = Column(Text, nullable=False) # آدرس کامل ثبت شده در زمان خرید
    shipping_company = Column(String, nullable=True) # پست پیشتاز، تیپاکس، پیک موتوری
    tracking_code = Column(String, nullable=True) # بارکد پستی برای ارائه به مشتری
    shipped_at = Column(DateTime, nullable=True) # زمان تحویل به اداره پست
    
    # 4. یادداشت‌ها
    admin_note = Column(Text, nullable=True) # یادداشت خصوصی ادمین (مثلا: "مشتری تماس گرفت، فردا ارسال شود")
    customer_note = Column(Text, nullable=True) # یادداشت مشتری روی سفارش
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True) # ایندکس برای سرعت گرفتن نمودارها
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # روابط
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

# ==========================================
# جدول اقلام سفارش (Snapshot)
# ==========================================
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    variant_id = Column(String, ForeignKey("product_variants.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    
    # بسیار مهم: ثبت قیمت در لحظه خرید!
    # اگر فردا قیمت عینک بالا رفت، تاریخچه خریدهای قبلی نباید تغییر کند.
    unit_price = Column(Float, nullable=False) 

    # روابط
    order = relationship("Order", back_populates="items")
    variant = relationship("ProductVariant")