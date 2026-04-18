from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.config.database import get_db
from app.core.dependencies import get_current_scrutiny_officer
from app.models.user_model import User
from app.models.claim_model import Claim, ClaimStatus
from app.models.query_model import Query
from app.schemas.claim_schema import ClaimResponse
from app.schemas.query_schema import QueryRaise, QueryResponse
from app.services.workflow_service import transition

router = APIRouter(prefix="/scrutiny", tags=["Scrutiny Officer"])


@router.get("/queue", response_model=list[ClaimResponse])
def get_queue(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_scrutiny_officer),
):
    """All claims currently at SUBMITTED stage — scrutiny officer's pending queue."""
    return (
        db.query(Claim)
        .filter(Claim.current_stage == 2)
        .order_by(Claim.created_at.asc())   # oldest first = most urgent
        .all()
    )


@router.post("/{claim_id}/approve", response_model=ClaimResponse)
def approve(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_scrutiny_officer),
):
    """Scrutiny officer approves after physical document verification."""
    return transition(
        db, claim_id,
        ClaimStatus.SCRUTINY_APPROVED,
        current_user,
        remarks="Scrutiny officer approved — original documents verified"
    )


@router.post("/{claim_id}/query", response_model=QueryResponse, status_code=201)
def raise_query(
    claim_id: UUID,
    payload:      QueryRaise,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_scrutiny_officer),
):
    """
    Scrutiny officer raises a query.
    Claim moves to QUERY_RAISED. Employee is notified (SMS/email in prod).
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Transition claim to QUERY_RAISED
    transition(db, claim_id, ClaimStatus.QUERY_RAISED, current_user,
               remarks=f"Query raised: {payload.query_message}")

    query = Query(
        claim_id      = claim_id,
        raised_by     = current_user.user_id,
        raised_stage  = 2,
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
    current_user: User    = Depends(get_current_scrutiny_officer),
):
    """Scrutiny officer rejects the claim."""
    return transition(
        db, claim_id,
        ClaimStatus.REJECTED,
        current_user,
        remarks="Rejected at scrutiny stage"
    )
