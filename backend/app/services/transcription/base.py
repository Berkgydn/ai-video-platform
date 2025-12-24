from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseTranscriber(ABC):
    """
    Tüm transkripsiyon motorları bu sınıfı miras almak zorundadır.
    """
    
    @abstractmethod
    def transcribe(self, audio_path: str) -> List[Dict[str, Any]]:
        """
        Geriye şu formatta bir liste dönmelidir:
        [
            {"start": 0.0, "end": 2.5, "text": "Merhaba dünya"},
            ...
        ]
        """
        pass