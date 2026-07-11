import logging
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List

from app.core.database import get_db_session
from app.core.security import verify_password, get_password_hash

from app.modules.users.schemas import (
    UserCreate, UserResponse, TokenResponse, LoginRequest, 
    AddressCreate, AddressResponse, UserUpdate, PasswordUpdate
)
from app.modules.users.services import UserService
from app.modules.users.dependencies import get_user_service, get_current_user, get_current_superuser
from app.modules.users.models import User, Address
from app.modules.users.repository import AddressRepository

# تعریف لاگر اختصاصی برای این فایل
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(
    user_in: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    try:
        user = await user_service.register_user(user_in)
        logger.info(f"ثبت نام موفق کاربر جدید با شماره {user_in.phone_number}.")
        return user
    except HTTPException as e:
        logger.warning(f"خطای اعتبارسنجی/تکراری در ثبت نام شماره {user_in.phone_number}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"خطای بحرانی سرور در زمان ثبت نام شماره {user_in.phone_number}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در سیستم ثبت نام. لطفاً دقایقی دیگر تلاش کنید.")

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with phone number and password"
)
async def login(
    login_data: LoginRequest,
    user_service: UserService = Depends(get_user_service)
):
    try:
        token = await user_service.login_user(login_data)
        logger.info(f"ورود موفق به حساب کاربری برای شماره: {login_data.phone_number}")
        return token
    except HTTPException as e:
        logger.warning(f"تلاش ناموفق برای ورود شماره {login_data.phone_number}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"خطای سرور در سیستم ورود برای شماره {login_data.phone_number}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطای سرور در فرآیند ورود.")

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current logged in user details"
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """دریافت اطلاعات پروفایل کاربری که الان لاگین کرده است."""
    return current_user

@router.get(
    "/addresses",
    response_model=List[AddressResponse],
    summary="Get user addresses"
)
async def get_my_addresses(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        repository = AddressRepository(session)
        return await repository.get_user_addresses(current_user.id)
    except Exception as e:
        logger.error(f"خطا در دریافت لیست آدرس‌های کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در دریافت آدرس‌ها")

@router.post(
    "/addresses",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new address"
)
async def create_new_address(
    address_in: AddressCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        repository = AddressRepository(session)
        address = await repository.create_address(current_user.id, address_in.model_dump())
        logger.info(f"کاربر {current_user.id} یک آدرس جدید ثبت کرد.")
        return address
    except Exception as e:
        logger.error(f"خطا در ثبت آدرس جدید برای کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در ثبت آدرس جدید")

@router.delete("/addresses/{address_id}")
async def delete_my_address(
    address_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """حذف یک آدرس"""
    try:
        stmt = delete(Address).where(Address.id == address_id, Address.user_id == current_user.id)
        result = await session.execute(stmt)
        
        if result.rowcount == 0:
            logger.warning(f"تلاش کاربر {current_user.id} برای حذف آدرسی ({address_id}) که وجود ندارد یا متعلق به او نیست.")
            raise HTTPException(status_code=404, detail="آدرس مورد نظر یافت نشد")
            
        await session.commit()
        logger.info(f"آدرس {address_id} توسط کاربر {current_user.id} حذف شد.")
        return {"message": "آدرس حذف شد"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"خطا در فرآیند حذف آدرس {address_id} برای کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در حذف آدرس")

@router.patch("/addresses/{address_id}/default")
async def set_address_as_default(
    address_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """تبدیل یک آدرس به آدرس پیش‌فرض"""
    try:
        # ابتدا تمام آدرس‌های این کاربر را از حالت پیش‌فرض خارج می‌کنیم
        await session.execute(update(Address).where(Address.user_id == current_user.id).values(is_default=False))
        # سپس آدرس انتخابی را پیش‌فرض می‌کنیم
        result = await session.execute(update(Address).where(Address.id == address_id, Address.user_id == current_user.id).values(is_default=True))
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="آدرس مورد نظر یافت نشد")
            
        await session.commit()
        logger.info(f"کاربر {current_user.id} آدرس پیش‌فرض خود را به {address_id} تغییر داد.")
        return {"message": "آدرس پیش‌فرض تغییر کرد"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"خطا در تغییر آدرس پیش‌فرض برای کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در تغییر آدرس پیش‌فرض")

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """آپدیت اطلاعات پایه کاربر"""
    try:
        current_user.full_name = user_data.full_name
        current_user.email = user_data.email
        await session.commit()
        await session.refresh(current_user)
        logger.info(f"اطلاعات پروفایل کاربر {current_user.id} با موفقیت بروزرسانی شد.")
        return current_user
    except Exception as e:
        logger.error(f"خطا در بروزرسانی پروفایل کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در بروزرسانی اطلاعات پروفایل")

@router.put("/password")
async def update_my_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """تغییر رمز عبور کاربر"""
    try:
        if not verify_password(password_data.current_password, current_user.hashed_password):
            logger.warning(f"تلاش ناموفق برای تغییر پسورد توسط کاربر {current_user.id} (رمز فعلی اشتباه وارد شده است)")
            raise HTTPException(status_code=400, detail="رمز عبور فعلی اشتباه است")
        
        current_user.hashed_password = get_password_hash(password_data.new_password)
        await session.commit()
        logger.info(f"رمز عبور کاربر {current_user.id} با موفقیت تغییر یافت.")
        return {"message": "رمز عبور با موفقیت تغییر کرد"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"خطا در فرآیند تغییر رمز عبور برای کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطای سرور در تغییر رمز عبور")

@router.get("/admin/all", response_model=List[UserResponse], dependencies=[Depends(get_current_superuser)])
async def get_all_users_admin(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_db_session)
):
    """(ویژه ادمین) دریافت لیست تمام کاربران فروشگاه"""
    try:
        stmt = select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
        result = await session.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        logger.error(f"خطا در دریافت لیست کاربران توسط ادمین: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="خطا در دریافت لیست کاربران")