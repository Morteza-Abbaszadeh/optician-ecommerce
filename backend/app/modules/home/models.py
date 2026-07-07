from sqlalchemy import Column, String, Integer, Boolean
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from app.core.database import Base

class HomeSection(Base):
    __tablename__ = "home_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=True)
    section_type = Column(String, nullable=False) # HERO, PRODUCT_GRID, BRAND_COLLECTION, SOCIAL_LOCATION
    order = Column(Integer, default=0) # ترتیب نمایش
    is_active = Column(Boolean, default=True)
    product_ids = Column(ARRAY(UUID(as_uuid=True)), default=[]) # لیست آیدی محصولاتی که در این بخش نمایش داده می‌شوند