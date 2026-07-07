from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15) # شماره موبایل اجباری
    email: Optional[EmailStr] = None # ایمیل اختیاری
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    phone_number: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    
class AddressBase(BaseModel):
    title: str
    full_address: str
    postal_code: Optional[str] = None
    phone_number: str
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)