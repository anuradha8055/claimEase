from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.config.database import get_db
from app.core.dependencies import get_current_employee, get_current_user
from app.models.user_model import User
from app.models.query_model import Query
from app.models.claim_model import Claim, ClaimStatus
from app.schemas.query_schema import QueryRespond, QueryResponse
from app.services.workflow_service import transition

router = APIRouter(prefix="/queries", tags=["Queries"])


@router.get("/my", response_model=list[QueryResponse])
def my_pending_queries(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_employee),
):
    """Employee views all pending queries on their claims."""
    from app.models.employees_model import Employee
    employee = db.query(Employee).filter(Employee.user_id == current_user.user_id).first()
    if not employee:
        return []
    # Get all pending queries for claims owned by this employee
    return (
        db.query(Query)
        .join(Claim, Query.claim_id == Claim.claim_id)
        .filter(
            Claim.user_id == current_user.user_id,
            Query.status == "PENDING"
        )
        .all()
    )


@router.post("/{query_id}/respond", response_model=QueryResponse)
def respond_to_query(
    query_id: UUID,
    payload:      QueryRespond,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_employee),
):
    """
    Employee responds to a query.
    Claim automatically moves back to SUBMITTED for re-review.
    """
    query = db.query(Query).filter(Query.query_id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    if query.status != "PENDING":
        raise HTTPException(status_code=400, detail="Query already resolved")

    query.response_text = payload.response_text
    query.responded_at  = datetime.now(timezone.utc)
    query.resolved_at   = datetime.now(timezone.utc)
    query.status        = "RESOLVED"
    db.commit()

    # Move claim back to SUBMITTED for officer re-review
    transition(db, query.claim_id, ClaimStatus.SUBMITTED, current_user,
               remarks=f"Employee responded to query #{query_id}: {payload.response_text[:100]}")

    db.refresh(query)
    return query
