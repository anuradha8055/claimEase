from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.dependencies import get_current_ddo
from app.models.user_model import User
from app.models.claim_model import Claim, ClaimStatus
from app.models.payment_model import Payment
from app.schemas.claim_schema import ClaimResponse
from app.services.workflow_service import transition

router = APIRouter(prefix="/ddo", tags=["DDO"])


@router.get("/queue", response_model=list[ClaimResponse])
def get_queue(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_ddo),
):
    """All claims at FINANCE_APPROVED stage — DDO's pending queue."""
    return (
        db.query(Claim)
        .filter(Claim.claim_status == ClaimStatus.FINANCE_APPROVED)
        .order_by(Claim.created_at.asc())
        .all()
    )


@router.post("/{claim_id}/sanction", response_model=ClaimResponse)
def sanction(
    claim_id: int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_ddo),
):
    """
    DDO gives final sanction.
    Creates payment record → triggers PAYMENT_PROCESSED state.
    In production: this also calls Mahakosh/BEAN API and PFMS.
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.eligible_amount is None:
        raise HTTPException(
            status_code=400,
            detail="Eligible amount not set. Finance officer must approve first."
        )

    # Create payment record
    payment = Payment(
        claim_id        = claim_id,
        approved_amount = claim.eligible_amount,
        payment_status  = "INITIATED",
        payment_method  = "PFMS",
        processed_by    = current_user.user_id,
    )
    db.add(payment)
    db.commit()

    # Transition: FINANCE_APPROVED → DDO_SANCTIONED → PAYMENT_PROCESSED
    claim = transition(db, claim_id, ClaimStatus.DDO_SANCTIONED, current_user,
                       remarks=f"DDO sanctioned ₹{claim.eligible_amount}")
    claim = transition(db, claim_id, ClaimStatus.PAYMENT_PROCESSED, current_user,
                       remarks="Payment initiated via PFMS")

    return claim


@router.get("/sanctioned")
def sanctioned_claims(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_ddo),
):
    """All claims that have been sanctioned and paid."""
    claims = (
        db.query(Claim)
        .filter(Claim.claim_status == ClaimStatus.PAYMENT_PROCESSED)
        .all()
    )
    return [{"claim_id": c.claim_id, "claim_number": c.claim_number,
             "eligible_amount": float(c.eligible_amount or 0)} for c in claims]
