from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.claim_model import Claim, ClaimStatus
from app.models.employees_model import Employee
from app.schemas.claim_schema import ClaimCreate


def _generate_claim_number(db: Session, dept_code: str = "MH") -> str:
    year  = datetime.now(timezone.utc).year
    count = db.query(Claim).count() + 1
    return f"{dept_code}-{year}-{count:06d}"


def create_claim(db: Session, payload: ClaimCreate, user_id: int) -> Claim:
    """Creates a claim in DRAFT state for the logged-in employee."""
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found for this user")

    claim = Claim(
        employee_id       = employee.employee_id,
        hospital_id       = payload.hospital_id,
        admission_date    = payload.admission_date,
        discharge_date    = payload.discharge_date,
        diagnosis         = payload.diagnosis,
        total_bill_amount = payload.total_bill_amount,
        claimed_amount    = payload.claimed_amount,
        claim_status      = ClaimStatus.DRAFT,
        current_stage     = ClaimStatus.DRAFT,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def submit_claim(db: Session, claim_id: int, user_id: int) -> Claim:
    """Transitions claim from DRAFT to SUBMITTED and assigns an inward number."""
    from app.services.workflow_service import transition
    from app.models.user_model import User

    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Verify ownership
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee or claim.employee_id != employee.employee_id:
        raise HTTPException(status_code=403, detail="You can only submit your own claims")

    actor = db.query(User).filter(User.user_id == user_id).first()
    claim = transition(db, claim_id, ClaimStatus.SUBMITTED, actor, "Employee submitted claim")

    # Assign inward number on first submit
    if not claim.claim_number:
        claim.claim_number = _generate_claim_number(db)
        db.commit()
        db.refresh(claim)

    return claim


def get_claim(db: Session, claim_id: int) -> Claim:
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


def get_my_claims(db: Session, user_id: int) -> list[Claim]:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        return []
    return db.query(Claim).filter(Claim.employee_id == employee.employee_id).all()
