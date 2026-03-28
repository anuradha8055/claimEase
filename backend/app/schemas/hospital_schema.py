from pydantic import BaseModel

class HospitalResponse(BaseModel):
    hospital_id: int
    name: str
    address: str

    class Config:
        from_attributes = True