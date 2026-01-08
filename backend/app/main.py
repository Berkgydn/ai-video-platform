from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# --- VERİTABANI İMPORTLARI (YENİ) ---
from app.core.database import engine, Base
# Modellerin Base tarafından tanınması için import edilmesi ŞARTTIR:
from app.models import video as video_models 

from app.api.v1.endpoints import videos

app = FastAPI(title="AI Video Platform API")

# --- CORS Ayarları ---
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

# --- TABLO OLUŞTURMA (CRITICAL FIX) ---
@app.on_event("startup")
async def init_tables():
    print("🏗️ Veritabanı tabloları kontrol ediliyor...")
    async with engine.begin() as conn:
        # Eğer tablolar yoksa oluşturur (varsa dokunmaz)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tablolar hazır!")

# Router'ı ekle
app.include_router(videos.router, prefix="/api/v1/videos", tags=["videos"])

# Medya Klasörü Ayarları
MEDIA_DIR = "/app/media" 
os.makedirs(MEDIA_DIR, exist_ok=True)

# "/media" url'sine gelen istekleri MEDIA_DIR klasöründen sun
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

@app.get("/")
async def root():
    return {"message": "Hello from AI Video Platform Backend!", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}