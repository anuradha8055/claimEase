import enum
from datetime import datetime
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

class Claim(Base):
    __tablename__ = "claims"

    claim_id        = Column(Integer, primary_key=True, autoincrement=True)
    employee_id     = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    hospital_id     = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    claim_number    = Column(String(50), unique=True, nullable=True) 

    admission_date  = Column(Date, nullable=False)
    discharge_date  = Column(Date, nullable=False)
    diagnosis       = Column(Text)
    is_emergency    = Column(Boolean, default=False, nullable=False) # Essential for Medical Officer

    # Financials: Using Numeric(12, 2) consistently
    total_bill_amount = Column(Numeric(12, 2), nullable=False) 
    claimed_amount    = Column(Numeric(12, 2), nullable=False) 
    eligible_amount   = Column(Numeric(12, 2)) # Populated by Medical/Rules engine

    claim_status    = Column(SAEnum(ClaimStatus, name="claim_status_enum"), nullable=False, default=ClaimStatus.DRAFT)
    
    # Tracks which role currently owns the claim
    assigned_to_role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=True)

    created_at      = Column(DateTime, nullable=False, server_default=func.now())
    updated_at      = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    employee        = relationship("Employee", back_populates="claims")
    hospital        = relationship("Hospital", back_populates="claims")
    documents       = relationship("Document", back_populates="claim")
    workflow_logs   = relationship("ClaimWorkflowLog", back_populates="claim", cascade="all, delete-orphan")
    queries         = relationship("Query", back_populates="claim")
    payments        = relationship("Payment", back_populates="claim")
    treatments      = relationship("Treatment", back_populates="claim")