from typing import Any, Dict
import shutil
import os
import uuid
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.models.video import Video, VideoStatus, Subtitle
from app.services.process_service import process_video_background
from app.schemas.video import VideoResponse 

router = APIRouter()
MEDIA_DIR = "/app/media"

@router.post("/upload/")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    # DÜZELTME: Frontend'den gelen form verilerini karşılıyoruz
    source_language: str = Form("tr"), # Varsayılan 'tr' ama frontend gönderirse o geçerli
    target_languages: str = Form(None), # String olarak gelecek: "en,es" gibi
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(('.mp4', '.mov', '.avi', '.mkv')):
        raise HTTPException(status_code=400, detail="Desteklenmeyen dosya formatı.")
    
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(MEDIA_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya kaydedilemedi: {str(e)}")

    # Gelen string halindeki dilleri listeye çeviriyoruz
    # Örn: Frontend "en,fr" gönderirse -> ['en', 'fr'] olur.
    target_langs_list = []
    if target_languages:
        # Virgülle ayrılmış stringi listeye çevir ve boşlukları temizle
        target_langs_list = [lang.strip() for lang in target_languages.split(",") if lang.strip()]

    # Veritabanına kaydederken dilleri ekliyoruz
    new_video = Video(
        title=file.filename,
        file_path=file_path,
        status=VideoStatus.UPLOADED,
        source_language=source_language,  # Seçilen kaynak dil
        target_languages=target_langs_list # Seçilen hedef diller
    )
    
    db.add(new_video)
    await db.commit()
    await db.refresh(new_video)

    # Background task'a gönder
    background_tasks.add_task(process_video_background, str(new_video.id), AsyncSessionLocal)

    return {"id": str(new_video.id), "title": new_video.title, "status": "processing_started"}

@router.get("/", response_model=List[VideoResponse])
async def list_videos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).order_by(Video.created_at.desc()).offset(skip).limit(limit))
    videos = result.scalars().all()
    return videos

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video bulunamadı")
    return video

# DÜZELTME: Artık 'language' parametresi alıyor ve o dili döndürüyor
@router.get("/{video_id}/subtitles")
async def get_subtitles(
    video_id: str, 
    language: str = None, # Opsiyonel query parametresi (örn: ?language=en)
    db: AsyncSession = Depends(get_db)
):
    # 1. Video kontrolü
    video_result = await db.execute(select(Video).where(Video.id == video_id))
    video = video_result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video bulunamadı")

    # 2. Altyazı sorgusu
    query = select(Subtitle).where(Subtitle.video_id == video_id)
    
    # Eğer frontend spesifik bir dil istediyse onu filtrele
    if language:
        query = query.where(Subtitle.language == language)

    result = await db.execute(query)
    subtitles = result.scalars().all()
    
    # 3. Sonuç döndürme
    if not subtitles:
        # Hiç altyazı yoksa boş içerik dön
        return {"content": []}
        
    # Eğer dil belirtildiyse ve bulunduysa (zaten filtrelendiği için) ilkini dön
    # Dil belirtilmediyse de varsayılan olarak ilk bulduğunu dön
    return subtitles[0]

@router.put("/{video_id}/subtitles")
async def update_subtitles(
    video_id: str, 
    subtitles: List[Dict[str, Any]], 
    # Buraya da ileride language parametresi eklemek gerekebilir
    # Şimdilik varsayılanı güncelliyor
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Subtitle).where(Subtitle.video_id == video_id))
    subtitle_record = result.scalars().first()
    
    if not subtitle_record:
        raise HTTPException(status_code=404, detail="Altyazı bulunamadı")

    subtitle_record.content = subtitles
    await db.commit()
    return {"status": "success", "message": "Altyazılar güncellendi"}

@router.delete("/{video_id}")
async def delete_video(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video bulunamadı")

    if video.file_path and os.path.exists(video.file_path):
        try:
            os.remove(video.file_path)
            print(f"DEBUG: Dosya silindi -> {video.file_path}")
        except Exception as e:
            print(f"UYARI: Dosya silinirken hata oldu: {e}")

    await db.delete(video)
    await db.commit()
    
    return {"status": "deleted", "id": video_id}