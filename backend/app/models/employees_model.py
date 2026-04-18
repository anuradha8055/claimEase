from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.config.database import Base

class Employee(Base):
    __tablename__ = "employees"

    employeeId   = Column(Integer, primary_key=True, autoincrement=True)  # Auto-increment ID
    user_id       = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False) # Unique for 1:1 mapping

    department    = Column(String(100))
    designation   = Column(String(100))
    
    # Added: Pay Level/Grade Pay often dictates room category eligibility (General/Semi-Private/Private)
    pay_level     = Column(Integer) 
    grade_pay     = Column(Numeric(10, 2)) 

    # Relationships
    user   = relationship("User", back_populates="employee")
    claims = relationship("Claim", back_populates="employee")