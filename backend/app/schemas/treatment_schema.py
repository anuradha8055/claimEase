from pydantic import BaseModel

class TreatmentCreate(BaseModel):
    claim_id: int
    treatment_code: str


class TreatmentResponse(BaseModel):
    treatment_id: int
    claim_id: int
    treatment_code: str

    class Config:
        from_attributes = True