from pydantic import BaseModel

class WorkflowResponse(BaseModel):
    workflow_id: int
    claim_id: int
    current_stage: str
    assigned_to: int

    class Config:
        from_attributes = True