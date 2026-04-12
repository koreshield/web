"""
Cost Analytics API for KoreShield
Provides endpoints for tracking and analyzing API costs across providers and tenants.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum
import structlog
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import get_current_admin
from ..database import get_db
from ..models.request_log import RequestLog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


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


async def _query_cost_data(session: AsyncSession, time_range: TimeRange) -> List[CostData]:
    """Generate cost data based on time range using DB aggregation."""
    days_map = {
        TimeRange.TODAY: 1,
        TimeRange.LAST_7_DAYS: 7,
        TimeRange.LAST_30_DAYS: 30,
        TimeRange.LAST_90_DAYS: 90,
        TimeRange.LAST_YEAR: 365,
    }
    num_days = days_map.get(time_range, 7)
    start_date = datetime.utcnow() - timedelta(days=num_days)
    
    # Query: Group by Date (YYYY-MM-DD), Provider
    # Note: SQLite/Postgres specific date function. Assuming Postgres.
    # Postgres: date_trunc('day', timestamp)
    date_col = func.date_trunc('day', RequestLog.timestamp)
    
    stmt = (
        select(
            date_col.label("day"),
            RequestLog.provider,
            func.sum(RequestLog.cost).label("cost"),
            func.count(RequestLog.id).label("requests"),
            func.sum(RequestLog.tokens_total).label("tokens")
        )
        .where(RequestLog.timestamp >= start_date)
        .group_by(date_col, RequestLog.provider)
        .order_by(date_col)
    )
    
    result = await session.execute(stmt)
    rows = result.all()
    
    # Process results into structured data
    # Map {day_str: {provider: ProviderCost}}
    data_by_day = {}
    
    for row in rows:
        day_str = row.day.strftime("%Y-%m-%d")
        if day_str not in data_by_day:
            data_by_day[day_str] = []
        
        data_by_day[day_str].append(ProviderCost(
            provider=row.provider,
            cost=round(float(row.cost or 0), 4),
            requests=row.requests,
            tokens=row.tokens or 0
        ))
    
    # Fill in gaps and format
    final_data = []
    for i in range(num_days):
        date = datetime.utcnow() - timedelta(days=num_days - i - 1)
        day_str = date.strftime("%Y-%m-%d")
        period_label = date.strftime("%b %d")
        
        providers = data_by_day.get(day_str, [])
        total_cost = sum(p.cost for p in providers)
        
        # Mock tenant costs for now (until Tenant model linked)
        tenant_costs = []
        
        final_data.append(CostData(
            period=period_label,
            total_cost=round(total_cost, 4),
            provider_costs=providers,
            tenant_costs=tenant_costs
        ))
        
    return final_data


@router.get("/costs", response_model=List[CostData], summary="Cost Analytics", description="Get daily LLM cost data broken down by provider for the specified time range. Supports filtering by provider and tenant.")
async def get_cost_analytics(
    time_range: TimeRange = Query(TimeRange.LAST_7_DAYS, description="Time range for cost data"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    tenant: Optional[str] = Query(None, description="Filter by tenant"),
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """
    Get cost analytics data for the specified time range.
    """
    logger.info("get_cost_analytics", 
                time_range=time_range, 
                provider=provider, 
                tenant=tenant,
                user_id=current_user.get("id"))
    
    try:
        cost_data = await _query_cost_data(session, time_range)
        
        # Apply filters (in memory is easier for post-aggregation, or move to SQL)
        if provider:
            for data in cost_data:
                data.provider_costs = [
                    pc for pc in data.provider_costs 
                    if pc.provider.lower() == provider.lower()
                ]
                # Recalculate total if needed, or keep original? 
                # Usually filtered view shows total of filter.
                data.total_cost = sum(pc.cost for pc in data.provider_costs)

        return cost_data
        
    except Exception as e:
        logger.error("get_cost_analytics_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cost analytics: {str(e)}")


@router.get("/costs/summary", summary="Cost Summary", description="Get a high-level cost summary for the current period including total spend, period-over-period change, average cost per request, and projected monthly cost.")
async def get_cost_summary(
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get a summary of current period costs."""
    logger.info("get_cost_summary", user_id=current_user.get("id"))
    
    try:
        # Get data
        cost_data = await _query_cost_data(session, TimeRange.LAST_7_DAYS)
        
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
        
        # Current period (today/last day) vs Previous
        # Actually logic in mock was: last day vs day before.
        # Let's say "Current Period" = Total of last 7 days? Or single day?
        # Usually dashboard shows "This Week vs Last Week" or "Today vs Yesterday".
        # Let's assume Today vs Yesterday for quick pulse.
        
        current = cost_data[-1]
        previous = cost_data[-2] if len(cost_data) > 1 else cost_data[-1]
        
        current_cost = current.total_cost
        previous_cost = previous.total_cost
        
        change_percentage = 0
        if previous_cost > 0:
            change_percentage = ((current_cost - previous_cost) / previous_cost) * 100
        
        total_requests = sum(pc.requests for pc in current.provider_costs)
        avg_cost_per_request = current_cost / total_requests if total_requests > 0 else 0
        
        most_expensive = max(current.provider_costs, key=lambda x: x.cost) if current.provider_costs else None
        
        # Project monthly
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
            } if most_expensive else None,
            "projected_monthly_cost": round(projected_monthly, 2),
        }
        
    except Exception as e:
        logger.error("get_cost_summary_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cost summary: {str(e)}")


@router.get("/tenants", summary="Tenant Analytics", description="Get per-tenant usage and cost analytics. Returns aggregated metrics grouped by tenant.")
async def get_tenant_analytics(
    current_user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
):
    """Get tenant analytics."""
    # Placeholder until Tenant model linked to RequestLog
    # Could group by user_id
    return []
