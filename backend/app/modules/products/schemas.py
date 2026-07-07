from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any

class CategoryBase(BaseModel):
    name: str
    slug: str
    parent_id: Optional[str] = None
    icon_url: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
    
class CategoryCreate(CategoryBase):
    pass

class BrandBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None

class BrandResponse(BrandBase):
    id: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class BrandCreate(BrandBase):
    pass

class ProductImageResponse(BaseModel):
    id: str
    image_url: str
    is_primary: bool
    model_config = ConfigDict(from_attributes=True)

# ==========================
# Variant Schemas (استفاده از attributes داینامیک)
# ==========================
class ProductVariantBase(BaseModel):
    sku: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock_quantity: int
    # تمام ویژگی‌های متغیر مثل رنگ، سایز، نمره چشم اینجا پاس داده می‌شوند
    attributes: Dict[str, Any] = {}

class ProductVariantResponse(ProductVariantBase):
    id: str
    is_active: bool
    images: List[ProductImageResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ==========================
# Product Main Schemas
# ==========================
class ProductBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    product_type: str # GLASSES, LENS, SUNGLASSES
    is_prescription_ready: bool = False
    # تمام ویژگی‌های ثابت محصول (جنس، کشور سازنده و...) اینجا پاس داده می‌شوند
    specifications: Dict[str, Any] = {}

class ProductResponse(ProductBase):
    id: str
    category: CategoryResponse
    brand: BrandResponse
    variants: List[ProductVariantResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ProductImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False
    sort_order: int = 0

class ProductVariantCreate(ProductVariantBase):
    images: List[ProductImageCreate] = []

class ProductCreate(ProductBase):
    category_id: str
    brand_id: str
    variants: List[ProductVariantCreate] = []