from datetime import date, datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.claim_model import Claim, ClaimStatus
from app.schemas.claim_schema import ClaimCreate

def create_claim(db: Session, payload: ClaimCreate, user_id: UUID) -> Claim:
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
        claim_status = ClaimStatus.DRAFT,
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


def submit_claim(db: Session, claim_id: UUID, user_id: UUID) -> Claim:
    """Transitions claim from DRAFT to SUBMITTED and assigns an inward number.
    
    Validates that at least one document has been uploaded before submission.
    """
    from app.services.workflow_service import transition
    from app.models.user_model import User
    from app.models.document_model import Document
    from app.models.roles_model import Role

    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Verify ownership - check if claim belongs to the current user
    if claim.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only submit your own claims")

    # Check if at least one document has been uploaded for this claim
    document_count = db.query(Document).filter(Document.claim_id == claim_id).count()
    if document_count == 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot submit claim without uploading documents. Please upload at least one document before submitting."
        )

    actor = db.query(User).filter(User.user_id == user_id).first()
    claim = transition(db, claim_id, ClaimStatus.SUBMITTED, actor, "Employee submitted claim")

    # Safety sync: ensure stage + assignment are persisted after final submit.
    # This guarantees scrutiny queue pickup even if role mapping data was inconsistent.
    scrutiny_role = db.query(Role).filter(Role.role_name == "SCRUTINY_OFFICER").first()
    claim.current_stage = 2
    claim.assigned_to_role_id = scrutiny_role.role_id if scrutiny_role else claim.assigned_to_role_id
    db.commit()
    db.refresh(claim)

    return claim


def get_claim(db: Session, claim_id: UUID) -> Claim:
    claim = (
        db.query(Claim)
        .options(
            joinedload(Claim.user),
            joinedload(Claim.hospital),
            joinedload(Claim.patient),
        )
        .filter(Claim.claim_id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


def get_my_claims(db: Session, user_id: UUID) -> list[Claim]:
    """Get all claims created by the current user."""
    return (
        db.query(Claim)
        .options(
            joinedload(Claim.user),
            joinedload(Claim.hospital),
            joinedload(Claim.patient),
        )
        .filter(Claim.user_id == user_id)
        .all()
    )


def update_claim(db: Session, claim_id: UUID, payload: ClaimCreate, user_id: UUID) -> Claim:
    """Updates an existing DRAFT claim for the logged-in employee."""
    from app.models.user_model import User
    from app.models.patient_model import PatientDetails
    from app.models.hospitals_model import HospitalDetails
    
    # Check if claim exists
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Verify ownership
    if claim.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own claims")
    
    # Only DRAFT claims can be updated
    if claim.claim_status != ClaimStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only DRAFT claims can be updated")
    
    # Update claim
    claim.totalBillAmount = payload.totalBillAmount
    claim.isEmergency = payload.isEmergency
    claim.updated_at = datetime.now(timezone.utc)
    
    # Update patient details
    patient = db.query(PatientDetails).filter(PatientDetails.claim_id == claim_id).first()
    if patient:
        patient.patientName = payload.patientName
        patient.relation = payload.relation
        patient.birthDate = payload.patientBirthDate
        patient.age = (datetime.now(timezone.utc).date().year - payload.patientBirthDate.year)
        patient.gender = payload.patientGender
        patient.diagnosis = payload.diagnosis
    
    # Update hospital details
    hospital = db.query(HospitalDetails).filter(HospitalDetails.claim_id == claim_id).first()
    if hospital:
        hospital.hospitalName = payload.hospitalName
        hospital.hospitalType = payload.hospitalType
        hospital.hospitalAddress = payload.hospitalAddress or ""
        hospital.hospitalCity = payload.hospitalCity or ""
        hospital.hospitalState = payload.hospitalState or ""
        hospital.hospitalPincode = payload.hospitalPincode or ""
        hospital.hospitalContactNo = payload.hospitalContactNumber or ""
        hospital.doctorName = payload.doctorName or ""
        hospital.doctorQualification = payload.doctorQualification or ""
        hospital.treatmentDetails = payload.treatmentDetails or ""
        hospital.admissionDate = payload.admissionDate
        hospital.dischargeDate = payload.dischargeDate
    
    db.commit()
    db.refresh(claim)
    return claim
