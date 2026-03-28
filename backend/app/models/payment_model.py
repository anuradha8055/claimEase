from sqlalchemy import Column, Integer, ForeignKey, String, Float
from sqlalchemy.orm import relationship
from app.config.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.claim_id"))

    approved_amount = Column(Float)

    claim = relationship("Claim", back_populates="payments")