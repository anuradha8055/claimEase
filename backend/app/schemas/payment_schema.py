from pydantic import BaseModel

class PaymentCreate(BaseModel):
    claim_id: int
    approved_amount: float


class PaymentResponse(BaseModel):
    payment_id: int
    claim_id: int
    approved_amount: float

    class Config:
        from_attributes = True