from fastapi import APIRouter, HTTPException, Request, Depends, status
from pydantic import BaseModel
import structlog

from .auth import get_current_admin

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["management"])

class LoginRequest(BaseModel):
    email: str
    password: str

class SecurityConfigUpdate(BaseModel):
    sensitivity: str | None = None
    default_action: str | None = None

@router.post("/login")
async def admin_login(request: LoginRequest):
    """
    Admin login endpoint.
    
    This endpoint authenticates admin users and returns a JWT token.
    Note: This is a placeholder implementation. In production, this should
    integrate with your authentication service or database.
    """
    # TODO: Replace with actual authentication logic
    # For now, accept any email/password combination
    if not request.email or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    
    # Mock authentication - replace with real auth service
    if request.email == "admin@koreshield.com" and request.password == "admin123":
        # In production, this JWT should be issued by your auth service
        # For demo purposes, we'll return a mock response
        logger.info("admin_login_success", email=request.email)
        return {
            "access_token": "mock_jwt_token_replace_with_real_auth_service",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": "admin_001",
                "name": "Admin User", 
                "email": request.email,
                "role": "admin"
            }
        }
    else:
        logger.warning("admin_login_failed", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/logout")
async def admin_logout(current_user: dict = Depends(get_current_admin)):
    """Admin logout endpoint (stateless - just returns success)."""
    logger.info("admin_logout", user_id=current_user.get("id"), email=current_user.get("email"))
    return {"status": "logged_out"}

@router.get("/stats")
async def get_stats(request: Request, current_user: dict = Depends(get_current_admin)):
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
    current_user: dict = Depends(get_current_admin)
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
async def list_policies(request: Request, current_user: dict = Depends(get_current_admin)):
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





