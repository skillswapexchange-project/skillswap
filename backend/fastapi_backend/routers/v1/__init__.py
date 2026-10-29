from fastapi import APIRouter

from routers.v1.auth import router as auth_router
from routers.v1.reviews import router as reviews_router
from routers.v1.skills import router as skills_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(skills_router)
router.include_router(reviews_router)
