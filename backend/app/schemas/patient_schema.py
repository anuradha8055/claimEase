from pydantic import BaseModel, ConfigDict
from datetime import date
from uuid import UUID
from typing import Optional

class PatientBase(BaseModel):
    patientName: str
    relation: str
    gender: str
    birthDate: date
    diagnosis: str

class PatientCreate(PatientBase):
    claim_id: UUID

class PatientResponse(PatientBase):
    patient_id: UUID
    claim_id: UUID
    age: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)