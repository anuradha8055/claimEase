from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.claim_model import Claim, ClaimStatus
from app.models.employees_model import Employee
from app.schemas.claim_schema import ClaimCreate



def create_claim(db: Session, payload: ClaimCreate, user_id: int) -> Claim:
    """Creates a claim in DRAFT state for the logged-in employee."""
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found for this user")

    # Calculate age
    today = date.today()
    calculated_age = today.year - payload.patient_dob.year - (
        (today.month, today.day) < (payload.patient_dob.month, payload.patient_dob.day)
    )

    # Create claim with hospital info stored directly (no FK validation)
    claims = Claim(
        employeeId       = employee.employeeId,
        # Hospital info stored directly - no database lookup required
        hospital_name    = payload.hospital_name,
        hospital_type    = payload.hospital_type,
        hospital_address = payload.hospital_address,
        hospital_city    = payload.hospital_city,
        hospital_state   = payload.hospital_state,
        hospital_pincode = payload.hospital_pincode,
        hospital_contact_number = payload.hospital_contact_number,
        # Patient info
        patient_name     = payload.patient_name,
        relation         = payload.relation,
        patient_gender   = payload.patient_gender,
        patient_dob      = payload.patient_dob,    
        patient_age      = calculated_age,
        # Treatment info
        admission_date   = payload.admission_date,
        discharge_date   = payload.discharge_date,
        diagnosis        = payload.diagnosis,
        treatment_details = payload.treatment_details,
        is_emergency     = payload.is_emergency,
        doctor_name      = payload.doctor_name,
        doctor_qualification = payload.doctor_qualification,
        # Financials
        total_bill_amount = payload.total_bill_amount,
        # Status
        claim_status     = ClaimStatus.DRAFT,
        current_stage    = ClaimStatus.DRAFT,
    )
    db.add(claims)
    db.commit()
    db.refresh(claims)
    return claims


def submit_claim(db: Session, claim_id: int, user_id: int) -> Claim:
    """Transitions claim from DRAFT to SUBMITTED and assigns an inward number."""
    from app.services.workflow_service import transition
    from app.models.user_model import User

    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Verify ownership
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee or claim.employeeId != employee.employeeId:
        raise HTTPException(status_code=403, detail="You can only submit your own claims")

    actor = db.query(User).filter(User.user_id == user_id).first()
    claim = transition(db, claim_id, ClaimStatus.SUBMITTED, actor, "Employee submitted claim")


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
    return db.query(Claim).filter(Claim.employeeId == employee.employeeId).all()
