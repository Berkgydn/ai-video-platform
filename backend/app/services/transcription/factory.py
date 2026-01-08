import os
from app.services.transcription.engines.local_whisper import LocalWhisperTranscriber
from app.services.transcription.engines.openai_api import OpenAIWhisperTranscriber

def get_transcriber():
    """
    .env dosyasındaki TRANSCRIPTION_MODE ayarına bakar.
    'API' ise OpenAI motorunu, değilse Local motoru getirir.
    """
    mode = os.getenv("TRANSCRIPTION_MODE", "LOCAL").upper()

    if mode == "API":
        return OpenAIWhisperTranscriber()
    else:
        # Varsayılan (Local)
        return LocalWhisperTranscriber()