from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from app.models.claim_model import ClaimStatus

# --- Base Shared Fields ---
class ClaimBase(BaseModel):
    admission_date: date
    discharge_date: date
    diagnosis: str
    is_emergency: bool = False
    total_bill_amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    claimed_amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    hospital_id: int

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
    claim_number: Optional[str] = None
    eligible_amount: Optional[Decimal] = None
    claim_status: ClaimStatus
    employeeId: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True) # Allows Pydantic to read SQLAlchemy objects

class ClaimResponse(ClaimBase):
    """Response model for claim details"""
    claim_id: int
    claim_number: Optional[str] = None
    eligible_amount: Optional[Decimal] = None
    claim_status: ClaimStatus
    employeeId: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ClaimStatusResponse(BaseModel):
    """Response model for claim status tracking"""
    claim_id: int
    claim_status: ClaimStatus
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)