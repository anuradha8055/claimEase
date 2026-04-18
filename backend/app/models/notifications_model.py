from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    message         = Column(Text, nullable=False)
    notification_status = Column(String(20), default="UNREAD", nullable=False)
    created_at      = Column(DateTime, server_default=func.now())

    user = relationship("User")