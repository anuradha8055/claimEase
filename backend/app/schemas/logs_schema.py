from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AuditLogResponse(BaseModel):
    audit_log_id: UUID
    user_id: UUID
    actionType: str
    entityType: Optional[str] = None
    entityId: Optional[UUID] = None
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)