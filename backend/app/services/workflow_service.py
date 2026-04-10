from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from app.models.claim_model import Claim, ClaimStatus, CLAIM_TRANSITIONS
from app.models.workflow_model import ClaimWorkflowLog
from app.models.notifications_model import Notification

class WorkflowService:
    @staticmethod
    def move_claim(
        db: Session, 
        claim_id: int, 
        current_user_id: int, 
        user_role_id: int, 
        to_status: ClaimStatus, 
        remarks: str = None
    ):
        # 1. Fetch the claim
        claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        # 2. Check if the transition is logically allowed (Defined in claim_model.py)
        if to_status not in CLAIM_TRANSITIONS.get(claim.claim_status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid transition from {claim.claim_status} to {to_status}"
            )

        # 3. Role-Based Access Control (RBAC) Logic
        # Define which Role ID is responsible for which status
        # (Assuming: 1: Employee, 2: Scrutiny, 3: Medical, 4: Finance, 5: DDO)
        role_mapping = {
            ClaimStatus.SUBMITTED: 1,         # Only Employee can submit
            ClaimStatus.SCRUTINY_APPROVED: 2,  # Only Scrutiny can verify
            ClaimStatus.QUERY_RAISED: [2, 3, 4, 5], # Any officer can raise query
            ClaimStatus.MEDICAL_APPROVED: 3,   # Only Medical can approve amount
            ClaimStatus.FINANCE_APPROVED: 4,   # Only Finance can verify funds
            ClaimStatus.DDO_SANCTIONED: 5,     # Only DDO can give final sanction
            ClaimStatus.PAYMENT_PROCESSED: 4   # Finance marks as paid
        }

        required_role = role_mapping.get(to_status)
        if isinstance(required_role, list):
            if user_role_id not in required_role:
                raise HTTPException(status_code=403, detail="Role not authorized for this action")
        elif required_role and user_role_id != required_role:
            raise HTTPException(status_code=403, detail="Role not authorized for this action")

        # 4. Record the Audit Log
        workflow_log = ClaimWorkflowLog(
            claim_id=claim.claim_id,
            action_by_user_id=current_user_id,
            from_status=claim.claim_status,
            to_status=to_status,
            remarks=remarks
        )
        db.add(workflow_log)

        # 5. Update Claim State
        old_status = claim.claim_status
        claim.claim_status = to_status
        
        # Logic to "Pass the ball" to the next role
        next_role_map = {
            ClaimStatus.SUBMITTED: 2,          # To Scrutiny
            ClaimStatus.SCRUTINY_APPROVED: 3,   # To Medical
            ClaimStatus.MEDICAL_APPROVED: 4,    # To Finance
            ClaimStatus.FINANCE_APPROVED: 5,    # To DDO
            ClaimStatus.DDO_SANCTIONED: 4,      # Back to Finance for payment
            ClaimStatus.QUERY_RAISED: 1         # Back to Employee
        }
        claim.assigned_to_role_id = next_role_map.get(to_status)

        # 6. Generate Notification for the Employee
        new_notification = Notification(
            user_id=claim.employee.user_id,
            title=f"Claim Update: {to_status}",
            message=f"Your claim {claim.claim_number} has been moved from {old_status} to {to_status}. Remarks: {remarks}",
            claim_id=claim.claim_id
        )
        db.add(new_notification)

        db.commit()
        db.refresh(claim)
        return claim


def transition(db: Session, claim_id: int, to_status: ClaimStatus, current_user, remarks: str = None):
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
        to_status=to_status,
        remarks=remarks
    )