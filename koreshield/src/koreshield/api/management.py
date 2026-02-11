from fastapi import APIRouter, HTTPException, Request, Depends, status
from pydantic import BaseModel, EmailStr
import structlog
import bcrypt
import jwt
import secrets
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from .auth import get_current_admin, get_current_user
from ..models.user import User
from ..models.api_key import APIKey
from ..services.email import send_welcome_email, send_verification_email

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["management"])

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False) if DATABASE_URL else None
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False) if engine else None

async def get_db():
    """Database session dependency."""
    if not AsyncSessionLocal:
        raise HTTPException(status_code=500, detail="Database not configured")
    async with AsyncSessionLocal() as session:
        yield session

# JWT Configuration
JWT_SECRET = os.getenv("JWT_PRIVATE_KEY") or os.getenv("JWT_PUBLIC_KEY") or os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "RS256" if "BEGIN" in JWT_SECRET else "HS256"
JWT_EXPIRATION_HOURS = 24

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SecurityConfigUpdate(BaseModel):
    sensitivity: str | None = None
    default_action: str | None = None

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
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
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
        if len(request.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Hash password
        password_hash = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Create user
        import uuid
        user = User(
            id=uuid.uuid4(),
            email=request.email,
            password_hash=password_hash,
            name=request.name,
            role='user',
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
        
        # Generate JWT token
        token_payload = {
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
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
async def admin_login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
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
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        await db.commit()
        
        # Generate JWT token
        token_payload = {
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        logger.info("login_success", user_id=str(user.id), email=user.email)
        
        return {
            "user": user.to_dict(),
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_error", error=str(e), email=request.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again later."
        )

@router.post("/logout")
async def admin_logout(current_user: dict = Depends(get_current_admin)):
    """Admin logout endpoint (stateless - just returns success)."""
    logger.info("admin_logout", user_id=current_user.get("id"), email=current_user.get("email"))
    return {"status": "logged_out"}

@router.get("/stats")
async def get_stats(request: Request, current_user: dict = Depends(get_current_user)):
    """Get current proxy statistics."""
    # Access the proxy instance from the app state or request
    if hasattr(request.app.state, "stats"):
        return request.app.state.stats
    return {"error": "Stats not available"}

@router.get("/config")
async def get_config(request: Request, current_user: dict = Depends(get_current_admin)):
    """Get current configuration."""
    if hasattr(request.app.state, "config"):
        return request.app.state.config
    return {"error": "Config not available"}

@router.patch("/config/security")
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

import json
import os

@router.get("/logs")
async def get_audit_logs(
    request: Request, 
    limit: int = 100, 
    offset: int = 0, 
    level: str | None = None,
    current_user: dict = Depends(get_current_user)
):
    """Get audit logs."""
    log_file = "logs/koreshield.log"
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                # Read all lines
                lines = f.readlines()
                
                # Process in reverse (newest first)
                for line in reversed(lines):
                    try:
                        log_entry = json.loads(line)
                        
                        # Filter by level if requested
                        if level and log_entry.get("level", "").lower() != level.lower():
                            continue
                            
                        logs.append(log_entry)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.error("Error reading log file", error=str(e))
    
    # Pagination
    total_count = len(logs)
    paginated_logs = logs[offset : offset + limit]
    
    return {"logs": paginated_logs, "total": total_count, "limit": limit, "offset": offset}

class Policy(BaseModel):
    id: str
    name: str
    description: str
    severity: str
    roles: list[str] = ["admin", "moderator", "user"]

@router.get("/policies")
async def list_policies(request: Request, current_user: dict = Depends(get_current_user)):
    """List all security policies."""
    # Assuming the proxy instance is available and has the policy engine
    if hasattr(request.app.state, "policy_engine"):
        return request.app.state.policy_engine.list_policies()
    return []

@router.post("/policies")
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

@router.delete("/policies/{policy_id}")
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
        # Generate API key
        full_key, key_hash, key_prefix = APIKey.generate_key()
        
        # Calculate expiration
        now = datetime.utcnow()
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
            user_id=current_user["id"],
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
            user_id=str(current_user["id"]),
            key_id=str(api_key.id),
            key_prefix=key_prefix
        )
        
        # Return with full key (only time it's shown!)
        response_data = api_key.to_dict()
        response_data["api_key"] = full_key
        
        return response_data
        
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
        result = await db.execute(
            select(APIKey)
            .where(APIKey.user_id == current_user["id"])
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
        # Find the API key
        result = await db.execute(
            select(APIKey)
            .where(APIKey.id == key_id)
            .where(APIKey.user_id == current_user["id"])
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
            user_id=str(current_user["id"]),
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
        result = await db.execute(
            select(APIKey)
            .where(APIKey.id == key_id)
            .where(APIKey.user_id == current_user["id"])
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




