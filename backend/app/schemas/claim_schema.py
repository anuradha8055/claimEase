from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List, Literal
from decimal import Decimal
from app.models.claim_model import ClaimStatus

RelationType= Literal["Father", "Mother", "Husband", "Wife","Son", "Daughter","Brother", "Sister","Self"] # For future use in notifications, etc.

# --- Base Shared Fields ---
class ClaimBase(BaseModel):
    #patient details
    patient_name: str
    relation: RelationType
    patient_gender: str
    patient_dob: date       

    #hospital details
    hospital_id: int
    hospital_name: Optional[str] = None
    hospital_type: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_state: Optional[str] = None
    hospital_pincode: Optional[str] = None
    hospital_contact_number: Optional[str] = None

    #medical details
    doctor_name: Optional[str] = None
    doctor_qualification: Optional[str] = None
    diagnosis: str  
    treatment_details: Optional[str] = None    
    admission_date: date
    discharge_date: date
    is_emergency: bool = False
    total_bill_amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    
  

# --- For the EMPLOYEE: Creating a claim ---
class ClaimCreate(ClaimBase):
    pass # Employees only fill the Base fields initially

# --- For the MEDICAL OFFICER: Approving/Calculating amount ---
class ClaimMedicalUpdate(BaseModel):
    eligible_amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    remarks: str = Field(..., min_length=5) # Why was this amount approved?
    status: ClaimStatus = ClaimStatus.MEDICAL_APPROVED

# --- For the SCRUTINY OFFICER: Initial Verification ---
class ClaimScrutinyUpdate(BaseModel):
    is_verified: bool
    remarks: str
    status: ClaimStatus # SCRUTINY_APPROVED or QUERY_RAISED

# --- For the READ/VIEW (Response to Frontend) ---
class ClaimRead(ClaimBase):
    claim_id: int
    eligible_amount: Optional[Decimal] = None
    claim_status: ClaimStatus
    employeeId: int
    patient_age: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True) # Allows Pydantic to read SQLAlchemy objects

class ClaimResponse(ClaimBase):
    """Response model for claim details"""
    claim_id: int
    eligible_amount: Optional[Decimal] = None
    claim_status: ClaimStatus
    employeeId: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class ClaimStatusResponse(BaseModel):
    """Response model for claim status tracking"""
    claim_id: int
    claim_status: ClaimStatus
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)