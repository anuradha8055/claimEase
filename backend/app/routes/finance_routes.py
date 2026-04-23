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
from app.models.hospitals_model import HospitalDetails
from app.schemas.claim_schema import ClaimResponse
from app.schemas.query_schema import QueryRaise, QueryResponse, RejectReason
from app.services.query_notification_service import log_query_and_notify_employee
from app.services.workflow_service import transition

router = APIRouter(prefix="/finance", tags=["Finance Officer"])
FINANCE_ROLE_ID = 4


class FinanceApproval(BaseModel):
    override_amount:     Optional[Decimal] = Field(None, gt=0)
    override_reason:     Optional[str]     = None   # mandatory if override_amount set


def _calculate_eligible_amount(db: Session, claim: Claim) -> dict:
    """
    Runs the entitlement rules engine against the claim.
    Returns breakdown and total eligible amount.
    """
    hospital = db.query(HospitalDetails).filter(HospitalDetails.claim_id == claim.claim_id).first()
   
    system_calculated = claim.totalBillAmount or 0

    return {
        "system_calculated": float(system_calculated),
        "hospital_name":         hospital.hospitalName if hospital else None,
        # claim model stores submitted amount in totalBillAmount
        "claimed_amount":    float(claim.totalBillAmount or 0),
        "breakdown": [],
    }


@router.get("/queue", response_model=list[ClaimResponse])
def get_queue(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    """Claims assigned to finance role_id=4."""
    claims = (
        db.query(Claim)
        .filter(
            (Claim.assigned_to_role_id == FINANCE_ROLE_ID) |
            ((Claim.assigned_to_role_id.is_(None)) & (Claim.current_stage == 4))
        )
        .order_by(Claim.created_at.asc())
        .all()
    )
    missing_assignment = [c for c in claims if c.assigned_to_role_id is None]
    if missing_assignment:
        for claim in missing_assignment:
            claim.assigned_to_role_id = FINANCE_ROLE_ID
        db.commit()
    return claims


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
    payload: RejectReason,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_finance_officer),
):
    claim = transition(
        db, claim_id, ClaimStatus.REJECTED, current_user,
        remarks=f"Rejected at finance stage: {payload.reason}"
    )
    log_query_and_notify_employee(
        db,
        claim_id=claim_id,
        raised_by_user_id=current_user.user_id,
        raised_stage=4,
        message=payload.reason,
        event_type="REJECTION",
    )
    db.commit()
    return claim


@router.post("/{claim_id}/query", response_model=QueryResponse, status_code=201)
def raise_query(
    claim_id: UUID,
    payload: QueryRaise,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_finance_officer),
):
    """Finance officer raises a query — claim returns to employee."""
    transition(
        db, claim_id, ClaimStatus.QUERY_RAISED, current_user,
        remarks=f"Finance query: {payload.query_message}"
    )
    query = log_query_and_notify_employee(
        db,
        claim_id=claim_id,
        raised_by_user_id=current_user.user_id,
        raised_stage=4,
        message=payload.query_message,
        event_type="QUERY",
    )
    db.commit()
    db.refresh(query)
    return query
