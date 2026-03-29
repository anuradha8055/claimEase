from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.claim_model import ClaimStatus

class WorkflowLogResponse(BaseModel):
    log_id: int
    claim_id: int
    action_by_user_id: int
    from_status: Optional[ClaimStatus]
    to_status: ClaimStatus
    remarks: Optional[str]
    created_at: datetime
    
    # We add this so the frontend can show the name of the officer who approved it
    # action_by_name: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)