from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.config.database import get_db
from app.core.dependencies import get_current_user, get_current_employee
from app.models.user_model import User
from app.schemas.claim_schema import ClaimCreate, ClaimResponse, ClaimStatusResponse
from app.services import claim_service
from app.models.claim_model import Claim 

router = APIRouter(prefix="/claims", tags=["Claims"])


# ========== POST routes ==========
@router.post("/create_claim", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    payload: ClaimCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_employee),
):
    """Employee creates a new claim in DRAFT state."""
    return claim_service.create_claim(db, payload, current_user.user_id)


# ========== GET routes with literal paths (MUST come before parameterized routes) ==========
@router.get("/my", response_model=list[ClaimResponse])
def my_claims(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_employee),
):
    """Employee views all their own claims."""
    return claim_service.get_my_claims(db, current_user.user_id)


@router.get("/my-claims", response_model=list[ClaimResponse])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employee)
):
    """Get all claims created by the current employee."""
    return claim_service.get_my_claims(db, current_user.user_id)


# ========== GET/POST routes with path parameters (must come AFTER literal paths) ==========
@router.post("/{claim_id}/submit", response_model=ClaimResponse)
def submit_claim(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_employee),
):
    """Employee submits a DRAFT claim — assigns inward number, moves to SUBMITTED."""
    return claim_service.submit_claim(db, claim_id, current_user.user_id)


@router.get("/{claim_id}/status", response_model=ClaimStatusResponse)
def claim_status(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Live status tracker — current state, last updated."""
    claim = claim_service.get_claim(db, claim_id)
    return ClaimStatusResponse(
        claim_id      = claim.claim_id,
        claim_status  = claim.claim_status,
        current_stage = claim.current_stage,
    )


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(
    claim_id: UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Get full claim details. Accessible by any authenticated user."""
    return claim_service.get_claim(db, claim_id)