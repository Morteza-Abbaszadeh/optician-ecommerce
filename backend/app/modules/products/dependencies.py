from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session # مسیر سشن دیتابیس خود را چک کنید
from app.modules.products.repository import ProductRepository
from app.modules.products.services import ProductService

def get_product_service(session: AsyncSession = Depends(get_db_session)) -> ProductService:
    repository = ProductRepository(session)
    return ProductService(repository)