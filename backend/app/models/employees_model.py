from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))

    department = Column(String)
    designation = Column(String)

    user = relationship("User", back_populates="employee")
    claims = relationship("Claim", back_populates="employee")