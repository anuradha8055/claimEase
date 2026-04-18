from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.config.database import Base

class HospitalDetails(Base):
    __tablename__ = "hospital_details"
    
    hospital_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.claim_id"), nullable=False)
    
    # Hospital Identity
    hospitalName = Column(String(255), nullable=False)
    hospitalType = Column(String(100)) # e.g., 'GOVT', 'PRIVATE'
    
    # Location
    hospitalAddress = Column(Text)
    hospitalCity = Column(String(100))
    hospitalState = Column(String(100))
    hospitalPincode = Column(String(10))
    hospitalContactNo = Column(String(20))
    
    # Professional Details
    doctorName = Column(String(255))
    doctorQualification = Column(String(255))
    treatmentDetails = Column(Text)
    
    # Timeline
    admissionDate = Column(Date, nullable=False)
    dischargeDate = Column(Date, nullable=False)

    # Relationships
    claim = relationship("Claim", back_populates="hospital")