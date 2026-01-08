import requests
import json
from app.services.refinement.base import BaseRefiner

class OllamaRefiner(BaseRefiner):
    def refine(self, segments, target_lang="en"):
        print(f"🧠 [LOCAL] Ollama (Qwen 2.5) ile metin düzeltiliyor ve çevriliyor ({target_lang})...")
        
        # Docker içindeki Ollama adresi
        url = "http://ollama:11434/api/generate"
        
        refined_segments = []
        
        for seg in segments:
            # --- DÜZELTME 1: Prompt Güçlendirildi ---
            # Talimatları İngilizce veriyoruz çünkü Qwen talimatları İngilizce daha iyi anlıyor.
            # Hallüsinasyonu önlemek için kesin kurallar koyduk.
            prompt = f"""
            Role: You are a professional video subtitle translator.
            Task: Translate the following text into the target language code: '{target_lang}'.
            
            Rules:
            1. Output ONLY the translated text. 
            2. Do NOT add explanations, notes, or conversational filler (like "Here is the translation").
            3. Maintain the original meaning and tone.
            4. If the text is unclear, translate the literal meaning.

            Text to Translate:
            "{seg['text']}"
            """
            
            payload = {
                "model": "qwen2.5:3b", 
                "prompt": prompt,
                "stream": False,
                # --- DÜZELTME 2: Yaratıcılığı Kısıtlama ---
                # temperature 0 yaparak modelin saçmalama (hallucination) riskini en aza indiriyoruz.
                "options": {
                    "temperature": 0.0,
                    "num_ctx": 4096 
                }
            }
            
            try:
                # --- DÜZELTME 3: Timeout Artırıldı ---
                # 60 saniye yetmiyor, 300 (5 dakika) yapıyoruz.
                response = requests.post(url, json=payload, timeout=300)
                
                # HTTP hata kontrolü
                response.raise_for_status()
                
                result = response.json()
                
                # Cevabı al ve temizle (Tırnak işaretlerini vs temizle)
                translated_text = result.get("response", "").strip().strip('"')
                
                new_seg = seg.copy()
                new_seg["text"] = translated_text
                refined_segments.append(new_seg)
                
            except Exception as e:
                print(f"⚠️ Ollama Hatası (Segment atlandı): {e}")
                refined_segments.append(seg) # Hata olursa orijinali kalsın, boş kalmasın.

        return refined_segments