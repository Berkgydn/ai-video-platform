from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseRefiner(ABC):
    @abstractmethod
    def refine(self, segments: List[Dict[str, Any]], target_lang: str = "en") -> List[Dict[str, Any]]:
        pass