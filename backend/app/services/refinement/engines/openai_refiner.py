import os
from openai import OpenAI
from app.services.refinement.base import BaseRefiner

class OpenAIRefiner(BaseRefiner):
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def refine(self, segments, target_lang="en"):
        print("🧠 [API] OpenAI ile metin düzeltiliyor...")
        
        refined_segments = []
        
        for seg in segments:
            prompt = f"""
            Aşağıdaki metindeki yazım hatalarını bağlama göre düzelt ve {target_lang} diline çevir. Sadece sonucu yaz.
            Metin: {seg['text']}
            """
            
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}]
                )
                
                new_text = response.choices[0].message.content.strip()
                
                new_seg = seg.copy()
                new_seg["text"] = new_text
                refined_segments.append(new_seg)
            except Exception as e:
                print(f"🚨 OpenAI Hatası: {e}")
                refined_segments.append(seg)
                
        return refined_segments