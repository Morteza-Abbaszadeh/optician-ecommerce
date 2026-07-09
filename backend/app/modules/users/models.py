from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship 
from sqlalchemy.dialects.postgresql import UUID 
import uuid 
from app.shared.models import TimeStampedModel

class User(TimeStampedModel):
    __tablename__ = "users"

    # ایمیل و شماره تلفن از قبل به درستی ایندکس شده بودند
    email = Column(String(255), unique=True, index=True, nullable=True) 
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=False) 
    
    # وضعیت فعال بودن در میدل‌ورها و احراز هویت زیاد چک می‌شود، پس ایندکس شد
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # اضافه کردن رابطه دوطرفه با آدرس‌ها
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")

# مدل جدید برای آدرس‌ها
class Address(TimeStampedModel):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # کلید خارجی باید حتماً ایندکس شود تا سرعت اتصال کاربر به آدرس‌هایش در زمان خرید افت نکند
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title = Column(String(50), nullable=False)  # مثل: خانه، محل کار
    full_address = Column(String(500), nullable=False)
    postal_code = Column(String(20), nullable=True)
    city = Column(String(50), nullable=False)
    province = Column(String(50), nullable=False)
    
    # پیدا کردن آدرس پیش‌فرض در صفحه Checkout کوئری پر تکراری است، پس ایندکس شد
    is_default = Column(Boolean, default=False, index=True)
    
    user = relationship("User", back_populates="addresses")