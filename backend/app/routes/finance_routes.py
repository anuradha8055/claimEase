from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from uuid import UUID
from app.config.database import get_db
from app.core.dependencies import get_current_finance_officer
from app.models.user_model import User
from app.models.claim_model import Claim, ClaimStatus
from app.models.hospitals_model import Hospital, HospitalDetails
from app.schemas.claim_schema import ClaimResponse
from app.services.workflow_service import transition

router = APIRouter(prefix="/finance", tags=["Finance Officer"])


class FinanceApproval(BaseModel):
    override_amount:     Optional[Decimal] = Field(None, gt=0)
    override_reason:     Optional[str]     = None   # mandatory if override_amount set


def _calculate_eligible_amount(db: Session, claim: Claim) -> dict:
    """
    Runs the entitlement rules engine against the claim.
    Returns breakdown and total eligible amount.
    """
    hospital = db.query(HospitalDetails).filter(HospitalDetails.claim_id == claim.claim_id).first()
   
    system_calculated = claim.totalBillAmount

    return {
        "system_calculated": float(system_calculated),
        "hospital_name":         hospital.hospitalName if hospital else None,
        "claimed_amount":    float(claim.claimed_amount),
    }


@router.get("/queue", response_model=list[ClaimResponse])
def get_queue(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    """All claims at MEDICAL_APPROVED stage."""
    return (
        db.query(Claim)
        .filter(Claim.current_stage == 4)
        .order_by(Claim.created_at.asc())
        .all()
    )


@router.get("/{claim_id}/calculate")
def calculate_entitlement(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    """
    Runs the rules engine on the claim.
    Finance officer reviews this before approving.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return _calculate_eligible_amount(db, claim)


@router.post("/{claim_id}/approve", response_model=ClaimResponse)
def approve(
    claim_id: UUID,
    payload:      FinanceApproval,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    """
    Finance officer approves with auto-calculated or manually overridden amount.
    Override requires a written reason — logged to audit trail.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if payload.override_amount:
        if not payload.override_reason:
            raise HTTPException(
                status_code=400,
                detail="override_reason is required when overriding the calculated amount"
            )
        claim.approvedAmount= payload.override_amount
        remarks = f"Finance approved with override: ₹{payload.override_amount}. Reason: {payload.override_reason}"
    else:
        calc = _calculate_eligible_amount(db, claim)
        claim.approvedAmount = Decimal(str(calc["system_calculated"]))
        remarks = f"Finance approved — system calculated eligible amount: ₹{claim.approvedAmount}"

    db.commit()

    return transition(db, claim_id, ClaimStatus.FINANCE_APPROVED, current_user, remarks=remarks)


@router.post("/{claim_id}/reject", response_model=ClaimResponse)
def reject(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    return transition(db, claim_id, ClaimStatus.REJECTED, current_user,
                      remarks="Rejected at finance stage")
