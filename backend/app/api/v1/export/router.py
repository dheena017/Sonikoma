from fastapi import APIRouter
from api.v1.export.youtube import router as youtube_router
from api.v1.export.profiles import router as profiles_router
from api.v1.export.credentials import router as credentials_router

export_router = APIRouter()

# Combine/include all modularized export routers
export_router.include_router(youtube_router)
export_router.include_router(profiles_router)
export_router.include_router(credentials_router)
