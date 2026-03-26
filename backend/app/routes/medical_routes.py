from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_medical_officer
from app.models.user_model import User
from app.models.claim_model import Claim, ClaimStatus
from app.models.hospitals_model import Hospital
from app.models.query_model import Query
from app.schemas.claim_schema import ClaimResponse
from app.schemas.query_schema import QueryRaise, QueryResponse
from app.services.workflow_service import transition

router = APIRouter(prefix="/medical", tags=["Medical Officer"])


@router.get("/queue", response_model=list[ClaimResponse])
def get_queue(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    """All claims at SCRUTINY_APPROVED stage."""
    return (
        db.query(Claim)
        .filter(Claim.claim_status == ClaimStatus.SCRUTINY_APPROVED)
        .order_by(Claim.created_at.asc())
        .all()
    )


@router.get("/{claim_id}/hospital-check")
def hospital_empanelment_check(
    claim_id: int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    """
    Auto-flag: checks if claim's hospital is empanelled.
    Medical officer sees this warning before approving.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    hospital = db.query(Hospital).filter(Hospital.hospital_id == claim.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    return {
        "hospital_name":    hospital.hospital_name,
        "is_empanelled":    hospital.is_empanelled,
        "empanelment_tier": hospital.empanelment_tier,
        "warning":          None if hospital.is_empanelled
                            else "WARNING: This hospital is NOT on the government empanelled list. "
                                 "Additional justification required before approval."
    }


@router.post("/{claim_id}/approve", response_model=ClaimResponse)
def approve(
    claim_id: int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    """Medical officer approves treatment validity."""
    return transition(
        db, claim_id,
        ClaimStatus.MEDICAL_APPROVED,
        current_user,
        remarks="Medical officer approved — treatment and diagnosis validated"
    )


@router.post("/{claim_id}/query", response_model=QueryResponse, status_code=201)
def raise_query(
    claim_id: int,
    payload:      QueryRaise,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    """Medical officer raises a query — claim returns to employee."""
    transition(db, claim_id, ClaimStatus.QUERY_RAISED, current_user,
               remarks=f"Medical query: {payload.query_message}")

    query = Query(
        claim_id      = claim_id,
        raised_by     = current_user.user_id,
        raised_stage  = "MEDICAL_OFFICER",
        query_message = payload.query_message,
        sent_to_stage = "EMPLOYEE",
        status        = "PENDING",
    )
    db.add(query)
    db.commit()
    db.refresh(query)
    return query


@router.post("/{claim_id}/reject", response_model=ClaimResponse)
def reject(
    claim_id: int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    return transition(db, claim_id, ClaimStatus.REJECTED, current_user,
                      remarks="Rejected at medical review stage")
