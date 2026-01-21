from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True, default="Lobi Utama") # <--- Kolom Baru
    sender = Column(String, index=True)
    content = Column(String)
    msg_type = Column(String, default="text")
    file_url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)