from sqlalchemy import Column, Integer, Text,String, DateTime, ForeignKey, func
from app.config.database import Base
from uuid import UUID  
import uuid
from sqlalchemy.dialects.postgresql import UUID 

class AuditLog(Base):
    __tablename__ = "audit_logs"
    audit_log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    actionType = Column(String(50), nullable=False)
    entityType = Column(String(50))
    entityId = Column(UUID(as_uuid=True))
    ipAddress = Column(String(45))
    userAgent = Column(String(255))
    timestamp = Column(DateTime, server_default=func.now())

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"
    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.claim_id"))
    stage_id = Column(Integer) # 1 to 5
    action_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())