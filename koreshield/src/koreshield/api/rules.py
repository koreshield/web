"""
Custom Rules Management API

Provides CRUD operations for managing custom detection rules in the Rule Engine.

PERSISTENCE: DB-backed via the custom_rules table.  The database is the source
of truth for rule configuration; the in-memory RuleEngine is a runtime cache
used for fast pattern matching during proxied requests.

On service startup, call `startup_load_rules(db)` to populate the engine from
the database before any requests arrive.  All create/update/delete mutations
sync both the DB and the in-memory engine atomically.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import structlog
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import get_current_user
from ..database import get_db
from ..models.custom_rule import CustomRuleRecord
from ..rule_engine import RuleEngine, CustomRule, RuleSeverity, RuleAction
from ..utils import utcnow_naive

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Rules"])

# ─────────────────────────────────────────
# In-memory detection engine (runtime cache)
# ─────────────────────────────────────────

_rule_engine: Optional[RuleEngine] = None


def get_rule_engine() -> RuleEngine:
    """Return the global RuleEngine instance (creates one if needed)."""
    global _rule_engine
    if _rule_engine is None:
        _rule_engine = RuleEngine()
    return _rule_engine


async def startup_load_rules(db: AsyncSession) -> int:
    """
    Load all enabled rules from the database into the in-memory RuleEngine.

    Call this once during application startup so that detection works
    immediately without waiting for the first management API call.

    Returns the number of rules loaded.
    """
    engine = get_rule_engine()
    result = await db.execute(select(CustomRuleRecord))
    records = result.scalars().all()

    loaded = 0
    for record in records:
        rule = _record_to_engine_rule(record)
        engine.add_rule(rule)
        loaded += 1

    logger.info("Loaded custom rules into engine on startup", count=loaded)
    return loaded


# ─────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────

def _record_to_engine_rule(record: CustomRuleRecord) -> CustomRule:
    """Convert a DB record to a RuleEngine CustomRule object."""
    return CustomRule(
        id=str(record.id),
        name=record.name,
        description=record.description,
        pattern=record.pattern,
        pattern_type=record.pattern_type,
        severity=RuleSeverity(record.severity),
        action=RuleAction(record.action),
        enabled=record.enabled,
        tags=record.tags or [],
        metadata={
            "priority": record.priority,
            "conditions": record.conditions or [],
            "actions": record.rule_actions or [],
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        },
    )


def _record_to_response(record: CustomRuleRecord) -> dict:
    """Convert a DB record to the API response dict."""
    return record.to_dict()


# ─────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────

class RuleCondition(BaseModel):
    """Rule condition model."""
    type: str = Field(..., description="Condition type (e.g., 'content.contains', 'confidence', 'attack_type')")
    operator: str = Field(..., description="Comparison operator (e.g., '==', '>=', 'matches')")
    value: Any = Field(..., description="Value to compare against")


class RuleActionModel(BaseModel):
    """Rule action model."""
    type: str = Field(..., description="Action type (e.g., 'block', 'log', 'alert', 'sanitize')")
    params: Dict[str, Any] = Field(default_factory=dict, description="Action parameters")


class RuleCreateRequest(BaseModel):
    """Request model for creating a rule."""
    name: str = Field(..., min_length=1, max_length=200, description="Rule name")
    description: str = Field(..., min_length=1, max_length=1000, description="Rule description")
    pattern: str = Field(..., min_length=1, description="Detection pattern")
    pattern_type: str = Field(..., description="Pattern type: 'regex', 'keyword', 'contains', 'startswith', 'endswith'")
    severity: str = Field(..., description="Severity level: 'low', 'medium', 'high', 'critical'")
    action: str = Field(..., description="Action: 'block', 'warn', 'log', 'allow'")
    enabled: bool = Field(default=True, description="Whether the rule is enabled")
    priority: int = Field(default=5, ge=1, le=10, description="Rule priority (1-10)")
    tags: List[str] = Field(default_factory=list, description="Rule tags for categorization")
    conditions: List[RuleCondition] = Field(default_factory=list, description="Additional conditions")
    actions: List[RuleActionModel] = Field(default_factory=list, description="Actions to take when rule matches")


class RuleUpdateRequest(BaseModel):
    """Request model for updating a rule."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    pattern: Optional[str] = Field(None, min_length=1)
    pattern_type: Optional[str] = None
    severity: Optional[str] = None
    action: Optional[str] = None
    enabled: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    tags: Optional[List[str]] = None
    conditions: Optional[List[RuleCondition]] = None
    actions: Optional[List[RuleActionModel]] = None


class RuleResponse(BaseModel):
    """Response model for a rule."""
    id: str
    name: str
    description: str
    pattern: str
    pattern_type: str
    severity: str
    action: str
    enabled: bool
    priority: int
    tags: List[str]
    conditions: List[RuleCondition]
    actions: List[RuleActionModel]
    created_at: str
    updated_at: str


class RuleTestRequest(BaseModel):
    """Request model for testing a rule."""
    pattern: str = Field(..., description="Pattern to test")
    pattern_type: str = Field(..., description="Pattern type")
    test_input: str = Field(..., description="Input text to test against")


# ─────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────

@router.get(
    "/management/rules",
    response_model=List[RuleResponse],
    summary="List all rules",
    description="Get a list of all custom detection rules",
)
async def list_rules(
    enabled: Optional[bool] = None,
    severity: Optional[str] = None,
    _current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all custom rules with optional filtering."""
    try:
        stmt = select(CustomRuleRecord)
        if enabled is not None:
            stmt = stmt.where(CustomRuleRecord.enabled == enabled)
        if severity:
            stmt = stmt.where(CustomRuleRecord.severity == severity.lower())

        result = await db.execute(stmt)
        records = result.scalars().all()
        logger.info("Listed rules", count=len(records))
        return [_record_to_response(r) for r in records]

    except Exception as e:
        logger.error("Failed to list rules", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list rules: {str(e)}")


@router.get(
    "/management/rules/{rule_id}",
    response_model=RuleResponse,
    summary="Get rule by ID",
    description="Get details of a specific rule",
)
async def get_rule(
    rule_id: str,
    _current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific rule by ID."""
    try:
        rule_uuid = uuid.UUID(rule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid rule ID format")

    try:
        result = await db.execute(select(CustomRuleRecord).where(CustomRuleRecord.id == rule_uuid))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found")
        return _record_to_response(record)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get rule", rule_id=rule_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get rule: {str(e)}")


@router.post(
    "/management/rules",
    response_model=RuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new rule",
    description="Create a new custom detection rule",
)
async def create_rule(
    request: RuleCreateRequest,
    _current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new custom rule.

    The rule is persisted to the database and immediately loaded into the
    in-memory RuleEngine so it becomes active for current request scanning.
    """
    try:
        now = utcnow_naive()
        record = CustomRuleRecord(
            name=request.name,
            description=request.description,
            pattern=request.pattern,
            pattern_type=request.pattern_type,
            severity=request.severity.lower(),
            action=request.action.lower(),
            enabled=request.enabled,
            priority=request.priority,
            tags=request.tags,
            conditions=[c.dict() for c in request.conditions],
            rule_actions=[a.dict() for a in request.actions],
            created_at=now,
            updated_at=now,
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)

        # Sync to in-memory engine for live detection
        engine = get_rule_engine()
        engine_rule = _record_to_engine_rule(record)
        engine.add_rule(engine_rule)

        logger.info("Created new rule", rule_id=str(record.id), name=request.name)
        return _record_to_response(record)

    except HTTPException:
        raise
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Invalid field value: {str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error("Failed to create rule", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")


@router.put(
    "/management/rules/{rule_id}",
    response_model=RuleResponse,
    summary="Update a rule",
    description="Update an existing rule",
)
async def update_rule(
    rule_id: str,
    request: RuleUpdateRequest,
    _current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing rule.

    Only provided fields are updated; others remain unchanged.
    Changes are persisted to the database and synced to the live engine.
    """
    try:
        rule_uuid = uuid.UUID(rule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid rule ID format")

    try:
        result = await db.execute(select(CustomRuleRecord).where(CustomRuleRecord.id == rule_uuid))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found")

        if request.name is not None:
            record.name = request.name
        if request.description is not None:
            record.description = request.description
        if request.pattern is not None:
            record.pattern = request.pattern
        if request.pattern_type is not None:
            record.pattern_type = request.pattern_type
        if request.severity is not None:
            record.severity = request.severity.lower()
        if request.action is not None:
            record.action = request.action.lower()
        if request.enabled is not None:
            record.enabled = request.enabled
        if request.priority is not None:
            record.priority = request.priority
        if request.tags is not None:
            record.tags = request.tags
        if request.conditions is not None:
            record.conditions = [c.dict() for c in request.conditions]
        if request.actions is not None:
            record.rule_actions = [a.dict() for a in request.actions]

        record.updated_at = utcnow_naive()
        await db.commit()
        await db.refresh(record)

        # Sync to in-memory engine: remove old entry, add updated one
        engine = get_rule_engine()
        engine.remove_rule(rule_id)
        engine.add_rule(_record_to_engine_rule(record))

        logger.info("Updated rule", rule_id=rule_id)
        return _record_to_response(record)

    except HTTPException:
        raise
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Invalid field value: {str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error("Failed to update rule", rule_id=rule_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update rule: {str(e)}")


@router.delete(
    "/management/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a rule",
    description="Delete a custom rule",
)
async def delete_rule(
    rule_id: str,
    _current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a rule from both the database and the live detection engine."""
    try:
        rule_uuid = uuid.UUID(rule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid rule ID format")

    try:
        result = await db.execute(select(CustomRuleRecord).where(CustomRuleRecord.id == rule_uuid))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found")

        await db.delete(record)
        await db.commit()

        # Remove from live engine
        get_rule_engine().remove_rule(rule_id)

        logger.info("Deleted rule", rule_id=rule_id)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to delete rule", rule_id=rule_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to delete rule: {str(e)}")


@router.post(
    "/management/rules/test",
    summary="Test a rule pattern",
    description="Test a rule pattern against sample input",
)
async def test_rule(
    request: RuleTestRequest,
    _current_user: dict = Depends(get_current_user),
):
    """
    Test a rule pattern against sample input without creating the rule.

    Useful for validating patterns before creating or updating rules.
    No database access required.
    """
    try:
        import re

        match_found = False
        error_message = None

        try:
            if request.pattern_type == "regex":
                pattern = re.compile(request.pattern, re.IGNORECASE)
                match_found = pattern.search(request.test_input) is not None
            elif request.pattern_type in ("keyword", "contains"):
                match_found = request.pattern.lower() in request.test_input.lower()
            elif request.pattern_type == "startswith":
                match_found = request.test_input.lower().startswith(request.pattern.lower())
            elif request.pattern_type == "endswith":
                match_found = request.test_input.lower().endswith(request.pattern.lower())
            else:
                error_message = f"Unknown pattern type: {request.pattern_type}"
        except re.error as e:
            error_message = f"Invalid regex pattern: {str(e)}"
        except Exception as e:
            error_message = f"Error testing pattern: {str(e)}"

        logger.info(
            "Tested rule pattern",
            pattern_type=request.pattern_type,
            match_found=match_found,
            has_error=error_message is not None,
        )

        return {
            "match_found": match_found,
            "error": error_message,
            "pattern": request.pattern,
            "pattern_type": request.pattern_type,
            "test_input": request.test_input,
        }

    except Exception as e:
        logger.error("Failed to test rule", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to test rule: {str(e)}")
