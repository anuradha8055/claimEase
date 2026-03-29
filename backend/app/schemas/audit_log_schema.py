from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AuditLogResponse(BaseModel):
    audit_log_id: int
    user_id: int
    action_type: str
    entity_type: str
    entity_id: int
    timestamp: datetime
    ip_address: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)