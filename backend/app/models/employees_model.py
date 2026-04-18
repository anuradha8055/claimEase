from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.config.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from uuid import UUID
import uuid

class Employee(Base):
    __tablename__ = "employees"

    employeeId   = Column(Integer, primary_key=True, autoincrement=True)  # Auto-increment ID
    user_id       = Column(PG_UUID(as_uuid=True), ForeignKey("users.user_id"), unique=True, nullable=False) # Unique for 1:1 mapping

    department    = Column(String(100))
    designation   = Column(String(100))
    
    # Added: Pay Level/Grade Pay often dictates room category eligibility (General/Semi-Private/Private)
    pay_level     = Column(Integer) 
    grade_pay     = Column(Numeric(10, 2)) 

    # Relationships
    user   = relationship("User", back_populates="employee_details")
    claims = relationship("Claim", primaryjoin="Employee.user_id == Claim.user_id", 
        foreign_keys="Claim.user_id",back_populates="employee",overlaps="claims,user")