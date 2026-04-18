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
    hospitalName = Column("hospitalname", String(255), nullable=False)
    hospitalType = Column("hospitaltype", String(100)) # e.g., 'GOVT', 'PRIVATE'
    
    # Location
    hospitalAddress = Column("hospitaladdress", Text)
    hospitalCity = Column("hospitalcity", String(100))
    hospitalState = Column("hospitalstate", String(100))
    hospitalPincode = Column("hospitalpincode", String(10))
    hospitalContactNo = Column("hospitalcontactno", String(20))
    
    # Professional Details
    doctorName = Column("doctorname", String(255))
    doctorQualification = Column("doctorqualification", String(255))
    treatmentDetails = Column("treatmentdetails", Text)
    
    # Timeline
    admissionDate = Column("admissiondate", Date, nullable=False)
    dischargeDate = Column("dischargedate", Date, nullable=False)

    # Relationships
    claim = relationship("Claim", back_populates="hospital")