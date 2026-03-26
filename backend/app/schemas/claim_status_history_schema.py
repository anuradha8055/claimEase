from pydantic import BaseModel

class ClaimStatusHistoryResponse(BaseModel):
    id: int
    claim_id: int
    status: str

    class Config:
        from_attributes = True