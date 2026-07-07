from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.modules.users.models import User ,Address
from app.modules.users.schemas import UserCreate
from sqlalchemy import update

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # تغییر از email به phone_number
    async def get_by_phone_number(self, phone_number: str) -> User | None:
        result = await self.session.execute(select(User).where(User.phone_number == phone_number))
        return result.scalars().first()
    
    async def get_by_id(self, user_id: str) -> User | None:
            result = await self.session.execute(select(User).where(User.id == user_id))
            return result.scalars().first()
        
    async def create(self, user_in: UserCreate, hashed_password: str) -> User:
        new_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            phone_number=user_in.phone_number
        )
        self.session.add(new_user)
        await self.session.commit()
        await self.session.refresh(new_user)
        return new_user
    
    
class AddressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_addresses(self, user_id: str) -> list[Address]:
        stmt = select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_address(self, user_id: str, address_data: dict) -> Address:
        if address_data.get("is_default"):
            # برداشتن پیش‌فرض از آدرس‌های قبلی
            await self.session.execute(
                update(Address)
                .where(Address.user_id == user_id)
                .values(is_default=False)
            )
            
        new_address = Address(user_id=user_id, **address_data)
        self.session.add(new_address)
        await self.session.commit()
        await self.session.refresh(new_address)
        return new_address