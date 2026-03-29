from sqlalchemy import Column, Integer, ForeignKey, String, Numeric, DateTime, func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id      = Column(Integer, primary_key=True, autoincrement=True)
    claim_id        = Column(Integer, ForeignKey("claims.claim_id"), nullable=False)
    
    # Financials: Consistently using Numeric(12, 2)
    approved_amount = Column(Numeric(12, 2), nullable=False) 

    # Bank Transfer Details (Crucial for Finance Role)
    utr_number      = Column(String(100), unique=True) # Unique Transaction Reference
    bank_name       = Column(String(150))
    payment_status  = Column(String(50), default="PENDING") # PENDING, SUCCESS, FAILED
    
    paid_at         = Column(DateTime)
    created_at      = Column(DateTime, server_default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="payments")