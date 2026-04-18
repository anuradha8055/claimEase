from datetime import datetime, timedelta, timezone
from hashlib import new
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.config.settings import REFRESH_TOKEN_EXPIRE_DAYS
from app.models.user_model import User
from app.schemas.user_schema import UserRegister, UserLogin, UserResponse, TokenResponse
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.models.roles_model import Role
from app.core.dependencies import get_current_user
from uuid import UUID

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user. Role must already exist in the roles table."""
    #checking already registered or not 
    if db.query(User).filter(User.emailAddress == payload.emailAddress).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role_record = db.query(Role).filter(Role.role_name == payload.role).first()
    
    if not role_record:
        raise HTTPException(
            status_code=400, 
            detail=f"Role '{payload.role}' does not exist in the database."
        )
    #hash the password
    hashed_password = hash_password(payload.password)

    new_user = User(
        fullName       = payload.fullName,
        department     = payload.department,
        designation     = payload.profession,
        employeeId    = payload.employeeId,
        contactNo       = payload.contact,
        emailAddress   = payload.emailAddress,
        role_id        = role_record.role_id,
        password       = hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Employee profile if role is EMPLOYEE
    if payload.role.upper() == "EMPLOYEE":
        from app.models.employees_model import Employee
        try:
            new_employee = Employee(
                user_id = new_user.user_id,
                department = payload.department,
                designation = payload.profession
            )
            db.add(new_employee)
            db.commit()
            db.refresh(new_employee)
        except Exception as e:
            db.rollback()
            # Delete the user if employee creation fails
            db.delete(new_user)
            db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create employee profile: {str(e)}"
            )

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login with email + password. Returns access + refresh tokens."""
    user = db.query(User).filter(User.emailAddress == payload.emailAddress).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if user.accountStatus.value != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")

    role_name = user.role.role_name if user.role else ""
    access    = create_access_token(user.user_id, role_name, user.fullName, user.emailAddress)
    refresh   = create_refresh_token(user.user_id)

    # Store refresh token in DB for rotation
    user.refreshToken           = refresh
    user.refreshTokenExpiresAt = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    user.lastLogin               = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(accessToken=access, refreshToken=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, db: Session = Depends(get_db)):
    """
    Pass the refresh token in Authorization header: Bearer <refresh_token>
    Returns new access + refresh token pair.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token   = auth.split(" ", 1)[1]
    payload = decode_token(token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user or user.refreshToken != token:
        raise HTTPException(status_code=401, detail="Refresh token revoked or reused")

    role_name = user.role.role_name if user.role else ""
    access    = create_access_token(user.user_id, role_name, user.fullName, user.emailAddress)
    new_ref   = create_refresh_token(user.user_id)

    user.refreshToken           = new_ref
    user.refreshTokenExpiresAt = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db.commit()

    return TokenResponse(accessToken=access, refreshToken=new_ref)


@router.post("/logout")
def logout(db: Session = Depends(get_db), request: Request = None):
    """Invalidates the refresh token stored in DB."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return {"message": "Logged out"}
    token   = auth.split(" ", 1)[1]
    payload = decode_token(token)
    if payload:
        user = db.query(User).filter(User.user_id == int(payload.get("sub", 0))).first()
        if user:
            user.refresh_token = None
            db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's profile from database."""
    return current_user
