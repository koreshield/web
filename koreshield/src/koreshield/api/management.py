import json
import os
import re
import secrets
import hashlib
import uuid
from urllib.parse import urlparse
from uuid import UUID
from datetime import datetime, timedelta, timezone

import bcrypt
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import AsyncSessionLocal, get_db
from ..models.api_key import APIKey
from ..models.request_log import RequestLog
from ..models.user import User
from ..oauth_handler import (
    GitHubOAuthHandler,
    GoogleOAuthHandler,
    find_or_create_oauth_user,
    OAuthException,
)
from ..services.email import (
    send_admin_mfa_email,
    send_password_reset_email,
    send_verification_email,
    send_welcome_email,
)
from .auth import AUTH_COOKIE_NAME, get_current_admin, get_current_user, issue_jwt_token

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Management"])
PRIVILEGED_ROLES = {"admin", "owner", "superuser"}
_MFA_CODE_TTL_SECONDS = 10 * 60
_MFA_CHALLENGE_STORE: dict[str, dict] = {}

SENSITIVE_KEY_PATTERN = re.compile(
    r"(password|secret|token|private[_-]?key|api[_-]?key|dsn|connection|credential|auth)",
    re.IGNORECASE,
)


def _is_dev_mode(config: dict | None = None) -> bool:
    env_candidates = [
        os.getenv("ENVIRONMENT"),
        os.getenv("APP_ENV"),
    ]
    if config and isinstance(config, dict):
        server_config = config.get("server", {})
        if isinstance(server_config, dict):
            env_candidates.append(server_config.get("environment"))

    normalized = {(value or "").strip().lower() for value in env_candidates}
    return any(value in {"dev", "development", "local", "test"} for value in normalized)


def _redact_sensitive(value):
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            if SENSITIVE_KEY_PATTERN.search(str(key)):
                redacted[key] = "***redacted***"
            else:
                redacted[key] = _redact_sensitive(item)
        return redacted
    if isinstance(value, list):
        return [_redact_sensitive(item) for item in value]
    return value

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MFAVerifyRequest(BaseModel):
    challenge_token: str
    code: str = Field(..., min_length=6, max_length=6)


class MFAResendRequest(BaseModel):
    challenge_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class SecurityConfigUpdate(BaseModel):
    sensitivity: str | None = None
    default_action: str | None = None


class IncidentCreateRequest(BaseModel):
    title: str
    severity: str = Field(..., pattern="^(critical|major|minor|maintenance)$")
    affected_components: list[str] = Field(default_factory=list)
    message: str
    incident_type: str = "service_disruption"
    status: str = Field(default="investigating", pattern="^(investigating|identified|monitoring|resolved|scheduled)$")


class IncidentUpdateRequest(BaseModel):
    message: str
    status: str = Field(..., pattern="^(investigating|identified|monitoring|resolved|scheduled)$")


class MaintenanceCreateRequest(BaseModel):
    title: str
    description: str
    scheduled_start: str
    scheduled_end: str
    affected_components: list[str] = Field(default_factory=list)
    status: str = Field(default="scheduled", pattern="^(scheduled|in_progress|completed)$")


class BreachCreateRequest(BaseModel):
    title: str
    severity: str = Field(..., pattern="^(critical|major|minor)$")
    summary: str
    status: str = Field(default="investigating", pattern="^(investigating|identified|monitoring|resolved)$")
    disclosure_required: bool = False
    regulatory_due_at: str | None = None


class BreachUpdateRequest(BaseModel):
    message: str
    status: str = Field(..., pattern="^(investigating|identified|monitoring|resolved)$")


def _utcnow_naive() -> datetime:
    """Return naive UTC datetime for current schema compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _validate_password_strength(password: str) -> None:
    """Apply baseline password validation."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )


def _cleanup_expired_mfa_challenges() -> None:
    now = _utcnow_naive()
    expired_tokens = [
        token
        for token, challenge in _MFA_CHALLENGE_STORE.items()
        if challenge.get("expires_at") and challenge["expires_at"] <= now
    ]
    for token in expired_tokens:
        _MFA_CHALLENGE_STORE.pop(token, None)


def _generate_mfa_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))


def _hash_mfa_code(code: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()


def _build_log_integrity_hash(entry: dict) -> str:
    canonical_payload = json.dumps(
        {
            "request_id": entry.get("request_id"),
            "timestamp": entry.get("timestamp"),
            "provider": entry.get("provider"),
            "model": entry.get("model"),
            "path": entry.get("path"),
            "method": entry.get("method"),
            "status_code": entry.get("status_code"),
            "is_blocked": entry.get("is_blocked"),
            "attack_detected": entry.get("attack_detected"),
            "attack_type": entry.get("attack_type"),
            "user_id": entry.get("user_id"),
        },
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    return hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()


def _build_auth_response(user: User, token: str) -> dict:
    return {
        "user": user.to_dict(),
        "token": token,
        "mfa_required": False,
    }


async def _issue_admin_mfa_challenge(user: User) -> dict:
    _cleanup_expired_mfa_challenges()
    challenge_token = secrets.token_urlsafe(32)
    code = _generate_mfa_code()
    code_salt = secrets.token_hex(16)
    expires_at = _utcnow_naive() + timedelta(seconds=_MFA_CODE_TTL_SECONDS)

    _MFA_CHALLENGE_STORE[challenge_token] = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "code_hash": _hash_mfa_code(code, code_salt),
        "code_salt": code_salt,
        "expires_at": expires_at,
        "delivery": "email",
        "auth_method": user.oauth_provider or "password",
    }

    sent = await send_admin_mfa_email(user.email, code, user.name)
    if not sent:
        _MFA_CHALLENGE_STORE.pop(challenge_token, None)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Privileged sign-in requires an email verification code, but email delivery is not configured correctly right now",
        )

    payload = {
        "user": user.to_dict(),
        "mfa_required": True,
        "challenge_token": challenge_token,
        "delivery": "email",
        "expires_in_seconds": _MFA_CODE_TTL_SECONDS,
    }
    if _is_dev_mode():
        payload["debug_code"] = code
    return payload


async def _complete_login(response: Response, user: User, *, mfa_verified: bool, auth_method: str) -> dict:
    user.last_login_at = _utcnow_naive()
    token = issue_jwt_token(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        extra_claims={
            "mfa_verified": mfa_verified,
            "auth_method": auth_method,
            "name": user.name,
        },
    )
    _set_auth_cookie(response, token)
    return _build_auth_response(user, token)


async def _count_privileged_users(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(User)
        .where(User.role.in_(["admin", "owner", "superuser"]))
    )
    return int(result.scalar_one() or 0)


async def _promote_to_owner_if_workspace_unclaimed(db: AsyncSession, user: User) -> bool:
    if user.role in {"admin", "owner", "superuser"}:
        return False

    privileged_user_count = await _count_privileged_users(db)
    if privileged_user_count > 0:
        return False

    user.role = "owner"
    user.updated_at = _utcnow_naive()
    logger.info("bootstrap_promoted_user_to_owner", user_id=str(user.id), email=user.email)
    return True


async def get_optional_db():
    """Return a database session when configured, otherwise yield None."""
    if not AsyncSessionLocal:
        yield None
        return

    async for session in get_db():
        yield session


@router.get("/me", summary="Current User", tags=["Authentication"])
async def get_me(
    current_user: dict = Depends(get_current_user),
):
    """Get current authenticated user profile."""
    return {"user": current_user}


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    company: str | None = None
    job_title: str | None = None


@router.patch("/me", summary="Update Profile", tags=["Authentication"])
async def update_me(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile."""
    user_id = current_user.get("id")
    try:
        user_uuid = UUID(str(user_id))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid user identifier") from exc

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.name is not None:
        user.name = request.name.strip() or user.name

    metadata = dict(user.user_metadata or {})
    if request.company is not None:
        company = request.company.strip()
        if company:
            metadata["company"] = company
        else:
            metadata.pop("company", None)

    if request.job_title is not None:
        job_title = request.job_title.strip()
        if job_title:
            metadata["job_title"] = job_title
        else:
            metadata.pop("job_title", None)

    user.user_metadata = metadata

    await db.commit()
    await db.refresh(user)
    return {"user": user.to_dict()}


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="User Signup",
    description="Create a new user account with email verification. Sends welcome and verification emails.",
    response_description="User created successfully with JWT token",
    responses={
        201: {
            "description": "User created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "email": "user@example.com",
                            "name": "John Doe",
                            "role": "user",
                            "status": "active",
                            "email_verified": False,
                            "created_at": "2026-02-05T19:00:00Z"
                        },
                        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "message": "Signup successful! Please check your email to verify your account."
                    }
                }
            }
        },
        400: {"description": "Email already registered or invalid password"},
        500: {"description": "Internal server error"}
    },
    tags=["Authentication"]
)
async def signup(
    request: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    User signup endpoint with email verification.

    Creates a new user account, sends welcome email and verification email.
    Password is hashed using bcrypt before storage.
    """
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == request.email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Validate password strength
        _validate_password_strength(request.password)

        # Hash password
        password_hash = _hash_password(request.password)

        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        verification_expires = _utcnow_naive() + timedelta(hours=24)

        user_count_result = await db.execute(select(func.count()).select_from(User))
        existing_user_count = user_count_result.scalar_one()
        assigned_role = "owner" if existing_user_count == 0 else "user"

        # Create user
        import uuid
        user = User(
            id=uuid.uuid4(),
            email=request.email,
            password_hash=password_hash,
            name=request.name,
            role=assigned_role,
            status='active',
            email_verified=False,
            email_verification_token=verification_token,
            email_verification_expires_at=verification_expires
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Send emails (non-blocking, don't fail signup if email fails)
        try:
            await send_welcome_email(request.email, request.name)
            await send_verification_email(request.email, verification_token, request.name)
        except Exception as e:
            logger.warning("failed_to_send_signup_emails", email=request.email, error=str(e))

        logger.info("user_signup_success", user_id=str(user.id), email=user.email)

        token = issue_jwt_token(
            user_id=str(user.id),
            email=user.email,
            role=user.role,
            extra_claims={
                "mfa_verified": False,
                "auth_method": "password",
                "name": user.name,
            },
        )
        _set_auth_cookie(response, token)

        return {
            "user": user.to_dict(),
            "token": token,
            "message": "Signup successful! Please check your email to verify your account."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("signup_error", error=str(e), email=request.email)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup failed. Please try again later."
        )

@router.post(
    "/login",
    summary="User Login",
    description="Authenticate user with email and password. Returns JWT token for subsequent requests.",
    response_description="Login successful with JWT token",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "user": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "email": "user@example.com",
                            "name": "John Doe",
                            "role": "user",
                            "status": "active",
                            "email_verified": True,
                            "last_login_at": "2026-02-05T19:30:00Z"
                        },
                        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                    }
                }
            }
        },
        401: {"description": "Invalid email or password"},
        403: {"description": "Account is not active"},
        500: {"description": "Internal server error"}
    },
    tags=["Authentication"]
)
async def admin_login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    User login endpoint with rate limiting to prevent brute force attacks.

    Authenticates user with email and password, returns JWT token.
    """
    try:
        # Find user by email
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if not user:
            logger.warning("login_attempt_user_not_found", email=request.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password
        if not bcrypt.checkpw(request.password.encode('utf-8'), user.password_hash.encode('utf-8')):
            logger.warning("login_attempt_invalid_password", email=request.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Check if user is active
        if user.status != 'active':
            logger.warning("login_attempt_inactive_user", email=request.email, status=user.status)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is not active"
            )

        role_changed = await _promote_to_owner_if_workspace_unclaimed(db, user)

        await db.commit()

        if user.role in PRIVILEGED_ROLES:
            logger.info(
                "login_mfa_challenge_issued",
                user_id=str(user.id),
                email=user.email,
                role=user.role,
                role_changed=role_changed,
            )
            return await _issue_admin_mfa_challenge(user)

        auth_response = await _complete_login(
            response,
            user,
            mfa_verified=False,
            auth_method="password",
        )
        await db.commit()

        logger.info("login_success", user_id=str(user.id), email=user.email, role=user.role, role_changed=role_changed)

        return auth_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_error", error=str(e), email=request.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again later."
        )


@router.post(
    "/mfa/verify",
    summary="Verify Admin MFA",
    description="Complete privileged sign-in by verifying the one-time code sent to the admin email address.",
    tags=["Authentication"],
)
async def verify_admin_mfa(
    request: MFAVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    _cleanup_expired_mfa_challenges()
    challenge = _MFA_CHALLENGE_STORE.get(request.challenge_token)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA challenge is invalid or has expired",
        )

    expected_hash = _hash_mfa_code(request.code.strip(), challenge["code_salt"])
    if not secrets.compare_digest(expected_hash, challenge["code_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code",
        )

    result = await db.execute(select(User).where(User.id == UUID(challenge["user_id"])))
    user = result.scalar_one_or_none()
    if not user:
        _MFA_CHALLENGE_STORE.pop(request.challenge_token, None)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    auth_method = challenge.get("auth_method", user.oauth_provider or "password")
    auth_response = await _complete_login(
        response,
        user,
        mfa_verified=True,
        auth_method=auth_method,
    )
    await db.commit()
    _MFA_CHALLENGE_STORE.pop(request.challenge_token, None)

    logger.info("admin_mfa_verified", user_id=str(user.id), email=user.email, role=user.role)
    return auth_response


@router.post(
    "/mfa/resend",
    summary="Resend Admin MFA Code",
    description="Resend the one-time admin verification code for an active privileged login challenge.",
    tags=["Authentication"],
)
async def resend_admin_mfa(
    request: MFAResendRequest,
):
    _cleanup_expired_mfa_challenges()
    challenge = _MFA_CHALLENGE_STORE.get(request.challenge_token)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA challenge is invalid or has expired",
        )

    code = _generate_mfa_code()
    code_salt = secrets.token_hex(16)
    challenge["code_salt"] = code_salt
    challenge["code_hash"] = _hash_mfa_code(code, code_salt)
    challenge["expires_at"] = _utcnow_naive() + timedelta(seconds=_MFA_CODE_TTL_SECONDS)

    sent = await send_admin_mfa_email(
        challenge["email"],
        code,
        challenge.get("name"),
    )
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Privileged sign-in requires an email verification code, but email delivery is not configured correctly right now",
        )

    payload = {
        "status": "resent",
        "challenge_token": request.challenge_token,
        "delivery": challenge.get("delivery", "email"),
        "expires_in_seconds": _MFA_CODE_TTL_SECONDS,
    }
    if _is_dev_mode():
        payload["debug_code"] = code
    return payload


@router.post(
    "/forgot-password",
    summary="Request Password Reset",
    description="Start the password reset flow and send a reset link if the account exists.",
    tags=["Authentication"],
)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Start the password reset flow.

    This endpoint always returns the same response so it does not leak whether an
    email address is registered.
    """
    generic_response = {
        "message": "If an account exists for that email, a reset link has been sent."
    }

    try:
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if not user or user.status != "active":
            logger.info("password_reset_requested_for_unknown_or_inactive_user", email=request.email)
            return generic_response

        token = secrets.token_urlsafe(32)
        user.reset_password_token = token
        user.reset_password_expires_at = _utcnow_naive() + timedelta(minutes=15)
        await db.commit()

        try:
            await send_password_reset_email(user.email, token, user.name)
        except Exception as exc:
            logger.warning("failed_to_send_password_reset_email", email=user.email, error=str(exc))

        logger.info("password_reset_requested", user_id=str(user.id), email=user.email)
        return generic_response
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("forgot_password_error", email=request.email, error=str(exc))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed. Please try again later.",
        )


@router.post(
    "/reset-password",
    summary="Reset Password",
    description="Complete the password reset flow using a valid reset token.",
    tags=["Authentication"],
)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset a user's password using a one-time token."""
    try:
        _validate_password_strength(request.new_password)

        result = await db.execute(select(User).where(User.reset_password_token == request.token))
        user = result.scalar_one_or_none()

        if not user or not user.reset_password_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        if user.reset_password_expires_at <= _utcnow_naive():
            user.reset_password_token = None
            user.reset_password_expires_at = None
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        user.password_hash = _hash_password(request.new_password)
        user.reset_password_token = None
        user.reset_password_expires_at = None
        await db.commit()

        logger.info("password_reset_success", user_id=str(user.id), email=user.email)
        return {"message": "Password reset successful. You can now log in with your new password."}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("reset_password_error", error=str(exc))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again later.",
        )

@router.post("/logout", summary="Logout", description="Invalidate the current session cookie and log out the authenticated user.", tags=["Authentication"])
async def admin_logout(response: Response, current_user: dict = Depends(get_current_user)):
    """Logout endpoint for any authenticated user."""
    _delete_auth_cookie(response)
    logger.info("user_logout", user_id=current_user.get("id"), email=current_user.get("email"))
    return {"status": "logged_out"}

@router.get("/stats/live", summary="Live Platform Statistics", description="Return raw in-memory runtime statistics for operator diagnostics.")
async def get_live_stats(request: Request, current_user: dict = Depends(get_current_admin)):
    """Get unscoped in-memory proxy statistics for admin diagnostics."""
    # Access the proxy instance from the app state or request
    if hasattr(request.app.state, "stats"):
        return request.app.state.stats
    return {"error": "Stats not available"}

@router.get("/config", summary="Get Configuration", description="Return the current platform configuration (development environments only). Sensitive values are redacted.")
async def get_config(request: Request, current_user: dict = Depends(get_current_admin)):
    """Get current configuration."""
    if hasattr(request.app.state, "config"):
        current_config = request.app.state.config
        if not _is_dev_mode(current_config):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration endpoint is disabled outside development environments",
            )
        return _redact_sensitive(current_config)
    return {"error": "Config not available"}

@router.patch("/config/security", summary="Update Security Config", description="Update runtime security settings including sensitivity level and default action policy.")
async def update_security_config(
    request: Request,
    config_update: SecurityConfigUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update security configuration."""
    if not hasattr(request.app.state, "config"):
        raise HTTPException(status_code=500, detail="Config not available")

    current_config = request.app.state.config
    security_config = current_config.get("security", {})

    updates_made = False

    if config_update.sensitivity:
        if config_update.sensitivity not in ["low", "medium", "high"]:
            raise HTTPException(status_code=400, detail="Invalid sensitivity level")
        security_config["sensitivity"] = config_update.sensitivity
        updates_made = True

    if config_update.default_action:
        if config_update.default_action not in ["block", "allow", "flag"]:
            raise HTTPException(status_code=400, detail="Invalid default action")
        security_config["default_action"] = config_update.default_action
        updates_made = True


    if updates_made:
        # Update the main config object
        current_config["security"] = security_config
        logger.info("security_config_updated", updates=config_update.dict(exclude_unset=True))


    if updates_made:
        # Update the main config object
        current_config["security"] = security_config
        logger.info("security_config_updated", updates=config_update.dict(exclude_unset=True))

    return {"status": "updated", "config": security_config}


@router.get(
    "/stats",
    summary="Per-Account Statistics",
    description=(
        "Returns request counts, block rates, and threat stats **scoped to the authenticated "
        "account only**. A brand-new account with no traffic will correctly return all zeros."
    ),
    tags=["Management"],
    responses={
        200: {"description": "Per-account statistics"},
        401: {"description": "Unauthenticated"},
    },
)
async def get_account_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession | None = Depends(get_optional_db),
):
    """Return statistics scoped strictly to the authenticated user's account."""
    try:
        user_uuid = UUID(current_user["id"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user identity")

    # When the database is unavailable (e.g. CI environment without DB), return zeros
    # rather than a 500 — the dashboard will show an empty state.
    if db is None:
        return {"statistics": {"requests_total": 0, "requests_blocked": 0, "requests_allowed": 0, "attacks_detected": 0}}

    try:
        total_result = await db.execute(
            select(func.count(RequestLog.id)).where(RequestLog.user_id == user_uuid)
        )
        total = total_result.scalar() or 0

        blocked_result = await db.execute(
            select(func.count(RequestLog.id)).where(
                RequestLog.user_id == user_uuid,
                RequestLog.is_blocked == True,  # noqa: E712
            )
        )
        blocked = blocked_result.scalar() or 0

        attacks_result = await db.execute(
            select(func.count(RequestLog.id)).where(
                RequestLog.user_id == user_uuid,
                RequestLog.attack_detected == True,  # noqa: E712
            )
        )
        attacks = attacks_result.scalar() or 0

        allowed = total - blocked
    except Exception as e:
        logger.error("account_stats_query_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")

    return {
        "statistics": {
            "requests_total": total,
            "requests_blocked": blocked,
            "requests_allowed": allowed,
            "attacks_detected": attacks,
        }
    }


@router.get(
    "/logs",
    summary="Audit Logs",
    description=(
        "Returns paginated request logs **scoped to the authenticated account only**. "
        "Results include detection outcomes, latency, provider, model, and attack details "
        "for every proxy request made with your API keys."
    ),
    tags=["Management"],
    responses={
        200: {"description": "Paginated request logs for this account"},
        401: {"description": "Unauthenticated"},
    },
)
async def get_audit_logs(
    request: Request,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession | None = Depends(get_optional_db),
):
    """Return request logs scoped to the authenticated user only.

    Merges two sources:
    1. Persisted rows in the ``request_logs`` table (filtered by user_id).
    2. In-memory ``audit_log_store`` entries that haven't yet been flushed to
       the DB (e.g. RAG scan results) — also filtered by user_id.
    """
    try:
        user_uuid = UUID(current_user["id"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user identity")

    user_id_str = str(user_uuid)
    logs: list[dict] = []
    seen_ids: set[str] = set()
    audit_integrity = getattr(request.app.state, "audit_integrity", None)

    # ── 1. In-memory audit_log_store (RAG scans, fast-path entries) ─────────
    audit_store = getattr(request.app.state, "audit_log_store", None)
    if audit_store:
        for entry in audit_store:
            entry_uid = entry.get("user_id")
            # user_id may be a UUID object or a string depending on origin
            if entry_uid is None or str(entry_uid) != user_id_str:
                continue
            rid = str(entry.get("request_id") or entry.get("id") or "")
            if rid and rid in seen_ids:
                continue
            if rid:
                seen_ids.add(rid)
            logs.append(entry)

    # ── 2. Persisted DB rows ─────────────────────────────────────────────────
    if db is not None:
        try:
            result = await db.execute(
                select(RequestLog)
                .where(RequestLog.user_id == user_uuid)
                .order_by(desc(RequestLog.timestamp))
                .limit(limit + len(logs))   # over-fetch slightly to fill page after dedup
            )
            for entry in result.scalars().all():
                rid = entry.request_id or str(entry.id)
                if rid in seen_ids:
                    continue
                seen_ids.add(rid)
                logs.append({
                    "id": str(entry.id),
                    "request_id": entry.request_id,
                    "timestamp": entry.timestamp.isoformat(),
                    "event": "request_log",
                    "path": entry.path,
                    "method": entry.method,
                    "provider": entry.provider,
                    "model": entry.model,
                    "status": "failure" if entry.is_blocked or entry.status_code >= 400 else "success",
                    "status_code": entry.status_code,
                    "latency_ms": entry.latency_ms,
                    "tokens_total": entry.tokens_total,
                    "cost": entry.cost,
                    "is_blocked": entry.is_blocked,
                    "attack_detected": entry.attack_detected,
                    "attack_type": entry.attack_type,
                    "attack_details": entry.attack_details or {},
                    "user_id": str(entry.user_id) if entry.user_id else None,
                    "ip": entry.ip_address,
                    "user_agent": entry.user_agent,
                    "integrity_hash": _build_log_integrity_hash(
                        {
                            "request_id": entry.request_id,
                            "timestamp": entry.timestamp.isoformat(),
                            "provider": entry.provider,
                            "model": entry.model,
                            "path": entry.path,
                            "method": entry.method,
                            "status_code": entry.status_code,
                            "is_blocked": entry.is_blocked,
                            "attack_detected": entry.attack_detected,
                            "attack_type": entry.attack_type,
                            "user_id": str(entry.user_id) if entry.user_id else None,
                        }
                    ),
                    **(
                        audit_integrity.get_metadata(entry.request_id)
                        if audit_integrity and entry.request_id
                        else {"verification_status": "unavailable", "storage_backend": "db_only"}
                    ),
                })
        except Exception as e:
            logger.error("audit_logs_query_failed", error=str(e))

    # Sort newest-first, paginate
    logs.sort(key=lambda e: e.get("timestamp") or "", reverse=True)
    total_count = len(logs)
    paginated = logs[offset: offset + limit]

    return {"logs": paginated, "total": total_count, "limit": limit, "offset": offset}


@router.get(
    "/logs/verify",
    summary="Verify Audit Log Chain",
    description="Verify ledger-backed hash-chain metadata for this account's audit logs.",
    tags=["Management"],
)
async def verify_audit_log_chain(
    request: Request,
    limit: int = 200,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession | None = Depends(get_optional_db),
):
    logs_response = await get_audit_logs(
        request=request,
        limit=limit,
        offset=0,
        current_user=current_user,
        db=db,
    )
    request_ids = [entry.get("request_id") for entry in logs_response["logs"] if entry.get("request_id")]
    audit_integrity = getattr(request.app.state, "audit_integrity", None)
    if not audit_integrity:
        return {
            "checked": 0,
            "missing": request_ids,
            "latest_chain_hash": None,
            "storage_backend": "unavailable",
            "verification_status": "unavailable",
        }
    return audit_integrity.verify_request_ids(request_ids)


@router.get(
    "/operations",
    summary="Operational State",
    description="Get the current operational incident, maintenance, breach, and uptime evidence state.",
    tags=["Management"],
)
async def get_operational_state(
    request: Request,
    current_user: dict = Depends(get_current_admin),
):
    operational_status = getattr(request.app.state, "operational_status", None)
    if not operational_status:
        raise HTTPException(status_code=500, detail="Operational status service not available")
    return await operational_status.get_admin_state()


@router.post(
    "/operations/incidents",
    summary="Create Incident",
    description="Create a customer-facing operational incident entry and publish it in the status history.",
    tags=["Management"],
)
async def create_incident(
    request: Request,
    payload: IncidentCreateRequest,
    current_user: dict = Depends(get_current_admin),
):
    operational_status = getattr(request.app.state, "operational_status", None)
    if not operational_status:
        raise HTTPException(status_code=500, detail="Operational status service not available")
    incident = await operational_status.create_incident(
        title=payload.title,
        severity=payload.severity,
        affected_components=payload.affected_components,
        message=payload.message,
        incident_type=payload.incident_type,
        status=payload.status,
        source="manual",
    )
    logger.info("incident_created", actor=current_user.get("email"), incident_id=incident["id"])
    return incident


@router.post(
    "/operations/incidents/{incident_id}/updates",
    summary="Add Incident Update",
    description="Append a timeline update to an operational incident and optionally resolve it.",
    tags=["Management"],
)
async def add_incident_update(
    incident_id: str,
    request: Request,
    payload: IncidentUpdateRequest,
    current_user: dict = Depends(get_current_admin),
):
    operational_status = getattr(request.app.state, "operational_status", None)
    if not operational_status:
        raise HTTPException(status_code=500, detail="Operational status service not available")
    try:
        incident = await operational_status.add_incident_update(
            incident_id,
            message=payload.message,
            status=payload.status,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Incident not found")
    logger.info("incident_updated", actor=current_user.get("email"), incident_id=incident_id, status=payload.status)
    return incident


@router.post(
    "/operations/maintenance",
    summary="Schedule Maintenance",
    description="Create a scheduled maintenance window for the public status page.",
    tags=["Management"],
)
async def schedule_maintenance(
    request: Request,
    payload: MaintenanceCreateRequest,
    current_user: dict = Depends(get_current_admin),
):
    operational_status = getattr(request.app.state, "operational_status", None)
    if not operational_status:
        raise HTTPException(status_code=500, detail="Operational status service not available")
    window = await operational_status.schedule_maintenance(
        title=payload.title,
        description=payload.description,
        scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end,
        affected_components=payload.affected_components,
        status=payload.status,
    )
    logger.info("maintenance_scheduled", actor=current_user.get("email"), maintenance_id=window["id"])
    return window


@router.post(
    "/operations/breaches",
    summary="Create Breach Record",
    description="Open a security incident / breach record with disclosure and regulatory tracking fields.",
    tags=["Management"],
)
async def create_breach_record(
    request: Request,
    payload: BreachCreateRequest,
    current_user: dict = Depends(get_current_admin),
):
    operational_status = getattr(request.app.state, "operational_status", None)
    if not operational_status:
        raise HTTPException(status_code=500, detail="Operational status service not available")
    record = await operational_status.create_breach_record(
        title=payload.title,
        severity=payload.severity,
        summary=payload.summary,
        status=payload.status,
        disclosure_required=payload.disclosure_required,
        regulatory_due_at=payload.regulatory_due_at,
    )
    logger.info("breach_record_created", actor=current_user.get("email"), breach_id=record["id"])
    return record


@router.post(
    "/operations/breaches/{breach_id}/updates",
    summary="Add Breach Update",
    description="Append a timeline update to a breach record and keep disclosure tracking current.",
    tags=["Management"],
)
async def add_breach_update(
    breach_id: str,
    request: Request,
    payload: BreachUpdateRequest,
    current_user: dict = Depends(get_current_admin),
):
    operational_status = getattr(request.app.state, "operational_status", None)
    if not operational_status:
        raise HTTPException(status_code=500, detail="Operational status service not available")
    try:
        record = await operational_status.add_breach_update(
            breach_id,
            message=payload.message,
            status=payload.status,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Breach record not found")
    logger.info("breach_record_updated", actor=current_user.get("email"), breach_id=breach_id, status=payload.status)
    return record

class Policy(BaseModel):
    id: str
    name: str
    description: str
    severity: str
    roles: list[str] = ["admin", "moderator", "user"]

@router.get("/policies", summary="List Policies", description="List all active security policies configured in the policy engine.")
async def list_policies(request: Request, current_user: dict = Depends(get_current_user)):
    """List all security policies."""
    # Assuming the proxy instance is available and has the policy engine
    if hasattr(request.app.state, "policy_engine"):
        return request.app.state.policy_engine.list_policies()
    return []

@router.post("/policies", summary="Create Policy", description="Add a new security policy to the policy engine. Policy IDs must be unique.")
async def create_policy(request: Request, policy: Policy, current_user: dict = Depends(get_current_admin)):
    """Create or update a policy."""
    if not hasattr(request.app.state, "policy_engine"):
        raise HTTPException(status_code=500, detail="Policy engine not initialized")

    engine = request.app.state.policy_engine
    success = engine.add_policy(policy.dict())

    if not success:
        raise HTTPException(status_code=400, detail="Policy ID already exists")

    # Persist to config in state
    if hasattr(request.app.state, "config"):
        request.app.state.config["policies"] = engine.list_policies()

    return {"status": "created", "policy": policy}

@router.delete("/policies/{policy_id}", summary="Delete Policy", description="Remove a security policy by ID from the policy engine.")
async def delete_policy(request: Request, policy_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete a policy."""
    if not hasattr(request.app.state, "policy_engine"):
        raise HTTPException(status_code=500, detail="Policy engine not initialized")

    engine = request.app.state.policy_engine
    success = engine.remove_policy(policy_id)

    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")

    # Persist to config in state
    if hasattr(request.app.state, "config"):
        request.app.state.config["policies"] = engine.list_policies()

    return {"status": "deleted", "policy_id": policy_id}


# ============================================================================
# API Key Management Endpoints
# ============================================================================

class CreateAPIKeyRequest(BaseModel):
    name: str
    description: str | None = None
    expires_in_days: int | None = None  # Optional expiration in days
    expires_at: datetime | None = None  # Optional specific expiration date

class APIKeyResponse(BaseModel):
    id: str
    name: str
    description: str | None
    key_prefix: str
    last_used_at: str | None
    expires_at: str | None
    is_revoked: bool
    created_at: str

class CreateAPIKeyResponse(APIKeyResponse):
    api_key: str  # Full key - only shown once!


def _current_user_uuid(current_user: dict) -> UUID:
    """Normalize authenticated user ids for UUID-backed models and queries."""
    try:
        return UUID(str(current_user["id"]))
    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identity",
        ) from exc

@router.post(
    "/api-keys",
    status_code=status.HTTP_201_CREATED,
    summary="Generate API Key",
    description="Generate a new API key for authentication. The full key is only shown once!",
    response_model=CreateAPIKeyResponse,
    tags=["API Keys"]
)
async def generate_api_key(
    request: CreateAPIKeyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new API key for the authenticated user.

    **Important**: The full API key is only returned once. Store it securely!
    """
    try:
        user_id = _current_user_uuid(current_user)

        # Generate API key
        full_key, key_hash, key_prefix = APIKey.generate_key()

        # Calculate expiration
        # Calculate expiration
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = None

        if request.expires_at is not None:
             # Normalize to naive UTC for storage
             if request.expires_at.tzinfo is not None:
                 expires_at = request.expires_at.astimezone(timezone.utc).replace(tzinfo=None)
             else:
                 expires_at = request.expires_at

             if expires_at <= now:
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST,
                     detail="expires_at must be in the future",
                 )
        elif request.expires_in_days is not None:
            if request.expires_in_days <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="expires_in_days must be greater than 0",
                )
            expires_at = now + timedelta(days=request.expires_in_days)

        # Create API key record
        api_key = APIKey(
            user_id=user_id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            name=request.name,
            description=request.description,
            expires_at=expires_at,
        )

        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)

        logger.info(
            "API key generated",
            user_id=str(user_id),
            key_id=str(api_key.id),
            key_prefix=key_prefix
        )

        # Return with full key (only time it's shown!)
        response_data = api_key.to_dict()
        response_data["api_key"] = full_key

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate API key", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate API key"
        )

@router.get(
    "/api-keys",
    summary="List API Keys",
    description="List all API keys for the authenticated user",
    response_model=list[APIKeyResponse],
    tags=["API Keys"]
)
async def list_api_keys(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all API keys for the authenticated user.

    Note: Full keys are never shown again after creation.
    """
    try:
        user_id = _current_user_uuid(current_user)
        result = await db.execute(
            select(APIKey)
            .where(APIKey.user_id == user_id)
            .order_by(APIKey.created_at.desc())
        )
        api_keys = result.scalars().all()

        return [api_key.to_dict() for api_key in api_keys]

    except Exception as e:
        logger.error("Failed to list API keys", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list API keys"
        )

@router.delete(
    "/api-keys/{key_id}",
    summary="Revoke API Key",
    description="Revoke (delete) an API key",
    tags=["API Keys"]
)
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Revoke an API key. The key will be marked as revoked and can no longer be used.
    """
    try:
        user_id = _current_user_uuid(current_user)
        # Find the API key
        result = await db.execute(
            select(APIKey)
            .where(APIKey.id == key_id)
            .where(APIKey.user_id == user_id)
        )
        api_key = result.scalar_one_or_none()

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )

        # Mark as revoked
        api_key.is_revoked = True
        await db.commit()

        logger.info(
            "API key revoked",
            user_id=str(user_id),
            key_id=str(api_key.id),
            key_prefix=api_key.key_prefix
        )

        return {"status": "revoked", "key_id": key_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to revoke API key", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke API key"
        )

@router.get(
    "/api-keys/{key_id}",
    summary="Get API Key Details",
    description="Get details of a specific API key",
    response_model=APIKeyResponse,
    tags=["API Keys"]
)
async def get_api_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific API key.

    Note: The full key is never returned, only the prefix.
    """
    try:
        user_id = _current_user_uuid(current_user)
        result = await db.execute(
            select(APIKey)
            .where(APIKey.id == key_id)
            .where(APIKey.user_id == user_id)
        )
        api_key = result.scalar_one_or_none()

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )

        return api_key.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get API key", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get API key"
        )

# ============================================================================
# Threat & Block Log Export
# ============================================================================

import csv
import io as _io

@router.get(
    "/export/threats",
    summary="Export Threat & Block Logs",
    description=(
        "Download all threat detections and blocked requests as a CSV file. "
        "Includes timestamp, attack type, confidence, action taken, provider, model, "
        "latency, and IP address. Suitable for client and investor reporting."
    ),
    tags=["Management"],
    response_class=Response,
)
async def export_threat_logs(
    limit: int = 10000,
    include_safe: bool = False,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession | None = Depends(get_optional_db),
):
    """Export threat and block logs as a downloadable CSV."""

    rows = []

    if db:
        from sqlalchemy import or_
        query = select(RequestLog).order_by(desc(RequestLog.timestamp)).limit(limit)
        if not include_safe:
            query = query.where(
                or_(RequestLog.attack_detected == True, RequestLog.is_blocked == True)
            )
        result = await db.execute(query)
        logs = result.scalars().all()

        for log in logs:
            details = log.attack_details or {}
            detection = details.get("detection") or {}
            policy = details.get("policy") or {}
            confidence = detection.get("confidence") or ""
            triggered_policy = policy.get("reason") or policy.get("policy_id") or ""
            detection.get("attack_type") or log.attack_type or ""

            rows.append({
                "timestamp": log.timestamp.isoformat() if log.timestamp else "",
                "request_id": log.request_id or "",
                "threat_detected": str(bool(log.attack_detected)),
                "threat_type": log.attack_type or "",
                "confidence": f"{float(confidence):.4f}" if confidence != "" else "",
                "action_taken": "blocked" if log.is_blocked else "allowed",
                "triggered_policy": triggered_policy,
                "block_reason": log.block_reason or "",
                "provider": log.provider or "",
                "model": log.model or "",
                "status_code": log.status_code or "",
                "latency_ms": f"{log.latency_ms:.1f}" if log.latency_ms else "",
                "tokens_total": log.tokens_total or 0,
                "cost_gbp": f"{log.cost:.6f}" if log.cost else "0.000000",
                "ip_address": log.ip_address or "",
                "user_agent": (log.user_agent or "")[:120],
                "user_id": str(log.user_id) if log.user_id else "",
                "api_key_id": str(log.api_key_id) if log.api_key_id else "",
            })
    else:
        # Fallback: no DB — return empty CSV with headers only
        pass

    fieldnames = [
        "timestamp", "request_id", "threat_detected", "threat_type",
        "confidence", "action_taken", "triggered_policy", "block_reason",
        "provider", "model", "status_code", "latency_ms",
        "tokens_total", "cost_gbp", "ip_address", "user_agent",
        "user_id", "api_key_id",
    ]

    output = _io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)

    csv_bytes = output.getvalue().encode("utf-8")
    filename = f"koreshield_threats_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Internal: test key provisioning (used by CI / security regression workflows)
# ---------------------------------------------------------------------------

class _TestKeyRequest(BaseModel):
    name: str = "ci-test-key"
    type: str = "test"


@router.post(
    "/internal/test-keys",
    summary="Provision CI Test API Key",
    tags=["Management"],
    include_in_schema=False,  # Hidden from public Swagger docs
)
async def provision_test_key(
    request: Request,
    body: _TestKeyRequest,
    db: AsyncSession | None = Depends(get_optional_db),
):
    """
    Create a short-lived test API key for CI/CD regression suites.

    Authentication uses the ``X-Internal-Secret`` header (must match the
    ``SECRET_KEY`` environment variable).  This endpoint is intentionally
    not exposed in the public OpenAPI schema.

    Returns:
        ``{"key": "<full_api_key>", "key_id": "<uuid>", "name": "<name>"}``
    """
    secret_key = os.getenv("SECRET_KEY", "")
    provided = request.headers.get("X-Internal-Secret", "")

    # Constant-time comparison to prevent timing attacks
    import hmac as _hmac
    if not secret_key or not _hmac.compare_digest(
        provided.encode("utf-8"), secret_key.encode("utf-8")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Internal-Secret header",
        )

    full_key, key_hash, key_prefix = APIKey.generate_key()

    if db is not None:
        # Provision an ephemeral key (24-hour TTL) attached to a stable CI user.
        # Fresh CI databases do not have an admin yet, so we create a service
        # owner instead of returning an in-memory key that normal API auth
        # cannot validate.
        try:
            admin_result = await db.execute(
                select(User).where(User.role.in_(["admin", "owner", "superuser"])).limit(1)
            )
            admin_user = admin_result.scalar_one_or_none()

            if admin_user is None:
                ci_email = "ci-security@koreshield.local"
                ci_user_result = await db.execute(
                    select(User).where(User.email == ci_email).limit(1)
                )
                admin_user = ci_user_result.scalar_one_or_none()

            now = datetime.now(timezone.utc).replace(tzinfo=None)
            if admin_user is None:
                admin_user = User(
                    id=uuid.uuid4(),
                    email="ci-security@koreshield.local",
                    password_hash=_hash_password(secrets.token_urlsafe(32)),
                    name="CI Security Service",
                    role="owner",
                    status="active",
                    email_verified=True,
                    created_at=now,
                    updated_at=now,
                    user_metadata={"system_user": True, "purpose": "security_ci"},
                )
                db.add(admin_user)
                await db.flush()
                logger.info(
                    "CI security service user created",
                    user_id=str(admin_user.id),
                    email=admin_user.email,
                )

            api_key_record = APIKey(
                user_id=admin_user.id,
                key_hash=key_hash,
                key_prefix=key_prefix,
                name=body.name,
                description=f"CI test key (type={body.type})",
                expires_at=now + timedelta(hours=24),
            )
            db.add(api_key_record)
            await db.commit()
            await db.refresh(api_key_record)
            logger.info(
                "CI test key provisioned",
                key_id=str(api_key_record.id),
                name=body.name,
                user_id=str(admin_user.id),
            )
            return {"key": full_key, "key_id": str(api_key_record.id), "name": body.name}
        except Exception as exc:
            await db.rollback()
            logger.warning("Could not persist CI test key to DB", error=str(exc))

    # Fallback: return the key without DB persistence (still usable for
    # auth-less smoke tests that don't hit the DB-backed key lookup).
    logger.info("CI test key issued (in-memory fallback)", name=body.name)
    return {"key": full_key, "key_id": str(uuid.uuid4()), "name": body.name}


# OAuth Endpoints

class OAuthCallbackRequest(BaseModel):
    """Payload sent by the frontend callback page after the OAuth provider redirects."""
    code: str = Field(..., description="Authorization code returned by the OAuth provider")
    state: str = Field(..., description="CSRF state token issued by the login endpoint")


class OAuthLoginResponse(BaseModel):
    """Returned by the login initiation endpoint."""
    auth_url: str = Field(..., description="Full authorization URL to redirect the user to")
    state: str = Field(..., description="CSRF state token — store in sessionStorage and send back with the callback")


class OAuthCallbackResponse(BaseModel):
    """Returned after a successful OAuth callback."""
    user: dict = Field(..., description="Authenticated user object")
    token: str | None = Field(None, description="JWT access token (also set as an HttpOnly cookie)")
    mfa_required: bool = Field(False, description="Whether a second factor is required before admin access is granted")
    challenge_token: str | None = Field(None, description="Opaque MFA challenge token when privileged verification is pending")
    delivery: str | None = Field(None, description="How the second factor was delivered")
    expires_in_seconds: int | None = Field(None, description="Challenge lifetime in seconds")


# TTL (seconds) for the CSRF state token stored in Redis
_OAUTH_STATE_TTL = 600  # 10 minutes


def _resolve_frontend_base_url(request: Request) -> str:
    """Resolve the frontend base URL for OAuth callbacks."""
    configured = os.getenv("FRONTEND_BASE_URL")
    if configured:
        return configured.rstrip("/")

    origin = request.headers.get("origin")
    if origin:
        return origin.rstrip("/")

    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")

    host = request.headers.get("host", "localhost:3000")
    scheme = "http" if host.startswith(("localhost", "127.0.0.1")) else "https"
    return f"{scheme}://{host}".rstrip("/")


def _oauth_redirect_uri(request: Request, provider: str) -> str:
    """Return the frontend callback URL that OAuth providers must redirect to.

    GitHub / Google are configured with:
      Authorised redirect URI = https://koreshield.com/auth/github-callback
                                https://koreshield.com/auth/google-callback

    FRONTEND_BASE_URL is preferred, but we can also derive the active frontend
    origin from the incoming request so local Docker and reverse-proxy setups
    do not depend on a separate manual env setting.
    """
    base = _resolve_frontend_base_url(request)
    return f"{base}/auth/{provider}-callback"


async def _store_oauth_state(request: Request, provider: str, state: str, payload: dict) -> None:
    """Persist the CSRF state token in Redis with a 10-minute TTL.

    Falls back to a process-local dict when Redis is unavailable (dev only).
    """
    import json as _json
    redis = getattr(request.app.state, "redis_async_client", None)
    key = f"oauth_state:{provider}:{state}"
    if redis:
        await redis.set(key, _json.dumps(payload), ex=_OAUTH_STATE_TTL)
    else:
        # Dev fallback — store on the app state dict (single-process only)
        store = getattr(request.app.state, "_oauth_state_store", {})
        store[key] = payload
        request.app.state._oauth_state_store = store


async def _consume_oauth_state(request: Request, provider: str, state: str) -> dict:
    """Retrieve and delete the CSRF state from Redis (atomic get-and-delete).

    Raises HTTPException 400 if the state is missing or expired.
    """
    import json as _json
    redis = getattr(request.app.state, "redis_async_client", None)
    key = f"oauth_state:{provider}:{state}"
    if redis:
        raw = await redis.getdel(key)
        if raw is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OAuth state. Please try signing in again.",
            )
        return _json.loads(raw)
    else:
        store = getattr(request.app.state, "_oauth_state_store", {})
        payload = store.pop(key, None)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OAuth state. Please try signing in again.",
            )
        return payload


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set the auth cookie with environment-appropriate settings."""
    cookie_samesite = os.getenv("COOKIE_SAMESITE")
    if not cookie_samesite:
        env = os.getenv("ENVIRONMENT", "").lower()
        cookie_samesite = "none" if env in {"production", "staging"} else "lax"
    cookie_secure = os.getenv("COOKIE_SECURE", "false").strip().lower() in {"1", "true", "yes"}
    if cookie_samesite == "none":
        cookie_secure = True
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=f"Bearer {token}",
        httponly=True,
        samesite=cookie_samesite,
        secure=cookie_secure,
        max_age=24 * 60 * 60,
        path="/",
    )


def _delete_auth_cookie(response: Response) -> None:
    """Delete the auth cookie using the same attributes it was set with.

    Browsers only honour a Set-Cookie deletion (max_age=0 / expires in the past)
    when the SameSite, Secure, HttpOnly, and Path attributes match the original
    cookie exactly.  Using plain delete_cookie() without these attributes leaves
    the cookie alive in production (SameSite=None; Secure) environments.
    """
    cookie_samesite = os.getenv("COOKIE_SAMESITE")
    if not cookie_samesite:
        env = os.getenv("ENVIRONMENT", "").lower()
        cookie_samesite = "none" if env in {"production", "staging"} else "lax"
    cookie_secure = os.getenv("COOKIE_SECURE", "false").strip().lower() in {"1", "true", "yes"}
    if cookie_samesite == "none":
        cookie_secure = True
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value="",
        httponly=True,
        samesite=cookie_samesite,
        secure=cookie_secure,
        max_age=0,
        expires=0,
        path="/",
    )


@router.get(
    "/oauth/github/login",
    response_model=OAuthLoginResponse,
    summary="Initiate GitHub OAuth",
    description=(
        "Generates a GitHub authorization URL and a CSRF state token. "
        "The frontend should redirect the user to `auth_url`. "
        "GitHub will redirect back to `https://koreshield.com/auth/github-callback?code=...&state=...`. "
        "Store `state` in `sessionStorage` and pass it to the callback endpoint."
    ),
    tags=["Authentication", "OAuth"],
    responses={
        400: {"description": "GitHub OAuth is not configured on the server"},
        500: {"description": "Unexpected server error"},
    },
)
async def github_login(request: Request, redirect_url: str | None = None):
    """Initiate GitHub OAuth flow."""
    try:
        state = secrets.token_urlsafe(32)
        redirect_uri = _oauth_redirect_uri(request, "github")
        await _store_oauth_state(
            request, "github", state,
            {"redirect_url": redirect_url or "/dashboard", "redirect_uri": redirect_uri},
        )
        auth_url = GitHubOAuthHandler.get_authorization_url(state, redirect_uri)
        return {"auth_url": auth_url, "state": state}
    except OAuthException as e:
        logger.warning("github_login_oauth_not_configured", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("github_login_error", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GitHub login failed")


@router.post(
    "/oauth/github/callback",
    response_model=OAuthCallbackResponse,
    summary="Complete GitHub OAuth",
    description=(
        "Validates the CSRF state, exchanges the authorization code with GitHub, "
        "and returns a JWT token + user object. An `HttpOnly` session cookie is also set. "
        "Called by the `/auth/github-callback` frontend page."
    ),
    tags=["Authentication", "OAuth"],
    responses={
        400: {"description": "Invalid or expired state, or GitHub rejected the authorization code"},
        500: {"description": "Unexpected server error"},
    },
)
async def github_callback(
    request: Request,
    response: Response,
    body: OAuthCallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback from GitHub."""
    try:
        # Validate CSRF state — raises 400 if invalid/expired
        cached = await _consume_oauth_state(request, "github", body.state)
        redirect_uri = cached["redirect_uri"]

        access_token = await GitHubOAuthHandler.exchange_code_for_token(body.code, redirect_uri)
        user_info = await GitHubOAuthHandler.get_user_info(access_token)

        user = await find_or_create_oauth_user(
            db,
            provider="github",
            provider_user_id=user_info["id"],
            email=user_info["email"],
            name=user_info["name"],
        )
        await db.commit()

        if user.role in PRIVILEGED_ROLES:
            logger.info("github_oauth_mfa_challenge_issued", user_id=str(user.id), email=user.email, role=user.role)
            return await _issue_admin_mfa_challenge(user)

        auth_response = await _complete_login(
            response,
            user,
            mfa_verified=False,
            auth_method="github",
        )
        await db.commit()

        logger.info("github_oauth_login_success", user_id=str(user.id), email=user.email)
        return auth_response

    except OAuthException as e:
        logger.warning("github_callback_oauth_error", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("github_callback_error", error=str(e))
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GitHub callback handling failed")


@router.get(
    "/oauth/google/login",
    response_model=OAuthLoginResponse,
    summary="Initiate Google OAuth",
    description=(
        "Generates a Google authorization URL and a CSRF state token. "
        "The frontend should redirect the user to `auth_url`. "
        "Google will redirect back to `https://koreshield.com/auth/google-callback?code=...&state=...`. "
        "Store `state` in `sessionStorage` and pass it to the callback endpoint."
    ),
    tags=["Authentication", "OAuth"],
    responses={
        400: {"description": "Google OAuth is not configured on the server"},
        500: {"description": "Unexpected server error"},
    },
)
async def google_login(request: Request, redirect_url: str | None = None):
    """Initiate Google OAuth flow."""
    try:
        state = secrets.token_urlsafe(32)
        redirect_uri = _oauth_redirect_uri(request, "google")
        await _store_oauth_state(
            request, "google", state,
            {"redirect_url": redirect_url or "/dashboard", "redirect_uri": redirect_uri},
        )
        auth_url = GoogleOAuthHandler.get_authorization_url(state, redirect_uri)
        return {"auth_url": auth_url, "state": state}
    except OAuthException as e:
        logger.warning("google_login_oauth_not_configured", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("google_login_error", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google login failed")


@router.post(
    "/oauth/google/callback",
    response_model=OAuthCallbackResponse,
    summary="Complete Google OAuth",
    description=(
        "Validates the CSRF state, exchanges the authorization code with Google, "
        "and returns a JWT token + user object. An `HttpOnly` session cookie is also set. "
        "Called by the `/auth/google-callback` frontend page."
    ),
    tags=["Authentication", "OAuth"],
    responses={
        400: {"description": "Invalid or expired state, or Google rejected the authorization code"},
        500: {"description": "Unexpected server error"},
    },
)
async def google_callback(
    request: Request,
    response: Response,
    body: OAuthCallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback from Google."""
    try:
        # Validate CSRF state — raises 400 if invalid/expired
        cached = await _consume_oauth_state(request, "google", body.state)
        redirect_uri = cached["redirect_uri"]

        access_token = await GoogleOAuthHandler.exchange_code_for_token(body.code, redirect_uri)
        user_info = await GoogleOAuthHandler.get_user_info(access_token)

        user = await find_or_create_oauth_user(
            db,
            provider="google",
            provider_user_id=user_info["id"],
            email=user_info["email"],
            name=user_info["name"],
        )
        await db.commit()

        if user.role in PRIVILEGED_ROLES:
            logger.info("google_oauth_mfa_challenge_issued", user_id=str(user.id), email=user.email, role=user.role)
            return await _issue_admin_mfa_challenge(user)

        auth_response = await _complete_login(
            response,
            user,
            mfa_verified=False,
            auth_method="google",
        )
        await db.commit()

        logger.info("google_oauth_login_success", user_id=str(user.id), email=user.email)
        return auth_response

    except OAuthException as e:
        logger.warning("google_callback_oauth_error", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("google_callback_error", error=str(e))
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google callback handling failed")
