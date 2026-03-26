from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    log_id: int
    action: str
    user_id: int

    class Config:
        from_attributes = True