from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional

class PaymentCreate(BaseModel):
    claim_id: int
    approved_amount: Decimal
    utr_number: str = Field(..., description="Unique Transaction Reference from Bank")
    bank_name: str
    payment_status: str = "SUCCESS"

class PaymentRead(PaymentCreate):
    payment_id: int
    paid_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)