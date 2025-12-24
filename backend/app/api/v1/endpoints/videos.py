from typing import Any, Dict
import shutil
import os
import uuid
from typing import List # List type hint için gerekli
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.models.video import Video, VideoStatus, Subtitle
from app.services.process_service import process_video_background
# ---> YENİ: Oluşturduğumuz şemayı import ediyoruz
from app.schemas.video import VideoResponse 



router = APIRouter()
MEDIA_DIR = "/app/media"

@router.post("/upload/")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
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

    new_video = Video(
        title=file.filename,
        file_path=file_path,
        status=VideoStatus.UPLOADED
    )
    db.add(new_video)
    await db.commit()
    await db.refresh(new_video)

    background_tasks.add_task(process_video_background, str(new_video.id), AsyncSessionLocal)

    return {"id": str(new_video.id), "title": new_video.title, "status": "processing_started"}

# ---> DÜZELTME BURADA: response_model=List[VideoResponse] yaptık <---
@router.get("/", response_model=List[VideoResponse])
async def list_videos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).order_by(Video.created_at.desc()).offset(skip).limit(limit))
    videos = result.scalars().all()
    return videos # Artık Pydantic bunu otomatik olarak JSON'a çevirecek

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video bulunamadı")
    return video

@router.get("/{video_id}/subtitles")
async def get_subtitles(video_id: str, db: AsyncSession = Depends(get_db)):
    video_result = await db.execute(select(Video).where(Video.id == video_id))
    video = video_result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video bulunamadı")

    result = await db.execute(select(Subtitle).where(Subtitle.video_id == video_id))
    subtitles = result.scalars().all()
    
    return subtitles[0] if subtitles else {"content": []}


@router.put("/{video_id}/subtitles")
async def update_subtitles(
    video_id: str, 
    subtitles: List[Dict[str, Any]], # Frontend'den gelen yeni liste
    db: AsyncSession = Depends(get_db)
):
    """Altyazıları günceller"""
    # 1. Mevcut altyazı kaydını bul
    result = await db.execute(select(Subtitle).where(Subtitle.video_id == video_id))
    subtitle_record = result.scalars().first()
    
    if not subtitle_record:
        raise HTTPException(status_code=404, detail="Altyazı bulunamadı")

    # 2. İçeriği güncelle
    subtitle_record.content = subtitles
    
    # 3. Kaydet
    await db.commit()
    return {"status": "success", "message": "Altyazılar güncellendi"}


@router.delete("/{video_id}")
async def delete_video(video_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Videoyu veritabanında bul
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video bulunamadı")

    # 2. Fiziksel dosyayı diskten sil (media klasöründen)
    if video.file_path and os.path.exists(video.file_path):
        try:
            os.remove(video.file_path)
            print(f"DEBUG: Dosya silindi -> {video.file_path}")
        except Exception as e:
            print(f"UYARI: Dosya silinirken hata oldu: {e}")
            # Dosya silinemese bile veritabanından silelim ki listede kalmasın

    # 3. Veritabanı kaydını sil
    await db.delete(video)
    await db.commit()
    
    return {"status": "deleted", "id": video_id}