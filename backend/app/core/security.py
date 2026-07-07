import bcrypt
import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """تولید هش امن با استفاده مستقیم از bcrypt"""
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """بررسی تطابق رمز عبور"""
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)

def create_access_token(subject: str | int) -> str:
    """تولید JWT Token بر اساس شناسه کاربر (subject)"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Payload توکن که شامل شناسه کاربر (sub) و زمان انقضا (exp) است
    to_encode = {"exp": expire, "sub": str(subject)}
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt