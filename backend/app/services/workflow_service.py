from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from datetime import datetime
from uuid import UUID
from app.models.claim_model import Claim, ClaimStatus, CLAIM_TRANSITIONS
from app.models.roles_model import Role
from app.models.notifications_model import Notification
import traceback

from app.models.logs_model import WorkflowLog

class WorkflowService:
    @staticmethod
    def _get_role_id_by_name(db: Session, role_name: str) -> int | None:
        role = db.query(Role).filter(Role.role_name == role_name).first()
        return role.role_id if role else None

    @staticmethod
    def move_claim(
        db: Session, 
        claim_id: UUID, 
        current_user_id: UUID, 
        user_role_id: int, 
        user_role_name: str | None,
        to_status: ClaimStatus, 
        remarks: str = None
    ):
        try:
            # 1. Fetch the claim with eager-loaded employee relationship
            claim = db.query(Claim).options(joinedload(Claim.employee)).filter(Claim.claim_id == claim_id).first()
            if not claim:
                raise HTTPException(status_code=404, detail="Claim not found")

            # 2. Check if the transition is logically allowed (Defined in claim_model.py)
            if to_status not in CLAIM_TRANSITIONS.get(claim.claim_status, []):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid transition from {claim.claim_status} to {to_status}"
                )

            # 3. Role-Based Access Control (RBAC) using role names from DB/auth
            role_mapping = {
                ClaimStatus.SUBMITTED: "EMPLOYEE",
                ClaimStatus.SCRUTINY_APPROVED: "SCRUTINY_OFFICER",
                ClaimStatus.QUERY_RAISED: ["SCRUTINY_OFFICER", "MEDICAL_OFFICER", "FINANCE_OFFICER", "DDO"],
                ClaimStatus.MEDICAL_APPROVED: "MEDICAL_OFFICER",
                ClaimStatus.FINANCE_APPROVED: "FINANCE_OFFICER",
                ClaimStatus.DDO_SANCTIONED: "DDO",
                ClaimStatus.PAYMENT_PROCESSED: "DDO",
            }

            required_role = role_mapping.get(to_status)
            if isinstance(required_role, list):
                if user_role_name not in required_role:
                    raise HTTPException(status_code=403, detail="Role not authorized for this action")
            elif required_role and user_role_name != required_role:
                raise HTTPException(status_code=403, detail="Role not authorized for this action")

            # 4. Record the Audit Log
            workflow_log = WorkflowLog(
                claim_id=claim.claim_id,
                stage_id=claim.current_stage,
                action_by=current_user_id,
                remarks=remarks,
                sla_days=None,  # SLA calculation can be added based on timestamps
                created_at=datetime.utcnow()
            )
            db.add(workflow_log)

            # 5. Update Claim State
            old_status = claim.claim_status
            claim.claim_status = to_status
            
            # Explicit workflow handoff IDs as requested:
            # SUBMITTED -> 2 (Scrutiny), SCRUTINY_APPROVED -> 3 (Medical),
            # MEDICAL_APPROVED -> 4 (Finance), FINANCE_APPROVED -> 5 (DDO)
            next_role_id_map = {
                ClaimStatus.SUBMITTED: 2,
                ClaimStatus.SCRUTINY_APPROVED: 3,
                ClaimStatus.MEDICAL_APPROVED: 4,
                ClaimStatus.FINANCE_APPROVED: 5,
                ClaimStatus.DDO_SANCTIONED: 5,
                ClaimStatus.PAYMENT_PROCESSED: None,
                ClaimStatus.QUERY_RAISED: 1,
                ClaimStatus.REJECTED: None,
            }
            claim.assigned_to_role_id = next_role_id_map.get(to_status)

            # Keep current_stage in sync with same officer pipeline IDs
            next_stage_map = {
                ClaimStatus.DRAFT: 1,
                ClaimStatus.SUBMITTED: 2,
                ClaimStatus.SCRUTINY_APPROVED: 3,
                ClaimStatus.MEDICAL_APPROVED: 4,
                ClaimStatus.FINANCE_APPROVED: 5,
                ClaimStatus.DDO_SANCTIONED: 5,
                ClaimStatus.PAYMENT_PROCESSED: 5,
                ClaimStatus.QUERY_RAISED: 1,
                ClaimStatus.REJECTED: 0,
            }
            claim.current_stage = next_stage_map.get(to_status, claim.current_stage)

            # 6. Generate Notification for the Employee
            # NOTE: Notification creation is optional and shouldn't fail the workflow
            try:
                employee_user_id = claim.employee.user_id if claim.employee else None
                if employee_user_id:
                    new_notification = Notification(
                        user_id=employee_user_id,
                        message=f"Your claim #{claim.claim_id} status changed to {to_status}",
                        notification_status="UNREAD"
                    )
                    db.add(new_notification)
            except Exception as e:
                # Log but don't fail - notification is non-critical
                print(f"[WARN] Could not create notification: {str(e)}")

            db.commit()
            db.refresh(claim)
            return claim
            
        except Exception as e:
            db.rollback()
            error_details = traceback.format_exc()
            print(f"[ERROR] in move_claim: {str(e)}")
            print(error_details)
            # Re-raise with detailed error
            raise HTTPException(status_code=500, detail=f"Claim transition failed: {str(e)}")


def transition(db: Session, claim_id: UUID, to_status: ClaimStatus, current_user, remarks: str = None):
    """
    Convenience function for claim transitions. Extracts user_id and role_id from current_user.
    
    Args:
        db: Database session
        claim_id: ID of the claim to transition
        to_status: Target ClaimStatus
        current_user: User object with user_id and role_id attributes
        remarks: Optional remarks for the transition
    
    Returns:
        Updated Claim object
    """
    return WorkflowService.move_claim(
        db=db,
        claim_id=claim_id,
        current_user_id=current_user.user_id,
        user_role_id=current_user.role_id,
        user_role_name=current_user.role.role_name if current_user.role else None,
        to_status=to_status,
        remarks=remarks
    )