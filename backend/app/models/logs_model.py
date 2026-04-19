from sqlalchemy import Column, Integer, Text,String, DateTime, ForeignKey, func
from app.config.database import Base
from uuid import UUID  
import uuid
from sqlalchemy.dialects.postgresql import UUID 

class AuditLog(Base):
    __tablename__ = "audit_logs"
    audit_log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    actionType = Column("actiontype", String(50), nullable=False)
    entityType = Column("entitytype", String(50))
    entityId = Column("entityid", UUID(as_uuid=True))
    ipAddress = Column("ipaddress", String(45))
    userAgent = Column("useragent", String(255))
    timestamp = Column("timestamp", DateTime, server_default=func.now())

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"
    log_id = Column("log_id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column("claim_id", UUID(as_uuid=True), ForeignKey("claims.claim_id"))
    stage_id = Column("stage_id", Integer) # 1 to 5
    action_by = Column("action_by", UUID(as_uuid=True), ForeignKey("users.user_id"))
    remarks = Column("remarks", Text)
    sla_days = Column("sla_days", Integer) # Days taken to complete this stage
    created_at = Column("created_at", DateTime, server_default=func.now())