import sys
from pathlib import Path
import uvicorn

# Ensure all application paths are in sys.path
ROOT_DIR = Path(__file__).resolve().parent
FASTAPI_DIR = ROOT_DIR / 'backend' / 'fastapi_backend'
DJANGO_DIR = ROOT_DIR / 'backend' / 'django_backend'

for path in [ROOT_DIR, FASTAPI_DIR, DJANGO_DIR]:
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

if __name__ == '__main__':
    print(f"Starting SkillSwap FastAPI server on http://127.0.0.1:8080 ...")
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8080,
        reload=True,
        app_dir=str(FASTAPI_DIR),
    )
