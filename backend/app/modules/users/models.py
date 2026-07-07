from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship # اضافه شد
from sqlalchemy.dialects.postgresql import UUID # اضافه شد
import uuid # اضافه شد
from app.shared.models import TimeStampedModel

class User(TimeStampedModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=True) 
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=False) 
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # اضافه کردن رابطه دوطرفه با آدرس‌ها
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")

# مدل جدید برای آدرس‌ها
class Address(TimeStampedModel):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(50), nullable=False)  # مثل: خانه، محل کار
    full_address = Column(String(500), nullable=False)
    postal_code = Column(String(20), nullable=True)
    phone_number = Column(String(20), nullable=False) # شماره تماس تحویل گیرنده
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")
    
    
