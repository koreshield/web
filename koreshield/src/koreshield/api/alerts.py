"""
Alert Management API

Provides CRUD operations for managing alert rules and notification channels.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import structlog
from datetime import datetime
import uuid

from .auth import get_current_user

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Alerts"])

# In-memory storage for MVP (would be database in production)
_alert_rules: Dict[str, dict] = {}
_alert_channels: Dict[str, dict] = {}

# Pydantic models for API
class AlertRuleCreateRequest(BaseModel):
    """Request model for creating an alert rule."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    condition: str = Field(..., description="Alert trigger condition")
    severity: str = Field(..., description="Severity: critical, high, medium, low")
    enabled: bool = Field(default=True)
    channels: List[str] = Field(default_factory=list, description="Channel IDs to send alerts to")
    cooldown_minutes: int = Field(default=30, ge=1, le=1440, description="Cooldown period in minutes")

class AlertRuleUpdateRequest(BaseModel):
    """Request model for updating an alert rule."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    condition: Optional[str] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None
    channels: Optional[List[str]] = None
    cooldown_minutes: Optional[int] = Field(None, ge=1, le=1440)

class AlertRuleResponse(BaseModel):
    """Response model for an alert rule."""
    id: str
    name: str
    description: str
    condition: str
    severity: str
    enabled: bool
    channels: List[str]
    cooldown_minutes: int
    last_triggered: Optional[str] = None
    trigger_count: int
    created_at: str
    updated_at: str

class AlertChannelCreateRequest(BaseModel):
    """Request model for creating an alert channel."""
    type: str = Field(..., description="Channel type: email, slack, webhook, teams, telegram, pagerduty")
    name: str = Field(..., min_length=1, max_length=200)
    enabled: bool = Field(default=True)
    config: Dict[str, Any] = Field(..., description="Channel-specific configuration")

class AlertChannelUpdateRequest(BaseModel):
    """Request model for updating an alert channel."""
    type: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    enabled: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None

class AlertChannelResponse(BaseModel):
    """Response model for an alert channel."""
    id: str
    type: str
    name: str
    enabled: bool
    config: Dict[str, Any]
    created_at: str
    updated_at: str

class AlertChannelTestRequest(BaseModel):
    """Request model for testing an alert channel."""
    channel_id: str = Field(..., description="ID of the channel to test")
    test_message: str = Field(default="Test alert from KoreShield")

# Alert Rules Endpoints
@router.get(
    "/management/alerts/rules",
    response_model=List[AlertRuleResponse],
    summary="List all alert rules",
    description="Get a list of all configured alert rules"
)
async def list_alert_rules(
    enabled: Optional[bool] = None,
    severity: Optional[str] = None,
    _current_user: dict = Depends(get_current_user)
):
    """List all alert rules with optional filtering."""
    try:
        rules = list(_alert_rules.values())
        
        # Apply filters
        if enabled is not None:
            rules = [r for r in rules if r['enabled'] == enabled]
        if severity:
            rules = [r for r in rules if r['severity'] == severity.lower()]
        
        logger.info("Listed alert rules", count=len(rules))
        return rules
        
    except Exception as e:
        logger.error("Failed to list alert rules", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list alert rules: {str(e)}")

@router.get(
    "/management/alerts/rules/{rule_id}",
    response_model=AlertRuleResponse,
    summary="Get alert rule by ID"
)
async def get_alert_rule(
    rule_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Get a specific alert rule by ID."""
    rule = _alert_rules.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Alert rule with ID '{rule_id}' not found")
    return rule

@router.post(
    "/management/alerts/rules",
    response_model=AlertRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create alert rule"
)
async def create_alert_rule(
    request: AlertRuleCreateRequest,
    _current_user: dict = Depends(get_current_user)
):
    """Create a new alert rule."""
    try:
        # Validate severity
        if request.severity.lower() not in ['critical', 'high', 'medium', 'low']:
            raise HTTPException(status_code=400, detail="Invalid severity level")
        
        rule_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        rule = {
            'id': rule_id,
            'name': request.name,
            'description': request.description,
            'condition': request.condition,
            'severity': request.severity.lower(),
            'enabled': request.enabled,
            'channels': request.channels,
            'cooldown_minutes': request.cooldown_minutes,
            'last_triggered': None,
            'trigger_count': 0,
            'created_at': now,
            'updated_at': now,
        }
        
        _alert_rules[rule_id] = rule
        logger.info("Created alert rule", rule_id=rule_id, name=request.name)
        
        return rule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create alert rule", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create alert rule: {str(e)}")

@router.put(
    "/management/alerts/rules/{rule_id}",
    response_model=AlertRuleResponse,
    summary="Update alert rule"
)
async def update_alert_rule(
    rule_id: str,
    request: AlertRuleUpdateRequest,
    _current_user: dict = Depends(get_current_user)
):
    """Update an existing alert rule."""
    try:
        rule = _alert_rules.get(rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail=f"Alert rule with ID '{rule_id}' not found")
        
        # Validate severity if provided
        if request.severity and request.severity.lower() not in ['critical', 'high', 'medium', 'low']:
            raise HTTPException(status_code=400, detail="Invalid severity level")
        
        # Update fields
        if request.name is not None:
            rule['name'] = request.name
        if request.description is not None:
            rule['description'] = request.description
        if request.condition is not None:
            rule['condition'] = request.condition
        if request.severity is not None:
            rule['severity'] = request.severity.lower()
        if request.enabled is not None:
            rule['enabled'] = request.enabled
        if request.channels is not None:
            rule['channels'] = request.channels
        if request.cooldown_minutes is not None:
            rule['cooldown_minutes'] = request.cooldown_minutes
        
        rule['updated_at'] = datetime.utcnow().isoformat()
        
        logger.info("Updated alert rule", rule_id=rule_id)
        return rule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update alert rule", rule_id=rule_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update alert rule: {str(e)}")

@router.delete(
    "/management/alerts/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete alert rule"
)
async def delete_alert_rule(
    rule_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Delete an alert rule."""
    if rule_id not in _alert_rules:
        raise HTTPException(status_code=404, detail=f"Alert rule with ID '{rule_id}' not found")
    
    del _alert_rules[rule_id]
    logger.info("Deleted alert rule", rule_id=rule_id)

# Alert Channels Endpoints
@router.get(
    "/management/alerts/channels",
    response_model=List[AlertChannelResponse],
    summary="List all alert channels"
)
async def list_alert_channels(
    type: Optional[str] = None,
    enabled: Optional[bool] = None,
    _current_user: dict = Depends(get_current_user)
):
    """List all configured alert channels."""
    try:
        channels = list(_alert_channels.values())
        
        # Apply filters
        if type:
            channels = [c for c in channels if c['type'] == type.lower()]
        if enabled is not None:
            channels = [c for c in channels if c['enabled'] == enabled]
        
        logger.info("Listed alert channels", count=len(channels))
        return channels
        
    except Exception as e:
        logger.error("Failed to list alert channels", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list alert channels: {str(e)}")

@router.get(
    "/management/alerts/channels/{channel_id}",
    response_model=AlertChannelResponse,
    summary="Get alert channel by ID"
)
async def get_alert_channel(
    channel_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Get a specific alert channel by ID."""
    channel = _alert_channels.get(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail=f"Alert channel with ID '{channel_id}' not found")
    return channel

@router.post(
    "/management/alerts/channels",
    response_model=AlertChannelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create alert channel"
)
async def create_alert_channel(
    request: AlertChannelCreateRequest,
    _current_user: dict = Depends(get_current_user)
):
    """Create a new alert channel."""
    try:
        # Validate channel type
        valid_types = ['email', 'slack', 'webhook', 'teams', 'telegram', 'pagerduty']
        if request.type.lower() not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid channel type. Must be one of: {', '.join(valid_types)}")
        
        channel_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        channel = {
            'id': channel_id,
            'type': request.type.lower(),
            'name': request.name,
            'enabled': request.enabled,
            'config': request.config,
            'created_at': now,
            'updated_at': now,
        }
        
        _alert_channels[channel_id] = channel
        logger.info("Created alert channel", channel_id=channel_id, name=request.name, type=request.type)
        
        return channel
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create alert channel", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create alert channel: {str(e)}")

@router.put(
    "/management/alerts/channels/{channel_id}",
    response_model=AlertChannelResponse,
    summary="Update alert channel"
)
async def update_alert_channel(
    channel_id: str,
    request: AlertChannelUpdateRequest,
    _current_user: dict = Depends(get_current_user)
):
    """Update an existing alert channel."""
    try:
        channel = _alert_channels.get(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail=f"Alert channel with ID '{channel_id}' not found")
        
        # Validate channel type if provided
        if request.type:
            valid_types = ['email', 'slack', 'webhook', 'teams', 'telegram', 'pagerduty']
            if request.type.lower() not in valid_types:
                raise HTTPException(status_code=400, detail=f"Invalid channel type. Must be one of: {', '.join(valid_types)}")
        
        # Update fields
        if request.type is not None:
            channel['type'] = request.type.lower()
        if request.name is not None:
            channel['name'] = request.name
        if request.enabled is not None:
            channel['enabled'] = request.enabled
        if request.config is not None:
            channel['config'] = request.config
        
        channel['updated_at'] = datetime.utcnow().isoformat()
        
        logger.info("Updated alert channel", channel_id=channel_id)
        return channel
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update alert channel", channel_id=channel_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update alert channel: {str(e)}")

@router.delete(
    "/management/alerts/channels/{channel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete alert channel"
)
async def delete_alert_channel(
    channel_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Delete an alert channel."""
    if channel_id not in _alert_channels:
        raise HTTPException(status_code=404, detail=f"Alert channel with ID '{channel_id}' not found")
    
    del _alert_channels[channel_id]
    logger.info("Deleted alert channel", channel_id=channel_id)

@router.post(
    "/management/alerts/channels/test",
    summary="Test alert channel",
    description="Send a test message to an alert channel"
)
async def test_alert_channel(
    request: AlertChannelTestRequest,
    _current_user: dict = Depends(get_current_user)
):
    """Test an alert channel by sending a test message."""
    try:
        channel = _alert_channels.get(request.channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail=f"Channel with ID '{request.channel_id}' not found")
        
        if not channel['enabled']:
            raise HTTPException(status_code=400, detail="Channel is disabled")
        
        # In a real implementation, this would actually send the alert
        # For now, just simulate success
        logger.info("Test alert sent", channel_id=request.channel_id, channel_name=channel['name'])
        
        return {
            'success': True,
            'message': f"Test alert sent successfully to {channel['name']}",
            'channel_id': request.channel_id,
            'channel_type': channel['type'],
            'test_message': request.test_message,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to test alert channel", channel_id=request.channel_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to test alert channel: {str(e)}")


@router.post(
    "/management/alerts/channels/{channel_id}/test",
    summary="Test alert channel by ID",
    description="Send a test message to an alert channel using a REST-style path."
)
async def test_alert_channel_by_id(
    channel_id: str,
    _current_user: dict = Depends(get_current_user)
):
    """Compatibility route for clients that address a specific channel directly."""
    request = AlertChannelTestRequest(channel_id=channel_id)
    return await test_alert_channel(request, _current_user)
