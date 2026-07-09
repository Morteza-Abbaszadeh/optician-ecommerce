from sqlalchemy import Column, String, Integer, Boolean
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from app.core.database import Base
from sqlalchemy import JSON

class HomeSection(Base):
    __tablename__ = "home_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=True)
    section_type = Column(String, nullable=False) # HERO, PRODUCT_GRID, BRAND_COLLECTION, SOCIAL_LOCATION
    
    # مرتب‌سازی صفحه اصلی بر اساس این فیلد است، پس ایندکس شد
    order = Column(Integer, default=0, index=True) 
    
    # فیلتر اصلی برای نمایش بخش‌ها، فعال بودن آن‌هاست، پس ایندکس شد
    is_active = Column(Boolean, default=True, index=True)
    
    product_ids = Column(ARRAY(UUID(as_uuid=True)), default=[]) # لیست آیدی محصولاتی که در این بخش نمایش داده می‌شوند    
    config = Column(JSON, nullable=True, default={})