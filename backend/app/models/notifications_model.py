from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    title           = Column(String(100), nullable=False)
    message         = Column(Text, nullable=False)
    
    # Link to the claim so they can click the notification to open the claim
    claim_id        = Column(Integer, ForeignKey("claims.claim_id"), nullable=True)
    
    is_read         = Column(Boolean, default=False)
    created_at      = Column(DateTime, server_default=func.now())

    user = relationship("User")