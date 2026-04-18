from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.utils.security import decode_token
from app.models.user_model import User

bearer = HTTPBearer()

ROLE_EMPLOYEE         = "EMPLOYEE"
ROLE_SCRUTINY         = "SCRUTINY_OFFICER"
ROLE_MEDICAL          = "MEDICAL_OFFICER"
ROLE_FINANCE          = "FINANCE_OFFICER"
ROLE_DDO              = "DDO"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> User:
    token   = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user or user.accountStatus.value != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def _role_guard(required_role: str):
    def guard(current_user: User = Depends(get_current_user)) -> User:
        role_name = current_user.role.role_name if current_user.role else ""
        if role_name != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    return guard


get_current_employee        = _role_guard(ROLE_EMPLOYEE)
get_current_scrutiny_officer = _role_guard(ROLE_SCRUTINY)
get_current_medical_officer  = _role_guard(ROLE_MEDICAL)
get_current_finance_officer  = _role_guard(ROLE_FINANCE)
get_current_ddo              = _role_guard(ROLE_DDO)
