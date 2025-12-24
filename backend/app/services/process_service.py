from sqlalchemy.ext.asyncio import AsyncSession
from app.models.video import Video, VideoStatus, Subtitle
from app.services.video_manager import VideoManager
from app.services.transcription.engines.local_whisper import LocalWhisperTranscriber
import json
import traceback

# Modeli global olarak bir kere yükleyelim (RAM tasarrufu)
_transcriber = None

def get_transcriber():
    global _transcriber
    if _transcriber is None:
        _transcriber = LocalWhisperTranscriber()
    return _transcriber

async def process_video_background(video_id: str, db_session_factory):
    """
    Arka planda çalışacak ana fonksiyon.
    """
    async with db_session_factory() as db:
        video = await db.get(Video, video_id)
        if not video:
            print(f"❌ Video bulunamadı ID: {video_id}")
            return

        try:
            # 1. Durumu güncelle: Processing
            print(f"⚙️ İşlem başlıyor: {video.title}")
            video.status = VideoStatus.PROCESSING
            await db.commit()

            # 2. Sesi ayıkla
            audio_path = VideoManager.extract_audio(video.file_path)
            
            # 3. Transcribe et
            transcriber = get_transcriber()
            segments = transcriber.transcribe(audio_path)

            # 4. Sonucu Altyazı tablosuna kaydet
            # DÜZELTME: is_original=True parametresini kaldırdık.
            new_subtitle = Subtitle(
                video_id=video.id,
                language="tr",
                content=segments 
            )
            db.add(new_subtitle)

            # 5. Durumu güncelle: Completed
            video.status = VideoStatus.COMPLETED
            print(f"✅ İşlem BAŞARIYLA tamamlandı: {video.title}")

        except Exception as e:
            print(f"❌ HATA OLUŞTU: {str(e)}")
            traceback.print_exc()
            video.status = VideoStatus.FAILED
        finally:
            await db.commit()