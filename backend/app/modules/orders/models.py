import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, JSON, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID  # ایمپورت حیاتی برای دیتابیس
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

# ==========================================
# وضعیت‌های دقیق سفارش
# ==========================================
class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PROCESSING = "PROCESSING"
    PREPARING = "PREPARING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"

class PaymentMethod(str, enum.Enum):
    ONLINE = "ONLINE"
    BANK_TRANSFER = "BANK_TRANSFER"
    PAY_ON_DELIVERY = "PAY_ON_DELIVERY"

# ==========================================
# جدول اصلی سفارشات
# ==========================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # 🟢 اصلاح شد: نوع داده دقیقاً به UUID بازگشت
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING_PAYMENT, index=True, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    
    total_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    final_price = Column(Float, nullable=False)
    
    is_paid = Column(Boolean, default=False, index=True)
    paid_at = Column(DateTime, nullable=True)
    
    tracking_code = Column(String, index=True, nullable=True) 
    shipped_at = Column(DateTime, nullable=True) 
    
    admin_note = Column(Text, nullable=True) 
    customer_note = Column(Text, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True) 
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

# ==========================================
# جدول اقلام سفارش
# ==========================================
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
    variant_id = Column(String, ForeignKey("product_variants.id", ondelete="SET NULL"), index=True, nullable=True)
    
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    prescription = Column(JSON, nullable=True)
    
    order = relationship("Order", back_populates="items")