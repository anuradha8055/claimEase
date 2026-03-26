from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_finance_officer
from app.models.user_model import User
from app.models.claim_model import Claim, ClaimStatus
from app.models.entitlement_rule_model import EntitlementRule
from app.models.hospitals_model import Hospital
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
    hospital = db.query(Hospital).filter(Hospital.hospital_id == claim.hospital_id).first()
    tier     = hospital.empanelment_tier if hospital else None

    rules       = db.query(EntitlementRule).filter(
        EntitlementRule.effective_to == None  # active rules only
    ).all()

    total_eligible = Decimal("0.00")
    breakdown      = []

    for rule in rules:
        cond   = rule.conditions or {}
        # Basic condition matching
        if "empanelment_tier" in cond and cond["empanelment_tier"] != tier:
            continue

        cap    = rule.max_amount
        amount = min(claim.claimed_amount, cap)
        total_eligible += amount
        breakdown.append({
            "rule":     rule.rule_name,
            "category": rule.category,
            "cap":      float(cap),
            "applied":  float(amount),
        })

    return {
        "system_calculated": float(total_eligible),
        "breakdown":         breakdown,
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
        .filter(Claim.claim_status == ClaimStatus.MEDICAL_APPROVED)
        .order_by(Claim.created_at.asc())
        .all()
    )


@router.get("/{claim_id}/calculate")
def calculate_entitlement(
    claim_id: int,
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
    claim_id: int,
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
        claim.eligible_amount = payload.override_amount
        remarks = f"Finance approved with override: ₹{payload.override_amount}. Reason: {payload.override_reason}"
    else:
        calc = _calculate_eligible_amount(db, claim)
        claim.eligible_amount = Decimal(str(calc["system_calculated"]))
        remarks = f"Finance approved — system calculated eligible amount: ₹{claim.eligible_amount}"

    db.commit()

    return transition(db, claim_id, ClaimStatus.FINANCE_APPROVED, current_user, remarks=remarks)


@router.post("/{claim_id}/reject", response_model=ClaimResponse)
def reject(
    claim_id: int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    return transition(db, claim_id, ClaimStatus.REJECTED, current_user,
                      remarks="Rejected at finance stage")
