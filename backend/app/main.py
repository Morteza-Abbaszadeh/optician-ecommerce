from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.users.router import router as users_router
from app.modules.products.router import router as products_router
from app.modules.orders.router import router as orders_router
from app.modules.home.router import router as home_router
from fastapi.staticfiles import StaticFiles
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings # اضافه کردن تنظیمات



app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Modular Monolith API for Optician E-Commerce",
    version="1.0.0"
)


UPLOAD_DIR = "static/uploads/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# API Versioning and Routing Registration
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(products_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(home_router, prefix="/api/v1")



@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    """
    Health check endpoint to verify the backend is running and responsive.
    """
    return {"status": "healthy", "service": "optician-backend"}