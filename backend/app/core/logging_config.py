import logging
from logging.handlers import RotatingFileHandler
import os

# ساخت پوشه مخصوص لاگ‌ها در صورت عدم وجود
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE_PATH = os.path.join(LOG_DIR, "app.log")

def setup_logging():
    # ۱. تعریف فرمت استاندارد و خوانا برای لاگ‌ها
    log_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # ۲. تنظیم هندلر چرخشی برای فایل (جلوگیری از پر شدن هارد سرور)
    # maxBytes=10*1024*1024 یعنی هر فایل حداکثر 10 مگابایت شود
    # backupCount=5 یعنی حداکثر 5 فایل قدیمی نگهداری شود (قدیمی‌ترین‌ها خودکار پاک می‌شوند)
    file_handler = RotatingFileHandler(
        LOG_FILE_PATH, 
        maxBytes=10 * 1024 * 1024, 
        backupCount=5, 
        encoding="utf-8"
    )
    file_handler.setFormatter(log_formatter)
    file_handler.setLevel(logging.INFO)

    # ۳. تنظیم هندلر برای نمایش در ترمینال داکر (رویت آنی لاگ‌ها هنگام توسعه و پروداکشن)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_formatter)
    console_handler.setLevel(logging.INFO)

    # ۴. اعمال تنظیمات روی روتر اصلی (Root Logger)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # حذف هندلرهای پیش‌فرض قدیمی برای جلوگیری از تکرار لاگ‌ها
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
        
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # کم کردن لاگ‌های اضافی کتابخانه‌های دیگر مثل uvicorn یا صادرکننده‌های دیتابیس
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)