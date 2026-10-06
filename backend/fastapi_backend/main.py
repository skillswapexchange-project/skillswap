import os
import sys
from pathlib import Path

from fastapi import Depends, FastAPI

DJANGO_BACKEND_DIR = Path(__file__).resolve().parents[1] / 'django_backend'
if str(DJANGO_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(DJANGO_BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from config.database import get_db

app = FastAPI(title='SkillSwap API')


@app.get('/health', tags=['health'])
def health_check(_database=Depends(get_db)):
    return {'status': 'ok'}
