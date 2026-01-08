# Python 3.10 kullan
FROM python:3.10-slim

WORKDIR /app

# Sistem kütüphanelerini yükle (pip'in donmaması için gereklidir)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pip'i güncelle (Eski sürümler büyük dosyalarda hata verir)
RUN pip install --upgrade pip

# --- KRİTİK ---
# Torch'u requirements.txt'den değil, direkt PyTorch sunucusundan çekiyoruz.
# Bu sunucu çok daha hızlıdır ve timeout hatası vermez.
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 --no-cache-dir

# Kalan kütüphaneleri (FastAPI, SQLAlchemy vs.) normal şekilde yükle
COPY requirements.txt .
# SENİN İSTEDİĞİN KISA VE TEMİZ KOMUT:
RUN pip install --no-cache-dir -r requirements.txt

# Kodları kopyala
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]