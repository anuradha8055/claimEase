import enum
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    DateTime, ForeignKey, Enum as SAEnum, func, Boolean
)
from sqlalchemy.orm import relationship
from app.config.database import Base

class ClaimStatus(str, enum.Enum):
    DRAFT             = "DRAFT"
    SUBMITTED         = "SUBMITTED"
    SCRUTINY_APPROVED  = "SCRUTINY_APPROVED"
    MEDICAL_APPROVED   = "MEDICAL_APPROVED"
    FINANCE_APPROVED   = "FINANCE_APPROVED"
    DDO_SANCTIONED     = "DDO_SANCTIONED"
    QUERY_RAISED       = "QUERY_RAISED"
    PAYMENT_PROCESSED  = "PAYMENT_PROCESSED"
    REJECTED           = "REJECTED"

# Define valid state transitions for the claim workflow
CLAIM_TRANSITIONS = {
    ClaimStatus.DRAFT: [ClaimStatus.SUBMITTED, ClaimStatus.REJECTED],
    ClaimStatus.SUBMITTED: [ClaimStatus.SCRUTINY_APPROVED, ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.SCRUTINY_APPROVED: [ClaimStatus.MEDICAL_APPROVED, ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.MEDICAL_APPROVED: [ClaimStatus.FINANCE_APPROVED, ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.FINANCE_APPROVED: [ClaimStatus.DDO_SANCTIONED, ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.QUERY_RAISED: [ClaimStatus.SUBMITTED, ClaimStatus.SCRUTINY_APPROVED, ClaimStatus.MEDICAL_APPROVED, ClaimStatus.FINANCE_APPROVED, ClaimStatus.REJECTED],
    ClaimStatus.DDO_SANCTIONED: [ClaimStatus.PAYMENT_PROCESSED, ClaimStatus.REJECTED],
    ClaimStatus.PAYMENT_PROCESSED: [ClaimStatus.REJECTED],
    ClaimStatus.REJECTED: [],
}

class Claim(Base):
    __tablename__ = "claims"

    claim_id        = Column(Integer, primary_key=True, autoincrement=True)
    employeeId      = Column(Integer, ForeignKey("employees.employeeId"), nullable=False)
    patient_name    = Column(String(255), nullable=False) # Added patient name for better claim details
    relation        = Column(String(100), nullable=False) # Relation of patient to employee (self, spouse, child, parent)
    patient_gender  = Column(String(10), nullable=False) # Added patient
    patient_dob     = Column(Date, nullable=False) # Added patient date of birth for age-based eligibility rules    
    
    patient_age = Column(Integer) # Added patient age for easier querying and eligibility checks
    #Hospital info
    hospital_id     = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)

    
    #treatment and doctor info
    treatment_details = Column(Text) # Added treatment details for better claim processing and audit trail
    doctor_name      = Column(String(255)) # Added doctor name for better claim details and audit trail
    doctor_qualification = Column(String(255)) # Added doctor qualification for better claim details and audit trail
    admission_date  = Column(Date, nullable=False)
    discharge_date  = Column(Date, nullable=False)
    diagnosis       = Column(Text)
    is_emergency    = Column(Boolean, default=False, nullable=False) # Essential for Medical Officer

    # Financials: Using Numeric(12, 2) consistently
    total_bill_amount = Column(Numeric(12, 2), nullable=False) 
    eligible_amount   = Column(Numeric(12, 2)) # Populated by Medical/Rules engine

    # --- Status ---
    claim_status = Column(SAEnum(ClaimStatus, name="claim_status_enum"), default=ClaimStatus.DRAFT)
    current_stage = Column(SAEnum(ClaimStatus, name="claim_status_enum"), default=ClaimStatus.DRAFT)
    
    # Audit fields
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    employee        = relationship("Employee", back_populates="claims")
    hospital        = relationship("Hospital", back_populates="claims")
    documents       = relationship("Document", back_populates="claim")
    workflow_logs   = relationship("ClaimWorkflowLog", back_populates="claim", cascade="all, delete-orphan")
    queries         = relationship("Query", back_populates="claim")
    payments        = relationship("Payment", back_populates="claim")
    treatments      = relationship("Treatment", back_populates="claim")

    @property
    def hospital_name(self) -> str:
        return self.hospital.hospital_name if self.hospital else ""

    @property
    def hospital_type(self) -> str:
        return self.hospital.hospital_type if self.hospital else ""

    @property
    def hospital_city(self) -> str:
        return self.hospital.city if self.hospital else ""

    @property
    def hospital_state(self) -> str:
        return self.hospital.state if self.hospital else ""

    @property
    def hospital_contact_number(self) -> str:
        return self.hospital.hospital_contact_number if self.hospital else ""