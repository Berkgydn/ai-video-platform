# 🎥 AI-Powered Video Transcription & Dubbing Platform

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=flat-square&logo=docker)
![Python](https://img.shields.io/badge/Backend-FastAPI-green?style=flat-square&logo=python)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

**Production-grade standartlarında geliştirilen, yapay zeka destekli video altyazı, düzenleme ve dublaj platformu.**

Bu proje, yerel olarak çalışan gelişmiş Speech-to-Text modellerini (OpenAI Whisper) modern bir web arayüzü ile birleştirerek, içerik üreticileri için uçtan uca bir altyazı yönetim ve dublaj sistemi sunar.

---

## 🏗 Proje Vizyonu ve Mimari

Bu platform sadece bir "wrapper" (sarmalayıcı) değil, ölçeklenebilir bir **SaaS (Software as a Service)** mimarisi üzerine inşa edilmiştir.

### Temel Prensipler:
1.  **Strategy Pattern (AI Engine Agnostic):** Transkripsiyon motoru soyutlanmıştır. Sistem, yerel modellerden (Whisper) Cloud API'lere (OpenAI, Google STT) tek bir konfigürasyonla geçiş yapabilir.
2.  **Language Agnostic Design:** Veritabanı ve iş mantığı, "tek dil" sınırlamasından kurtarılmıştır. Çoklu dil desteği, çapraz çeviri ve dublaj senaryoları için zemin hazırdır.
3.  **Modern Frontend Deneyimi:** Klasik template yapıları yerine, React ve Tailwind CSS ile güçlendirilmiş, Single Page Application (SPA) mantığında çalışan dinamik bir "Altyazı Editörü" sunar.

---

## 🗺️ Detaylı Yol Haritası (Master Plan)

### ✅ Faz 1: Temel Altyapı ve Veri Akışı (Tamamlandı)
*Projenin üzerine inşa edileceği sağlam zemin.*
- [x] **Docker Orkestrasyonu:** Backend (FastAPI), Frontend (React) ve Veritabanı (Postgres) servislerinin izole konteynerlerde ayağa kaldırılması.
- [x] **Veritabanı Mimarisi:** Videolar, altyazılar ve projeler için ilişkisel tabloların (SQLAlchemy/Async) tasarlanması.
- [x] **Video Ingestion:** Büyük dosyaların (MP4/MKV) stream edilerek yüklenmesi ve güvenli depolanması.
- [x] **Video Yönetimi (CRUD):** Yükleme, listeleme, silme (Disk + DB) işlemlerinin tamamlanması.
- [x] **Video Oynatma:** Statik dosya sunucusu yapılandırması ve tarayıcı entegrasyonu.
- [x] **Frontend Dashboard:** Kullanıcı arayüzü iskeleti ve API servis katmanı.

### 🚧 Faz 2: AI Motoru ve Transkripsiyon (Sıradaki Adım)
*Videonun sese, sesin metne dönüştüğü aşama.*
- [x] **Whisper Entegrasyonu:** OpenAI Whisper modelinin projeye eklenmesi ve model yönetimi.
- [x] **Ses Ayrıştırma (Audio Extraction):** FFmpeg ile videolardan ses kanalının (WAV/MP3) izole edilmesi.
- [x] **Asenkron İş Kuyruğu:** Uzun süren AI işlemleri için `Celery` ve `Redis` entegrasyonu.
- [x] **Inference & Storage:** Sesin metne çevrilmesi ve zaman damgalı (timestamped) verinin JSONB olarak veritabanına işlenmesi.

### 🟡 Faz 3: Akıllı Altyazı Editörü
*Kullanıcı etkileşimi ve düzenleme.*
- [x] **Waveform Görselleştirmesi:** `wavesurfer.js` ile ses dalgalarının çizilmesi.
- [x] **İnteraktif Bloklar:** Zaman kaydırma, metin düzenleme ve karaoke efekti.
- [x] **SRT/VTT Export:** Standart formatlarda çıktı alma.

### 🟡 Faz 4: Globalleşme (Çeviri)
- [ ] **Dil Tespiti:** Kaynak dilin otomatik algılanması.
- [ ] **AI Çeviri:** Altyazıların LLM (GPT/Llama) desteğiyle diğer dillere çevrilmesi.
- [ ] **Split View Editor:** Orijinal ve hedef dilin yan yana düzenlenmesi.

### 🔴 Faz 5: AI Dublaj (Vizyon)
- [ ] **TTS (Text-to-Speech):** Çevrilen metnin sese dönüştürülmesi.
- [ ] **Voice Cloning:** Orijinal konuşmacının ses tonunun kopyalanması.
- [ ] **Vocal Removal:** Arka plan müziğini koruyarak orijinal konuşmanın silinmesi.
- [ ] **Audio Ducking & Mixing:** Yeni sesin videoya montajlanması.

### 🔴 Faz 6: Ticarileştirme (SaaS)
- [ ] **Auth:** JWT tabanlı kimlik doğrulama.
- [ ] **GPU Deployment:** Sistemin bulut GPU sunucularına taşınması.

---

## 🛠 Teknoloji Yığını (Tech Stack)

Proje, endüstri standartlarında modern teknolojiler kullanılarak geliştirilmektedir:

### Backend & AI
* **Python 3.10+**: Ana geliştirme dili.
* **FastAPI**: Yüksek performanslı, asenkron REST API framework'ü.
* **SQLAlchemy (Async)**: Modern ORM yapısı.
* **OpenAI Whisper**: Transkripsiyon çekirdeği.
* **FFmpeg**: Video/Ses işleme ve format manipülasyonu.
* **Celery & Redis (Planlanan)**: Asenkron görev kuyruğu.

### Frontend
* **React (Vite)**: Hızlı ve modüler UI geliştirme.
* **Tailwind CSS**: Modern ve duyarlı (responsive) tasarım sistemi.
* **Axios**: API iletişimi.

### DevOps & Database
* **Docker & Docker Compose**: Tüm servislerin orkestrasyonu.
* **PostgreSQL**: Güvenilir ilişkisel veritabanı.

---

## 💻 Kurulum ve Çalıştırma (Geliştirme Ortamı)

Projeyi yerel ortamınızda çalıştırmak için **Docker** ve **Git** kurulu olmalıdır.

```bash
# 1. Projeyi klonlayın
git clone [https://github.com/Berkgydn/ai-video-platform.git](https://github.com/Berkgydn/ai-video-platform.git)
cd ai-video-platform

# 2. Örnek çevre değişkenlerini ayarlayın
cp .env.example .env

# 3. Docker konteynerlerini ayağa kaldırın
docker-compose up --build

#Servisler şu portlarda çalışacaktır:

Frontend: http://localhost:5173

Backend API: http://localhost:8000

API Docs: http://localhost:8000/docs