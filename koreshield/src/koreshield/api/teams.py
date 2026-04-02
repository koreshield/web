from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models.team import Team, TeamMember
from ..models.user import User
from .auth import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])

# --- Schemas ---

class TeamBase(BaseModel):
    name: str
    slug: str

class TeamCreate(TeamBase):
    pass

class TeamMemberSchema(BaseModel):
    id: UUID
    user_id: UUID
    team_id: UUID
    role: str
    joined_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TeamSchema(TeamBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    my_role: Optional[str] = None # Role of current user in this team

    model_config = ConfigDict(from_attributes=True)

class AddMemberRequest(BaseModel):
    email: str
    role: str = "member"

# --- Dependencies ---

async def get_team_member(
    team_id: UUID,
    user_dict: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TeamMember:
    """Validate user is a member of the team."""
    user_id = UUID(user_dict["id"])
    query = select(TeamMember).where(
        and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team not found or access denied")
    return member

# --- Endpoints ---

@router.post("", response_model=TeamSchema, include_in_schema=False)
@router.post("/", response_model=TeamSchema)
async def create_team(
    team_in: TeamCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new team."""
    user_id = UUID(current_user["id"])

    # Check slug uniqueness
    query = select(Team).where(Team.slug == team_in.slug)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team slug already taken")

    # Create Team
    team = Team(
        name=team_in.name,
        slug=team_in.slug,
        owner_id=user_id
    )
    db.add(team)
    await db.flush() # Get ID

    # Add Owner as member
    member = TeamMember(
        team_id=team.id,
        user_id=user_id,
        role="owner"
    )
    db.add(member)
    await db.commit()
    await db.refresh(team)

    # Return schema
    response = TeamSchema.model_validate(team)
    response.my_role = "owner"
    return response

@router.get("", response_model=List[TeamSchema], include_in_schema=False)
@router.get("/", response_model=List[TeamSchema])
async def list_my_teams(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List teams the current user is a member of."""
    user_id = UUID(current_user["id"])

    query = select(Team, TeamMember.role).join(TeamMember).where(TeamMember.user_id == user_id)
    result = await db.execute(query)

    teams = []
    for row in result:
        team, role = row
        t_schema = TeamSchema.model_validate(team)
        t_schema.my_role = role
        teams.append(t_schema)
    return teams

@router.get("/{team_id}", response_model=TeamSchema)
async def get_team(
    team_id: UUID,
    member: TeamMember = Depends(get_team_member), # Validates membership
    db: AsyncSession = Depends(get_db)
):
    """Get team details."""
    query = select(Team).where(Team.id == team_id)
    result = await db.execute(query)
    team = result.scalar_one()

    response = TeamSchema.model_validate(team)
    response.my_role = member.role
    return response

@router.get("/{team_id}/members", response_model=List[TeamMemberSchema])
async def list_members(
    team_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db)
):
    """List members of a team."""
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

@router.post("/{team_id}/members", response_model=TeamMemberSchema)
async def add_member(
    team_id: UUID,
    request: AddMemberRequest,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db)
):
    """Add a member to the team."""
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Find user by email
    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already member
    query = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user.id))
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already in team")

    new_member = TeamMember(
        team_id=team_id,
        user_id=user.id,
        role=request.role
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    # Reload to get user details
    query = select(TeamMember).options(selectinload(TeamMember.user)).where(TeamMember.id == new_member.id)
    result = await db.execute(query)
    new_member = result.scalar_one()

    schema = TeamMemberSchema.model_validate(new_member)
    schema.user_email = user.email
    schema.user_name = user.name
    return schema

@router.delete("/{team_id}/members/{user_id}")
async def remove_member(
    team_id: UUID,
    user_id: UUID,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db)
):
    """Remove a member from the team."""
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Cannot remove self if owner (must transfer ownership first - unimplemented for now)
    # Check target member
    query = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
    result = await db.execute(query)
    target_member = result.scalar_one_or_none()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    if target_member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove team owner")

    await db.delete(target_member)
    await db.commit()
    return {"status": "success"}

class UpdateRoleRequest(BaseModel):
    role: str

@router.post("/{team_id}/members/{user_id}/role")
async def update_member_role(
    team_id: UUID,
    user_id: UUID,
    request: UpdateRoleRequest,
    member: TeamMember = Depends(get_team_member),
    db: AsyncSession = Depends(get_db)
):
    """Update a member's role."""
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Check target member
    query = select(TeamMember).where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
    result = await db.execute(query)
    target_member = result.scalar_one_or_none()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    if target_member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    if request.role not in ["admin", "member", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    target_member.role = request.role
    await db.commit()
    return {"status": "success"}
