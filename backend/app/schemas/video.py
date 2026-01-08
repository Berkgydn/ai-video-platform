from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Any
import uuid

# --- 1. GİRİŞ ŞEMALARI (Request) ---

# Video yüklerken Frontend'den gelecek veriler
class VideoCreate(BaseModel):
    title: str
    # Hangi dillere çevrileceği (Örn: ["en", "de"])
    target_languages: List[str] = [] 
    # ---> YENİ: Videonun orijinal dili (Frontend'den seçilen)
    source_language: str = "tr"

# --- 2. ÇIKIŞ ŞEMALARI (Response) ---

# Veritabanından gelen Video verisini JSON'a çevirmek için
class VideoResponse(BaseModel):
    id: uuid.UUID
    title: str
    file_path: str
    status: str
    # ---> YENİ: Cevap dönerken videonun kaynak dilini de belirtiyoruz
    source_language: str
    # Hedef diller
    target_languages: List[str] = [] 
    created_at: datetime

    # SQLAlchemy objesini okuyabilmesi için bu ayar şart (Pydantic v2)
    model_config = ConfigDict(from_attributes=True)

# Altyazıları listelerken kullanacağımız şema
class SubtitleResponse(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    language: str
    content: List[Dict[str, Any]] # JSON içeriği [{start:0, text:"..."}]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)