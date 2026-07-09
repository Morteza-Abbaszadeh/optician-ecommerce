import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, Float, Integer, JSON, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base 

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # نام دسته‌بندی برای جستجوها ایندکس شد
    name = Column(String, index=True, nullable=False) 
    slug = Column(String, unique=True, index=True, nullable=False)
    # کلید خارجی برای پیدا کردن سریع زیردسته‌ها ایندکس شد
    parent_id = Column(String, ForeignKey("categories.id"), index=True, nullable=True) 
    icon_url = Column(String, nullable=True) 
    is_active = Column(Boolean, default=True)

    subcategories = relationship("Category", backref="parent", remote_side=[id])
    products = relationship("Product", back_populates="category")

class Brand(Base):
    __tablename__ = "brands"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False) 
    slug = Column(String, unique=True, index=True, nullable=False)
    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="brand")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # عنوان محصول بیشترین جستجو را در سایت دارد، پس حتماً ایندکس می‌شود
    title = Column(String, index=True, nullable=False) 
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    
    
    
    # کلیدهای خارجی برای فیلتر کردن سریع محصولات بر اساس برند و دسته ایندکس شدند
    category_id = Column(String, ForeignKey("categories.id"), index=True, nullable=True) 
    brand_id = Column(String, ForeignKey("brands.id"), index=True, nullable=True) 
    
    # فیلترهای نمایش در فروشگاه معمولاً فقط محصولات فعال را می‌گیرند، پس ایندکس می‌شود
    is_active = Column(Boolean, default=True, index=True) 
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    """جدول قیمت‌گذاری، موجودی و ویژگی‌های انتخابی کاربر"""
    __tablename__ = "product_variants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # کلید خارجی اتصال به محصول ایندکس شد (بسیار مهم برای سرعت لود جزئیات محصول)
    product_id = Column(String, ForeignKey("products.id"), index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=True) 
    
    # === مقادیر بازرگانی مشترک ===
    price = Column(Float, nullable=False) 
    discount_price = Column(Float, nullable=True) 
    stock_quantity = Column(Integer, default=0) 
    is_active = Column(Boolean, default=True)

    # === ویژگی‌های انتخابی کاربر در این تنوع (JSON) ===
    # مثال تنوع رنگی عینک: {"color_name": "مشکی", "color_code": "#000000"}
    # مثال تنوع عدسی: {"eye": "right", "sph": -2.50, "cyl": -1.00, "axis": 180}
    attributes = Column(JSON, default=dict)

    product = relationship("Product", back_populates="variants")
    images = relationship("ProductImage", back_populates="variant", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # کلید خارجی تصاویر اتصال به تنوع محصول ایندکس شد
    variant_id = Column(String, ForeignKey("product_variants.id"), index=True, nullable=False)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    
    variant = relationship("ProductVariant", back_populates="images")