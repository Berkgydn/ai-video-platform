import os
from app.services.refinement.engines.openai_refiner import OpenAIRefiner
from app.services.refinement.engines.ollama_refiner import OllamaRefiner

def get_refiner():
    mode = os.getenv("REFINEMENT_MODE", "LOCAL").upper()
    
    if mode == "API":
        return OpenAIRefiner()
    else:
        return OllamaRefiner()