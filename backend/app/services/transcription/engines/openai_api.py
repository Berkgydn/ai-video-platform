import os
from openai import OpenAI
from app.services.transcription.base import BaseTranscriber

class OpenAIWhisperTranscriber(BaseTranscriber):
    def __init__(self):
        # API Key kontrolü
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Key yoksa hata verip işlemi durdurur
            raise ValueError("❌ OPENAI_API_KEY bulunamadı! .env dosyasını kontrol et.")
        
        self.client = OpenAI(api_key=api_key)
        print("☁️ OpenAI Whisper API Modu Başlatıldı (Bulut Tabanlı)")

    def transcribe(self, audio_path: str):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Ses dosyası bulunamadı: {audio_path}")

        print(f"☁️ API'ye gönderiliyor: {audio_path}")

        try:
            with open(audio_path, "rb") as audio_file:
                # OpenAI Whisper API isteği
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json", # Zaman damgaları (timestamp) için şart
                    #language="tr" 
                )

            # Gelen cevabı senin projenin formatına (Start/End/Text) çeviriyoruz
            formatted_segments = []
            
            for segment in transcript.segments:
                formatted_segments.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip()
                })

            print("✅ API Transkripsiyonu Tamamlandı!")
            return formatted_segments

        except Exception as e:
            print(f"🚨 OpenAI API Hatası: {e}")
            raise e