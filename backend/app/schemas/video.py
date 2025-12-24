from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid

# Veritabanından gelen veriyi JSON'a çevirmek için bu kalıbı kullanacağız
class VideoResponse(BaseModel):
    id: uuid.UUID
    title: str
    file_path: str
    status: str
    created_at: datetime

    # SQLAlchemy objesini okuyabilmesi için bu ayar şart (Pydantic v2)
    model_config = ConfigDict(from_attributes=True)