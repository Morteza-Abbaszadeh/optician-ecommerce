from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, TokenResponse, LoginRequest
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.modules.users.models import User
from app.core.security import get_password_hash, verify_password, create_access_token

class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def register_user(self, user_in: UserCreate) -> User:
        # بررسی تکراری بودن بر اساس شماره موبایل
        existing_user = await self.repository.get_by_phone_number(user_in.phone_number)
        if existing_user:
            raise BadRequestException(detail="User with this phone number already exists.")

        hashed_password = get_password_hash(user_in.password)
        return await self.repository.create(user_in, hashed_password)

    async def login_user(self, login_data: LoginRequest) -> TokenResponse:
        # جستجو بر اساس شماره موبایل
        user = await self.repository.get_by_phone_number(login_data.phone_number)
        
        if not user or not verify_password(login_data.password, str(user.hashed_password)):
            raise UnauthorizedException(detail="Incorrect phone number or password")
            
        if not user.is_active:
            raise UnauthorizedException(detail="User account is disabled")

        access_token = create_access_token(subject=user.id)
        return TokenResponse(access_token=access_token)