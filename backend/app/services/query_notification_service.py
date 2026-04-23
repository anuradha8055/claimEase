import smtplib
from email.message import EmailMessage
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.config.settings import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_USE_TLS,
)
from app.models.claim_model import Claim
from app.models.notifications_model import Notification
from app.models.query_model import Query
from app.models.user_model import User


def _send_email(subject: str, recipient: str, body: str) -> None:
    if not SMTP_HOST or not SMTP_FROM_EMAIL or not recipient:
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM_EMAIL
    msg["To"] = recipient
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)


def log_query_and_notify_employee(
    db: Session,
    *,
    claim_id: UUID,
    raised_by_user_id: UUID,
    raised_stage: int,
    message: str,
    event_type: str,
) -> Query:
    query = Query(
        claim_id=claim_id,
        raised_by=raised_by_user_id,
        raised_stage=raised_stage,
        query_text=message,
        status="PENDING" if event_type == "QUERY" else "RESOLVED",
    )
    db.add(query)
    db.flush()

    claim = (
        db.query(Claim)
        .options(joinedload(Claim.user))
        .filter(Claim.claim_id == claim_id)
        .first()
    )
    employee: Optional[User] = claim.user if claim else None
    if employee:
        notification_text = (
            f"Claim {str(claim_id)[:8].upper()} {event_type.lower()}: {message}"
        )
        db.add(
            Notification(
                user_id=employee.user_id,
                message=notification_text,
                notification_status="UNREAD",
            )
        )
        try:
            _send_email(
                subject=f"Claim Update: {event_type.title()}",
                recipient=employee.emailAddress,
                body=(
                    f"Hello {employee.fullName},\n\n"
                    f"Your claim {str(claim_id)[:8].upper()} has a new {event_type.lower()} update.\n\n"
                    f"Details:\n{message}\n\n"
                    "Please login to the portal for details."
                ),
            )
        except Exception:
            # Keep core workflow successful even if email fails.
            pass

    return query
