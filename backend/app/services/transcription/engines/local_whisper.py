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
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        try:
            # 1. Pipeline'ı başlat
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=MODEL_DIR,
                tokenizer=MODEL_DIR,
                chunk_length_s=30,
                batch_size=8,
                device=device,
                torch_dtype=torch_dtype,
            )
            
            # __init__ içindeki düzeltmeyi de koruyoruz (Çifte dikiş)
            if self.pipe.model.generation_config is not None:
                eos_id = self.pipe.model.generation_config.eos_token_id
                if isinstance(eos_id, list):
                    self.pipe.model.generation_config.eos_token_id = eos_id[0]
                
                # Forced decoder ids temizliği
                self.pipe.model.generation_config.forced_decoder_ids = None

            print("✅ Model Başarıyla Yüklendi! (Hugging Face Transformers)")
            
        except Exception as e:
            print(f"❌ Model Yükleme Hatası: {e}")
            raise e

    def transcribe(self, audio_path: str):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Ses dosyası bulunamadı: {audio_path}")

        print(f"🎤 Transkripsiyon başladı: {audio_path}")
        
        # ---> KESİN ÇÖZÜM BURADA <---
        # Config dosyasını değil, buraya yazdığımız değerleri kullanmaya zorluyoruz.
        generate_kwargs = {
            "language": "turkish",
            "task": "transcribe",
            "forced_decoder_ids": None,
            "eos_token_id": 50257,  # <--- KRİTİK EKLEME: Listeyi ezip Integer veriyoruz
            "pad_token_id": 50257   # <--- KRİTİK EKLEME
        }

        try:
            prediction = self.pipe(
                audio_path, 
                return_timestamps=True, 
                generate_kwargs=generate_kwargs
            )
        except Exception as e:
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