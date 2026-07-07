from fastapi import APIRouter, Depends, status
from app.modules.users.schemas import UserCreate, UserResponse, TokenResponse, LoginRequest
from app.modules.users.services import UserService
from app.modules.users.dependencies import get_user_service, get_current_user
from app.modules.users.models import User 
from app.modules.users.schemas import AddressCreate, AddressResponse
from app.modules.users.repository import AddressRepository
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.users.schemas import UserUpdate, PasswordUpdate
from app.core.security import verify_password, get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from fastapi import HTTPException
from sqlalchemy import select
from typing import List
from app.modules.users.dependencies import get_current_superuser


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
    return await user_service.register_user(user_in)

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with phone number and password"
)
async def login(
    login_data: LoginRequest, # دریافت داده به صورت JSON تمیز
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.login_user(login_data)




@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current logged in user details"
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    دریافت اطلاعات پروفایل کاربری که الان لاگین کرده است.
    نیاز به توکن معتبر در هدر (Bearer Token) دارد.
    """
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
    repository = AddressRepository(session)
    return await repository.get_user_addresses(current_user.id)

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
    repository = AddressRepository(session)
    return await repository.create_address(current_user.id, address_in.model_dump())


from app.modules.users.models import Address
from sqlalchemy import update, delete

@router.delete("/addresses/{address_id}")
async def delete_my_address(
    address_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """حذف یک آدرس"""
    stmt = delete(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    await session.execute(stmt)
    await session.commit()
    return {"message": "آدرس حذف شد"}

@router.patch("/addresses/{address_id}/default")
async def set_address_as_default(
    address_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """تبدیل یک آدرس به آدرس پیش‌فرض"""
    # ابتدا تمام آدرس‌های این کاربر را از حالت پیش‌فرض خارج می‌کنیم
    await session.execute(update(Address).where(Address.user_id == current_user.id).values(is_default=False))
    # سپس آدرس انتخابی را پیش‌فرض می‌کنیم
    await session.execute(update(Address).where(Address.id == address_id, Address.user_id == current_user.id).values(is_default=True))
    await session.commit()
    return {"message": "آدرس پیش‌فرض تغییر کرد"}


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """آپدیت اطلاعات پایه کاربر"""
    current_user.full_name = user_data.full_name
    current_user.email = user_data.email
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.put("/password")
async def update_my_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """تغییر رمز عبور کاربر"""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="رمز عبور فعلی اشتباه است")
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await session.commit()
    return {"message": "رمز عبور با موفقیت تغییر کرد"}




@router.get("/admin/all", response_model=List[UserResponse], dependencies=[Depends(get_current_superuser)])
async def get_all_users_admin(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_db_session)
):
    """(ویژه ادمین) دریافت لیست تمام کاربران فروشگاه"""
    stmt = select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


