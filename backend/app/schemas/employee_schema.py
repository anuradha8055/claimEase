from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from datetime import date
from uuid import UUID
from typing import Optional

class EmployeeBase(BaseModel):
    panNumber: Optional[str] = None
    bankAccount: Optional[str] = None
    ifscCode: Optional[str] = None
    gradePay: Optional[Decimal] = None
    basicPay: Optional[Decimal] = None
    dateOfJoining: Optional[date] = None
    officeLocation: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: UUID
    user_id: UUID
    
    model_config = ConfigDict(from_attributes=True)