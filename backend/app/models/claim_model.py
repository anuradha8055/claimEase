import enum
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    DateTime, ForeignKey, Enum as SAEnum, func, Boolean
)
from sqlalchemy.orm import relationship
from app.config.database import Base
from uuid import UUID
import uuid
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

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
    claim_id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.user_id"))
    totalBillAmount = Column("totalbillamount", Numeric(12, 2), nullable=False)
    approvedAmount = Column("approvedamount", Numeric(12, 2))
    isEmergency = Column("isemergency", Boolean, default=False)
    current_stage = Column(Integer, default=1)
    assigned_to_role_id = Column(Integer, ForeignKey("roles.role_id"))
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="claim")
    patient = relationship("PatientDetails", back_populates="claim", uselist=False)
    hospital = relationship("HospitalDetails", back_populates="claim", uselist=False)
    document = relationship("Document", back_populates="claim")
    queries = relationship("Query", back_populates="claim")
    employee = relationship("EmployeeDetails", primaryjoin="Claim.user_id == EmployeeDetails.user_id",
        foreign_keys=[user_id], back_populates="claim", viewonly=True, overlaps="claim,employee")