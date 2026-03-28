from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.config.database import Base

class Treatment(Base):
    __tablename__ = "treatments"

    treatment_id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.claim_id"))

    treatment_code = Column(String)

    claim = relationship("Claim", back_populates="treatments")