from pydantic import BaseModel, ConfigDict
from datetime import date
from uuid import UUID
from typing import Optional

class HospitalBase(BaseModel):
    hospitalName: str
    hospitalType: Optional[str] = None
    hospitalAddress: Optional[str] = None
    hospitalCity: Optional[str] = None
    hospitalState: Optional[str] = None
    hospitalPincode: Optional[str] = None
    hospitalContactNo: Optional[str] = None
    doctorName: Optional[str] = None
    doctorQualification: Optional[str] = None
    treatmentDetails: Optional[str] = None
    admissionDate: date
    dischargeDate: date

class HospitalCreate(HospitalBase):
    claim_id: UUID

class HospitalResponse(HospitalBase):
    hospital_id: UUID
    claim_id: UUID
    
    model_config = ConfigDict(from_attributes=True)