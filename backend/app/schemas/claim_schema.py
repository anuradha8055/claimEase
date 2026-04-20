from pydantic import BaseModel, Field, ConfigDict, computed_field
from datetime import date, datetime
from typing import Optional, List, Literal
from decimal import Decimal
from app.models.claim_model import ClaimStatus
from uuid import UUID


RelationType= Literal["Father", "Mother", "Husband", "Wife","Son", "Daughter","Brother", "Sister","Self"] # For future use in notifications, etc.

# --- Base Shared Fields ---
class ClaimBase(BaseModel):
    totalBillAmount: Decimal = Field(..., max_digits=12, decimal_places=2)
    isEmergency: bool = False
  

# --- For the EMPLOYEE: Creating a claim ---
class ClaimCreate(ClaimBase):
    # Flattened payload for easy React integration
    # Patient details
    patientName: str
    relation: str
    patientGender: str
    patientBirthDate: date
    diagnosis: str
    
    # Hospital details
    hospitalName: str
    hospitalType: str
    hospitalAddress: str = ""
    hospitalCity: str = ""
    hospitalState: str = ""
    hospitalPincode: str = ""
    hospitalContactNumber: str = ""
    
    # Treatment details
    admissionDate: date
    dischargeDate: date
    treatmentDetails: str = ""
    doctorName: str = ""
    doctorQualification: str = ""

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
class PatientDetailsResponse(BaseModel):
    patientName: str
    relation: str
    birthDate: date
    age: Optional[int] = None
    gender: str
    diagnosis: str
    
    model_config = ConfigDict(from_attributes=True)

class HospitalDetailsResponse(BaseModel):
    hospitalName: str
    hospitalType: str
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
    
    model_config = ConfigDict(from_attributes=True)

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
    claim_status: ClaimStatus
    current_stage: int
    assigned_to_role_id: Optional[int] = None
    approvedAmount: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientDetailsResponse] = None
    hospital: Optional[HospitalDetailsResponse] = None
    
    @computed_field  # type: ignore[misc]
    @property
    def claim_number(self) -> str:
        """Generate claim number from first 8 characters of UUID"""
        return str(self.claim_id)[:8].upper()
    
    @computed_field  # type: ignore[misc]
    @property
    def diagnosis(self) -> Optional[str]:
        """Extract diagnosis from patient details"""
        return self.patient.diagnosis if self.patient else None
    
    @computed_field  # type: ignore[misc]
    @property
    def admission_date(self) -> Optional[date]:
        """Extract admission date from hospital details"""
        return self.hospital.admissionDate if self.hospital else None
    
    @computed_field  # type: ignore[misc]
    @property
    def discharge_date(self) -> Optional[date]:
        """Extract discharge date from hospital details"""
        return self.hospital.dischargeDate if self.hospital else None
    
    @computed_field  # type: ignore[misc]
    @property
    def total_bill_amount(self) -> Decimal:
        """Alias for totalBillAmount"""
        return self.totalBillAmount
    
    @computed_field  # type: ignore[misc]
    @property
    def eligible_reimbursement_amount(self) -> Optional[Decimal]:
        """Alias for approvedAmount"""
        return self.approvedAmount
    
    @computed_field  # type: ignore[misc]
    @property
    def last_updated_timestamp(self) -> datetime:
        """Alias for updated_at"""
        return self.updated_at
    
    model_config = ConfigDict(from_attributes=True)

class ClaimStatusResponse(BaseModel):
    """Response model for claim status tracking"""
    claim_id: int
    claim_status: ClaimStatus
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)