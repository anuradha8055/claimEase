from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClaimCreate(BaseModel):
    hospital_id:       int
    admission_date:    date
    discharge_date:    date
    diagnosis:         str | None = None
    total_bill_amount: Decimal    = Field(gt=0, le=10_000_000, decimal_places=2)
    claimed_amount:    Decimal    = Field(gt=0, le=10_000_000, decimal_places=2)


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    claim_id:          int
    employee_id:       int
    hospital_id:       int
    claim_number:      Optional[str]
    admission_date:    date
    discharge_date:    date
    diagnosis:         Optional[str]
    total_bill_amount: Decimal
    claimed_amount:    Decimal
    eligible_amount:   Optional[Decimal]
    claim_status:      str
    current_stage:     str
    created_at:        datetime
    updated_at:        datetime


class ClaimStatusResponse(BaseModel):
    """Lightweight status tracker response for employee-facing tracker."""
    claim_id:      int
    claim_number:  Optional[str]
    claim_status:  str
    current_stage: str
    updated_at:    datetime
