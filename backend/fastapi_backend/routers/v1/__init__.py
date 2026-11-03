from fastapi import APIRouter

from routers.v1.auth import router as auth_router
from routers.v1.exchanges import router as exchanges_router
from routers.v1.skills import router as skills_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(skills_router)
router.include_router(exchanges_router)