# 🎥 AI-Powered Video Transcription & Dubbing Platform

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=flat-square&logo=docker)
![Python](https://img.shields.io/badge/Backend-FastAPI-green?style=flat-square&logo=python)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

**Production-grade standartlarında geliştirilen, yapay zeka destekli video altyazı, düzenleme ve dublaj platformu.**

Bu proje, yerel olarak çalışan gelişmiş Speech-to-Text modellerini (OpenAI Whisper) modern bir web arayüzü ile birleştirerek, içerik üreticileri için uçtan uca bir altyazı yönetim sistemi sunar.

---

## 🏗 Proje Vizyonu ve Mimari

Bu platform sadece bir "wrapper" (sarmalayıcı) değil, ölçeklenebilir bir **SaaS (Software as a Service)** mimarisi üzerine inşa edilmiştir.

### Temel Prensipler:
1.  **Strategy Pattern (AI Engine Agnostic):** Transkripsiyon motoru soyutlanmıştır. Şu anda yerel çalışan (Dockerize edilmiş) özel modeller kullanılmaktadır, ancak sistem tek bir konfigürasyon değişikliği ile Cloud API'lere (OpenAI, Google STT) geçiş yapabilecek esneklikte tasarlanmıştır.
2.  **Language Agnostic Design:** Veritabanı ve iş mantığı, "tek dil" sınırlamasından kurtarılmıştır. Çoklu dil desteği, çapraz çeviri ve dublaj senaryoları için zemin hazırdır.
3.  **Modern Frontend Deneyimi:** Klasik template yapıları yerine, React ve Tailwind CSS ile güçlendirilmiş, Single Page Application (SPA) mantığında çalışan dinamik bir "Altyazı Editörü" sunar.

---

## 🚀 Özellikler (Yol Haritası)

### 🟢 Faz 1: MVP - Core Transcription (Şu Anki Odak)
- [x] **Konteynerizasyon:** Tamamen Dockerize edilmiş geliştirme ortamı.
- [ ] **Video Ingestion:** Sürükle-bırak video yükleme ve güvenli depolama.
- [ ] **AI İşleme:** Yerel Whisper modeli ile GPU/CPU tabanlı ses-metin dönüşümü.
- [ ] **Akıllı Editör:** Videoyla tam senkronize çalışan, dalga formu (waveform) destekli altyazı düzenleme arayüzü.
- [ ] **SRT Export:** Standartlara uygun altyazı dosyası çıktısı.

### 🟡 Faz 2: Globalleşme (Planlanan)
- [ ] Çoklu dil desteği ve otomatik çeviri.
- [ ] Cloud API entegrasyonları (Hybrid Architecture).
- [ ] Kullanıcı rolleri ve proje yönetimi.

### 🔴 Faz 3: Dublaj (Vizyon)
- [ ] Text-to-Speech (TTS) entegrasyonu.
- [ ] Orijinal sesin silinip (vocal removal), AI sesinin senkronize edilmesi.

---

## 🛠 Teknoloji Yığını (Tech Stack)

Proje, endüstri standartlarında modern teknolojiler kullanılarak geliştirilmektedir:

### Backend & AI
* **Python 3.10+**: Ana geliştirme dili.
* **FastAPI**: Yüksek performanslı, asenkron REST API framework'ü.
* **SQLAlchemy (Async)**: Modern ORM yapısı.
* **Celery & Redis**: Uzun süren video işleme görevleri için asenkron kuyruk yönetimi.
* **FFmpeg**: Video ve ses manipülasyonu.
* **OpenAI Whisper**: Transkripsiyon çekirdeği.

### Frontend
* **React (Vite)**: Hızlı ve modüler UI geliştirme.
* **Tailwind CSS**: Modern ve duyarlı (responsive) tasarım sistemi.
* **Zustand**: Hafif ve güçlü State yönetimi.
* **Axios**: API iletişimi.

### DevOps & Database
* **Docker & Docker Compose**: Tüm servislerin orkestrasyonu.
* **PostgreSQL**: Güvenilir ilişkisel veritabanı.
* **JSONB**: Altyazı verilerinin yüksek performanslı saklanması için.

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