from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class WorkflowLogResponse(BaseModel):
    log_id: UUID
    claim_id: UUID
    stage_id: int  # Numeric stage (1-5)
    action_by: UUID
    remarks: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)