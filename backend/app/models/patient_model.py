import enum
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    DateTime, ForeignKey, Enum as SAEnum, func, Boolean
)
from sqlalchemy.orm import relationship
from app.config.database import Base
import uuid
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

class PatientDetails(Base):
    __tablename__ = "patient_details"
    patient_id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(PG_UUID(as_uuid=True), ForeignKey("claims.claim_id"), nullable=False)
    patientName = Column("patientname", String(255), nullable=False)
    relation = Column("relation", String(100))
    birthDate = Column("birthdate", Date)
    age = Column("age", Integer)
    gender = Column("gender", String(20))
    diagnosis = Column("diagnosis", Text)

    claim = relationship("Claim", back_populates="patient")