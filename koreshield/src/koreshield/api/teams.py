"""
Teams API for KoreShield
Provides full team management: CRUD, membership, invites, and shared dashboards.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models.team import Team, TeamMember, TeamInvite, SharedDashboard
from ..models.user import User
from .auth import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class TeamBase(BaseModel):
    name: str
    slug: str

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None

class TeamSchema(TeamBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    my_role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TeamMemberSchema(BaseModel):
    id: UUID
    user_id: UUID
    team_id: UUID
    role: str
    joined_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AddMemberRequest(BaseModel):
    email: str
    role: str = "member"

class UpdateRoleRequest(BaseModel):
    role: str

class TeamInviteSchema(BaseModel):
    id: UUID
    team_id: UUID
    email: str
    role: str
    status: str
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CreateInviteRequest(BaseModel):
    email: str
    role: str = "member"

class SharedDashboardSchema(BaseModel):
    id: UUID
    team_id: UUID
    name: str
    dashboard_type: str
    config: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CreateDashboardRequest(BaseModel):
    name: str
    dashboard_type: str = "security"
    config: dict = {}


# ──────────────────────────────────────────────
# Dependencies
# ──────────────────────────────────────────────

async def get_team_member(
    team_id: UUID,
    user_dict: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamMember:
    """Validate current user is a member of the team and return their membership."""
    user_id = UUID(user_dict["id"])
    query = select(TeamMember).where(
        and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team not found or access denied")
    return member


# ──────────────────────────────────────────────
# Team CRUD
# ──────────────────────────────────────────────

@router.post("", response_model=TeamSchema, include_in_schema=False)
@router.post("/", response_model=TeamSchema, summary="Create Team", description="Create a new team. The creator is automatically assigned the owner role.")
async def create_team(
    team_in: TeamCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = UUID(current_user["id"])

    query = select(Team).where(Team.slug == team_in.slug)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team slug already taken")

    team = Team(name=team_in.name, slug=team_in.slug, owner_id=user_id)
    db.add(team)
    await db.flush()

    member = TeamMember(team_id=team.id, user_id=user_id, role="owner")
    db.add(member)
    await db.commit()
    await db.refresh(team)

    response = TeamSchema.model_validate(team)
    response.my_role = "owner"
    return response


@router.get("", response_model=List[TeamSchema], include_in_schema=False)
@router.get("/", response_model=List[TeamSchema], summary="List My Teams", description="List all teams the authenticated user is a member of.")
async def list_my_teams(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = UUID(current_user["id"])
    query = select(Team, TeamMember.role).join(TeamMember).where(TeamMember.user_id == user_id)
    result = await db.execute(query)

    teams = []
    for team, role in result:
        t_schema = TeamSchema.model_validate(team)
        t_schema.my_role = role
        teams.append(t_schema)
    return teams


@router.get("/{team_id}", response_model=TeamSchema, summary="Get Team", description="Get details for a specific team. Requires membership.")
async def get_team(
    team_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    query = select(Team).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one()

    response = TeamSchema.model_validate(team)
    response.my_role = member.role
    return response


@router.put("/{team_id}", response_model=TeamSchema, summary="Update Team", description="Update team name. Only the owner or admin can update team details. The slug is immutable.")
async def update_team(
    team_id: UUID,
    team_update: TeamUpdate,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    query = select(Team).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one()

    if team_update.name is not None:
        team.name = team_update.name

    await db.commit()
    await db.refresh(team)

    response = TeamSchema.model_validate(team)
    response.my_role = member.role
    return response


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Team", description="Permanently delete a team and all its members. Only the team owner can perform this action.")
async def delete_team(
    team_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can delete the team")

    query = select(Team).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    await db.delete(team)
    await db.commit()


# ──────────────────────────────────────────────
# Members
# ──────────────────────────────────────────────

@router.get("/{team_id}/members", response_model=List[TeamMemberSchema], summary="List Team Members", description="List all members of a team with their roles.")
async def list_members(
    team_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    query = select(TeamMember).options(selectinload(TeamMember.user)).where(TeamMember.team_id == team_id)
    result = await db.execute(query)
    members = result.scalars().all()

    response = []
    for m in members:
        schema = TeamMemberSchema.model_validate(m)
        if m.user:
            schema.user_email = m.user.email
            schema.user_name = m.user.name
        response.append(schema)
    return response


@router.post("/{team_id}/members", response_model=TeamMemberSchema, summary="Add Team Member", description="Add an existing KoreShield user to the team by email address. For inviting users not yet registered, use the invites endpoint.")
async def add_member(
    team_id: UUID,
    request: AddMemberRequest,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found. Use the invites endpoint to invite unregistered users.")

    query = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user.id))
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    new_member = TeamMember(team_id=team_id, user_id=user.id, role=request.role)
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    query = select(TeamMember).options(selectinload(TeamMember.user)).where(TeamMember.id == new_member.id)
    result = await db.execute(query)
    new_member = result.scalar_one()

    schema = TeamMemberSchema.model_validate(new_member)
    schema.user_email = user.email
    schema.user_name = user.name
    return schema


@router.delete("/{team_id}/members/{user_id}", summary="Remove Team Member", description="Remove a member from the team. The team owner cannot be removed.")
async def remove_member(
    team_id: UUID,
    user_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    query = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
    result = await db.execute(query)
    target_member = result.scalar_one_or_none()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")
    if target_member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the team owner. Transfer ownership first.")

    await db.delete(target_member)
    await db.commit()
    return {"status": "success"}


@router.post("/{team_id}/members/{user_id}/role", summary="Update Member Role", description="Update the role of a team member. Owner role cannot be changed through this endpoint.")
async def update_member_role(
    team_id: UUID,
    user_id: UUID,
    request: UpdateRoleRequest,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if request.role not in ["admin", "member", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be one of: admin, member, viewer")

    query = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
    result = await db.execute(query)
    target_member = result.scalar_one_or_none()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")
    if target_member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")

    target_member.role = request.role
    await db.commit()
    return {"status": "success", "role": request.role}


# ──────────────────────────────────────────────
# Invites
# ──────────────────────────────────────────────

@router.get("/{team_id}/invites", response_model=List[TeamInviteSchema], summary="List Team Invites", description="List pending invitations for the team. Only owners and admins can view invites.")
async def list_invites(
    team_id: UUID,
    status_filter: Optional[str] = None,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    query = select(TeamInvite).where(TeamInvite.team_id == team_id)
    if status_filter:
        query = query.where(TeamInvite.status == status_filter)
    else:
        query = query.where(TeamInvite.status == "pending")

    result = await db.execute(query)
    invites = result.scalars().all()
    return invites


@router.post("/{team_id}/invites", response_model=TeamInviteSchema, status_code=status.HTTP_201_CREATED, summary="Create Team Invite", description="Create a pending invitation for an email address. If the user is already registered, they are added directly. Otherwise an invite record is created for when they sign up.")
async def create_invite(
    team_id: UUID,
    request: CreateInviteRequest,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Check if user already exists — add directly if so
    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Check not already a member
        q2 = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == existing_user.id))
        r2 = await db.execute(q2)
        if r2.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User is already a member of this team")

        new_member = TeamMember(team_id=team_id, user_id=existing_user.id, role=request.role)
        db.add(new_member)

    # Always create an invite record for tracking
    # Check for duplicate pending invite
    q3 = select(TeamInvite).where(
        and_(TeamInvite.team_id == team_id, TeamInvite.email == request.email, TeamInvite.status == "pending")
    )
    r3 = await db.execute(q3)
    if r3.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A pending invite already exists for this email")

    invite = TeamInvite(
        team_id=team_id,
        email=request.email,
        role=request.role,
        created_by=UUID(member.user_id if isinstance(member.user_id, str) else str(member.user_id)),
        status="accepted" if existing_user else "pending",
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


@router.delete("/{team_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Cancel Team Invite", description="Cancel a pending team invitation.")
async def cancel_invite(
    team_id: UUID,
    invite_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    query = select(TeamInvite).where(and_(TeamInvite.id == invite_id, TeamInvite.team_id == team_id))
    result = await db.execute(query)
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending invites")

    invite.status = "cancelled"
    await db.commit()


# ──────────────────────────────────────────────
# Shared Dashboards
# ──────────────────────────────────────────────

@router.get("/{team_id}/dashboards", response_model=List[SharedDashboardSchema], summary="List Shared Dashboards", description="List shared dashboards for a team. Optionally filter by dashboard type (security, analytics, compliance).")
async def list_dashboards(
    team_id: UUID,
    dashboard_type: Optional[str] = None,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    query = select(SharedDashboard).where(SharedDashboard.team_id == team_id)
    if dashboard_type:
        query = query.where(SharedDashboard.dashboard_type == dashboard_type)

    result = await db.execute(query)
    dashboards = result.scalars().all()
    return dashboards


@router.post("/{team_id}/dashboards", response_model=SharedDashboardSchema, status_code=status.HTTP_201_CREATED, summary="Create Shared Dashboard", description="Create a new shared dashboard for the team. Only owners and admins can create dashboards.")
async def create_dashboard(
    team_id: UUID,
    request: CreateDashboardRequest,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    dashboard = SharedDashboard(
        team_id=team_id,
        name=request.name,
        dashboard_type=request.dashboard_type,
        config=request.config,
        created_by=UUID(str(member.user_id)),
    )
    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)
    return dashboard


@router.delete("/{team_id}/dashboards/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Shared Dashboard", description="Delete a shared dashboard. Only owners and admins can delete dashboards.")
async def delete_dashboard(
    team_id: UUID,
    dashboard_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    query = select(SharedDashboard).where(
        and_(SharedDashboard.id == dashboard_id, SharedDashboard.team_id == team_id)
    )
    result = await db.execute(query)
    dashboard = result.scalar_one_or_none()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    await db.delete(dashboard)
    await db.commit()
