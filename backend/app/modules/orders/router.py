from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db_session
from app.modules.orders.schemas import OrderCreate, OrderResponse, OrderUpdateAdmin
from app.modules.orders.repository import OrderRepository
from app.modules.users.dependencies import get_current_user, get_current_superuser

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(
    order_data: OrderCreate,
    current_user = Depends(get_current_user), 
    session: AsyncSession = Depends(get_db_session)
):
    repository = OrderRepository(session)
    try:
        order = await repository.create_order(
            user_id=current_user.id, 
            order_data=order_data
        )
        return order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="خطای سرور در ثبت سفارش")

@router.get("/admin/all", response_model=List[OrderResponse], dependencies=[Depends(get_current_superuser)])
async def get_all_orders_admin(
    limit: int = 50, 
    offset: int = 0, 
    session: AsyncSession = Depends(get_db_session)
):
    """(ویژه ادمین) دریافت لیست تمام فاکتورهای فروشگاه"""
    repository = OrderRepository(session)
    return await repository.get_all_orders_admin(limit=limit, offset=offset)

@router.patch("/admin/{order_id}", response_model=OrderResponse, dependencies=[Depends(get_current_superuser)])
async def update_order_admin(
    order_id: str, 
    update_data: OrderUpdateAdmin, 
    session: AsyncSession = Depends(get_db_session)
):
    """(ویژه ادمین) تغییر وضعیت، ثبت کد رهگیری پستی و یادداشت"""
    repository = OrderRepository(session)
    # تبدیل کلاس pydantic به دیکشنری بدون فیلدهای نال
    update_dict = update_data.model_dump(exclude_unset=True) 
    
    updated_order = await repository.update_order_admin(order_id, update_dict)
    if not updated_order:
        raise HTTPException(status_code=404, detail="سفارش مورد نظر یافت نشد")
    return updated_order

@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """دریافت تاریخچه سفارشات کاربر لاگین شده برای پروفایل"""
    repository = OrderRepository(session)
    return await repository.get_user_orders(current_user.id)