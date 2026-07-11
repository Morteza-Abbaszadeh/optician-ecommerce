import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db_session
from app.modules.orders.schemas import OrderCreate, OrderResponse, OrderUpdateAdmin
from app.modules.orders.repository import OrderRepository
from app.modules.users.dependencies import get_current_user, get_current_superuser

# تعریف لاگر اختصاصی برای این فایل
logger = logging.getLogger(__name__)

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
        logger.info(f"سفارش جدید با موفقیت برای کاربر {current_user.id} ثبت شد.")
        return order
        
    except ValueError as e:
        # خطاهای بیزینسی (مثل کمبود موجودی) را در سطح هشدار (Warning) ثبت می‌کنیم
        logger.warning(f"خطای اعتبارسنجی در ثبت سفارش کاربر {current_user.id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    except Exception as e:
        # خطاهای غیرمنتظره سرور (مثل قطعی دیتابیس) را با exc_info=True ثبت می‌کنیم تا Traceback کامل (شماره خط کد) در فایل لاگ ذخیره شود
        logger.error(f"خطای بحرانی سرور در زمان ثبت سفارش برای کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="خطای سرور در ثبت سفارش. لطفاً دقایقی دیگر تلاش کنید.")

@router.get("/admin/all", response_model=List[OrderResponse], dependencies=[Depends(get_current_superuser)])
async def get_all_orders_admin(
    limit: int = 50, 
    offset: int = 0, 
    session: AsyncSession = Depends(get_db_session)
):
    """(ویژه ادمین) دریافت لیست تمام فاکتورهای فروشگاه"""
    try:
        repository = OrderRepository(session)
        return await repository.get_all_orders_admin(limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"خطا در دریافت لیست سفارشات ادمین: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="خطا در دریافت لیست سفارشات")

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
    
    # 👈 اعتبارسنجی هوشمند: جلوگیری از ارسال کوئری بی‌مورد به دیتابیس در صورت خالی بودن تغییرات
    if not update_dict:
        logger.info(f"ادمین تلاش کرد سفارش {order_id} را بدون هیچ تغییری آپدیت کند.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="هیچ داده‌ای برای تغییر ارسال نشده است")
        
    try:
        updated_order = await repository.update_order_admin(order_id, update_dict)
        if not updated_order:
            logger.warning(f"تلاش ادمین برای آپدیت سفارشی که وجود ندارد. آیدی: {order_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سفارش مورد نظر یافت نشد")
            
        logger.info(f"سفارش {order_id} توسط ادمین با موفقیت بروزرسانی شد.")
        return updated_order
        
    except Exception as e:
        logger.error(f"خطای سرور در آپدیت سفارش {order_id} توسط ادمین: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="خطا در بروزرسانی سفارش")

@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    """دریافت تاریخچه سفارشات کاربر لاگین شده برای پروفایل"""
    try:
        repository = OrderRepository(session)
        return await repository.get_user_orders(current_user.id)
    except Exception as e:
        logger.error(f"خطا در دریافت تاریخچه سفارشات کاربر {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="خطا در دریافت تاریخچه سفارشات")