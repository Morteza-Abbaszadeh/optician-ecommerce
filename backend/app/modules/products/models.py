import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, Float, Integer, JSON, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base 

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False) 
    slug = Column(String, unique=True, index=True, nullable=False)
    parent_id = Column(String, ForeignKey("categories.id"), nullable=True) 
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
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    brand_id = Column(String, ForeignKey("brands.id"), nullable=False)
    
    # === فیلدهای کاملاً مشترک برای همه محصولات ===
    title = Column(String, nullable=False) 
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    product_type = Column(String, index=True, nullable=False) # مثلا: GLASSES, LENS, ACCESSORY
    
    is_prescription_ready = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # === قلب تپنده فروشگاه (JSON) ===
    # تمام "توضیحات تکمیلی" در این فیلد ذخیره می‌شود.
    # مثال عینک: {"gender": "مردانه", "frame_material": "فلزی", "lens_width": "62", "bridge": "15"}
    # مثال عدسی: {"origin_country": "فرانسه", "index": "1.50", "coating": "ضد انعکاس"}
    specifications = Column(JSON, default=dict)

    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    """جدول قیمت‌گذاری، موجودی و ویژگی‌های انتخابی کاربر"""
    __tablename__ = "product_variants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
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
    variant_id = Column(String, ForeignKey("product_variants.id"), nullable=False)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False) 
    sort_order = Column(Integer, default=0) 
    variant = relationship("ProductVariant", back_populates="images")