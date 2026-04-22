import re
from pydantic import BaseModel, ConfigDict, field_validator
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
    id: int
    user_id: UUID
    
    model_config = ConfigDict(from_attributes=True)


class EmployeeProfileResponse(BaseModel):
    user_id: UUID
    fullName: str
    emailAddress: str
    employeeId: str
    department: Optional[str] = None
    designation: Optional[str] = None
    contactNo: Optional[str] = None
    lastLogin: Optional[str] = None
    panNumber: Optional[str] = None
    bankAccount: Optional[str] = None
    ifscCode: Optional[str] = None
    gradePay: Optional[Decimal] = None
    basicPay: Optional[Decimal] = None
    dateOfJoining: Optional[date | str] = None
    officeLocation: Optional[str] = None


class EmployeeProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    contactNo: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    panNumber: Optional[str] = None
    bankAccount: Optional[str] = None
    ifscCode: Optional[str] = None
    gradePay: Optional[Decimal] = None
    basicPay: Optional[Decimal] = None
    dateOfJoining: Optional[str] = None
    officeLocation: Optional[str] = None

    @field_validator("panNumber")
    @classmethod
    def validate_pan_number(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return value
        pan = value.strip().upper()
        if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", pan):
            raise ValueError("PAN must be in format ABCDE1234F")
        return pan

    @field_validator("ifscCode")
    @classmethod
    def validate_ifsc_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return value
        ifsc = value.strip().upper()
        if not re.fullmatch(r"[A-Z]{4}0[A-Z0-9]{6}", ifsc):
            raise ValueError("IFSC must be in format ABCD0123456")
        return ifsc

    @field_validator("contactNo")
    @classmethod
    def validate_contact_number(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return value
        contact = value.strip()
        if not re.fullmatch(r"^\+?[0-9]{10,15}$", contact):
            raise ValueError("Contact number must be 10 to 15 digits")
        return contact

    @field_validator("gradePay", "basicPay")
    @classmethod
    def validate_pay_values(cls, value: Optional[Decimal]) -> Optional[Decimal]:
        if value is None:
            return value
        if value < 0:
            raise ValueError("Pay fields cannot be negative")
        return value