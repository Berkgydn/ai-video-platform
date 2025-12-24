from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <-- 1. BU SATIRI EKLE
import os                                    # <-- 2. BU SATIRI EKLE
from app.api.v1.endpoints import videos # YENİ


app = FastAPI(title="AI Video Platform API")

# CORS Ayarları (Frontend ile konuşabilmesi için şart)
origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ı eklendi !
app.include_router(videos.router, prefix="/api/v1/videos", tags=["videos"])

MEDIA_DIR = "/app/media" 
os.makedirs(MEDIA_DIR, exist_ok=True) # Klasör yoksa oluştur

# "/media" url'sine gelen istekleri MEDIA_DIR klasöründen sun
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

@app.get("/")
async def root():
    return {"message": "Hello from AI Video Platform Backend!", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}