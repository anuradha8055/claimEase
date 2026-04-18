from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List, Literal
from decimal import Decimal
from app.models.claim_model import ClaimStatus

RelationType= Literal["Father", "Mother", "Husband", "Wife","Son", "Daughter","Brother", "Sister","Self"] # For future use in notifications, etc.

# --- Base Shared Fields ---
class ClaimBase(BaseModel):
    totalBillAmount: Decimal = Field(..., max_digits=12, decimal_places=2)
    isEmergency: bool = False
  

# --- For the EMPLOYEE: Creating a claim ---
class ClaimCreate(ClaimBase):
        # Flattened payload for easy React integration
    patientName: str
    relation: str
    patientGender: str
    patientBirthDate: date
    hospitalName: str
    hospitalType: str
    admissionDate: date
    dischargeDate: date
    diagnosis: str

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
    claim_id: UUID
    user_id: UUID
    current_stage: int
    assigned_to_role_id: Optional[int] = None
    approvedAmount: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ClaimStatusResponse(BaseModel):
    """Response model for claim status tracking"""
    claim_id: int
    claim_status: ClaimStatus
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)