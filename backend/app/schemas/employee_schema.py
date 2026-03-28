from pydantic import BaseModel

class EmployeeCreate(BaseModel):
    user_id: int
    department: str
    designation: str


class EmployeeResponse(BaseModel):
    employee_id: int
    user_id: int
    department: str
    designation: str

    class Config:
        from_attributes = True