# AI Destekli Video Altyazı ve Dublaj Platformu

Bu proje, yapay zeka destekli bir video işleme platformudur. Kullanıcıların yüklediği videoları otomatik olarak metne döker (transcription), gelişmiş bir arayüzde düzenleme imkanı sunar ve altyazı (SRT) çıktısı verir.

## 🚀 Özellikler (Faz 1 - MVP)
- **Video Yükleme:** Sürükle-bırak desteği.
- **AI Transkripsiyon:** Yerel çalışan Türkçe Speech-to-Text modeli (Gizlilik odaklı).
- **Akıllı Editör:** Videoyla senkronize çalışan, React tabanlı modern altyazı düzenleyicisi.
- **Dışa Aktarım:** .SRT formatında altyazı indirme.

## 🛠 Teknoloji Yığını
- **Backend:** Python, FastAPI, SQLAlchemy
- **AI Core:** PyTorch, OpenAI Whisper (Local)
- **Frontend:** React, Vite, Tailwind CSS
- **Database:** PostgreSQL
- **Infrastructure:** Docker & Docker Compose