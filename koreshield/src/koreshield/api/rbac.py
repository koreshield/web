"""
RBAC (Role-Based Access Control) API for KoreShield
Provides endpoints for managing users, roles, and permissions.
"""

from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import structlog
import uuid

from .auth import get_current_admin

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/rbac", tags=["rbac"])


# Enums

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class RoleName(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"
    SECURITY_ANALYST = "security_analyst"


# Models

class Permission(BaseModel):
    id: str
    name: str
    description: str
    category: str


class Role(BaseModel):
    id: str
    name: str
    description: str
    permissions: List[str]
    user_count: int = 0


class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    status: UserStatus
    created_at: str
    last_login: str
    permissions: List[str] = []


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str
    send_invite: bool = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[UserStatus] = None


class RoleCreate(BaseModel):
    name: str
    description: str
    permissions: List[str]


class RoleUpdate(BaseModel):
    description: Optional[str] = None
    permissions: Optional[List[str]] = None


# In-memory data stores (in production, use database)
_users_store: Dict[str, User] = {}
_roles_store: Dict[str, Role] = {}
_permissions_store: List[Permission] = []


def _initialize_defaults():
    """Initialize default roles and permissions."""
    global _permissions_store, _roles_store, _users_store
    
    if _permissions_store:
        return  # Already initialized
    
    # Define all permissions
    _permissions_store = [
        # Dashboard
        Permission(id="1", name="view:dashboard", description="View main dashboard", category="Dashboard"),
        Permission(id="2", name="view:analytics", description="View analytics and metrics", category="Analytics"),
        
        # Reports
        Permission(id="3", name="view:reports", description="View generated reports", category="Reports"),
        Permission(id="4", name="export:reports", description="Export reports to CSV/PDF", category="Reports"),
        Permission(id="5", name="create:reports", description="Create custom reports", category="Reports"),
        
        # Alerts
        Permission(id="6", name="view:alerts", description="View alert configurations", category="Alerts"),
        Permission(id="7", name="edit:alerts", description="Create and modify alerts", category="Alerts"),
        Permission(id="8", name="delete:alerts", description="Delete alert rules", category="Alerts"),
        
        # Policies
        Permission(id="9", name="view:policies", description="View security policies", category="Policies"),
        Permission(id="10", name="edit:policies", description="Create and modify policies", category="Policies"),
        Permission(id="11", name="delete:policies", description="Delete security policies", category="Policies"),
        
        # Rules
        Permission(id="12", name="view:rules", description="View rule engine configurations", category="Rules"),
        Permission(id="13", name="edit:rules", description="Create and modify rules", category="Rules"),
        Permission(id="14", name="delete:rules", description="Delete rules", category="Rules"),
        
        # Tenants
        Permission(id="15", name="view:tenants", description="View tenant information", category="Tenants"),
        Permission(id="16", name="edit:tenants", description="Modify tenant configurations", category="Tenants"),
        Permission(id="17", name="create:tenants", description="Create new tenants", category="Tenants"),
        Permission(id="18", name="delete:tenants", description="Delete tenants", category="Tenants"),
        
        # Users & Roles
        Permission(id="19", name="view:users", description="View user accounts", category="Users & Roles"),
        Permission(id="20", name="edit:users", description="Modify user accounts", category="Users & Roles"),
        Permission(id="21", name="create:users", description="Create new users", category="Users & Roles"),
        Permission(id="22", name="delete:users", description="Delete user accounts", category="Users & Roles"),
        Permission(id="23", name="view:roles", description="View role configurations", category="Users & Roles"),
        Permission(id="24", name="edit:roles", description="Modify role permissions", category="Users & Roles"),
        
        # API Keys
        Permission(id="25", name="create:api_keys", description="Generate API keys", category="API Keys"),
        Permission(id="26", name="revoke:api_keys", description="Revoke API keys", category="API Keys"),
    ]
    
    # Define default roles
    _roles_store = {
        "1": Role(
            id="1",
            name="Admin",
            description="Full system access with all permissions",
            permissions=["*"],
            user_count=1
        ),
        "2": Role(
            id="2",
            name="Editor",
            description="Can view and edit policies, rules, and configurations",
            permissions=[
                "view:dashboard", "view:analytics", "edit:policies", "edit:rules",
                "view:reports", "edit:tenants"
            ],
            user_count=2
        ),
        "3": Role(
            id="3",
            name="Viewer",
            description="Read-only access to dashboards and reports",
            permissions=["view:dashboard", "view:analytics", "view:reports"],
            user_count=2
        ),
        "4": Role(
            id="4",
            name="Security Analyst",
            description="Specialized role for security monitoring and analysis",
            permissions=[
                "view:dashboard", "view:analytics", "view:alerts", "edit:alerts",
                "view:reports", "export:reports"
            ],
            user_count=0
        ),
    }
    
    # Create some default users
    _users_store = {
        "1": User(
            id="1",
            email="admin@example.com",
            name="Admin User",
            role="Admin",
            status=UserStatus.ACTIVE,
            created_at="2024-01-15T10:00:00Z",
            last_login="2 hours ago",
            permissions=["*"]
        ),
        "2": User(
            id="2",
            email="john.doe@acme.com",
            name="John Doe",
            role="Viewer",
            status=UserStatus.ACTIVE,
            created_at="2024-01-20T14:30:00Z",
            last_login="1 day ago",
            permissions=["view:dashboard", "view:reports"]
        ),
        "3": User(
            id="3",
            email="jane.smith@techstart.io",
            name="Jane Smith",
            role="Editor",
            status=UserStatus.ACTIVE,
            created_at="2024-01-25T09:15:00Z",
            last_login="3 hours ago",
            permissions=["view:dashboard", "edit:policies", "view:reports"]
        ),
        "4": User(
            id="4",
            email="bob.wilson@devshop.com",
            name="Bob Wilson",
            role="Viewer",
            status=UserStatus.INACTIVE,
            created_at="2024-02-01T16:45:00Z",
            last_login="2 weeks ago",
            permissions=["view:dashboard"]
        ),
        "5": User(
            id="5",
            email="alice.johnson@cloudco.net",
            name="Alice Johnson",
            role="Editor",
            status=UserStatus.PENDING,
            created_at="2024-02-04T11:20:00Z",
            last_login="Never",
            permissions=["view:dashboard", "edit:policies"]
        ),
    }


# Initialize on module load
_initialize_defaults()


# Endpoints

@router.get("/users", response_model=List[User])
async def get_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    current_user: dict = Depends(get_current_admin)
):
    """Get all users with optional search and filter."""
    logger.info("get_users", search=search, role=role, user_id=current_user.get("id"))
    
    users = list(_users_store.values())
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        users = [u for u in users if search_lower in u.name.lower() or search_lower in u.email.lower()]
    
    # Apply role filter
    if role:
        users = [u for u in users if u.role.lower() == role.lower()]
    
    return users


@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get a specific user by ID."""
    logger.info("get_user", user_id=user_id, requester=current_user.get("id"))
    
    if user_id not in _users_store:
        raise HTTPException(status_code=404, detail="User not found")
    
    return _users_store[user_id]


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create a new user."""
    logger.info("create_user", email=user_data.email, role=user_data.role, 
                creator=current_user.get("id"))
    
    # Check if email already exists
    if any(u.email == user_data.email for u in _users_store.values()):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Verify role exists
    if not any(r.name == user_data.role for r in _roles_store.values()):
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create new user
    user_id = str(uuid.uuid4())
    role_obj = next((r for r in _roles_store.values() if r.name == user_data.role), None)
    
    new_user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        status=UserStatus.PENDING if user_data.send_invite else UserStatus.ACTIVE,
        created_at=datetime.utcnow().isoformat() + "Z",
        last_login="Never",
        permissions=role_obj.permissions if role_obj else []
    )
    
    _users_store[user_id] = new_user
    
    # Update role user count
    if role_obj:
        role_obj.user_count += 1
    
    return new_user


@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update a user."""
    logger.info("update_user", user_id=user_id, updates=user_update.model_dump(exclude_none=True),
                updater=current_user.get("id"))
    
    if user_id not in _users_store:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = _users_store[user_id]
    
    # Apply updates
    if user_update.name is not None:
        user.name = user_update.name
    
    if user_update.role is not None:
        # Verify role exists
        if not any(r.name == user_update.role for r in _roles_store.values()):
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Update role counts
        old_role = next((r for r in _roles_store.values() if r.name == user.role), None)
        new_role = next((r for r in _roles_store.values() if r.name == user_update.role), None)
        
        if old_role:
            old_role.user_count = max(0, old_role.user_count - 1)
        if new_role:
            new_role.user_count += 1
        
        user.role = user_update.role
        user.permissions = new_role.permissions if new_role else []
    
    if user_update.status is not None:
        user.status = user_update.status
    
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete a user."""
    logger.info("delete_user", user_id=user_id, deleter=current_user.get("id"))
    
    if user_id not in _users_store:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = _users_store[user_id]
    
    # Update role user count
    role = next((r for r in _roles_store.values() if r.name == user.role), None)
    if role:
        role.user_count = max(0, role.user_count - 1)
    
    del _users_store[user_id]
    return None


@router.get("/roles", response_model=List[Role])
async def get_roles(
    current_user: dict = Depends(get_current_admin)
):
    """Get all roles."""
    logger.info("get_roles", user_id=current_user.get("id"))
    return list(_roles_store.values())


@router.get("/roles/{role_id}", response_model=Role)
async def get_role(
    role_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get a specific role by ID."""
    logger.info("get_role", role_id=role_id, requester=current_user.get("id"))
    
    if role_id not in _roles_store:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return _roles_store[role_id]


@router.post("/roles", response_model=Role, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create a new role."""
    logger.info("create_role", name=role_data.name, creator=current_user.get("id"))
    
    # Check if role name already exists
    if any(r.name.lower() == role_data.name.lower() for r in _roles_store.values()):
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    # Verify all permissions exist
    valid_permissions = {p.name for p in _permissions_store}
    invalid_perms = set(role_data.permissions) - valid_permissions
    if invalid_perms:
        raise HTTPException(status_code=400, 
                          detail=f"Invalid permissions: {', '.join(invalid_perms)}")
    
    role_id = str(len(_roles_store) + 1)
    new_role = Role(
        id=role_id,
        name=role_data.name,
        description=role_data.description,
        permissions=role_data.permissions,
        user_count=0
    )
    
    _roles_store[role_id] = new_role
    return new_role


@router.put("/roles/{role_id}", response_model=Role)
async def update_role(
    role_id: str,
    role_update: RoleUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update a role."""
    logger.info("update_role", role_id=role_id, updater=current_user.get("id"))
    
    if role_id not in _roles_store:
        raise HTTPException(status_code=404, detail="Role not found")
    
    role = _roles_store[role_id]
    
    if role_update.description is not None:
        role.description = role_update.description
    
    if role_update.permissions is not None:
        # Verify all permissions exist
        valid_permissions = {p.name for p in _permissions_store}
        invalid_perms = set(role_update.permissions) - valid_permissions
        if invalid_perms:
            raise HTTPException(status_code=400, 
                              detail=f"Invalid permissions: {', '.join(invalid_perms)}")
        
        role.permissions = role_update.permissions
        
        # Update permissions for all users with this role
        for user in _users_store.values():
            if user.role == role.name:
                user.permissions = role.permissions
    
    return role


@router.get("/permissions", response_model=List[Permission])
async def get_permissions(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: dict = Depends(get_current_admin)
):
    """Get all permissions."""
    logger.info("get_permissions", category=category, user_id=current_user.get("id"))
    
    permissions = _permissions_store
    
    if category:
        permissions = [p for p in permissions if p.category.lower() == category.lower()]
    
    return permissions
