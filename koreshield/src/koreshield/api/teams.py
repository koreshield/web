"""
Teams API for KoreShield
Provides endpoints for team collaboration, member management, and shared resources.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import structlog
import uuid

from .auth import get_current_admin

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])


# Enums

class TeamStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class MemberRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class MemberStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    INACTIVE = "inactive"


class InviteStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class DashboardType(str, Enum):
    ANALYTICS = "analytics"
    SECURITY = "security"
    COST = "cost"
    CUSTOM = "custom"


# Models

class Team(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    owner_name: str
    member_count: int
    created_at: str
    status: TeamStatus


class TeamCreate(BaseModel):
    name: str
    description: str = ""


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TeamStatus] = None


class TeamMember(BaseModel):
    id: str
    user_id: str
    name: str
    email: EmailStr
    role: MemberRole
    joined_at: str
    last_active: str
    status: MemberStatus


class MemberInvite(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.MEMBER


class MemberRoleUpdate(BaseModel):
    role: MemberRole


class TeamInvite(BaseModel):
    id: str
    email: EmailStr
    role: str
    invited_by: str
    invited_at: str
    expires_at: str
    status: InviteStatus


class SharedDashboard(BaseModel):
    id: str
    name: str
    type: DashboardType
    owner: str
    shared_with: List[str]
    created_at: str


class DashboardCreate(BaseModel):
    name: str
    type: DashboardType
    config: Dict = Field(default_factory=dict)


# In-memory stores
_teams_store: Dict[str, Team] = {}
_members_store: Dict[str, List[TeamMember]] = {}
_invites_store: Dict[str, List[TeamInvite]] = {}
_dashboards_store: Dict[str, List[SharedDashboard]] = {}


def _initialize_data():
    """Initialize sample data."""
    global _teams_store, _members_store, _invites_store, _dashboards_store
    
    if _teams_store:
        return
    
    # Sample teams
    _teams_store = {
        "1": Team(
            id="1",
            name="Engineering Team",
            description="Core product development and infrastructure",
            owner_id="user_1",
            owner_name="John Doe",
            member_count=8,
            created_at="2024-01-15T10:00:00Z",
            status=TeamStatus.ACTIVE
        ),
        "2": Team(
            id="2",
            name="Security Team",
            description="Security monitoring and incident response",
            owner_id="user_2",
            owner_name="Jane Smith",
            member_count=5,
            created_at="2024-01-20T14:30:00Z",
            status=TeamStatus.ACTIVE
        ),
        "3": Team(
            id="3",
            name="Data Analytics",
            description="Business intelligence and data analysis",
            owner_id="user_3",
            owner_name="Bob Wilson",
            member_count=3,
            created_at="2024-02-01T09:15:00Z",
            status=TeamStatus.ACTIVE
        )
    }
    
    # Sample members for team 1
    _members_store["1"] = [
        TeamMember(
            id="m1",
            user_id="user_1",
            name="John Doe",
            email="john.doe@koreshield.com",
            role=MemberRole.OWNER,
            joined_at="2024-01-15T10:00:00Z",
            last_active="2 hours ago",
            status=MemberStatus.ACTIVE
        ),
        TeamMember(
            id="m2",
            user_id="user_2",
            name="Alice Johnson",
            email="alice@koreshield.com",
            role=MemberRole.ADMIN,
            joined_at="2024-01-16T11:30:00Z",
            last_active="5 minutes ago",
            status=MemberStatus.ACTIVE
        ),
        TeamMember(
            id="m3",
            user_id="user_3",
            name="Bob Smith",
            email="bob.smith@koreshield.com",
            role=MemberRole.MEMBER,
            joined_at="2024-01-18T14:20:00Z",
            last_active="1 day ago",
            status=MemberStatus.ACTIVE
        ),
        TeamMember(
            id="m4",
            user_id="user_4",
            name="Carol Davis",
            email="carol.davis@koreshield.com",
            role=MemberRole.VIEWER,
            joined_at="2024-01-25T09:45:00Z",
            last_active="3 hours ago",
            status=MemberStatus.ACTIVE
        ),
        TeamMember(
            id="m5",
            user_id="user_5",
            name="David Wilson",
            email="david.wilson@koreshield.com",
            role=MemberRole.MEMBER,
            joined_at="2024-02-01T16:30:00Z",
            last_active="Never",
            status=MemberStatus.PENDING
        )
    ]
    
    # Sample invites for team 1
    _invites_store["1"] = [
        TeamInvite(
            id="i1",
            email="newuser@example.com",
            role="member",
            invited_by="John Doe",
            invited_at="2024-02-03T10:00:00Z",
            expires_at="In 5 days",
            status=InviteStatus.PENDING
        ),
        TeamInvite(
            id="i2",
            email="contractor@example.com",
            role="viewer",
            invited_by="Alice Johnson",
            invited_at="2024-02-02T14:30:00Z",
            expires_at="In 6 days",
            status=InviteStatus.PENDING
        )
    ]
    
    # Sample shared dashboards for team 1
    _dashboards_store["1"] = [
        SharedDashboard(
            id="d1",
            name="Security Overview",
            type=DashboardType.SECURITY,
            owner="John Doe",
            shared_with=["Alice", "Bob", "Carol"],
            created_at="2024-01-20T10:00:00Z"
        ),
        SharedDashboard(
            id="d2",
            name="Cost Analysis Q1",
            type=DashboardType.COST,
            owner="Alice Johnson",
            shared_with=["John", "David"],
            created_at="2024-02-01T14:30:00Z"
        ),
        SharedDashboard(
            id="d3",
            name="API Performance Metrics",
            type=DashboardType.ANALYTICS,
            owner="Bob Smith",
            shared_with=["All Team"],
            created_at="2024-01-25T09:15:00Z"
        )
    ]
    
    # Initialize empty stores for other teams
    for team_id in ["2", "3"]:
        _members_store[team_id] = []
        _invites_store[team_id] = []
        _dashboards_store[team_id] = []


_initialize_data()


# Endpoints

@router.get("", response_model=List[Team])
async def get_teams(
    status: Optional[TeamStatus] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all teams."""
    logger.info("get_teams", status=status, user_id=current_user.get("id"))
    
    teams = list(_teams_store.values())
    
    if status:
        teams = [t for t in teams if t.status == status]
    
    return teams


@router.get("/{team_id}", response_model=Team)
async def get_team(
    team_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get a specific team."""
    logger.info("get_team", team_id=team_id, user_id=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return _teams_store[team_id]


@router.post("", response_model=Team, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create a new team."""
    logger.info("create_team", name=team_data.name, creator=current_user.get("id"))
    
    team_id = str(uuid.uuid4())
    
    new_team = Team(
        id=team_id,
        name=team_data.name,
        description=team_data.description,
        owner_id=current_user.get("id"),
        owner_name=current_user.get("name", "Unknown"),
        member_count=1,
        created_at=datetime.utcnow().isoformat() + "Z",
        status=TeamStatus.ACTIVE
    )
    
    _teams_store[team_id] = new_team
    
    # Add creator as owner
    _members_store[team_id] = [
        TeamMember(
            id=str(uuid.uuid4()),
            user_id=current_user.get("id"),
            name=current_user.get("name", "Unknown"),
            email=current_user.get("email", "unknown@koreshield.com"),
            role=MemberRole.OWNER,
            joined_at=datetime.utcnow().isoformat() + "Z",
            last_active="Just now",
            status=MemberStatus.ACTIVE
        )
    ]
    
    # Initialize empty stores
    _invites_store[team_id] = []
    _dashboards_store[team_id] = []
    
    return new_team


@router.put("/{team_id}", response_model=Team)
async def update_team(
    team_id: str,
    team_update: TeamUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update a team."""
    logger.info("update_team", team_id=team_id, updater=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = _teams_store[team_id]
    
    if team_update.name is not None:
        team.name = team_update.name
    
    if team_update.description is not None:
        team.description = team_update.description
    
    if team_update.status is not None:
        team.status = team_update.status
    
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete a team."""
    logger.info("delete_team", team_id=team_id, deleter=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    del _teams_store[team_id]
    _members_store.pop(team_id, None)
    _invites_store.pop(team_id, None)
    _dashboards_store.pop(team_id, None)
    
    return None


# Team Members

@router.get("/{team_id}/members", response_model=List[TeamMember])
async def get_team_members(
    team_id: str,
    role: Optional[MemberRole] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all members of a team."""
    logger.info("get_team_members", team_id=team_id, role=role, user_id=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = _members_store.get(team_id, [])
    
    if role:
        members = [m for m in members if m.role == role]
    
    return members


@router.post("/{team_id}/members/{member_id}/role", response_model=TeamMember)
async def update_member_role(
    team_id: str,
    member_id: str,
    role_update: MemberRoleUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Update a member's role."""
    logger.info("update_member_role", team_id=team_id, member_id=member_id,
                new_role=role_update.role, updater=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = _members_store.get(team_id, [])
    member = next((m for m in members if m.id == member_id), None)
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.role == MemberRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot change owner's role")
    
    member.role = role_update.role
    
    return member


@router.delete("/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    team_id: str,
    member_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Remove a member from the team."""
    logger.info("remove_team_member", team_id=team_id, member_id=member_id,
                remover=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = _members_store.get(team_id, [])
    member = next((m for m in members if m.id == member_id), None)
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.role == MemberRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot remove team owner")
    
    _members_store[team_id] = [m for m in members if m.id != member_id]
    
    # Update team member count
    team = _teams_store[team_id]
    team.member_count = max(0, team.member_count - 1)
    
    return None


# Team Invites

@router.get("/{team_id}/invites", response_model=List[TeamInvite])
async def get_team_invites(
    team_id: str,
    status_filter: Optional[InviteStatus] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all invites for a team."""
    logger.info("get_team_invites", team_id=team_id, status=status_filter,
                user_id=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    invites = _invites_store.get(team_id, [])
    
    if status_filter:
        invites = [i for i in invites if i.status == status_filter]
    
    return invites


@router.post("/{team_id}/invites", response_model=TeamInvite, status_code=status.HTTP_201_CREATED)
async def invite_member(
    team_id: str,
    invite_data: MemberInvite,
    current_user: dict = Depends(get_current_admin)
):
    """Invite a new member to the team."""
    logger.info("invite_member", team_id=team_id, email=invite_data.email,
                role=invite_data.role, inviter=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if already a member
    members = _members_store.get(team_id, [])
    if any(m.email == invite_data.email for m in members):
        raise HTTPException(status_code=400, detail="User is already a team member")
    
    # Check if already invited
    invites = _invites_store.get(team_id, [])
    if any(i.email == invite_data.email and i.status == InviteStatus.PENDING for i in invites):
        raise HTTPException(status_code=400, detail="User already has a pending invite")
    
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    new_invite = TeamInvite(
        id=str(uuid.uuid4()),
        email=invite_data.email,
        role=invite_data.role.value,
        invited_by=current_user.get("name", "Unknown"),
        invited_at=datetime.utcnow().isoformat() + "Z",
        expires_at=f"In 7 days",
        status=InviteStatus.PENDING
    )
    
    _invites_store[team_id].append(new_invite)
    
    return new_invite


@router.delete("/{team_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invite(
    team_id: str,
    invite_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Cancel a pending invite."""
    logger.info("cancel_invite", team_id=team_id, invite_id=invite_id,
                canceller=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    invites = _invites_store.get(team_id, [])
    invite = next((i for i in invites if i.id == invite_id), None)
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    invite.status = InviteStatus.CANCELLED
    
    return None


# Shared Dashboards

@router.get("/{team_id}/dashboards", response_model=List[SharedDashboard])
async def get_shared_dashboards(
    team_id: str,
    dashboard_type: Optional[DashboardType] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all shared dashboards for a team."""
    logger.info("get_shared_dashboards", team_id=team_id, type=dashboard_type,
                user_id=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    dashboards = _dashboards_store.get(team_id, [])
    
    if dashboard_type:
        dashboards = [d for d in dashboards if d.type == dashboard_type]
    
    return dashboards


@router.post("/{team_id}/dashboards", response_model=SharedDashboard, status_code=status.HTTP_201_CREATED)
async def create_shared_dashboard(
    team_id: str,
    dashboard_data: DashboardCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create a new shared dashboard."""
    logger.info("create_shared_dashboard", team_id=team_id, name=dashboard_data.name,
                creator=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    new_dashboard = SharedDashboard(
        id=str(uuid.uuid4()),
        name=dashboard_data.name,
        type=dashboard_data.type,
        owner=current_user.get("name", "Unknown"),
        shared_with=["All Team"],
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    
    _dashboards_store[team_id].append(new_dashboard)
    
    return new_dashboard


@router.delete("/{team_id}/dashboards/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shared_dashboard(
    team_id: str,
    dashboard_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete a shared dashboard."""
    logger.info("delete_shared_dashboard", team_id=team_id, dashboard_id=dashboard_id,
                deleter=current_user.get("id"))
    
    if team_id not in _teams_store:
        raise HTTPException(status_code=404, detail="Team not found")
    
    dashboards = _dashboards_store.get(team_id, [])
    dashboard = next((d for d in dashboards if d.id == dashboard_id), None)
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    _dashboards_store[team_id] = [d for d in dashboards if d.id != dashboard_id]
    
    return None
