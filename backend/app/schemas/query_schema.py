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
    model_config = ConfigDict(from_attributes=True)

    query_id:      int
    claim_id:      int
    raised_by:     int
    raised_stage:  str
    query_message: str
    status:        str
    response_text: Optional[str]
    created_at:    datetime
    resolved_at:   Optional[datetime]
    responded_at:  Optional[datetime]
