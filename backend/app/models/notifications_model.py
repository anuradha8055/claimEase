from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base
import uuid

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column("notification_id", Integer, primary_key=True, autoincrement=True)
    user_id         = Column("user_id", UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)

    message         = Column("message", Text, nullable=False)
    notification_status = Column("notificationstatus", String(20), default="UNREAD", nullable=False)
    created_at      = Column("created_at", DateTime, server_default=func.now())

    user = relationship("User")