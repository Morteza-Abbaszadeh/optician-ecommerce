from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.users.repository import UserRepository
from app.modules.users.services import UserService
from app.core.config import settings

# تنظیم آدرس لاگین برای Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")

def get_user_service(session: AsyncSession = Depends(get_db_session)) -> UserService:
    repository = UserRepository(session)
    return UserService(repository)

# --- کدهای جدید نگهبان امنیتی ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # رمزگشایی توکن با کلید مخفی
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    # پیدا کردن کاربر در دیتابیس
    repository = UserRepository(session)
    user = await repository.get_by_id(user_id)
    
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user



from fastapi import Depends, HTTPException, status


async def get_current_superuser(current_user = Depends(get_current_user)):
    """
    نگهبان مرکزی ادمین: 
    هر مسیری که این تابع به آن متصل شود، فقط برای مدیران ارشد قابل دسترسی خواهد بود.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز. شما مجوز ورود به پنل مدیریت را ندارید."
        )
    return current_user