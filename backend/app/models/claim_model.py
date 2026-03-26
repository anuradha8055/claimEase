import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    DateTime, ForeignKey, Enum as SAEnum, func
)
from sqlalchemy.orm import relationship
from app.config.database import Base


class ClaimStatus(str, enum.Enum):
    DRAFT              = "DRAFT"
    SUBMITTED          = "SUBMITTED"
    SCRUTINY_APPROVED  = "SCRUTINY_APPROVED"
    MEDICAL_APPROVED   = "MEDICAL_APPROVED"
    FINANCE_APPROVED   = "FINANCE_APPROVED"
    DDO_SANCTIONED     = "DDO_SANCTIONED"
    QUERY_RAISED       = "QUERY_RAISED"
    PAYMENT_PROCESSED  = "PAYMENT_PROCESSED"
    REJECTED           = "REJECTED"


# Valid transitions map — used by workflow_service.py
# Key = current state, Value = list of allowed next states
CLAIM_TRANSITIONS: dict[ClaimStatus, list[ClaimStatus]] = {
    ClaimStatus.DRAFT:             [ClaimStatus.SUBMITTED],
    ClaimStatus.SUBMITTED:         [ClaimStatus.SCRUTINY_APPROVED, ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.SCRUTINY_APPROVED: [ClaimStatus.MEDICAL_APPROVED,  ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.MEDICAL_APPROVED:  [ClaimStatus.FINANCE_APPROVED,  ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.FINANCE_APPROVED:  [ClaimStatus.DDO_SANCTIONED,    ClaimStatus.QUERY_RAISED, ClaimStatus.REJECTED],
    ClaimStatus.DDO_SANCTIONED:    [ClaimStatus.PAYMENT_PROCESSED],
    ClaimStatus.QUERY_RAISED:      [ClaimStatus.SUBMITTED],        # employee responds → back to scrutiny
    ClaimStatus.PAYMENT_PROCESSED: [],                             # terminal state
    ClaimStatus.REJECTED:          [],                             # terminal state
}


class Claim(Base):
    __tablename__ = "claims"

    claim_id        = Column(Integer, primary_key=True, autoincrement=True)
    employee_id     = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    hospital_id     = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    claim_number    = Column(String(50), unique=True, nullable=True)  # auto-set on submit

    admission_date  = Column(Date, nullable=False)
    discharge_date  = Column(Date, nullable=False)
    diagnosis       = Column(Text)

    # Three distinct financial amounts — all needed, all different
    total_bill_amount = Column(Numeric(12, 2), nullable=False)  # what hospital charged
    claimed_amount    = Column(Numeric(12, 2), nullable=False)  # what employee is claiming
    eligible_amount   = Column(Numeric(12, 2))                  # what rules engine says is payable

    claim_status    = Column(
        SAEnum(ClaimStatus, name="claim_status_enum"),
        nullable=False,
        default=ClaimStatus.DRAFT
    )
    current_stage   = Column(
        SAEnum(ClaimStatus, name="claim_status_enum"),
        nullable=False,
        default=ClaimStatus.DRAFT
    )

    created_at      = Column(DateTime, nullable=False, server_default=func.now())
    updated_at      = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    employee        = relationship("Employee", back_populates="claims")
    hospital        = relationship("Hospital", back_populates="claims")
    documents       = relationship("Document", back_populates="claim")
    workflows       = relationship("ClaimWorkflowLog", back_populates="claim")
    queries         = relationship("Query", back_populates="claim")
    payments        = relationship("Payment", back_populates="claim")
    treatments      = relationship("Treatment", back_populates="claim")