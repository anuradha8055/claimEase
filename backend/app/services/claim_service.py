from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.claim_model import Claim, ClaimStatus
from app.models.employees_model import EmployeeDetails
from app.schemas.claim_schema import ClaimCreate



def create_claim(db: Session, payload: ClaimCreate, user_id: int) -> Claim:
    """Creates a claim in DRAFT state for the logged-in employee."""
    from app.models.user_model import User
    from app.models.patient_model import PatientDetails
    from app.models.hospitals_model import HospitalDetails
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create claim 
    claim = Claim(
        user_id = user_id,
        totalBillAmount = payload.totalBillAmount,
        isEmergency = payload.isEmergency,
        current_stage = 1,
        created_at = datetime.now(timezone.utc),
        updated_at = datetime.now(timezone.utc),
    )
    db.add(claim)
    db.flush()  # Get claim_id without committing
    
    # Create patient details
    patient = PatientDetails(
        claim_id = claim.claim_id,
        patientName = payload.patientName,
        relation = payload.relation,
        birthDate = payload.patientBirthDate,
        age = (datetime.now(timezone.utc).date().year - payload.patientBirthDate.year),
        gender = payload.patientGender,
        diagnosis = payload.diagnosis,
    )
    db.add(patient)
    
    # Create hospital details
    hospital = HospitalDetails(
        claim_id = claim.claim_id,
        hospitalName = payload.hospitalName,
        hospitalType = payload.hospitalType,
        hospitalAddress = payload.hospitalAddress or "",
        hospitalCity = payload.hospitalCity or "",
        hospitalState = payload.hospitalState or "",
        hospitalPincode = payload.hospitalPincode or "",
        hospitalContactNo = payload.hospitalContactNumber or "",
        doctorName = payload.doctorName or "",
        doctorQualification = payload.doctorQualification or "",
        treatmentDetails = payload.treatmentDetails or "",
        admissionDate = payload.admissionDate,
        dischargeDate = payload.dischargeDate,
    )
    db.add(hospital)
    
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
    employee = db.query(EmployeeDetails).filter(EmployeeDetails.user_id == user_id).first()
    if not employee or claim.user_id != employee.user_id:
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
    employee = db.query(EmployeeDetails).filter(EmployeeDetails.user_id == user_id).first()
    if not employee:
        return []
    return db.query(Claim).filter(Claim.user_id == employee.user_id).all()
