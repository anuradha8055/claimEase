from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.claim_model import Claim, ClaimStatus, CLAIM_TRANSITIONS
from app.models.user_model import User


def transition(
    db: Session,
    claim_id: int,
    new_status: ClaimStatus,
    actor: User,
    remarks: str = ""
) -> Claim:
    """
    Attempts to transition a claim to new_status.
    Validates against CLAIM_TRANSITIONS — raises 422 if invalid.
    Logs the transition to claimworkflowlogs (audit chain).
    """
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    current = claim.claim_status
    allowed = CLAIM_TRANSITIONS.get(current, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot move from {current.value} to {new_status.value}. "
                   f"Allowed next states: {[s.value for s in allowed]}"
        )

    # Apply transition
    claim.claim_status  = new_status
    claim.current_stage = new_status

    # Append to workflow log
    _log_transition(db, claim_id, actor.user_id, current, new_status, remarks)

    db.commit()
    db.refresh(claim)
    return claim


def _log_transition(
    db: Session,
    claim_id: int,
    officer_id: int,
    from_status: ClaimStatus,
    to_status: ClaimStatus,
    remarks: str
):
    """
    Inserts an immutable row into claimworkflowlogs.
    Computes hash chain: current_hash = SHA256(previous_hash + transition_data).
    """
    import hashlib, json
    from datetime import datetime, timezone

    # Get last hash from previous log row
    from sqlalchemy import text
    result = db.execute(
        text("SELECT current_hash FROM claimworkflowlogs WHERE claim_id = :cid ORDER BY action_timestamp DESC LIMIT 1"),
        {"cid": claim_id}
    ).fetchone()
    previous_hash = result[0] if result else "GENESIS"

    # Compute new hash over previous_hash + transition data
    data = json.dumps({
        "claim_id":   claim_id,
        "officer_id": officer_id,
        "from":       from_status.value,
        "to":         to_status.value,
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "remarks":    remarks,
    }, sort_keys=True)
    current_hash = hashlib.sha256((previous_hash + data).encode()).hexdigest()

    db.execute(
        text("""
            INSERT INTO claimworkflowlogs
                (claim_id, officer_id, action_type, remarks, previous_hash, current_hash, action_timestamp)
            VALUES
                (:claim_id, :officer_id, :action_type, :remarks, :prev, :curr, NOW())
        """),
        {
            "claim_id":    claim_id,
            "officer_id":  officer_id,
            "action_type": f"{from_status.value} → {to_status.value}",
            "remarks":     remarks,
            "prev":        previous_hash,
            "curr":        current_hash,
        }
    )
