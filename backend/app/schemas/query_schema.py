from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class QueryRaise(BaseModel):
    claim_id:     int
    query_message: str
    raised_stage: str


class QueryRespond(BaseModel):
    response_text: str


class QueryResponse(BaseModel):
    query_id: UUID
    claim_id: UUID
    raised_by: UUID
    raised_stage: int
    query_text: str
    status: str
    response_text: Optional[str] = None
    created_at: datetime
    responded_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)