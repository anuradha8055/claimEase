from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.config.database import get_db
from app.core.dependencies import get_current_medical_officer
from app.models.user_model import User
from app.models.claim_model import Claim, ClaimStatus
from app.models.hospitals_model import HospitalDetails
from app.models.query_model import Query
from app.schemas.claim_schema import ClaimResponse
from app.schemas.query_schema import QueryRaise, QueryResponse
from app.services.workflow_service import transition

router = APIRouter(prefix="/medical", tags=["Medical Officer"])
MEDICAL_ROLE_ID = 3


@router.get("/queue", response_model=list[ClaimResponse])
def get_queue(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    """Claims assigned to medical role_id=3."""
    claims = (
        db.query(Claim)
        .filter(
            (Claim.assigned_to_role_id == MEDICAL_ROLE_ID) |
            ((Claim.assigned_to_role_id.is_(None)) & (Claim.current_stage == 3))
        )
        .order_by(Claim.created_at.asc())
        .all()
    )
    missing_assignment = [c for c in claims if c.assigned_to_role_id is None]
    if missing_assignment:
        for claim in missing_assignment:
            claim.assigned_to_role_id = MEDICAL_ROLE_ID
        db.commit()
    return claims


@router.get("/{claim_id}/hospital-check")
def hospital_empanelment_check(
    claim_id: UUID,
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

    hospital = db.query(HospitalDetails).filter(HospitalDetails.claim_id == claim_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    return {
        "hospital_name":    hospital.hospitalName,
        "hospital_type":    hospital.hospitalType,
        "admission_date":   hospital.admissionDate,
        "discharge_date":   hospital.dischargeDate,
    }


@router.post("/{claim_id}/approve", response_model=ClaimResponse)
def approve(
    claim_id: UUID,
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
    claim_id: UUID,
    payload:      QueryRaise,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    """Medical officer raises a query — claim returns to employee."""
    transition(db, claim_id, ClaimStatus.QUERY_RAISED, current_user,
               remarks=f"Medical query: {payload.query_message}")

    query = Query(
        query_id      = None,
        claim_id      = claim_id,
        raised_by     = current_user.user_id,
        raised_stage  = 3,
        query_text = payload.query_message,
        status        = "PENDING",
    )
    db.add(query)
    db.commit()
    db.refresh(query)
    return query


@router.post("/{claim_id}/reject", response_model=ClaimResponse)
def reject(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_medical_officer),
):
    return transition(db, claim_id, ClaimStatus.REJECTED, current_user,
                      remarks="Rejected at medical review stage")
