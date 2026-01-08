import torch
import os
from transformers import pipeline
from app.services.transcription.base import BaseTranscriber

# Docker içindeki model yolu
MODEL_DIR = "/app/ai_models/custom_tr_model"

class LocalWhisperTranscriber(BaseTranscriber):
    def __init__(self):
        print(f"🤖 Özel Model Yükleniyor: {MODEL_DIR}")
        
        # Cihaz kontrolü
        self.device_avail = torch.cuda.is_available()
        device = "cuda:0" if self.device_avail else "cpu"
        torch_dtype = torch.float16 if self.device_avail else torch.float32

        print(f"⚙️ Çalışma Ortamı: {'GPU (Hızlı) 🚀' if self.device_avail else 'CPU (Yavaş) 🐢'}")

        # --- BELLEK AYARLARI ---
        # 6GB VRAM için Batch Size'ı 1'e çekiyoruz. 
        # Bu, GPU belleğinin patlamasını engeller.
        optimal_batch_size = 1 if self.device_avail else 1

        try:
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=MODEL_DIR,
                tokenizer=MODEL_DIR,
                chunk_length_s=30,
                batch_size=optimal_batch_size, 
                device=device,
                torch_dtype=torch_dtype,
            )
            
            # Generation config ayarlarını güvenli hale getirme
            if self.pipe.model.generation_config is not None:
                self.pipe.model.generation_config.forced_decoder_ids = None

            print(f"✅ Model Yüklendi! (Batch Size: {optimal_batch_size})")
            
        except Exception as e:
            print(f"❌ Model Yükleme Hatası: {e}")
            raise e

    # DEĞİŞİKLİK 1: **kwargs eklendi.
    # Artık 'language' parametresi gelse bile hata vermez, kwargs içinde tutulur.
    def transcribe(self, audio_path: str, **kwargs):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Ses dosyası bulunamadı: {audio_path}")

        # Gelen dil parametresini sadece bilgi amaçlı logluyoruz, kullanmıyoruz.
        requested_lang = kwargs.get('language', 'Yok')
        print(f"🎤 Transkripsiyon başladı: {audio_path}")
        print(f"ℹ️ Servis dili '{requested_lang}' istedi ancak biz OTOMATİK ALGILAMA kullanacağız.")
        
        # --- DOĞRULUK vs BELLEK DENGESİ ---
        # 6GB VRAM için num_beams=3 idealdir. 5 fazla gelebilir.
        beam_count = 3 if self.device_avail else 1

        # DEĞİŞİKLİK 2: language parametresi YOK. Model sesi dinleyip kendi bulacak.
        generate_kwargs = {
            "task": "transcribe",
            "forced_decoder_ids": None, # Oto algılama için kritik
            # Sabit 50257 yerine dinamik ID kullanıyoruz (Daha güvenli)
            "eos_token_id": self.pipe.tokenizer.eos_token_id, 
            "pad_token_id": self.pipe.tokenizer.pad_token_id, 
            
            "num_beams": beam_count, 
            "do_sample": False,
            "length_penalty": 1.0,
            "early_stopping": True
        }

        print(f"📊 Beam Size: {beam_count} (GPU: {self.device_avail})")

        try:
            prediction = self.pipe(
                audio_path, 
                return_timestamps=True, 
                generate_kwargs=generate_kwargs
            )
        except Exception as e:
            # Hata durumunda CUDA belleğini temizlemeyi dene
            if "CUDA out of memory" in str(e):
                print("⚠️ CUDA Belleği yetmedi! Torch cache temizleniyor...")
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            print(f"🚨 Pipeline Hatası Detayı: {str(e)}")
            raise e
        
        formatted_segments = []
        chunks = prediction.get("chunks", [])
        
        if not chunks:
            formatted_segments.append({
                "start": 0.0,
                "end": 0.0,
                "text": prediction["text"].strip()
            })
        else:
            for chunk in chunks:
                start, end = chunk["timestamp"]
                if end is None:
                    end = start + 2.0 

                formatted_segments.append({
                    "start": start,
                    "end": end,
                    "text": chunk["text"].strip()
                })
            
        return formatted_segments