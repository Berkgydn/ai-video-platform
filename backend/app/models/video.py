import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class VideoStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    file_path = Column(String, nullable=False) # Diskteki konumu: /media/video.mp4
    duration = Column(Float, nullable=True)
    status = Column(String, default=VideoStatus.UPLOADED)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    subtitles = relationship("Subtitle", back_populates="video", cascade="all, delete-orphan")

class Subtitle(Base):
    __tablename__ = "subtitles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id"))
    language = Column(String(5), default="tr") # 'tr', 'en' vs.
    content = Column(JSONB, nullable=True) # [{start:0, end:2, text:"Merhaba"}, ...]
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="subtitles")