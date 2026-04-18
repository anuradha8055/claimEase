import enum
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    DateTime, ForeignKey, Enum as SAEnum, func, Boolean
)
from sqlalchemy.orm import relationship
from app.config.database import Base



class PatientDetails(Base):
    __tablename__ = "patient_details"
    patient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.claim_id"), nullable=False)
    patientName = Column(String(255), nullable=False)
    relation = Column(String(100))
    birthDate = Column(Date)
    age = Column(Integer)
    gender = Column(String(20))
    diagnosis = Column(Text)

    claim = relationship("Claim", back_populates="patient")