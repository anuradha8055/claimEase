from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import relationship
from app.config.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id           = Column(Integer, primary_key=True, autoincrement=True)
    hospital_name         = Column(String(200), nullable=False)
    hospital_type         = Column(String(50),  nullable=False)  # 'GOVT', 'PRIVATE', 'TRUST'
    city                  = Column(String(100), nullable=False)
    state                 = Column(String(100), nullable=False)
    registration_number   = Column(String(100), unique=True)
    contact_number        = Column(String(20))

    # Empanelment fields — added for medical officer auto-flag
    is_empanelled         = Column(Boolean, nullable=False, default=False)
    empanelment_tier      = Column(String(10))   # 'A', 'B', 'C' or None
    empanelled_since      = Column(Date)

    # Relationships
    claims = relationship("Claim", back_populates="hospital")