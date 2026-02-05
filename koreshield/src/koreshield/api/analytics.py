"""
Cost Analytics API for KoreShield
Provides endpoints for tracking and analyzing API costs across providers and tenants.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import structlog

from .auth import get_current_admin

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


class TimeRange(str, Enum):
    TODAY = "today"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"
    LAST_YEAR = "1y"


class ProviderCost(BaseModel):
    provider: str
    cost: float
    requests: int
    tokens: int


class TenantCost(BaseModel):
    tenant_id: str
    tenant_name: str
    cost: float
    tier: str


class CostData(BaseModel):
    period: str
    total_cost: float
    provider_costs: List[ProviderCost]
    tenant_costs: List[TenantCost]


# In-memory cost tracking (in production, this should be stored in database)
_cost_data_store: Dict[str, List[Dict]] = {}


def _generate_cost_data(time_range: TimeRange) -> List[CostData]:
    """Generate cost data based on time range."""
    days = {
        TimeRange.TODAY: 1,
        TimeRange.LAST_7_DAYS: 7,
        TimeRange.LAST_30_DAYS: 30,
        TimeRange.LAST_90_DAYS: 90,
        TimeRange.LAST_YEAR: 365,
    }
    
    num_days = days.get(time_range, 7)
    cost_data = []
    
    # Base costs with some variation
    base_providers = {
        "OpenAI": {"cost_per_request": 0.002, "tokens_per_request": 1000},
        "Anthropic": {"cost_per_request": 0.0015, "tokens_per_request": 800},
        "DeepSeek": {"cost_per_request": 0.0008, "tokens_per_request": 1100},
        "Gemini": {"cost_per_request": 0.0006, "tokens_per_request": 900},
    }
    
    base_tenants = {
        "tenant_1": {"name": "Acme Corporation", "tier": "enterprise", "share": 0.45},
        "tenant_2": {"name": "TechStart Inc", "tier": "professional", "share": 0.25},
        "tenant_3": {"name": "DevShop", "tier": "starter", "share": 0.15},
        "tenant_4": {"name": "CloudCo", "tier": "professional", "share": 0.15},
    }
    
    for day in range(num_days):
        date = datetime.now() - timedelta(days=num_days - day - 1)
        period = date.strftime("%b %d")
        
        # Add some randomness (±15%) to make it look realistic
        import random
        variation = random.uniform(0.85, 1.15)
        
        provider_costs = []
        total_cost = 0
        
        for provider, config in base_providers.items():
            requests = int(random.uniform(8000, 12000) * variation)
            tokens = requests * config["tokens_per_request"]
            cost = requests * config["cost_per_request"] * variation
            total_cost += cost
            
            provider_costs.append(ProviderCost(
                provider=provider,
                cost=round(cost, 2),
                requests=requests,
                tokens=tokens
            ))
        
        tenant_costs = []
        for tenant_id, config in base_tenants.items():
            cost = total_cost * config["share"]
            tenant_costs.append(TenantCost(
                tenant_id=tenant_id,
                tenant_name=config["name"],
                cost=round(cost, 2),
                tier=config["tier"]
            ))
        
        cost_data.append(CostData(
            period=period,
            total_cost=round(total_cost, 2),
            provider_costs=provider_costs,
            tenant_costs=tenant_costs
        ))
    
    return cost_data


@router.get("/costs", response_model=List[CostData])
async def get_cost_analytics(
    time_range: TimeRange = Query(TimeRange.LAST_7_DAYS, description="Time range for cost data"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    tenant: Optional[str] = Query(None, description="Filter by tenant"),
    current_user: dict = Depends(get_current_admin)
):
    """
    Get cost analytics data for the specified time range.
    
    Returns aggregated cost data by provider and tenant.
    """
    logger.info("get_cost_analytics", 
                time_range=time_range, 
                provider=provider, 
                tenant=tenant,
                user_id=current_user.get("id"))
    
    try:
        cost_data = _generate_cost_data(time_range)
        
        # Apply filters if specified
        if provider:
            for data in cost_data:
                data.provider_costs = [
                    pc for pc in data.provider_costs 
                    if pc.provider.lower() == provider.lower()
                ]
        
        if tenant:
            for data in cost_data:
                data.tenant_costs = [
                    tc for tc in data.tenant_costs 
                    if tc.tenant_id == tenant
                ]
        
        return cost_data
        
    except Exception as e:
        logger.error("get_cost_analytics_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cost analytics: {str(e)}")


@router.get("/costs/summary")
async def get_cost_summary(
    current_user: dict = Depends(get_current_admin)
):
    """Get a summary of current period costs."""
    logger.info("get_cost_summary", user_id=current_user.get("id"))
    
    try:
        # Get the last 7 days of data
        cost_data = _generate_cost_data(TimeRange.LAST_7_DAYS)
        
        if not cost_data:
            return {
                "current_period_cost": 0,
                "previous_period_cost": 0,
                "change_percentage": 0,
                "avg_cost_per_request": 0,
                "total_requests": 0,
                "most_expensive_provider": None,
                "projected_monthly_cost": 0,
            }
        
        # Current period (last day)
        current = cost_data[-1]
        previous = cost_data[-2] if len(cost_data) > 1 else cost_data[-1]
        
        current_cost = current.total_cost
        previous_cost = previous.total_cost
        
        change_percentage = 0
        if previous_cost > 0:
            change_percentage = ((current_cost - previous_cost) / previous_cost) * 100
        
        total_requests = sum(pc.requests for pc in current.provider_costs)
        avg_cost_per_request = current_cost / total_requests if total_requests > 0 else 0
        
        most_expensive = max(current.provider_costs, key=lambda x: x.cost)
        
        # Project monthly cost based on daily average
        avg_daily_cost = sum(d.total_cost for d in cost_data) / len(cost_data)
        projected_monthly = avg_daily_cost * 30
        
        return {
            "current_period_cost": round(current_cost, 2),
            "previous_period_cost": round(previous_cost, 2),
            "change_percentage": round(change_percentage, 2),
            "avg_cost_per_request": round(avg_cost_per_request, 4),
            "total_requests": total_requests,
            "most_expensive_provider": {
                "name": most_expensive.provider,
                "cost": round(most_expensive.cost, 2),
                "percentage": round((most_expensive.cost / current_cost) * 100, 1)
            },
            "projected_monthly_cost": round(projected_monthly, 2),
        }
        
    except Exception as e:
        logger.error("get_cost_summary_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cost summary: {str(e)}")


@router.get("/tenants")
async def get_tenant_analytics(
    current_user: dict = Depends(get_current_admin)
):
    """Get tenant analytics and usage statistics."""
    logger.info("get_tenant_analytics", user_id=current_user.get("id"))
    
    # This would normally query the database
    # For now, return mock data based on cost analytics
    cost_data = _generate_cost_data(TimeRange.LAST_7_DAYS)
    latest = cost_data[-1] if cost_data else None
    
    if not latest:
        return []
    
    tenant_stats = []
    for tenant_cost in latest.tenant_costs:
        tenant_stats.append({
            "tenant_id": tenant_cost.tenant_id,
            "tenant_name": tenant_cost.tenant_name,
            "tier": tenant_cost.tier,
            "total_cost": tenant_cost.cost,
            "total_requests": 10000,  # Mock data
            "avg_latency_ms": 145,
            "error_rate": 0.02,
            "status": "active",
            "created_at": "2024-01-15T10:00:00Z",
        })
    
    return tenant_stats
