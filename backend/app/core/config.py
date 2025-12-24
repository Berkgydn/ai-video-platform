import os

class Settings:
    PROJECT_NAME: str = "AI Video Platform"
    # Docker içindeki env değişkeninden okur
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
settings = Settings()