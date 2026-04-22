from datetime import datetime, timedelta, timezone
from hashlib import new
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.config.settings import REFRESH_TOKEN_EXPIRE_DAYS
from app.models.user_model import User
from app.schemas.user_schema import UserRegister, UserLogin, UserResponse, TokenResponse
from app.schemas.employee_schema import EmployeeProfileResponse, EmployeeProfileUpdate
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.models.roles_model import Role
from app.core.dependencies import get_current_user, get_current_employee
from uuid import UUID

router = APIRouter(prefix="/auth", tags=["Auth"])

def _normalize_date_of_joining(value) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


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
        from app.models.employees_model import EmployeeDetails
        try:
            new_employee = EmployeeDetails(
                user_id = new_user.user_id,
                pan_number = f"PENDING-{str(new_user.user_id)[:8]}",
                bank_account = f"PENDING-{str(new_user.user_id)[:8]}",
                ifsc_code = "PENDING"
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


@router.get("/employee-profile", response_model=EmployeeProfileResponse)
def get_employee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employee),
):
    """Get authenticated employee profile (user + employee_details)."""
    from app.models.employees_model import EmployeeDetails

    employee = db.query(EmployeeDetails).filter(EmployeeDetails.user_id == current_user.user_id).first()

    return EmployeeProfileResponse(
        user_id=current_user.user_id,
        fullName=current_user.fullName,
        emailAddress=current_user.emailAddress,
        employeeId=current_user.employeeId,
        department=current_user.department,
        designation=current_user.designation,
        contactNo=current_user.contactNo,
        lastLogin=current_user.lastLogin.isoformat() if current_user.lastLogin else None,
        panNumber=employee.pan_number if employee else None,
        bankAccount=employee.bank_account if employee else None,
        ifscCode=employee.ifsc_code if employee else None,
        gradePay=employee.grade_pay if employee else None,
        basicPay=employee.basic_pay if employee else None,
        dateOfJoining=_normalize_date_of_joining(employee.date_of_joining) if employee else None,
        officeLocation=employee.office_location if employee else None,
    )


@router.put("/employee-profile", response_model=EmployeeProfileResponse)
def update_employee_profile(
    payload: EmployeeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employee),
):
    """Update authenticated employee profile and persist in database."""
    from app.models.employees_model import EmployeeDetails

    employee = db.query(EmployeeDetails).filter(EmployeeDetails.user_id == current_user.user_id).first()
    if employee is None:
        employee = EmployeeDetails(
            user_id=current_user.user_id,
            pan_number="PENDING",
            bank_account="PENDING",
            ifsc_code="PENDING",
        )
        db.add(employee)
        db.flush()

    if payload.fullName is not None:
        current_user.fullName = payload.fullName.strip()
    if payload.contactNo is not None:
        current_user.contactNo = payload.contactNo.strip()
    if payload.department is not None:
        current_user.department = payload.department.strip()
    if payload.designation is not None:
        current_user.designation = payload.designation.strip()

    if payload.panNumber is not None:
        employee.pan_number = payload.panNumber.strip()
    if payload.bankAccount is not None:
        employee.bank_account = payload.bankAccount.strip()
    if payload.ifscCode is not None:
        employee.ifsc_code = payload.ifscCode.strip()
    if payload.gradePay is not None:
        employee.grade_pay = payload.gradePay
    if payload.basicPay is not None:
        employee.basic_pay = payload.basicPay
    if payload.dateOfJoining is not None:
        employee.date_of_joining = payload.dateOfJoining.strip()
    if payload.officeLocation is not None:
        employee.office_location = payload.officeLocation.strip()

    db.commit()
    db.refresh(current_user)
    db.refresh(employee)

    return EmployeeProfileResponse(
        user_id=current_user.user_id,
        fullName=current_user.fullName,
        emailAddress=current_user.emailAddress,
        employeeId=current_user.employeeId,
        department=current_user.department,
        designation=current_user.designation,
        contactNo=current_user.contactNo,
        lastLogin=current_user.lastLogin.isoformat() if current_user.lastLogin else None,
        panNumber=employee.pan_number,
        bankAccount=employee.bank_account,
        ifscCode=employee.ifsc_code,
        gradePay=employee.grade_pay,
        basicPay=employee.basic_pay,
        dateOfJoining=_normalize_date_of_joining(employee.date_of_joining),
        officeLocation=employee.office_location,
    )
