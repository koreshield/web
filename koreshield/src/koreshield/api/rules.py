"""
Custom Rules Management API

Provides CRUD operations for managing custom detection rules in the Rule Engine.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import structlog
from datetime import datetime
import uuid

from .auth import get_current_user
from ..rule_engine import RuleEngine, CustomRule, RuleSeverity, RuleAction

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Rules"])

# Initialize global rule engine
_rule_engine: Optional[RuleEngine] = None

def get_rule_engine() -> RuleEngine:
    """Get or create the global rule engine instance."""
    global _rule_engine
    if _rule_engine is None:
        _rule_engine = RuleEngine()
    return _rule_engine

# Pydantic models for API
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

@router.get(
    "/management/rules",
    response_model=List[RuleResponse],
    summary="List all rules",
    description="Get a list of all custom detection rules"
)
async def list_rules(
    enabled: Optional[bool] = None,
    severity: Optional[str] = None,
    _current_user: dict = Depends(get_current_user)
):
    """
    List all custom rules with optional filtering.
    
    - **enabled**: Filter by enabled status
    - **severity**: Filter by severity level
    """
    try:
        engine = get_rule_engine()
        rules = list(engine.rules.values())
        
        # Apply filters
        if enabled is not None:
            rules = [r for r in rules if r.enabled == enabled]
        if severity:
            rules = [r for r in rules if r.severity.value == severity.lower()]
        
        # Convert to response format
        result = []
        for rule in rules:
            result.append(RuleResponse(
                id=rule.id,
                name=rule.name,
                description=rule.description,
                pattern=rule.pattern,
                pattern_type=rule.pattern_type,
                severity=rule.severity.value,
                action=rule.action.value,
                enabled=rule.enabled,
                priority=rule.metadata.get('priority', 5),
                tags=rule.tags,
                conditions=rule.metadata.get('conditions', []),
                actions=rule.metadata.get('actions', []),
                created_at=rule.metadata.get('created_at', datetime.utcnow().isoformat()),
                updated_at=rule.metadata.get('updated_at', datetime.utcnow().isoformat()),
            ))
        
        logger.info("Listed rules", count=len(result), filtered=enabled is not None or severity is not None)
        return result
        
    except Exception as e:
        logger.error("Failed to list rules", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list rules: {str(e)}")

@router.get(
    "/management/rules/{rule_id}",
    response_model=RuleResponse,
    summary="Get rule by ID",
    description="Get details of a specific rule"
)
async def get_rule(
    rule_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Get a specific rule by ID."""
    try:
        engine = get_rule_engine()
        rule = engine.rules.get(rule_id)
        
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found")
        
        return RuleResponse(
            id=rule.id,
            name=rule.name,
            description=rule.description,
            pattern=rule.pattern,
            pattern_type=rule.pattern_type,
            severity=rule.severity.value,
            action=rule.action.value,
            enabled=rule.enabled,
            priority=rule.metadata.get('priority', 5),
            tags=rule.tags,
            conditions=rule.metadata.get('conditions', []),
            actions=rule.metadata.get('actions', []),
            created_at=rule.metadata.get('created_at', datetime.utcnow().isoformat()),
            updated_at=rule.metadata.get('updated_at', datetime.utcnow().isoformat()),
        )
        
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
    description="Create a new custom detection rule"
)
async def create_rule(
    request: RuleCreateRequest,
    _current_user: dict = Depends(get_current_user)
):
    """
    Create a new custom rule.
    
    The rule will be added to the rule engine and immediately become active if enabled.
    """
    try:
        engine = get_rule_engine()
        
        # Generate unique ID
        rule_id = str(uuid.uuid4())
        
        # Create rule object
        now = datetime.utcnow().isoformat()
        rule = CustomRule(
            id=rule_id,
            name=request.name,
            description=request.description,
            pattern=request.pattern,
            pattern_type=request.pattern_type,
            severity=RuleSeverity(request.severity.lower()),
            action=RuleAction(request.action.lower()),
            enabled=request.enabled,
            tags=request.tags,
            metadata={
                'priority': request.priority,
                'conditions': [c.dict() for c in request.conditions],
                'actions': [a.dict() for a in request.actions],
                'created_at': now,
                'updated_at': now,
            }
        )
        
        # Add to engine
        success = engine.add_rule(rule)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to add rule (duplicate ID or invalid pattern)")
        
        logger.info("Created new rule", rule_id=rule_id, name=request.name)
        
        return RuleResponse(
            id=rule.id,
            name=rule.name,
            description=rule.description,
            pattern=rule.pattern,
            pattern_type=rule.pattern_type,
            severity=rule.severity.value,
            action=rule.action.value,
            enabled=rule.enabled,
            priority=request.priority,
            tags=rule.tags,
            conditions=request.conditions,
            actions=request.actions,
            created_at=now,
            updated_at=now,
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        # Invalid severity or action enum value
        raise HTTPException(status_code=400, detail=f"Invalid field value: {str(e)}")
    except Exception as e:
        logger.error("Failed to create rule", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")

@router.put(
    "/management/rules/{rule_id}",
    response_model=RuleResponse,
    summary="Update a rule",
    description="Update an existing rule"
)
async def update_rule(
    rule_id: str,
    request: RuleUpdateRequest,
    _current_user: dict = Depends(get_current_user)
):
    """
    Update an existing rule.
    
    Only provided fields will be updated; others remain unchanged.
    """
    try:
        engine = get_rule_engine()
        existing_rule = engine.rules.get(rule_id)
        
        if not existing_rule:
            raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found")
        
        # Remove old rule
        engine.remove_rule(rule_id)
        
        # Create updated rule with merged data
        now = datetime.utcnow().isoformat()
        updated_rule = CustomRule(
            id=rule_id,
            name=request.name if request.name is not None else existing_rule.name,
            description=request.description if request.description is not None else existing_rule.description,
            pattern=request.pattern if request.pattern is not None else existing_rule.pattern,
            pattern_type=request.pattern_type if request.pattern_type is not None else existing_rule.pattern_type,
            severity=RuleSeverity(request.severity.lower()) if request.severity else existing_rule.severity,
            action=RuleAction(request.action.lower()) if request.action else existing_rule.action,
            enabled=request.enabled if request.enabled is not None else existing_rule.enabled,
            tags=request.tags if request.tags is not None else existing_rule.tags,
            metadata={
                'priority': request.priority if request.priority is not None else existing_rule.metadata.get('priority', 5),
                'conditions': [c.dict() for c in request.conditions] if request.conditions is not None else existing_rule.metadata.get('conditions', []),
                'actions': [a.dict() for a in request.actions] if request.actions is not None else existing_rule.metadata.get('actions', []),
                'created_at': existing_rule.metadata.get('created_at', now),
                'updated_at': now,
            }
        )
        
        # Add updated rule back
        success = engine.add_rule(updated_rule)
        if not success:
            # Rollback: restore original rule
            engine.add_rule(existing_rule)
            raise HTTPException(status_code=400, detail="Failed to update rule (invalid pattern)")
        
        logger.info("Updated rule", rule_id=rule_id)
        
        return RuleResponse(
            id=updated_rule.id,
            name=updated_rule.name,
            description=updated_rule.description,
            pattern=updated_rule.pattern,
            pattern_type=updated_rule.pattern_type,
            severity=updated_rule.severity.value,
            action=updated_rule.action.value,
            enabled=updated_rule.enabled,
            priority=updated_rule.metadata.get('priority', 5),
            tags=updated_rule.tags,
            conditions=updated_rule.metadata.get('conditions', []),
            actions=updated_rule.metadata.get('actions', []),
            created_at=updated_rule.metadata.get('created_at', now),
            updated_at=now,
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid field value: {str(e)}")
    except Exception as e:
        logger.error("Failed to update rule", rule_id=rule_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update rule: {str(e)}")

@router.delete(
    "/management/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a rule",
    description="Delete a custom rule"
)
async def delete_rule(
    rule_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Delete a rule from the system."""
    try:
        engine = get_rule_engine()
        
        if rule_id not in engine.rules:
            raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found")
        
        success = engine.remove_rule(rule_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to remove rule")
        
        logger.info("Deleted rule", rule_id=rule_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete rule", rule_id=rule_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to delete rule: {str(e)}")

@router.post(
    "/management/rules/test",
    summary="Test a rule pattern",
    description="Test a rule pattern against sample input"
)
async def test_rule(
    request: RuleTestRequest,
    _current_user: dict = Depends(get_current_user)
):
    """
    Test a rule pattern against sample input without creating the rule.
    
    Useful for validating patterns before creating or updating rules.
    """
    try:
        import re
        
        # Test the pattern
        match_found = False
        error_message = None
        
        try:
            if request.pattern_type == "regex":
                pattern = re.compile(request.pattern, re.IGNORECASE)
                match = pattern.search(request.test_input)
                match_found = match is not None
            elif request.pattern_type == "keyword":
                match_found = request.pattern.lower() in request.test_input.lower()
            elif request.pattern_type == "contains":
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
        
        logger.info("Tested rule pattern", 
                   pattern_type=request.pattern_type,
                   match_found=match_found, 
                   has_error=error_message is not None)
        
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
