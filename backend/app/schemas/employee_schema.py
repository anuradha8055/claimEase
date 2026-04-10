from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional

class EmployeeBase(BaseModel):
    department: str
    profession: str
    pay_level: Optional[int] = None
    grade_pay: Optional[Decimal] = None

class EmployeeCreate(EmployeeBase):
    user_id: int

class EmployeeResponse(EmployeeBase):
    employeeId: int
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)