from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.config.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    action_type  = Column(String(50),  nullable=False)
    entity_type  = Column(String(50),  nullable=False)
    entity_id    = Column(Integer,     nullable=False)
    ip_address   = Column(String(45))
    user_agent   = Column(String(255))
    timestamp    = Column(DateTime, nullable=False, server_default=func.now())
