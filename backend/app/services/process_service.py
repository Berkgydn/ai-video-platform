from sqlalchemy.ext.asyncio import AsyncSession
from app.models.video import Video, VideoStatus, Subtitle
from app.services.video_manager import VideoManager

# Transkripsiyon (Whisper) Fabrikası
from app.services.transcription.factory import get_transcriber as create_transcriber_instance

# Refinement (Düzeltme/Çeviri) Fabrikası
from app.services.refinement.factory import get_refiner

import json
import traceback
import gc 
import torch 

# Modeli global olarak tutuyoruz (Singleton)
_transcriber = None

def get_transcriber():
    global _transcriber
    if _transcriber is None:
        print("🔌 Transcriber motoru (Whisper) yükleniyor...")
        _transcriber = create_transcriber_instance()
    return _transcriber

def release_transcriber_memory():
    """
    Whisper modelini bellekten siler. Qwen'e yer açmak için kritik.
    """
    global _transcriber
    if _transcriber is not None:
        print("🧹 Whisper modeli bellekten temizleniyor...")
        del _transcriber
        _transcriber = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("✨ Bellek temizlendi! Sıra çeviri işlemlerinde.")

async def process_video_background(video_id: str, db_session_factory):
    async with db_session_factory() as db:
        video = await db.get(Video, video_id)
        if not video:
            print(f"❌ Video bulunamadı ID: {video_id}")
            return

        try:
            # 1. Bilgilendirme ve Durum Güncelleme
            print(f"⚙️ İşlem başlıyor: {video.title}")
            print(f"🏳️ Kaynak Dil: {video.source_language}") # Örn: 'es'
            print(f"🎯 Hedef Diller: {video.target_languages}") # Örn: ['en', 'de']
            
            video.status = VideoStatus.PROCESSING
            await db.commit()

            # 2. Sesi ayıkla
            audio_path = VideoManager.extract_audio(video.file_path)
            
            # --- AŞAMA 1: TRANSKRİPSİYON (KAYNAK DİL) ---
            print(f"🎤 [1/3] Transkripsiyon Başlıyor ({video.source_language})...")
            transcriber = get_transcriber()
            
            # Whisper'a videonun orijinal dilini söylüyoruz. 
            # Bu sayede 'es' dediğimizde İspanyolca anlar.
            raw_segments = transcriber.transcribe(audio_path, language=video.source_language)
            
            # 🔥 ANA DİLİ KAYDET
            print(f"💾 Orijinal ({video.source_language}) altyazı kaydediliyor...")
            original_subtitle = Subtitle(
                video_id=video.id,
                language=video.source_language, # Seçilen orijinal dil
                content=raw_segments
            )
            db.add(original_subtitle)
            await db.commit()

            # --- ARA TEMİZLİK ---
            release_transcriber_memory()

            # --- AŞAMA 2: ÇEVİRİ DÖNGÜSÜ ---
            target_langs = video.target_languages or []
            
            if target_langs:
                print(f"🧠 [2/3] Çeviri Motoru Hazırlanıyor...")
                refiner = get_refiner()

                for lang_code in target_langs:
                    # Kaynak dili kendisine çevirmeye çalışma
                    if lang_code == video.source_language:
                        continue

                    try:
                        print(f"🌍 Çevriliyor: {video.source_language.upper()} -> {lang_code.upper()}...")
                        
                        # AI'ya hem kaynak metni hem de kaynak dili veriyoruz
                        # Not: Eğer refiner.refine metodun source_lang parametresi almıyorsa,
                        # sadece target_lang ile de çalışır ama Qwen'e context vermek iyidir.
                        refined_segments = refiner.refine(
                            raw_segments, 
                            target_lang=lang_code
                        )
                        
                        new_subtitle = Subtitle(
                            video_id=video.id,
                            language=lang_code,
                            content=refined_segments
                        )
                        db.add(new_subtitle)
                        await db.commit()
                        print(f"✅ {lang_code.upper()} çevirisi kaydedildi.")
                        
                    except Exception as lang_error:
                        print(f"⚠️ {lang_code} çevirisinde hata: {lang_error}")

            # 3. Durumu güncelle: Completed
            video.status = VideoStatus.COMPLETED
            print(f"🏁 Tüm işlemler BAŞARIYLA tamamlandı: {video.title}")

        except Exception as e:
            print(f"❌ KRİTİK HATA: {str(e)}")
            traceback.print_exc()
            video.status = VideoStatus.FAILED
        finally:
            release_transcriber_memory()
            await db.commit()