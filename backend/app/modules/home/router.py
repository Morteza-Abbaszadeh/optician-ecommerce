from fastapi import APIRouter, Depends , HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.modules.users.dependencies import get_current_user, get_current_superuser

from pydantic import BaseModel

from app.core.database import get_db_session
from app.modules.home.models import HomeSection
from app.modules.home.schemas import HomeSectionResponse

router = APIRouter(prefix="/home", tags=["Home Layout"])

# دیتای پیش‌فرضی که در صورت خالی بودن دیتابیس تزریق می‌شود
DEFAULT_SECTIONS = [
    {"title": "بنر اصلی", "section_type": "HERO", "order": 1},
    {"title": "مد روز", "section_type": "PRODUCT_GRID", "order": 2},
    {"title": "کالکشن اختصاصی ری‌بن", "section_type": "BRAND_COLLECTION", "order": 3},
    {"title": "گالری و شبکه اجتماعی", "section_type": "SOCIAL_LOCATION", "order": 4},
]

@router.get("/layout", response_model=List[HomeSectionResponse])
async def get_home_layout(session: AsyncSession = Depends(get_db_session)):
    """دریافت چیدمان داینامیک صفحه اصلی بر اساس ترتیب (Order)"""
    
    stmt = select(HomeSection).where(HomeSection.is_active == True).order_by(HomeSection.order.asc())
    result = await session.execute(stmt)
    sections = list(result.scalars().all())

    # تزریق خودکار دیتای پیش‌فرض در صورت خالی بودن جدول
    if not sections:
        for sec_data in DEFAULT_SECTIONS:
            new_sec = HomeSection(**sec_data)
            session.add(new_sec)
        await session.commit()
        
        # کوئری مجدد پس از ساخت دیتا
        result = await session.execute(stmt)
        sections = list(result.scalars().all())

    return sections


class SectionUpdate(BaseModel):
    order: int
    is_active: bool

@router.patch("/{section_id}", dependencies=[Depends(get_current_superuser)])
async def update_section(
    section_id: int, 
    data: SectionUpdate, 
    session: AsyncSession = Depends(get_db_session)
):
    stmt = select(HomeSection).where(HomeSection.id == section_id)
    result = await session.execute(stmt)
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="بخش مورد نظر یافت نشد")
    
    section.order = data.order
    section.is_active = data.is_active
    await session.commit()
    return {"message": "با موفقیت به‌روزرسانی شد"}